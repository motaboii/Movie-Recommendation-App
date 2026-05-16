'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Movie } from '@/types'

interface UseMoviesOptions {
  searchQuery?: string
  selectedGenres?: string[]
  page?: number
  limit?: number
}

interface UseMoviesReturn {
  movies: Movie[]
  total: number
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useMovies({
  searchQuery = '',
  selectedGenres = [],
  page = 1,
  limit = 20,
}: UseMoviesOptions = {}): UseMoviesReturn {
  const [movies, setMovies] = useState<Movie[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchMovies = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const from = (page - 1) * limit
      const to = from + limit - 1

      let query = supabase.from('movies').select('*', { count: 'exact' })

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.ilike('title', `%${searchQuery.trim()}%`)
      }

      // Apply genre filter using array contains
      if (selectedGenres.length > 0) {
        query = query.contains('genres', selectedGenres)
      }

      // Apply pagination and ordering
      query = query
        .order('average_rating', { ascending: false })
        .range(from, to)

      const { data, error: supabaseError, count } = await query

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      setMovies((data as Movie[]) || [])
      setTotal(count || 0)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch movies'
      setError(message)
      setMovies([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedGenres, page, limit, supabase])

  useEffect(() => {
    fetchMovies()
  }, [fetchMovies])

  return { movies, total, loading, error, refetch: fetchMovies }
}
