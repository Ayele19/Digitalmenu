import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings as app_settings
from app.database import AsyncSessionLocal, Base, engine

# Import ALL models here at module load time so SQLAlchemy's mapper
# can resolve all relationship references (e.g. Category → MenuItem)
# before any query is executed.
from app.models import admin, category, menu_item  # noqa: F401
from app.models import settings as settings_model  # noqa: F401

from app.routers import auth, categories, menu_items, public
from app.routers import settings as settings_router
from app.utils.seed import seed_database

app = FastAPI(title="Habesha Café Menu API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads/images", exist_ok=True)
os.makedirs("uploads/videos", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(menu_items.router)
app.include_router(public.router)
app.include_router(settings_router.router)


@app.on_event("startup")
async def startup_event() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        await seed_database(db)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "Habesha Café Menu API"}
