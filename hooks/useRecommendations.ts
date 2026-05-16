'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRecommendations } from '@/lib/api'
import type { Movie, Recommendation } from '@/types'

interface UseRecommendationsReturn {
  recommendations: Movie[]
  loading: boolean
  error: string | null
}

export function useRecommendations(userId?: string | null): UseRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchMoviesByIds = useCallback(
    async (movieIds: number[]): Promise<Movie[]> => {
      if (movieIds.length === 0) return []

      const { data, error: supabaseError } = await supabase
        .from('movies')
        .select('*')
        .in('id', movieIds)

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      // Preserve recommendation order
      const movieMap = new Map<number, Movie>()
      ;(data as Movie[]).forEach((m) => movieMap.set(m.id, m))
      return movieIds.map((id) => movieMap.get(id)).filter(Boolean) as Movie[]
    },
    [supabase]
  )

  const fetchTrending = useCallback(async (): Promise<Movie[]> => {
    const { data, error: supabaseError } = await supabase
      .from('movies')
      .select('*')
      .order('average_rating', { ascending: false })
      .order('vote_count', { ascending: false })
      .limit(20)

    if (supabaseError) {
      throw new Error(supabaseError.message)
    }

    return (data as Movie[]) || []
  }, [supabase])

  const fetchRecommendations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (!userId) {
        // No user — show trending
        const trending = await fetchTrending()
        setRecommendations(trending)
        return
      }

      // Try FastAPI recommendations first
      try {
        const recs: Recommendation[] = await getRecommendations(userId, 20)
        const movieIds = recs.map((r) => r.movie_id)
        const movies = await fetchMoviesByIds(movieIds)
        setRecommendations(movies)
      } catch (apiError) {
        // API failed — fall back to trending
        console.warn('Recommendations API unavailable, falling back to trending:', apiError)
        const trending = await fetchTrending()
        setRecommendations(trending)
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch recommendations'
      setError(message)
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }, [userId, fetchMoviesByIds, fetchTrending])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  return { recommendations, loading, error }
}
