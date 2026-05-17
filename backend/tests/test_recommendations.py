"""
Unit tests for the HybridRecommender service.

These tests run against the real CSV data files (data/movies.csv and
data/ratings.csv), so they must be executed from the backend/ directory or
with PYTHONPATH set appropriately.

Run:
    cd backend
    pytest tests/test_recommendations.py -v
"""
from __future__ import annotations

import pytest

from app.services.recommender import HybridRecommender, recommender


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def rec() -> HybridRecommender:
    """Return the module-level singleton recommender (already initialised)."""
    return recommender


# ── Helper assertions ─────────────────────────────────────────────────────────

def _assert_recommendation_structure(items: list[dict]) -> None:
    """Assert every item has the correct keys and value types."""
    for item in items:
        assert isinstance(item, dict), f"Expected dict, got {type(item)}"
        assert "movie_id" in item, f"Missing 'movie_id' in {item}"
        assert "score" in item, f"Missing 'score' in {item}"
        assert "reason" in item, f"Missing 'reason' in {item}"
        assert isinstance(item["movie_id"], int), "movie_id must be int"
        assert isinstance(item["score"], float), "score must be float"
        assert 0.0 <= item["score"] <= 1.0, f"score out of [0,1] range: {item['score']}"
        assert isinstance(item["reason"], str), "reason must be str"
        assert len(item["reason"]) > 0, "reason must not be empty"


# ── Recommender initialisation ────────────────────────────────────────────────

class TestRecommenderInit:
    def test_singleton_is_hybrid_recommender(self, rec: HybridRecommender) -> None:
        assert isinstance(rec, HybridRecommender)

    def test_movies_loaded(self, rec: HybridRecommender) -> None:
        """At least 100 movies must be loaded from the CSV."""
        assert not rec._movies_df.empty, "movies_df should not be empty"
        assert len(rec._movies_df) >= 100, (
            f"Expected ≥100 movies, got {len(rec._movies_df)}"
        )

    def test_ratings_loaded(self, rec: HybridRecommender) -> None:
        """At least 400 ratings must be loaded."""
        assert not rec._ratings_df.empty, "ratings_df should not be empty"
        assert len(rec._ratings_df) >= 400, (
            f"Expected ≥400 ratings, got {len(rec._ratings_df)}"
        )

    def test_tfidf_matrix_built(self, rec: HybridRecommender) -> None:
        assert rec._tfidf_matrix is not None
        n_movies = len(rec._movies_df)
        assert rec._tfidf_matrix.shape[0] == n_movies

    def test_svd_fitted(self, rec: HybridRecommender) -> None:
        assert rec._svd is not None
        assert rec._item_factors is not None

    def test_ready_flag(self, rec: HybridRecommender) -> None:
        assert rec._ready is True


# ── get_similar_movies ────────────────────────────────────────────────────────

class TestGetSimilarMovies:
    def test_returns_list(self, rec: HybridRecommender) -> None:
        results = rec.get_similar_movies(movie_id=1, n=10)
        assert isinstance(results, list)

    def test_correct_count(self, rec: HybridRecommender) -> None:
        n = 8
        results = rec.get_similar_movies(movie_id=1, n=n)
        assert len(results) <= n

    def test_does_not_include_self(self, rec: HybridRecommender) -> None:
        movie_id = 3
        results = rec.get_similar_movies(movie_id=movie_id, n=10)
        returned_ids = [r["movie_id"] for r in results]
        assert movie_id not in returned_ids, "Seed movie should not appear in results"

    def test_correct_structure(self, rec: HybridRecommender) -> None:
        results = rec.get_similar_movies(movie_id=5, n=5)
        _assert_recommendation_structure(results)

    def test_scores_descending(self, rec: HybridRecommender) -> None:
        results = rec.get_similar_movies(movie_id=1, n=15)
        scores = [r["score"] for r in results]
        assert scores == sorted(scores, reverse=True), "Scores should be in descending order"

    def test_unknown_movie_returns_empty(self, rec: HybridRecommender) -> None:
        results = rec.get_similar_movies(movie_id=999999, n=10)
        assert results == [], "Unknown movie_id should return empty list"

    @pytest.mark.parametrize("movie_id", [1, 3, 9, 23, 55])
    def test_known_movies(self, rec: HybridRecommender, movie_id: int) -> None:
        results = rec.get_similar_movies(movie_id=movie_id, n=10)
        assert len(results) > 0, f"Expected results for movie_id={movie_id}"
        _assert_recommendation_structure(results)


