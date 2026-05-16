import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MovieStore {
  searchQuery: string
  selectedGenres: string[]
  currentPage: number
  setSearchQuery: (q: string) => void
  toggleGenre: (genre: string) => void
  setPage: (page: number) => void
  clearFilters: () => void
}

export const useMovieStore = create<MovieStore>()(
  persist(
    (set, get) => ({
      searchQuery: '',
      selectedGenres: [],
      currentPage: 1,

      setSearchQuery: (q: string) => {
        set({ searchQuery: q, currentPage: 1 })
      },

      toggleGenre: (genre: string) => {
        const current = get().selectedGenres
        const isSelected = current.length === 1 && current[0] === genre
        set({
          selectedGenres: isSelected ? [] : [genre],
          currentPage: 1,
        })
      },

      setPage: (page: number) => {
        set({ currentPage: page })
      },

      clearFilters: () => {
        set({ searchQuery: '', selectedGenres: [], currentPage: 1 })
      },
    }),
    {
      name: 'movie-store',
      partialize: (state) => ({
        selectedGenres: state.selectedGenres,
      }),
    }
  )
)
