import re
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_admin, get_db
from app.models.admin import Admin
from app.models.category import Category
from app.models.menu_item import MenuItem
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    CategoryWithChildren,
    _slug_from_name,
)

router = APIRouter(
    prefix="/api/categories",
    tags=["categories"],
    dependencies=[Depends(get_current_admin)],
)


def _build_tree(
    categories: list[Category],
    item_counts: dict[str, int],
) -> list[CategoryWithChildren]:
    """Return only top-level categories with their children list populated."""
    cat_map: dict[str, CategoryWithChildren] = {}

    for cat in categories:
        node = CategoryWithChildren.model_validate(cat)
        node.item_count = item_counts.get(cat.id, 0)
        cat_map[cat.id] = node

    roots: list[CategoryWithChildren] = []
    for cat in categories:
        node = cat_map[cat.id]
        if cat.parent_id is None:
            roots.append(node)
        elif cat.parent_id in cat_map:
            cat_map[cat.parent_id].children.append(
                CategoryResponse.model_validate(cat)
            )

    roots.sort(key=lambda c: c.display_order)
    for root in roots:
        root.children.sort(key=lambda c: c.display_order)

    return roots


@router.get("/", response_model=list[CategoryWithChildren])
async def list_categories(
    db: AsyncSession = Depends(get_db),
) -> list[CategoryWithChildren]:
    """Return the full category tree with per-category menu item counts."""
    result = await db.execute(select(Category).order_by(Category.display_order))
    categories: list[Category] = list(result.scalars().all())

    # Count menu items per category in a single query
    count_result = await db.execute(
        select(MenuItem.category_id, func.count(MenuItem.id).label("cnt"))
        .group_by(MenuItem.category_id)
    )
    item_counts: dict[str, int] = {row.category_id: row.cnt for row in count_result}

    return _build_tree(categories, item_counts)


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    """Create a new category, auto-generating a slug from the name if needed."""
    slug = payload.slug or _slug_from_name(payload.name)

    # Ensure uniqueness
    existing = await db.execute(select(Category).where(Category.slug == slug))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A category with slug '{slug}' already exists.",
        )

    category = Category(
        name=payload.name,
        slug=slug,
        parent_id=payload.parent_id,
        icon=payload.icon,
        display_order=payload.display_order,
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return CategoryResponse.model_validate(category)


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    payload: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    """Update an existing category. Regenerates slug when name changes without an explicit slug."""
    result = await db.execute(
        select(Category).where(Category.id == category_id)
    )
    category: Category | None = result.scalar_one_or_none()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    update_data = payload.model_dump(exclude_unset=True)

    # If name is changing and no explicit slug provided, regenerate slug
    if "name" in update_data and "slug" not in update_data:
        update_data["slug"] = _slug_from_name(update_data["name"])

    # If a new slug is being set, check for collisions (excluding self)
    if "slug" in update_data and update_data["slug"] != category.slug:
        collision = await db.execute(
            select(Category).where(
                Category.slug == update_data["slug"],
                Category.id != category_id,
            )
        )
        if collision.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A category with slug '{update_data['slug']}' already exists.",
            )

    for field, value in update_data.items():
        setattr(category, field, value)

    await db.commit()
    await db.refresh(category)
    return CategoryResponse.model_validate(category)


@router.delete("/{category_id}")
async def delete_category(
    category_id: str,
    force: str = Query(default="false"),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Delete a category. Pass force=true to delete even when menu items exist."""
    result = await db.execute(
        select(Category).where(Category.id == category_id)
    )
    category: Category | None = result.scalar_one_or_none()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    # Count associated menu items
    count_result = await db.execute(
        select(func.count(MenuItem.id)).where(MenuItem.category_id == category_id)
    )
    item_count: int = count_result.scalar_one()

    if item_count > 0:
        if force.lower() != "true":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category has menu items. Use force=true to delete anyway.",
            )
        # Detach menu items rather than deleting them
        await db.execute(
            update(MenuItem)
            .where(MenuItem.category_id == category_id)
            .values(category_id=None)
        )

    await db.delete(category)
    await db.commit()
    return {"message": "Category deleted"}


@router.patch("/{category_id}/reorder", response_model=CategoryResponse)
async def reorder_category(
    category_id: str,
    body: dict[str, Any],
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    """Update the display_order of a category."""
    display_order = body.get("display_order")
    if display_order is None or not isinstance(display_order, int):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Body must contain an integer 'display_order' field.",
        )

    result = await db.execute(
        select(Category).where(Category.id == category_id)
    )
    category: Category | None = result.scalar_one_or_none()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    category.display_order = display_order
    await db.commit()
    await db.refresh(category)
    return CategoryResponse.model_validate(category)
