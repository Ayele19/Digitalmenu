import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings as app_settings
from app.core.dependencies import get_current_admin, get_db
from app.models.settings import CafeSettings
from app.schemas.settings import SettingsResponse, SettingsUpdate
from app.utils.image_utils import save_upload_file

# Allowed video MIME types
_VIDEO_CONTENT_TYPES = {
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
}
# 200 MB ceiling
_MAX_VIDEO_BYTES = 200 * 1024 * 1024

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
            video_url=None,
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


@router.post("/video", response_model=SettingsResponse)
async def upload_video(
    video: UploadFile,
    db: AsyncSession = Depends(get_db),
) -> SettingsResponse:
    """Upload and store the cinematic hero video for the public menu page."""
    # Validate content type
    content_type = video.content_type or ""
    if content_type not in _VIDEO_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported video format '{content_type}'. "
                   "Please upload an MP4, WebM, OGG, or MOV file.",
        )

    # Read and check size
    file_bytes = await video.read()
    if len(file_bytes) > _MAX_VIDEO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Video file exceeds the 200 MB limit.",
        )

    # Determine extension from original filename
    original_name = video.filename or "video.mp4"
    _, ext = os.path.splitext(original_name)
    ext = ext.lower() if ext else ".mp4"

    filename = f"{uuid.uuid4().hex}{ext}"

    # Save under uploads/videos/
    video_dir = Path(app_settings.UPLOAD_DIR).parent / "videos"
    video_dir.mkdir(parents=True, exist_ok=True)
    dest_path = video_dir / filename

    try:
        dest_path.write_bytes(file_bytes)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save video: {exc}",
        )

    video_url = f"/uploads/videos/{filename}"

    row = await _get_or_create_settings(db)
    # Delete the old video file if it exists
    if row.video_url:
        old_path = Path(app_settings.UPLOAD_DIR).parent.parent / row.video_url.lstrip("/")
        try:
            old_path.unlink(missing_ok=True)
        except Exception:
            pass  # Non-fatal

    row.video_url = video_url

    await db.commit()
    await db.refresh(row)
    return SettingsResponse.model_validate(row)
