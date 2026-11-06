import io
import os
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError


async def save_upload_file(file: UploadFile, upload_dir: str) -> str:
    """
    Validate, resize, and persist an uploaded image file.

    - Reads file bytes and verifies it is a valid image via Pillow.
    - Converts RGBA / palette / other non-RGB modes to RGB (handles transparency).
    - Thumbnails the image to at most 800×800 pixels (aspect-ratio preserved).
    - Saves as JPEG with quality=85 to ``upload_dir``.
    - Returns the public path ``/uploads/images/{filename}``.

    Raises HTTP 400 if the upload is not a valid image.
    """
    file_bytes = await file.read()

    try:
        image = Image.open(io.BytesIO(file_bytes))
        # Verify full image data (catches truncated files)
        image.verify()
    except (UnidentifiedImageError, Exception):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid image.",
        )

    # Re-open after verify() (verify() leaves the file pointer in an unusable state)
    try:
        image = Image.open(io.BytesIO(file_bytes))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not process the uploaded image.",
        )

    # Determine file extension from original filename; default to .jpg
    original_name = file.filename or ""
    _, ext = os.path.splitext(original_name)
    ext = ext.lower() if ext else ".jpg"
    # Always save as JPEG regardless of original format
    save_ext = ".jpg"
    filename = f"{uuid4().hex}{save_ext}"

    # Convert to RGB so JPEG encoding always works
    if image.mode not in ("RGB", "L"):
        # Composite onto white background to handle transparency
        background = Image.new("RGB", image.size, (255, 255, 255))
        if image.mode == "RGBA":
            background.paste(image, mask=image.split()[3])
        else:
            background.paste(image.convert("RGB"))
        image = background
    elif image.mode == "L":
        # Greyscale is fine for JPEG; keep as-is
        pass

    # Resize maintaining aspect ratio — 1200px for sharp retina display
    image.thumbnail((1200, 1200), Image.LANCZOS)

    # Ensure upload directory exists
    dest_dir = Path(upload_dir)
    dest_dir.mkdir(parents=True, exist_ok=True)

    dest_path = dest_dir / filename
    try:
        image.save(str(dest_path), format="JPEG", quality=95, optimize=True, progressive=True)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to save image: {exc}",
        )

    return f"/uploads/images/{filename}"