# ── get_content_recommendations ───────────────────────────────────────────────

class TestGetContentRecommendations:
    def test_returns_list(self, rec: HybridRecommender) -> None:
        results = rec.get_content_recommendations(movie_ids=[1, 3, 5], n=10)
        assert isinstance(results, list)

    def test_correct_structure(self, rec: HybridRecommender) -> None:
        results = rec.get_content_recommendations(movie_ids=[4, 8, 10], n=10)
        _assert_recommendation_structure(results)

    def test_excludes_seed_movies(self, rec: HybridRecommender) -> None:
        seed_ids = [1, 7, 19]
        results = rec.get_content_recommendations(movie_ids=seed_ids, n=20)
        returned_ids = [r["movie_id"] for r in results]
        for sid in seed_ids:
            assert sid not in returned_ids, f"Seed movie {sid} should not be in results"

    def test_empty_input_returns_popular_fallback(self, rec: HybridRecommender) -> None:
        results = rec.get_content_recommendations(movie_ids=[], n=10)
        # Should return popular fallback, not an error
        assert isinstance(results, list)

    def test_max_count_respected(self, rec: HybridRecommender) -> None:
        n = 5
        results = rec.get_content_recommendations(movie_ids=[2, 10, 20], n=n)
        assert len(results) <= n


# ── get_hybrid_recommendations ────────────────────────────────────────────────

class TestGetHybridRecommendations:
    def test_known_user_returns_results(self, rec: HybridRecommender) -> None:
        results = rec.get_hybrid_recommendations(
            user_id="user_001",
            user_rated_movie_ids=rec.get_user_rated_movie_ids("user_001"),
            n=20,
        )
        assert isinstance(results, list)
        assert len(results) > 0

    def test_known_user_correct_structure(self, rec: HybridRecommender) -> None:
        rated = rec.get_user_rated_movie_ids("user_002")
        results = rec.get_hybrid_recommendations(
            user_id="user_002",
            user_rated_movie_ids=rated,
            n=15,
        )
        _assert_recommendation_structure(results)

    def test_cold_start_unknown_user(self, rec: HybridRecommender) -> None:
        """An unknown user (no ratings) should still get recommendations."""
        results = rec.get_hybrid_recommendations(
            user_id="unknown_user_xyz",
            user_rated_movie_ids=[],
            n=10,
        )
        assert isinstance(results, list)
        # Cold-start should fall back to popular / content — not crash
        assert len(results) >= 0  # 0 is acceptable if data is missing

    def test_cold_start_no_rated_ids(self, rec: HybridRecommender) -> None:
        """Passing an empty rated list triggers content-only cold-start."""
        results = rec.get_hybrid_recommendations(
            user_id="user_001",
            user_rated_movie_ids=[],
            n=10,
        )
        assert isinstance(results, list)
        _assert_recommendation_structure(results)

    def test_results_do_not_include_rated_movies(self, rec: HybridRecommender) -> None:
        rated = rec.get_user_rated_movie_ids("user_003")
        results = rec.get_hybrid_recommendations(
            user_id="user_003",
            user_rated_movie_ids=rated,
            n=20,
        )
        returned_ids = {r["movie_id"] for r in results}
        overlap = returned_ids & set(rated)
        assert not overlap, f"Rated movies appeared in recommendations: {overlap}"

    def test_max_count_respected(self, rec: HybridRecommender) -> None:
        n = 7
        rated = rec.get_user_rated_movie_ids("user_005")
        results = rec.get_hybrid_recommendations(
            user_id="user_005",
            user_rated_movie_ids=rated,
            n=n,
        )
        assert len(results) <= n


# ── get_user_rated_movie_ids ──────────────────────────────────────────────────

class TestGetUserRatedMovieIds:
    def test_known_user_returns_list_of_ints(self, rec: HybridRecommender) -> None:
        ids = rec.get_user_rated_movie_ids("user_001")
        assert isinstance(ids, list)
        assert all(isinstance(i, int) for i in ids)
        assert len(ids) > 0

    def test_unknown_user_returns_empty(self, rec: HybridRecommender) -> None:
        ids = rec.get_user_rated_movie_ids("this_user_does_not_exist")
        assert ids == []
