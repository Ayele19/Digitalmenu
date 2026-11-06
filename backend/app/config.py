from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/qrmenu"
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200
    UPLOAD_DIR: str = "uploads/images"
    # Comma-separated list of allowed origins, e.g.:
    #   https://qrmenu.vercel.app,https://qrmenu-git-main-yourname.vercel.app
    FRONTEND_URL: str = "http://localhost:5173"

    @property
    def allowed_origins(self) -> list[str]:
        """Return all CORS origins, always including localhost for dev."""
        origins = [o.strip() for o in self.FRONTEND_URL.split(",") if o.strip()]
        for local in ("http://localhost:5173", "http://localhost:3000"):
            if local not in origins:
                origins.append(local)
        return origins

    class Config:
        env_file = ".env"


settings = Settings()
