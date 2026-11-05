from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.database import Base


def _utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class CafeSettings(Base):
    __tablename__ = "cafe_settings"

    id = Column(Integer, primary_key=True)
    cafe_name = Column(String(200), default="Habesha Café", nullable=False)
    welcome_message = Column(
        String(500),
        default="Welcome! Enjoy our authentic Ethiopian flavors.",
        nullable=False,
    )
    logo_url = Column(String(500), nullable=True)
    address = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    is_menu_active = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow, nullable=False)
