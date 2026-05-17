'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import MovieCard from '@/components/MovieCard'
import MovieModal from '@/components/MovieModal'
import RecommendationCarousel from '@/components/RecommendationCarousel'
import StarRating from '@/components/StarRating'
import { DashboardSkeleton } from '@/components/LoadingSkeleton'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useRecommendations } from '@/hooks/useRecommendations'
import type { Movie, UserFavorite, UserRating } from '@/types'

interface GenreCount {
  genre: string
  count: number
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const { recommendations, loading: recsLoading } = useRecommendations(user?.id)
  const [favorites, setFavorites] = useState<Movie[]>([])
  const [ratings, setRatings] = useState<(UserRating & { movie: Movie })[]>([])
  const [genreBreakdown, setGenreBreakdown] = useState<GenreCount[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const supabase = createClient()

  const computeStats = useCallback(
    (favMovies: Movie[], ratedMovies: (UserRating & { movie: Movie })[]) => {
      const genreMap = new Map<string, number>()
      const allMovies = [
        ...favMovies,
        ...ratedMovies.map((r) => r.movie).filter(Boolean),
      ]
      allMovies.forEach((m) => {
        m?.genres?.forEach((g) => genreMap.set(g, (genreMap.get(g) || 0) + 1))
      })
      const sorted = Array.from(genreMap.entries())
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
      setGenreBreakdown(sorted)
    },
    []
  )

  const fetchDashboardData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      // Fetch favorites with movie data
      const { data: favData } = await supabase
        .from('user_favorites')
        .select('*, movie:movies(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(12)

      const favMovies = (favData as (UserFavorite & { movie: Movie })[])
        ?.map((f) => f.movie)
        .filter(Boolean) || []
      setFavorites(favMovies)

      // Fetch ratings with movie data
      const { data: ratingData } = await supabase
        .from('user_ratings')
        .select('*, movie:movies(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      const typedRatings = (ratingData as (UserRating & { movie: Movie })[]) || []
      setRatings(typedRatings)

      computeStats(favMovies, typedRatings)
    } finally {
      setLoading(false)
    }
  }, [user, supabase, computeStats])

  useEffect(() => {
    if (user) fetchDashboardData()
  }, [user, fetchDashboardData])

  if (authLoading || loading) return <DashboardSkeleton />

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-charcoal mb-2">Access Restricted</h2>
        <p className="text-charcoal-muted mb-6">Sign in to view your dashboard</p>
        <Link
          href="/login"
          className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-charcoal font-medium rounded-xl transition-colors"
        >
          Sign In
        </Link>
      </div>
    )
  }

  const hoursWatched = Math.round(
    ratings.reduce((acc, r) => acc + (r.movie?.runtime || 100), 0) / 60
  )
  const maxGenreCount = Math.max(...genreBreakdown.map((g) => g.count), 1)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Welcome Header */}
      <div className="flex items-center gap-4 animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-3xl font-black text-charcoal shadow-lg shadow-orange-900/30">
          {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-charcoal">
            Welcome back, <span className="gradient-text">{profile?.username || 'Movie Fan'}</span> 👋
          </h1>
          <p className="text-charcoal-muted text-sm">{user.email}</p>
          {profile?.preferred_genres && profile.preferred_genres.length > 0 && (
            <div className="flex gap-1.5 mt-1.5">
              {profile.preferred_genres.slice(0, 3).map((g) => (
                <span key={g} className="text-xs bg-orange-600/15 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full">
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 animate-fade-in-up stagger-1">
        {[
          {
            label: 'Movies Rated',
            value: ratings.length,
            icon: '⭐',
            color: 'from-yellow-600/20 to-orange-600/10',
            border: 'border-yellow-500/20',
          },
          {
            label: 'Favorites',
            value: favorites.length,
            icon: '❤️',
            color: 'from-red-600/20 to-pink-600/10',
            border: 'border-red-500/20',
          },
          {
            label: 'Hours Watched',
            value: hoursWatched,
            icon: '🕐',
            color: 'from-amber-600/20 to-blue-600/10',
            border: 'border-amber-500/20',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${stat.color} border ${stat.border}`}
          >
            <span className="text-2xl block mb-2">{stat.icon}</span>
            <div className="text-3xl font-black text-charcoal">{stat.value}</div>
            <div className="text-xs text-charcoal-muted font-medium mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Personalized Picks */}
      <div className="animate-fade-in-up stagger-2">
        <RecommendationCarousel
          movies={recommendations}
          title="🎯 Your Personalized Picks"
          subtitle="Curated by AI based on your taste"
          loading={recsLoading}
          onMovieClick={setSelectedMovie}
        />
      </div>

      {/* Favorites Grid */}
      <section className="animate-fade-in-up stagger-3">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="section-title text-charcoal">❤️ Your Favorites</h2>
            <p className="text-charcoal-muted text-sm mt-0.5">{favorites.length} saved movies</p>
          </div>
          <Link
            href="/browse"
            className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1 transition-colors"
          >
            Add more
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {favorites.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center">
            <span className="text-5xl">🎬</span>
            <p className="text-charcoal-muted text-sm mt-3">No favorites yet. Browse and heart some movies!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {favorites.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={() => setSelectedMovie(movie)}
                showFavoriteBtn
                isFavorited
              />
            ))}
          </div>
        )}
      </section>

      {/* Recently Rated */}
      <section className="animate-fade-in-up stagger-4">
        <div className="mb-5">
          <h2 className="section-title text-charcoal">⭐ Recently Rated</h2>
          <p className="text-charcoal-muted text-sm mt-0.5">Movies you&apos;ve scored</p>
        </div>

        {ratings.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center">
            <span className="text-5xl">⭐</span>
            <p className="text-charcoal-muted text-sm mt-3">You haven&apos;t rated any movies yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ratings.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-4 glass-card-hover rounded-xl px-4 py-3 cursor-pointer"
                onClick={() => r.movie && setSelectedMovie(r.movie)}
              >
                {r.movie?.poster_url && (
                  <div className="flex-none w-10 h-14 rounded-lg overflow-hidden">
                    <Image
                      src={r.movie.poster_url}
                      alt={r.movie.title}
                      width={40}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal line-clamp-1">{r.movie?.title}</p>
                  <p className="text-xs text-slate-500">{r.movie?.release_year}</p>
                </div>
                <StarRating rating={r.rating} readonly size="sm" maxRating={10} showValue />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Genre Breakdown */}
      {genreBreakdown.length > 0 && (
        <section className="animate-fade-in-up stagger-5">
          <div className="mb-5">
            <h2 className="section-title text-charcoal">🎭 Your Genre Breakdown</h2>
            <p className="text-charcoal-muted text-sm mt-0.5">Based on your favorites &amp; ratings</p>
          </div>
          <div className="glass-card rounded-2xl p-5 space-y-3">
            {genreBreakdown.map(({ genre, count }) => (
              <div key={genre} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal-muted font-medium">{genre}</span>
                  <span className="text-slate-500">{count} movies</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-700"
                    style={{ width: `${(count / maxGenreCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Movie Modal */}
      <MovieModal
        movie={selectedMovie}
        isOpen={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </div>
  )
}
