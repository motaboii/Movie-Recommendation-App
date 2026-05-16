"""
FastAPI router for movie recommendations.

Endpoints
---------
GET /api/recommendations/{user_id}?limit=20
    Hybrid recommendations for a given user.

GET /api/recommendations/similar/{movie_id}?limit=10
    Content-based similar movies.

GET /health
    Simple liveness probe.
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.services.recommender import recommender

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Response schemas ─────────────────────────────────────────────────────────

class RecommendationItem(BaseModel):
    movie_id: int
    score: float
    reason: str


class RecommendationsResponse(BaseModel):
    recommendations: list[RecommendationItem]
    user_id: str
    total: int


class SimilarMoviesResponse(BaseModel):
    recommendations: list[RecommendationItem]
    movie_id: int
    total: int


class HealthResponse(BaseModel):
    status: str


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse, tags=["health"])
def health_check() -> dict[str, Any]:
    """Liveness probe — returns 200 when the API is up."""
    return {"status": "ok"}


@router.get(
    "/recommendations/similar/{movie_id}",
    response_model=SimilarMoviesResponse,
    summary="Content-based similar movies",
)
def get_similar_movies(
    movie_id: int,
    limit: int = Query(default=10, ge=1, le=50, description="Max results to return"),
) -> dict[str, Any]:
    """
    Return the top-N movies that are content-similar to *movie_id*.

    Similarity is computed using TF-IDF on genres, cast, director and overview.
    """
    try:
        results = recommender.get_similar_movies(movie_id=movie_id, n=limit)
    except Exception as exc:  # pragma: no cover
        logger.exception("Error computing similar movies for movie_id=%s", movie_id)
        raise HTTPException(status_code=500, detail="Recommendation engine error") from exc

    items = [
        RecommendationItem(
            movie_id=r["movie_id"],
            score=round(float(r["score"]), 4),
            reason=r.get("reason", "Similar content"),
        )
        for r in results
    ]
    return SimilarMoviesResponse(
        recommendations=items,
        movie_id=movie_id,
        total=len(items),
    )


@router.get(
    "/recommendations/{user_id}",
    response_model=RecommendationsResponse,
    summary="Hybrid recommendations for a user",
)
def get_user_recommendations(
    user_id: str,
    limit: int = Query(default=20, ge=1, le=100, description="Max results to return"),
) -> dict[str, Any]:
    """
    Return hybrid (content + collaborative) recommendations for *user_id*.

    Falls back to pure content-based recommendations when the user has no
    rating history (cold-start scenario).
    """
    try:
        # Fetch movies the user has already rated
        user_rated_ids = recommender.get_user_rated_movie_ids(user_id)

        results = recommender.get_hybrid_recommendations(
            user_id=user_id,
            user_rated_movie_ids=user_rated_ids,
            n=limit,
        )
    except Exception as exc:  # pragma: no cover
        logger.exception("Error computing recommendations for user_id=%s", user_id)
        raise HTTPException(status_code=500, detail="Recommendation engine error") from exc

    items = [
        RecommendationItem(
            movie_id=r["movie_id"],
            score=round(float(r["score"]), 4),
            reason=r.get("reason", "Based on your ratings"),
        )
        for r in results
    ]
    return RecommendationsResponse(
        recommendations=items,
        user_id=user_id,
        total=len(items),
    )
