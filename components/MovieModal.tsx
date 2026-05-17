'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import StarRating from '@/components/StarRating'
import { MovieCardSkeleton } from '@/components/MovieCard'
import { createClient } from '@/lib/supabase/client'
import { getSimilarMovies } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import type { Movie } from '@/types'
import Link from 'next/link'

interface MovieModalProps {
  movie: Movie | null
  isOpen: boolean
  onClose: () => void
}

export default function MovieModal({ movie, isOpen, onClose }: MovieModalProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [similar, setSimilar] = useState<Movie[]>([])
  const [similarLoading, setSimilarLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const { user, isAdmin } = useAuth()
  const supabase = createClient()

  // Animate in
  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      setImgError(false)
    } else {
      const t = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const fetchUserData = useCallback(async () => {
    if (!user || !movie) return

    // Check favorite
    const { data: fav } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('movie_id', movie.id)
      .maybeSingle()
    setIsFavorited(!!fav)

    // Get user rating
    const { data: ratingData } = await supabase
      .from('user_ratings')
      .select('rating')
      .eq('user_id', user.id)
      .eq('movie_id', movie.id)
      .maybeSingle()
    setUserRating(ratingData?.rating || 0)
  }, [user, movie, supabase])

  const fetchSimilar = useCallback(async () => {
    if (!movie) return
    setSimilarLoading(true)
    try {
      const recs = await getSimilarMovies(movie.id, 6)
      const ids = recs.map((r) => r.movie_id)
      if (ids.length > 0) {
        const { data } = await supabase.from('movies').select('*').in('id', ids)
        setSimilar((data as Movie[]) || [])
      } else {
        setSimilar([])
      }
    } catch {
      setSimilar([])
    } finally {
      setSimilarLoading(false)
    }
  }, [movie, supabase])

  useEffect(() => {
    if (isOpen && movie) {
      fetchUserData()
      fetchSimilar()
    }
  }, [isOpen, movie, fetchUserData, fetchSimilar])

  const handleFavorite = async () => {
    if (!user) {
      showToast('Sign in to save favorites')
      return
    }
    if (!movie) return

    setActionLoading(true)
    try {
      if (isFavorited) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', movie.id)
        setIsFavorited(false)
        showToast('Removed from favorites')
      } else {
        await supabase.from('user_favorites').insert({
          user_id: user.id,
          movie_id: movie.id,
        })
        setIsFavorited(true)
        showToast('Added to favorites ❤️')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRate = async (rating: number) => {
    if (!user) {
      showToast('Sign in to rate movies')
      return
    }
    if (!movie) return

    setUserRating(rating)
    await supabase.from('user_ratings').upsert(
      { user_id: user.id, movie_id: movie.id, rating },
      { onConflict: 'user_id,movie_id' }
    )
    showToast(`Rated ${rating.toFixed(1)}/5 ⭐`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  if (!mounted || !movie) return null

  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-white/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Toast */}
      {toast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-cream-card border border-black/10 text-charcoal text-sm font-medium px-4 py-2.5 rounded-xl shadow-2xl animate-scale-in">
          {toast}
        </div>
      )}

      {/* Modal */}
      <div
        className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl shadow-2xl transition-all duration-300 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-charcoal/80 hover:text-charcoal hover:bg-white/80 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Backdrop Image */}
        <div className="relative h-52 sm:h-64 w-full overflow-hidden rounded-t-2xl">
          {!imgError && movie.backdrop_url ? (
            <Image
              src={movie.backdrop_url}
              alt={movie.title}
              fill
              className="object-cover"
              onError={() => setImgError(true)}
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-900/60 via-slate-900 to-amber-900/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-transparent to-black/40" />

          {/* Title overlay */}
          <div className="absolute bottom-4 left-6 right-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-charcoal drop-shadow-lg leading-tight">
              {movie.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-charcoal-muted">
              {movie.release_year && <span>{movie.release_year}</span>}
              {runtime && (
                <>
                  <span className="text-slate-500">•</span>
                  <span>{runtime}</span>
                </>
              )}
              {movie.language && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="uppercase text-xs font-medium bg-white/10 px-2 py-0.5 rounded">
                    {movie.language}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Genres + Rating row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {movie.genres?.map((genre) => (
                <span key={genre} className="genre-pill">{genre}</span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <StarRating rating={(movie.average_rating || 0) / 2} readonly size="md" maxRating={5} />
              <span className="text-xs text-slate-500">({movie.vote_count?.toLocaleString()} votes)</span>
            </div>
          </div>

          {/* Overview */}
          {movie.overview && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Overview</h3>
              <p className="text-charcoal-muted text-sm leading-relaxed">{movie.overview}</p>
            </div>
          )}

          {/* Cast & Director */}
          <div className="grid grid-cols-2 gap-4">
            {movie.director && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Director</h3>
                <p className="text-charcoal font-medium text-sm">{movie.director}</p>
              </div>
            )}
            {movie.cast_members && movie.cast_members.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Cast</h3>
                <div className="flex flex-wrap gap-1.5">
                  {movie.cast_members.slice(0, 4).map((actor) => (
                    <span
                      key={actor}
                      className="text-xs text-charcoal-muted bg-white/5 border border-black/5 rounded-lg px-2 py-1"
                    >
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pt-2 border-t border-black/5">
            {/* Favorite */}
            <button
              onClick={handleFavorite}
              disabled={actionLoading}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isFavorited
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  : 'bg-white/5 text-charcoal-muted border border-black/5 hover:bg-white/10'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill={isFavorited ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {isFavorited ? 'Remove Favorite' : 'Add to Favorites'}
            </button>

            {/* User Rating Section */}
            {!isAdmin && user && (
              <div className="bg-white border border-black/5 rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">
                    {userRating > 0 ? 'Your Rating' : 'Rate This Movie'}
                  </span>
                  <StarRating
                    rating={userRating}
                    onRate={handleRate}
                    size="lg"
                    maxRating={5}
                    showValue
                  />
                </div>
              </div>
            )}
          </div>

          {/* Similar Movies */}
          <div className="pt-2 border-t border-black/5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
              Similar Movies
            </h3>
            {similarLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <MovieCardSkeleton key={i} />
                ))}
              </div>
            ) : similar.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                {similar.map((m) => (
                  <Link href={`/movie/${m.id}`} key={m.id} className="flex-none w-24 block group">
                    <div className="relative rounded-lg overflow-hidden aspect-[2/3] bg-cream-bg shadow-sm group-hover:shadow-md transition-all">
                      {m.poster_url ? (
                        <Image src={m.poster_url} alt={m.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-orange-900/10 flex items-center justify-center">
                          <span className="text-orange-500 text-xs font-medium text-center p-1 line-clamp-3">{m.title}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-charcoal-muted mt-1.5 line-clamp-1 text-center group-hover:text-orange-600 transition-colors">{m.title}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No similar movies found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
