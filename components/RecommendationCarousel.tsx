'use client'

import { useRef, useState, useCallback } from 'react'
import MovieCard, { MovieCardSkeleton } from '@/components/MovieCard'
import type { Movie } from '@/types'

interface RecommendationCarouselProps {
  movies: Movie[]
  title: string
  subtitle?: string
  loading?: boolean
  onMovieClick?: (movie: Movie) => void
  onFavorite?: (movieId: number) => void
  favoritedIds?: Set<number>
}

export default function RecommendationCarousel({
  movies,
  title,
  subtitle,
  loading = false,
  onMovieClick,
  onFavorite,
  favoritedIds = new Set(),
}: RecommendationCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const [isHoveringCarousel, setIsHoveringCarousel] = useState(false)

  const scroll = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = container.clientWidth * 0.8
    container.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    })
  }, [])

  const handleScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return

    setShowLeftArrow(container.scrollLeft > 10)
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    )
  }

  if (!loading && movies.length === 0) {
    return (
      <section className="py-8">
        <div className="mb-6">
          <h2 className="section-title gradient-text">{title}</h2>
          {subtitle && <p className="text-charcoal-muted mt-1 text-sm">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-center justify-center py-16 glass-card rounded-2xl text-center px-8">
          <div className="w-16 h-16 rounded-full bg-orange-600/10 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-orange-400/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </div>
          <p className="text-charcoal font-semibold text-lg mb-2">No recommendations yet</p>
          <p className="text-charcoal-muted text-sm max-w-xs">
            Rate some movies to get personalized recommendations tailored just for you!
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8">
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="section-title gradient-text">{title}</h2>
          {subtitle && <p className="text-charcoal-muted mt-1 text-sm">{subtitle}</p>}
        </div>
        {!loading && movies.length > 0 && (
          <span className="text-xs text-slate-500 bg-white/5 px-3 py-1 rounded-full">
            {movies.length} films
          </span>
        )}
      </div>

      {/* Carousel Container */}
      <div
        className="relative group"
        onMouseEnter={() => setIsHoveringCarousel(true)}
        onMouseLeave={() => setIsHoveringCarousel(false)}
      >
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-10 h-10 rounded-full bg-cream-card border border-black/10 flex items-center justify-center text-charcoal shadow-xl transition-all duration-200 ${
              isHoveringCarousel
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-4'
            } hover:bg-orange-600 hover:border-orange-500`}
            aria-label="Scroll left"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-10 h-10 rounded-full bg-cream-card border border-black/10 flex items-center justify-center text-charcoal shadow-xl transition-all duration-200 ${
              isHoveringCarousel
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-4'
            } hover:bg-orange-600 hover:border-orange-500`}
            aria-label="Scroll right"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Left fade */}
        {showLeftArrow && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
        )}
        {/* Right fade */}
        {showRightArrow && (
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
        )}

        {/* Scrollable Row */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto pb-3 hide-scrollbar snap-x snap-mandatory"
        >
          {loading
            ? Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-none w-[140px] sm:w-[160px] md:w-[180px] snap-start"
                >
                  <MovieCardSkeleton />
                </div>
              ))
            : movies.map((movie) => (
                <div
                  key={movie.id}
                  className="flex-none w-[140px] sm:w-[160px] md:w-[180px] snap-start"
                >
                  <MovieCard
                    movie={movie}
                    onClick={() => onMovieClick?.(movie)}
                    onFavorite={() => onFavorite?.(movie.id)}
                    showFavoriteBtn
                    isFavorited={favoritedIds.has(movie.id)}
                  />
                </div>
              ))}
        </div>
      </div>
    </section>
  )
}
