from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.models.category import Category
from app.models.menu_item import MenuItem
from app.models.settings import CafeSettings
from app.schemas.category import CategoryResponse
from app.schemas.settings import SettingsResponse

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/settings", response_model=SettingsResponse)
async def public_settings(db: AsyncSession = Depends(get_db)) -> SettingsResponse:
    """Return active café settings. Returns sensible defaults if no row exists."""
    result = await db.execute(select(CafeSettings).where(CafeSettings.id == 1))
    row: CafeSettings | None = result.scalar_one_or_none()
    if row is None:
        # Return an in-memory default — do not persist anything in a public route
        from datetime import datetime, timezone

        class _DefaultSettings:
            id = 1
            cafe_name = "Habesha Café"
            welcome_message = "Welcome! Enjoy our authentic Ethiopian flavors."
            logo_url = None
            video_url = None
            address = None
            phone = None
            is_menu_active = True
            updated_at = datetime.now(timezone.utc)

        return SettingsResponse.model_validate(_DefaultSettings())
    return SettingsResponse.model_validate(row)


@router.get("/categories", response_model=list[CategoryResponse])
async def public_categories(db: AsyncSession = Depends(get_db)) -> list[CategoryResponse]:
    """Return all active categories ordered by display_order."""
    result = await db.execute(
        select(Category)
        .where(Category.is_active == True)  # noqa: E712
        .order_by(Category.display_order)
    )
    categories = list(result.scalars().all())
    return [CategoryResponse.model_validate(c) for c in categories]


@router.get("/menu")
async def public_menu(db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    """
    Return the full structured menu for customer display.

    Structure:
    [
      {
        id, name, slug, icon, display_order,
        items: [...],          # items directly on this parent category
        subcategories: [
          { id, name, slug, icon, display_order, items: [...] },
          ...
        ]
      },
      ...
    ]

    Only active categories and available menu items are included.
    """
    # Load all active categories
    cat_result = await db.execute(
        select(Category)
        .where(Category.is_active == True)  # noqa: E712
        .order_by(Category.display_order)
    )
    all_categories: list[Category] = list(cat_result.scalars().all())

    # Load all available menu items
    item_result = await db.execute(
        select(MenuItem)
        .where(MenuItem.is_available == True)  # noqa: E712
        .order_by(MenuItem.display_order)
    )
    all_items: list[MenuItem] = list(item_result.scalars().all())

    # Index items by category_id
    items_by_cat: dict[str, list[dict[str, Any]]] = {}
    for item in all_items:
        if item.category_id not in items_by_cat:
            items_by_cat[item.category_id] = []
        items_by_cat[item.category_id].append({
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "price": float(item.price),
            "image_url": item.image_url,
            "is_available": item.is_available,
            "display_order": item.display_order,
        })

    # Index categories by id and split parents / children
    cat_by_id: dict[str, Category] = {c.id: c for c in all_categories}
    parents: list[Category] = [c for c in all_categories if c.parent_id is None]
    children_by_parent: dict[str, list[Category]] = {}
    for cat in all_categories:
        if cat.parent_id is not None:
            children_by_parent.setdefault(cat.parent_id, []).append(cat)

    menu: list[dict[str, Any]] = []
    for parent in parents:
        subs: list[dict[str, Any]] = []
        for sub in sorted(children_by_parent.get(parent.id, []), key=lambda c: c.display_order):
            subs.append({
                "id": sub.id,
                "name": sub.name,
                "slug": sub.slug,
                "icon": sub.icon,
                "display_order": sub.display_order,
                "items": items_by_cat.get(sub.id, []),
            })

        menu.append({
            "id": parent.id,
            "name": parent.name,
            "slug": parent.slug,
            "icon": parent.icon,
            "display_order": parent.display_order,
            "items": items_by_cat.get(parent.id, []),
            "subcategories": subs,
        })

    return menu
