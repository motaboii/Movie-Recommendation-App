'use client'

import { useMovieStore } from '@/store/movieStore'

const ALL_GENRES = [
  'Action',
  'Drama',
  'Comedy',
  'Sci-Fi',
  'Horror',
  'Romance',
  'Thriller',
  'Animation',
  'Documentary',
  'Fantasy',
  'Crime',
  'Adventure',
  'Mystery',
  'Biography',
  'History',
]

interface GenreFilterProps {
  availableGenres?: string[]
  className?: string
}

export default function GenreFilter({
  availableGenres = ALL_GENRES,
  className = '',
}: GenreFilterProps) {
  const { selectedGenres, toggleGenre, clearFilters } = useMovieStore()

  const isAll = selectedGenres.length === 0

  return (
    <div className={`flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar ${className}`}>
      {/* "All" Chip */}
      <button
        onClick={clearFilters}
        className={`flex-none px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 whitespace-nowrap ${
          isAll
            ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-charcoal border-orange-500 shadow-lg shadow-orange-900/30'
            : 'bg-white/5 text-charcoal-muted border-black/5 hover:bg-white/10 hover:border-black/10'
        }`}
      >
        All
      </button>

      {/* Genre Pills */}
      {availableGenres.map((genre) => {
        const isActive = selectedGenres.includes(genre)
        return (
          <button
            key={genre}
            onClick={() => toggleGenre(genre)}
            className={`flex-none flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 whitespace-nowrap ${
              isActive
                ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-charcoal border-orange-500 shadow-lg shadow-orange-900/30'
                : 'bg-white/5 text-charcoal-muted border-black/5 hover:bg-orange-600/15 hover:text-orange-300 hover:border-orange-500/40'
            }`}
          >
            {isActive && (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {genre}
          </button>
        )
      })}

      {/* Clear Selection */}
      {selectedGenres.length > 0 && (
        <button
          onClick={clearFilters}
          className="flex-none flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium text-red-400 border border-red-400/20 bg-red-400/5 hover:bg-red-400/15 transition-all whitespace-nowrap"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear ({selectedGenres.length})
        </button>
      )}
    </div>
  )
}
