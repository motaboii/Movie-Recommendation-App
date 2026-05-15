-- ============================================================
-- Movie Recommendation System — Supabase Schema
-- Run this in your Supabase SQL Editor (Project > SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- MOVIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.movies (
    id              BIGSERIAL PRIMARY KEY,
    title           TEXT NOT NULL,
    overview        TEXT,
    genres          TEXT[] DEFAULT '{}',
    cast_members    TEXT[] DEFAULT '{}',   -- renamed from "cast" (reserved keyword)
    director        TEXT,
    poster_url      TEXT,
    backdrop_url    TEXT,
    release_year    INTEGER,
    average_rating  NUMERIC(3, 1) DEFAULT 0.0,
    vote_count      INTEGER DEFAULT 0,
    runtime         INTEGER,               -- minutes
    language        TEXT DEFAULT 'en',
    tmdb_id         INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROFILES TABLE (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username         TEXT UNIQUE,
    avatar_url       TEXT,
    preferred_genres TEXT[] DEFAULT '{}',
    is_admin         BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER RATINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_ratings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    movie_id    BIGINT NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
    rating      NUMERIC(2, 1) CHECK (rating >= 1 AND rating <= 5),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, movie_id)
);

-- ============================================================
-- USER FAVORITES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    movie_id    BIGINT NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, movie_id)
);

-- ============================================================
-- WATCH HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.watch_history (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    movie_id         BIGINT NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
    watched_at       TIMESTAMPTZ DEFAULT NOW(),
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100)
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_movies_title        ON public.movies USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_movies_genres       ON public.movies USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_movies_release_year ON public.movies(release_year DESC);
CREATE INDEX IF NOT EXISTS idx_movies_rating       ON public.movies(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_user_ratings_user   ON public.user_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_movie  ON public.user_ratings(movie_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user  ON public.watch_history(user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER movies_updated_at BEFORE UPDATE ON public.movies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER user_ratings_updated_at BEFORE UPDATE ON public.user_ratings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.movies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

-- Movies: public read, admin write
CREATE POLICY "Movies are publicly readable" ON public.movies
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can insert movies" ON public.movies
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "Admins can update movies" ON public.movies
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "Admins can delete movies" ON public.movies
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- Profiles: own row read/write, public read
CREATE POLICY "Profiles are publicly readable" ON public.profiles
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User Ratings
CREATE POLICY "Users can view own ratings" ON public.user_ratings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ratings" ON public.user_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON public.user_ratings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings" ON public.user_ratings
    FOR DELETE USING (auth.uid() = user_id);

-- User Favorites
CREATE POLICY "Users can view own favorites" ON public.user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON public.user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON public.user_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Watch History
CREATE POLICY "Users can view own watch history" ON public.watch_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watch history" ON public.watch_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watch history" ON public.watch_history
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
