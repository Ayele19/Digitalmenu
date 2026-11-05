from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings as app_settings
from app.core.dependencies import get_current_admin, get_db
from app.models.settings import CafeSettings
from app.schemas.settings import SettingsResponse, SettingsUpdate
from app.utils.image_utils import save_upload_file

router = APIRouter(
    prefix="/api/settings",
    tags=["settings"],
    dependencies=[Depends(get_current_admin)],
)


async def _get_or_create_settings(db: AsyncSession) -> CafeSettings:
    """Fetch the singleton CafeSettings row, creating it with defaults if absent."""
    result = await db.execute(select(CafeSettings).where(CafeSettings.id == 1))
    row: CafeSettings | None = result.scalar_one_or_none()
    if row is None:
        row = CafeSettings(
            id=1,
            cafe_name="Habesha Café",
            welcome_message="Welcome! Enjoy our authentic Ethiopian flavors.",
            logo_url=None,
            address=None,
            phone=None,
            is_menu_active=True,
        )
        db.add(row)
        await db.commit()
        await db.refresh(row)
    return row


@router.get("/", response_model=SettingsResponse)
async def get_settings(db: AsyncSession = Depends(get_db)) -> SettingsResponse:
    """Return the current café settings, creating defaults if none exist."""
    row = await _get_or_create_settings(db)
    return SettingsResponse.model_validate(row)


@router.put("/", response_model=SettingsResponse)
async def update_settings(
    payload: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
) -> SettingsResponse:
    """Update one or more café setting fields."""
    row = await _get_or_create_settings(db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(row, field, value)

    await db.commit()
    await db.refresh(row)
    return SettingsResponse.model_validate(row)


@router.post("/logo", response_model=SettingsResponse)
async def upload_logo(
    logo: UploadFile,
    db: AsyncSession = Depends(get_db),
) -> SettingsResponse:
    """Upload and store a new café logo, replacing the previous one."""
    logo_url = await save_upload_file(logo, app_settings.UPLOAD_DIR)

    row = await _get_or_create_settings(db)
    row.logo_url = logo_url

    await db.commit()
    await db.refresh(row)
    return SettingsResponse.model_validate(row)
