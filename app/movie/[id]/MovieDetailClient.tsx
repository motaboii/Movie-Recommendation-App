'use client'

import { useState, useEffect, useCallback } from 'react'
import StarRating from '@/components/StarRating'
import RecommendationCarousel from '@/components/RecommendationCarousel'
import { createClient } from '@/lib/supabase/client'
import { getSimilarMovies } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import type { Movie } from '@/types'

interface MovieDetailClientProps {
  movie: Movie
  movieId: number
}

export default function MovieDetailClient({ movie, movieId }: MovieDetailClientProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [similar, setSimilar] = useState<Movie[]>([])
  const [similarLoading, setSimilarLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const fetchUserData = useCallback(async () => {
    if (!user) return

    const [{ data: fav }, { data: ratingData }] = await Promise.all([
      supabase.from('user_favorites').select('id').eq('user_id', user.id).eq('movie_id', movieId).maybeSingle(),
      supabase.from('user_ratings').select('rating').eq('user_id', user.id).eq('movie_id', movieId).maybeSingle(),
    ])

    setIsFavorited(!!fav)
    setUserRating(ratingData?.rating || 0)
  }, [user, movieId, supabase])

  const fetchSimilar = useCallback(async () => {
    setSimilarLoading(true)
    try {
      const recs = await getSimilarMovies(movieId, 10)
      const ids = recs.map((r) => r.movie_id)
      if (ids.length > 0) {
        const { data } = await supabase.from('movies').select('*').in('id', ids)
        setSimilar((data as Movie[]) || [])
      }
    } catch {
      setSimilar([])
    } finally {
      setSimilarLoading(false)
    }
  }, [movieId, supabase])

  useEffect(() => {
    fetchUserData()
    fetchSimilar()
  }, [fetchUserData, fetchSimilar])

  const handleFavorite = async () => {
    if (!user) { showToast('Sign in to save favorites'); return }
    setActionLoading(true)
    try {
      if (isFavorited) {
        await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('movie_id', movieId)
        setIsFavorited(false)
        showToast('Removed from favorites')
      } else {
        await supabase.from('user_favorites').insert({ user_id: user.id, movie_id: movieId })
        setIsFavorited(true)
        showToast('Added to favorites ❤️')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleRate = async (rating: number) => {
    if (!user) { showToast('Sign in to rate movies'); return }
    setUserRating(rating)
    await supabase.from('user_ratings').upsert(
      { user_id: user.id, movie_id: movieId, rating },
      { onConflict: 'user_id,movie_id' }
    )
    showToast(`Rated ${rating.toFixed(1)}/5 ⭐`)
  }

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-cream-card border border-black/10 text-charcoal text-sm font-medium px-4 py-2.5 rounded-xl shadow-2xl animate-scale-in">
          {toast}
        </div>
      )}

      {/* Actions */}
      {!isAdmin && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-5 glass-card rounded-2xl">
          <button
            onClick={handleFavorite}
            disabled={actionLoading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              isFavorited
                ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20'
                : 'bg-white/50 text-charcoal border border-black/5 hover:bg-white'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill={isFavorited ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {isFavorited ? 'Remove Favorite' : 'Add to Favorites'}
          </button>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wider">
              {userRating > 0 ? 'Your Rating' : 'Rate This Movie'}
            </span>
            <StarRating rating={userRating} onRate={handleRate} size="lg" maxRating={5} showValue />
          </div>
        </div>
      )}

      {/* Similar Movies */}
      <RecommendationCarousel
        movies={similar}
        title="Similar Movies"
        subtitle="You might also enjoy these"
        loading={similarLoading}
      />
    </div>
  )
}
