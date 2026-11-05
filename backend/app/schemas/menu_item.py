from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MenuItemCreate(BaseModel):
    name: str
    description: str | None = None
    price: float
    category_id: str
    is_available: bool = True
    display_order: int = 0


class MenuItemUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    category_id: str | None = None
    is_available: bool | None = None
    display_order: int | None = None


class MenuItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str | None
    price: float
    image_url: str | None
    category_id: str
    is_available: bool
    display_order: int
    created_at: datetime
    updated_at: datetime


class MenuItemWithCategory(MenuItemResponse):
    category_name: str | None = None
