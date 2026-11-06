import os
from pathlib import Path

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings as app_settings
from app.core.dependencies import get_current_admin, get_db
from app.models.category import Category
from app.models.menu_item import MenuItem
from app.schemas.menu_item import MenuItemResponse, MenuItemWithCategory
from app.utils.image_utils import save_upload_file

router = APIRouter(
    prefix="/api/menu-items",
    tags=["menu-items"],
    dependencies=[Depends(get_current_admin)],
)


def _delete_image_file(image_url: str) -> None:
    """Remove a stored image from disk, ignoring missing-file errors."""
    # image_url is like /uploads/images/filename.jpg
    relative = image_url.lstrip("/")
    try:
        Path(relative).unlink()
    except FileNotFoundError:
        pass
    except Exception:
        pass


@router.get("/", response_model=list[MenuItemWithCategory])
async def list_menu_items(
    db: AsyncSession = Depends(get_db),
) -> list[MenuItemWithCategory]:
    """Return all menu items joined with their category name."""
    result = await db.execute(
        select(MenuItem, Category.name.label("category_name"))
        .outerjoin(Category, MenuItem.category_id == Category.id)
        .order_by(MenuItem.display_order)
    )
    rows = result.all()

    items: list[MenuItemWithCategory] = []
    for row in rows:
        item = MenuItemWithCategory.model_validate(row.MenuItem)
        item.category_name = row.category_name
        items.append(item)
    return items


@router.get("/{item_id}", response_model=MenuItemResponse)
async def get_menu_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
) -> MenuItemResponse:
    """Return a single menu item by ID."""
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item: MenuItem | None = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    return MenuItemResponse.model_validate(item)


@router.post("/", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
async def create_menu_item(
    name: str = Form(...),
    description: str = Form(default=""),
    price: float = Form(...),
    category_id: str | None = Form(default=None),
    is_available: str = Form(default="true"),
    display_order: int = Form(default=0),
    image: UploadFile | None = None,
    db: AsyncSession = Depends(get_db),
) -> MenuItemResponse:
    """Create a new menu item, optionally with an image upload."""
    image_url: str | None = None
    if image is not None and image.filename:
        image_url = await save_upload_file(image, app_settings.UPLOAD_DIR)

    # FormData sends booleans as strings
    available = is_available.lower() not in ("false", "0", "no")

    # Treat empty string category_id as None
    cat_id = category_id if category_id and category_id.strip() else None

    menu_item = MenuItem(
        name=name,
        description=description or None,
        price=price,
        category_id=cat_id,
        is_available=available,
        display_order=display_order,
        image_url=image_url,
    )
    db.add(menu_item)
    await db.commit()
    await db.refresh(menu_item)
    return MenuItemResponse.model_validate(menu_item)


@router.put("/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    item_id: str,
    name: str | None = Form(default=None),
    description: str | None = Form(default=None),
    price: float | None = Form(default=None),
    category_id: str | None = Form(default=None),
    is_available: str | None = Form(default=None),
    display_order: int | None = Form(default=None),
    image: UploadFile | None = None,
    db: AsyncSession = Depends(get_db),
) -> MenuItemResponse:
    """Update a menu item. Replaces the image if a new one is provided."""
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item: MenuItem | None = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")

    if name is not None:
        item.name = name
    if description is not None:
        item.description = description or None
    if price is not None:
        item.price = price
    if category_id is not None:
        item.category_id = category_id if category_id.strip() else None
    if is_available is not None:
        item.is_available = is_available.lower() not in ("false", "0", "no")
    if display_order is not None:
        item.display_order = display_order

    if image is not None and image.filename:
        if item.image_url:
            _delete_image_file(item.image_url)
        item.image_url = await save_upload_file(image, app_settings.UPLOAD_DIR)

    await db.commit()
    await db.refresh(item)
    return MenuItemResponse.model_validate(item)


@router.delete("/{item_id}")
async def delete_menu_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Delete a menu item and its associated image file."""
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item: MenuItem | None = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")

    if item.image_url:
        _delete_image_file(item.image_url)

    await db.delete(item)
    await db.commit()
    return {"message": "Item deleted"}


@router.patch("/{item_id}/toggle-availability", response_model=MenuItemResponse)
async def toggle_availability(
    item_id: str,
    db: AsyncSession = Depends(get_db),
) -> MenuItemResponse:
    """Flip the is_available flag on a menu item."""
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item: MenuItem | None = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")

    item.is_available = not item.is_available
    await db.commit()
    await db.refresh(item)
    return MenuItemResponse.model_validate(item)
