'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Movie } from '@/types'

interface MovieCardProps {
  movie: Movie
  onFavorite?: () => void
  showFavoriteBtn?: boolean
  isFavorited?: boolean
  onClick?: () => void
}

function StarIcon({ filled, half }: { filled: boolean; half?: boolean }) {
  if (half) {
    return (
      <span className="relative inline-block w-3.5 h-3.5">
        <svg className="w-3.5 h-3.5 text-slate-600 absolute" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span className="absolute inset-0 overflow-hidden w-1/2">
          <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </span>
      </span>
    )
  }
  return (
    <svg
      className={`w-3.5 h-3.5 ${filled ? 'text-yellow-400' : 'text-slate-600'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

export default function MovieCard({
  movie,
  onFavorite,
  showFavoriteBtn = false,
  isFavorited = false,
  onClick,
}: MovieCardProps) {
  const [imgError, setImgError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [favorited, setFavorited] = useState(isFavorited)

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorited(!favorited)
    onFavorite?.()
  }

  const rating = movie.average_rating || 0
  const fullStars = Math.floor(rating / 2)
  const hasHalf = rating / 2 - fullStars >= 0.5

  const genreColors = [
    'bg-orange-600/20 text-orange-300 border-orange-500/30',
    'bg-amber-600/20 text-amber-300 border-amber-500/30',
    'bg-blue-600/20 text-blue-300 border-blue-500/30',
    'bg-pink-600/20 text-pink-300 border-pink-500/30',
  ]

  return (
    <div
      className="group relative cursor-pointer movie-card-hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Card */}
      <div className="relative rounded-xl overflow-hidden bg-cream-card border border-white/5 shadow-card">
        {/* Poster - 2:3 aspect ratio */}
        <div className="relative w-full aspect-[2/3] overflow-hidden">
          {!imgError && movie.poster_url ? (
            <Image
              src={movie.poster_url}
              alt={movie.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-900/40 to-amber-900/20">
              <div className="text-center p-4">
                <svg
                  className="w-12 h-12 text-orange-400/50 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                  />
                </svg>
                <p className="text-xs text-slate-500 line-clamp-2 font-medium">{movie.title}</p>
              </div>
            </div>
          )}

          {/* Hover Overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="absolute inset-0 flex flex-col justify-end p-3 gap-2">
              {/* Genre Tags */}
              <div className="flex flex-wrap gap-1">
                {movie.genres?.slice(0, 2).map((genre, i) => (
                  <span
                    key={genre}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${genreColors[i % genreColors.length]}`}
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon
                    key={i}
                    filled={i < fullStars}
                    half={i === fullStars && hasHalf}
                  />
                ))}
                <span className="text-xs text-charcoal-muted ml-1">
                  {rating.toFixed(1)}
                </span>
              </div>

              {/* View Details Button */}
              <button className="w-full py-1.5 bg-orange-600 hover:bg-orange-500 text-charcoal text-xs font-semibold rounded-lg transition-colors">
                View Details
              </button>
            </div>
          </div>

          {/* Favorite Button */}
          {showFavoriteBtn && (
            <button
              onClick={handleFavorite}
              className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm ${
                favorited
                  ? 'bg-red-500/80 text-charcoal scale-110'
                  : 'bg-white/60 text-charcoal/70 hover:bg-red-500/60 hover:text-charcoal'
              }`}
            >
              <svg
                className="w-4 h-4"
                fill={favorited ? 'currentColor' : 'none'}
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
            </button>
          )}

          {/* Rating Badge */}
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg px-1.5 py-0.5">
            <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-[10px] font-bold text-charcoal">{rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Card Bottom */}
        <div className="p-2.5 pt-2">
          <h3 className="text-sm font-semibold text-charcoal line-clamp-1 leading-snug">
            {movie.title}
          </h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-charcoal-muted">{movie.release_year}</span>
            <span className="text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
              {rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Skeleton variant
export function MovieCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-cream-card border border-white/5">
      <div className="w-full aspect-[2/3] shimmer" />
      <div className="p-2.5 space-y-2">
        <div className="h-4 shimmer rounded w-3/4" />
        <div className="h-3 shimmer rounded w-1/2" />
      </div>
    </div>
  )
}
