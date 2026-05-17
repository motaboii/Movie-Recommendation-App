"""
Integration tests for the FastAPI application.

Uses FastAPI's TestClient (backed by httpx) — no live server required.

Run:
    cd backend
    pytest tests/test_api.py -v
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def client() -> TestClient:
    """Create a TestClient for the app, shared across the test module."""
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c


# ── Root endpoint ─────────────────────────────────────────────────────────────

class TestRoot:
    def test_get_root_status(self, client: TestClient) -> None:
        response = client.get("/")
        assert response.status_code == 200

    def test_get_root_body(self, client: TestClient) -> None:
        response = client.get("/")
        body = response.json()
        assert "message" in body
        assert "version" in body
        assert body["version"] == "1.0.0"

    def test_get_root_content_type(self, client: TestClient) -> None:
        response = client.get("/")
        assert "application/json" in response.headers["content-type"]


# ── /health ───────────────────────────────────────────────────────────────────

class TestHealthEndpoint:
    def test_health_status_code(self, client: TestClient) -> None:
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_body(self, client: TestClient) -> None:
        response = client.get("/health")
        assert response.json() == {"status": "ok"}

    def test_api_health_status_code(self, client: TestClient) -> None:
        """The /api/health route (from the router prefix) also works."""
        response = client.get("/api/health")
        assert response.status_code == 200

    def test_api_health_body(self, client: TestClient) -> None:
        response = client.get("/api/health")
        assert response.json() == {"status": "ok"}


# ── /api/recommendations/similar/{movie_id} ───────────────────────────────────

class TestSimilarMoviesEndpoint:
    def test_known_movie_status(self, client: TestClient) -> None:
        response = client.get("/api/recommendations/similar/1")
        assert response.status_code == 200

    def test_known_movie_response_structure(self, client: TestClient) -> None:
        response = client.get("/api/recommendations/similar/1")
        body = response.json()
        assert "recommendations" in body
        assert "movie_id" in body
        assert "total" in body
        assert body["movie_id"] == 1
        assert isinstance(body["recommendations"], list)
        assert isinstance(body["total"], int)

    def test_recommendation_item_fields(self, client: TestClient) -> None:
        response = client.get("/api/recommendations/similar/3")
        body = response.json()
        for item in body["recommendations"]:
            assert "movie_id" in item
            assert "score" in item
            assert "reason" in item
            assert isinstance(item["movie_id"], int)
            assert isinstance(item["score"], float)
            assert isinstance(item["reason"], str)

    def test_limit_param_respected(self, client: TestClient) -> None:
        limit = 5
        response = client.get(f"/api/recommendations/similar/1?limit={limit}")
        assert response.status_code == 200
        body = response.json()
        assert len(body["recommendations"]) <= limit

    def test_default_limit(self, client: TestClient) -> None:
        response = client.get("/api/recommendations/similar/1")
        body = response.json()
        assert len(body["recommendations"]) <= 10  # default limit

    def test_scores_in_range(self, client: TestClient) -> None:
        response = client.get("/api/recommendations/similar/5")
        body = response.json()
        for item in body["recommendations"]:
            assert 0.0 <= item["score"] <= 1.0

    @pytest.mark.parametrize("movie_id", [1, 3, 9, 28, 55])
    def test_various_movie_ids(self, client: TestClient, movie_id: int) -> None:
        response = client.get(f"/api/recommendations/similar/{movie_id}")
        assert response.status_code == 200

    def test_unknown_movie_returns_200_empty(self, client: TestClient) -> None:
        """Unknown movie IDs should return 200 with an empty recommendations list."""
        response = client.get("/api/recommendations/similar/999999")
        assert response.status_code == 200
        body = response.json()
        assert body["recommendations"] == []
        assert body["total"] == 0


# ── /api/recommendations/{user_id} ───────────────────────────────────────────

class TestUserRecommendationsEndpoint:
    def test_known_user_status(self, client: TestClient) -> None:
        response = client.get("/api/recommendations/user_001")
        assert response.status_code == 200

    def test_known_user_response_structure(self, client: TestClient) -> None:
        response = client.get("/api/recommendations/user_001")
        body = response.json()
        assert "recommendations" in body
        assert "user_id" in body
        assert "total" in body
        assert body["user_id"] == "user_001"
        assert isinstance(body["recommendations"], list)
        assert isinstance(body["total"], int)

    def test_known_user_returns_results(self, client: TestClient) -> None:
        response = client.get("/api/recommendations/user_001")
        body = response.json()
        assert len(body["recommendations"]) > 0

    def test_cold_start_unknown_user(self, client: TestClient) -> None:
        """An unknown user_id (cold-start) should return 200 — not 404 or 500."""
        response = client.get("/api/recommendations/unknown_user_xyz")
        assert response.status_code == 200

    def test_cold_start_response_structure(self, client: TestClient) -> None:
        response = client.get("/api/recommendations/unknown_user_xyz")
        body = response.json()
        assert "recommendations" in body
        assert "user_id" in body
        assert body["user_id"] == "unknown_user_xyz"

    def test_limit_param_respected(self, client: TestClient) -> None:
        limit = 5
        response = client.get(f"/api/recommendations/user_002?limit={limit}")
        assert response.status_code == 200
        body = response.json()
        assert len(body["recommendations"]) <= limit

    def test_default_limit(self, client: TestClient) -> None:
        response = client.get("/api/recommendations/user_003")
        body = response.json()
        assert len(body["recommendations"]) <= 20  # default limit

    def test_recommendation_items_structure(self, client: TestClient) -> None:
        response = client.get("/api/recommendations/user_004")
        body = response.json()
        for item in body["recommendations"]:
            assert "movie_id" in item
            assert "score" in item
            assert "reason" in item
            assert 0.0 <= item["score"] <= 1.0

    def test_total_matches_list_length(self, client: TestClient) -> None:
        response = client.get("/api/recommendations/user_005")
        body = response.json()
        assert body["total"] == len(body["recommendations"])

    @pytest.mark.parametrize("user_id", ["user_001", "user_010", "user_020", "user_030"])
    def test_various_users(self, client: TestClient, user_id: str) -> None:
        response = client.get(f"/api/recommendations/{user_id}")
        assert response.status_code == 200
        body = response.json()
        assert body["user_id"] == user_id


# ── OpenAPI / docs ────────────────────────────────────────────────────────────

class TestDocs:
    def test_openapi_json_available(self, client: TestClient) -> None:
        response = client.get("/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert "openapi" in schema
        assert "paths" in schema

    def test_swagger_ui_available(self, client: TestClient) -> None:
        response = client.get("/docs")
        assert response.status_code == 200

    def test_redoc_available(self, client: TestClient) -> None:
        response = client.get("/redoc")
        assert response.status_code == 200


# ── CORS headers ──────────────────────────────────────────────────────────────

class TestCORS:
    def test_cors_preflight(self, client: TestClient) -> None:
        """OPTIONS preflight from an allowed origin should return CORS headers."""
        response = client.options(
            "/api/recommendations/user_001",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        # FastAPI's CORSMiddleware returns 200 for OPTIONS
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers

    def test_cors_header_on_get(self, client: TestClient) -> None:
        response = client.get(
            "/api/recommendations/user_001",
            headers={"Origin": "http://localhost:3000"},
        )
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
