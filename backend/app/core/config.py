"""
Application configuration using Pydantic BaseSettings.
All values can be overridden by environment variables or a .env file.
"""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Supabase ────────────────────────────────────────────────────────────
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # ── Server ──────────────────────────────────────────────────────────────
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # ── CORS ────────────────────────────────────────────────────────────────
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


# Singleton — imported everywhere as `from app.core.config import settings`
settings = Settings()
