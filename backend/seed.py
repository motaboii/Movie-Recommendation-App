#!/usr/bin/env python3
"""
Seed the Supabase database with sample movies from data/movies.csv.

Usage
-----
    # From the backend/ directory:
    python seed.py

Environment variables required (or placed in .env):
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
"""
from __future__ import annotations

import csv
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client, Client

# Bootstrap
load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print(
        "ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set "
        "as environment variables or in a .env file.",
        file=sys.stderr,
    )
    sys.exit(1)

_DATA_DIR = Path(__file__).resolve().parent / "data"
_MOVIES_CSV = _DATA_DIR / "movies.csv"
_BATCH_SIZE = 20


# Helpers

def _split_pipe(value: str) -> list:
    """Split a pipe-separated CSV string into a Python list (-> PostgreSQL TEXT[])."""
    return [v.strip() for v in value.split("|") if v.strip()]


def _coerce_row(row: dict) -> dict:
    """Coerce CSV string values to correct Python types."""
    return {
        "id": int(row["id"]),
        "title": row["title"].strip(),
        "overview": row.get("overview", "").strip(),
        "genres": _split_pipe(row.get("genres", "")),       # list -> TEXT[]
        "cast_members": _split_pipe(row.get("cast", "")),   # list -> TEXT[]
        "director": row.get("director", "").strip(),
        "poster_url": row.get("poster_url", "").strip() or None,
        "backdrop_url": row.get("backdrop_url", "").strip() or None,
        "release_year": int(row["release_year"]) if row.get("release_year") else None,
        "average_rating": float(row["average_rating"]) if row.get("average_rating") else None,
        "vote_count": int(row["vote_count"]) if row.get("vote_count") else None,
        "runtime": int(row["runtime"]) if row.get("runtime") else None,
        "language": row.get("language", "en").strip() or "en",
    }


def _chunked(lst: list, size: int):
    for i in range(0, len(lst), size):
        yield lst[i: i + size]


def log(msg: str) -> None:
    """Print safely on Windows terminals that may not support UTF-8."""
    try:
        print(msg)
    except UnicodeEncodeError:
        print(msg.encode("ascii", errors="replace").decode("ascii"))


# Core seeding

def seed_movies(client: Client) -> None:
    if not _MOVIES_CSV.exists():
        print(f"ERROR: {_MOVIES_CSV} not found.", file=sys.stderr)
        sys.exit(1)

    log(f"Reading movies from {_MOVIES_CSV} ...")
    rows = []
    with _MOVIES_CSV.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for raw_row in reader:
            try:
                rows.append(_coerce_row(raw_row))
            except (ValueError, KeyError) as exc:
                print(f"  Skipping malformed row id={raw_row.get('id', '?')}: {exc}")

    total = len(rows)
    log(f"Found {total} movies. Upserting in batches of {_BATCH_SIZE} ...\n")

    upserted = 0
    errors = 0

    for batch_num, batch in enumerate(_chunked(rows, _BATCH_SIZE), start=1):
        try:
            client.table("movies").upsert(batch, on_conflict="id").execute()
            upserted += len(batch)
            ids = [r["id"] for r in batch]
            log(f"  Batch {batch_num:>3}: OK  {len(batch):>3} movies (IDs {ids[0]}-{ids[-1]})")
        except Exception as exc:
            errors += len(batch)
            print(f"  Batch {batch_num:>3}: ERROR -- {exc}", file=sys.stderr)

    log(f"\n{'=' * 50}")
    log(f"Done.  Upserted: {upserted}  |  Errors: {errors}  |  Total: {total}")

    if errors:
        print("\nSome batches failed. Check your schema.sql was applied.", file=sys.stderr)
        sys.exit(1)


# Entry point

def main() -> None:
    log("Connecting to Supabase ...")
    try:
        client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        log(f"Connected to: {SUPABASE_URL}\n")
    except Exception as exc:
        print(f"ERROR: Could not connect -- {exc}", file=sys.stderr)
        sys.exit(1)

    seed_movies(client)


if __name__ == "__main__":
    main()
