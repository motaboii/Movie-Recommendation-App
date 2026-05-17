'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import MovieCard from '@/components/MovieCard'
import GenreFilter from '@/components/GenreFilter'
import MovieModal from '@/components/MovieModal'
import { PageSkeleton } from '@/components/LoadingSkeleton'
import { useMovies } from '@/hooks/useMovies'
import { useMovieStore } from '@/store/movieStore'
import type { Movie } from '@/types'

const LIMIT = 20

export default function BrowsePage() {
  const searchParams = useSearchParams()
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [localSearch, setLocalSearch] = useState('')

  const { searchQuery, selectedGenres, currentPage, setSearchQuery, setPage } = useMovieStore()

  // Handle genre from URL params (e.g. from genre spotlight)
  useEffect(() => {
    const genreParam = searchParams.get('genre')
    if (genreParam) {
      const { toggleGenre, selectedGenres: current } = useMovieStore.getState()
      if (!current.includes(genreParam)) {
        toggleGenre(genreParam)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  const { movies, total, loading, error } = useMovies({
    searchQuery,
    selectedGenres,
    page: currentPage,
    limit: LIMIT,
  })

  const totalPages = Math.ceil(total / LIMIT)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(localSearch)
    setPage(1)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-charcoal mb-1">
          Browse <span className="gradient-text">Movies</span>
        </h1>
        <p className="text-charcoal-muted text-sm">
          {loading ? 'Loading...' : `${total.toLocaleString()} movies found`}
        </p>
      </div>

      {/* Search + Filter Row */}
      <div className="space-y-4 mb-8">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-3 max-w-xl">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search movies..."
              className="w-full bg-white/5 border border-black/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-charcoal placeholder:text-slate-500 focus:border-orange-500/50 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-charcoal text-sm font-medium rounded-xl transition-colors"
          >
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setLocalSearch('') }}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-charcoal-muted text-sm rounded-xl transition-colors border border-black/5"
            >
              Clear
            </button>
          )}
        </form>

        {/* Genre Filter */}
        <GenreFilter />
      </div>

      {/* Active Filter Tags */}
      {(searchQuery || selectedGenres.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-5">
          {searchQuery && (
            <div className="flex items-center gap-2 bg-orange-600/15 border border-orange-500/30 text-orange-300 text-xs font-medium px-3 py-1.5 rounded-full">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              &quot;{searchQuery}&quot;
              <button onClick={() => { setSearchQuery(''); setLocalSearch('') }} className="hover:text-charcoal">×</button>
            </div>
          )}
          {selectedGenres.map((g) => (
            <div key={g} className="flex items-center gap-2 bg-orange-600/15 border border-orange-500/30 text-orange-300 text-xs font-medium px-3 py-1.5 rounded-full">
              {g}
              <button
                onClick={() => useMovieStore.getState().toggleGenre(g)}
                className="hover:text-charcoal"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-charcoal font-semibold mb-1">Something went wrong</p>
          <p className="text-charcoal-muted text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && <PageSkeleton count={LIMIT} />}

      {/* Empty State */}
      {!loading && !error && movies.length === 0 && (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-charcoal font-semibold text-xl mb-2">No movies found</p>
          <p className="text-charcoal-muted text-sm mb-6">
            Try different search terms or remove some filters
          </p>
          <button
            onClick={() => useMovieStore.getState().clearFilters()}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-charcoal text-sm font-medium rounded-xl transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Movie Grid */}
      {!loading && !error && movies.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={() => setSelectedMovie(movie)}
                showFavoriteBtn
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <button
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl text-sm font-medium text-charcoal-muted hover:text-charcoal hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Prev
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-orange-600 text-charcoal shadow-lg shadow-orange-900/30'
                          : 'text-charcoal-muted hover:text-charcoal hover:bg-white/5'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl text-sm font-medium text-charcoal-muted hover:text-charcoal hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Results count */}
          <p className="text-center text-xs text-slate-600 mt-4">
            Showing {(currentPage - 1) * LIMIT + 1}–{Math.min(currentPage * LIMIT, total)} of {total.toLocaleString()} results
          </p>
        </>
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
