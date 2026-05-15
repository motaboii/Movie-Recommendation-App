"""
Movie Recommendation API — Application Entry Point
"""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import recommendations
from app.core.config import settings

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ── Application factory ───────────────────────────────────────────────────────
app = FastAPI(
    title="Movie Recommendation API",
    description=(
        "Hybrid ML recommendation engine combining TF-IDF content-based "
        "filtering with SVD collaborative filtering."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(recommendations.router, prefix="/api", tags=["recommendations"])

# ── Root routes ───────────────────────────────────────────────────────────────

@app.get("/", tags=["root"])
def root() -> dict:
    """API root — returns basic service information."""
    return {
        "message": "Movie Recommendation API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["health"])
def health() -> dict:
    """Top-level health check (mirrors /api/health for Docker HEALTHCHECK)."""
    return {"status": "ok"}


# ── Dev entrypoint ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True,
    )
