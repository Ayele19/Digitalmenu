from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SettingsUpdate(BaseModel):
    cafe_name: str | None = None
    welcome_message: str | None = None
    address: str | None = None
    phone: str | None = None
    is_menu_active: bool | None = None


class SettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cafe_name: str
    welcome_message: str
    logo_url: str | None
    video_url: str | None
    address: str | None
    phone: str | None
    is_menu_active: bool
    updated_at: datetime
