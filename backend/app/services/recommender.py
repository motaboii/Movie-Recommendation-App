"""
Hybrid Movie Recommendation Engine
===================================
Strategy
--------
* Content-based  : TF-IDF on (genres + cast + director + overview) → cosine similarity
* Collaborative  : TruncatedSVD on a sparse user–item rating matrix
* Hybrid blend   : 40 % content  +  60 % collaborative
* Cold-start     : When a user has no ratings, fall back to pure content-based
                   recommendations seeded from globally popular movies.

Data files expected (relative to this module's package root):
    ../../data/movies.csv
    ../../data/ratings.csv
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize

logger = logging.getLogger(__name__)

# ── Paths ─────────────────────────────────────────────────────────────────────
_THIS_DIR = Path(__file__).resolve().parent          # app/services/
_DATA_DIR = _THIS_DIR.parent.parent / "data"         # backend/data/
_MOVIES_CSV = _DATA_DIR / "movies.csv"
_RATINGS_CSV = _DATA_DIR / "ratings.csv"

# ── Hyper-parameters ──────────────────────────────────────────────────────────
_SVD_COMPONENTS = 50
_CONTENT_WEIGHT = 0.40
_COLLAB_WEIGHT = 0.60
_POPULAR_SEED_N = 10          # top-N popular movies used in cold-start seeding


class HybridRecommender:
    """Hybrid movie recommender (content + collaborative)."""

    def __init__(self) -> None:
        self._ready = False
        self._movies_df: pd.DataFrame = pd.DataFrame()
        self._ratings_df: pd.DataFrame = pd.DataFrame()

        # Content-based artefacts
        self._tfidf_matrix: Any = None          # sparse (n_movies × vocab)
        self._movie_id_to_idx: dict[int, int] = {}
        self._idx_to_movie_id: dict[int, int] = {}

        # Collaborative artefacts
        self._svd: TruncatedSVD | None = None
        self._user_item_matrix: csr_matrix | None = None
        self._user_id_to_idx: dict[str, int] = {}
        self._collab_movie_ids: list[int] = []      # column order in matrix
        self._item_factors: np.ndarray | None = None  # V^T  (items in latent space)

        self._load_data()

    # ── Data loading ──────────────────────────────────────────────────────────

    def _load_data(self) -> None:
        """Load CSV files and build all model artefacts."""
        if not _MOVIES_CSV.exists():
            logger.warning("movies.csv not found at %s — recommender disabled", _MOVIES_CSV)
            return
        if not _RATINGS_CSV.exists():
            logger.warning("ratings.csv not found at %s — collaborative filtering disabled", _RATINGS_CSV)

        try:
            self._movies_df = pd.read_csv(_MOVIES_CSV)
            self._movies_df["id"] = self._movies_df["id"].astype(int)
            self._movies_df = self._movies_df.drop_duplicates(subset="id").reset_index(drop=True)

            self._build_content_features(self._movies_df)

            if _RATINGS_CSV.exists():
                self._ratings_df = pd.read_csv(_RATINGS_CSV)
                self._ratings_df["movie_id"] = self._ratings_df["movie_id"].astype(int)
                self._ratings_df["rating"] = self._ratings_df["rating"].astype(float)
                self._build_collab_matrix(self._ratings_df)

            self._ready = True
            logger.info(
                "HybridRecommender ready — %d movies, %d ratings",
                len(self._movies_df),
                len(self._ratings_df),
            )
        except Exception:
            logger.exception("Failed to initialise HybridRecommender")

    # ── Feature builders ─────────────────────────────────────────────────────

    def _build_content_features(self, df: pd.DataFrame) -> None:
        """Build TF-IDF matrix from text features."""
        def _make_soup(row: pd.Series) -> str:
            genres   = str(row.get("genres",   "")).replace("|", " ")
            cast     = str(row.get("cast",     "")).replace("|", " ")
            director = str(row.get("director", ""))
            overview = str(row.get("overview", ""))
            # Repeat genres & director to give them higher weight
            return f"{genres} {genres} {director} {director} {cast} {overview}"

        df = df.copy()
        df["soup"] = df.apply(_make_soup, axis=1)

        vectorizer = TfidfVectorizer(
            analyzer="word",
            ngram_range=(1, 2),
            min_df=1,
            stop_words="english",
            sublinear_tf=True,
        )
        self._tfidf_matrix = vectorizer.fit_transform(df["soup"])

        self._movie_id_to_idx = {int(mid): idx for idx, mid in enumerate(df["id"])}
        self._idx_to_movie_id = {idx: int(mid) for idx, mid in enumerate(df["id"])}
        logger.debug("TF-IDF matrix shape: %s", self._tfidf_matrix.shape)

    def _build_collab_matrix(self, ratings_df: pd.DataFrame) -> None:
        """Build sparse user–item matrix and fit TruncatedSVD."""
        users = ratings_df["user_id"].unique().tolist()
        movies = ratings_df["movie_id"].unique().tolist()

        self._user_id_to_idx = {uid: idx for idx, uid in enumerate(users)}
        self._collab_movie_ids = movies
        movie_idx_map = {mid: idx for idx, mid in enumerate(movies)}

        row_ids = ratings_df["user_id"].map(self._user_id_to_idx).values
        col_ids = ratings_df["movie_id"].map(movie_idx_map).values
        data    = ratings_df["rating"].values

        self._user_item_matrix = csr_matrix(
            (data, (row_ids, col_ids)),
            shape=(len(users), len(movies)),
            dtype=np.float32,
        )

        n_components = min(_SVD_COMPONENTS, len(movies) - 1, len(users) - 1)
        if n_components < 1:
            logger.warning("Not enough data for SVD — collaborative filtering disabled")
            return

        self._svd = TruncatedSVD(n_components=n_components, random_state=42)
        self._svd.fit(self._user_item_matrix)
        # Pre-compute item factors in latent space: shape (n_movies, n_components)
        self._item_factors = self._svd.components_.T   # V^T transposed
        logger.debug("SVD fitted — components=%d", n_components)

    # ── Public API ────────────────────────────────────────────────────────────

    def get_user_rated_movie_ids(self, user_id: str) -> list[int]:
        """Return movie IDs that *user_id* has already rated."""
        if self._ratings_df.empty:
            return []
        user_rows = self._ratings_df[self._ratings_df["user_id"] == user_id]
        return user_rows["movie_id"].astype(int).tolist()

    def get_similar_movies(self, movie_id: int, n: int = 10) -> list[dict]:
        """
        Pure content-based: return top-N movies similar to *movie_id*.
        Excludes *movie_id* itself from results.
        """
        if not self._ready or self._tfidf_matrix is None:
            return []

        idx = self._movie_id_to_idx.get(movie_id)
        if idx is None:
            logger.warning("movie_id=%d not found in content index", movie_id)
            return []

        movie_vec = self._tfidf_matrix[idx]
        sim_scores = cosine_similarity(movie_vec, self._tfidf_matrix).flatten()
        sim_scores[idx] = -1.0  # exclude self

        top_n_indices = np.argsort(sim_scores)[::-1][:n]
        return [
            {
                "movie_id": self._idx_to_movie_id[i],
                "score": float(sim_scores[i]),
                "reason": "Similar content",
            }
            for i in top_n_indices
            if sim_scores[i] > 0
        ]

    def get_content_recommendations(
        self, movie_ids: list[int], n: int = 20
    ) -> list[dict]:
        """
        Content-based recommendations seeded by a *list* of movie IDs.
        Averages their TF-IDF vectors and returns the top-N closest movies,
        excluding the seed movies themselves.
        """
        if not self._ready or self._tfidf_matrix is None or not movie_ids:
            return self._popular_fallback(n)

        valid_indices = [
            self._movie_id_to_idx[mid]
            for mid in movie_ids
            if mid in self._movie_id_to_idx
        ]
        if not valid_indices:
            return self._popular_fallback(n)

        # Mean vector of seed movies (dense for averaging, then cosine)
        seed_matrix = self._tfidf_matrix[valid_indices]
        mean_vec = np.asarray(seed_matrix.mean(axis=0))  # Convert np.matrix to np.ndarray
        sim_scores = cosine_similarity(mean_vec, self._tfidf_matrix).flatten()

        # Exclude seed movies
        for i in valid_indices:
            sim_scores[i] = -1.0

        top_n_indices = np.argsort(sim_scores)[::-1][:n]
        return [
            {
                "movie_id": self._idx_to_movie_id[i],
                "score": float(sim_scores[i]),
                "reason": "Similar to movies you liked",
            }
            for i in top_n_indices
            if sim_scores[i] > 0
        ]

    def get_collab_recommendations(
        self, user_id: str, n: int = 20
    ) -> list[dict]:
        """
        SVD-based collaborative recommendations for *user_id*.
        Returns an empty list if the user is unknown (cold-start).
        """
        if (
            not self._ready
            or self._svd is None
            or self._user_item_matrix is None
            or self._item_factors is None
        ):
            return []

        user_idx = self._user_id_to_idx.get(user_id)
        if user_idx is None:
            return []   # unknown user — caller handles cold-start

        # Project user vector to latent space, then reconstruct ratings
        user_vec = self._user_item_matrix[user_idx]  # sparse (1 × n_movies)
        user_latent = self._svd.transform(user_vec)  # (1 × n_components)
        predicted_ratings = (user_latent @ self._item_factors.T).flatten()  # (n_movies,)

        # Zero out already-rated movies
        rated_cols = self._user_item_matrix[user_idx].nonzero()[1]
        predicted_ratings[rated_cols] = -np.inf

        top_n_indices = np.argsort(predicted_ratings)[::-1][:n]
        results = []
        for i in top_n_indices:
            score = float(predicted_ratings[i])
            if np.isinf(score):
                break
            results.append(
                {
                    "movie_id": self._collab_movie_ids[i],
                    "score": float(np.clip(score / 5.0, 0.0, 1.0)),
                    "reason": "Based on your ratings",
                }
            )
        return results

    def get_hybrid_recommendations(
        self,
        user_id: str,
        user_rated_movie_ids: list[int],
        n: int = 20,
    ) -> list[dict]:
        """
        Blend content-based and collaborative recommendations.

        Weighting
        ---------
        * Known user with ratings: 40 % content + 60 % collaborative
        * Cold-start (no ratings): 100 % content seeded from popular movies
        """
        is_cold_start = len(user_rated_movie_ids) == 0

        if is_cold_start:
            logger.debug("Cold-start for user_id=%s — using content fallback", user_id)
            popular_ids = self._get_popular_movie_ids(_POPULAR_SEED_N)
            return self.get_content_recommendations(popular_ids, n=n)

        # ── Gather both score lists ───────────────────────────────────────
        content_recs = self.get_content_recommendations(user_rated_movie_ids, n=n * 2)
        collab_recs  = self.get_collab_recommendations(user_id, n=n * 2)

        # If collaborative is empty (user not in training set), use content only
        if not collab_recs:
            logger.debug(
                "User %s not in collab index — using pure content", user_id
            )
            return [
                {**r, "reason": "Similar to movies you liked"}
                for r in content_recs[:n]
            ]

        # ── Merge scores ─────────────────────────────────────────────────
        combined: dict[int, float] = {}

        for rec in content_recs:
            mid = rec["movie_id"]
            combined[mid] = combined.get(mid, 0.0) + _CONTENT_WEIGHT * rec["score"]

        for rec in collab_recs:
            mid = rec["movie_id"]
            combined[mid] = combined.get(mid, 0.0) + _COLLAB_WEIGHT * rec["score"]

        # Exclude already-rated movies
        for mid in user_rated_movie_ids:
            combined.pop(mid, None)

        sorted_items = sorted(combined.items(), key=lambda x: x[1], reverse=True)[:n]

        return [
            {
                "movie_id": mid,
                "score": float(np.clip(score, 0.0, 1.0)),
                "reason": "Based on your ratings",
            }
            for mid, score in sorted_items
        ]

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _get_popular_movie_ids(self, n: int) -> list[int]:
        """Return IDs of the top-N most-voted movies."""
        if self._movies_df.empty:
            return []
        col = "vote_count" if "vote_count" in self._movies_df.columns else "average_rating"
        top = self._movies_df.nlargest(n, col)
        return top["id"].astype(int).tolist()

    def _popular_fallback(self, n: int) -> list[dict]:
        """Return a list of popular movies as a last-resort fallback."""
        popular_ids = self._get_popular_movie_ids(n)
        return [
            {
                "movie_id": mid,
                "score": 1.0,
                "reason": "Popular movie",
            }
            for mid in popular_ids
        ]


# ── Module-level singleton ────────────────────────────────────────────────────
recommender = HybridRecommender()
