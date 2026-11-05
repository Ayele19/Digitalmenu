from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator
import re


def _slug_from_name(name: str) -> str:
    """Convert a category name into a URL-safe slug."""
    slug = name.lower()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug)
    return slug.strip("-")


class CategoryCreate(BaseModel):
    name: str
    slug: str | None = None
    parent_id: str | None = None
    icon: str | None = None
    display_order: int = 0

    @field_validator("slug", mode="before")
    @classmethod
    def coerce_empty_slug(cls, v: str | None) -> str | None:
        """Treat an empty string slug as None so the router auto-generates it."""
        if v is not None and v.strip() == "":
            return None
        return v


class CategoryUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    parent_id: str | None = None
    icon: str | None = None
    display_order: int | None = None
    is_active: bool | None = None


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    parent_id: str | None
    icon: str | None
    display_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CategoryWithChildren(CategoryResponse):
    children: list[CategoryResponse] = []
    item_count: int = 0
