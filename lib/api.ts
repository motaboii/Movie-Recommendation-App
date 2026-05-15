import axios from 'axios'
import type { Movie, Recommendation, PaginatedResponse } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging / auth tokens if needed
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data)
    } else if (error.request) {
      console.error('Network Error:', error.message)
    }
    return Promise.reject(error)
  }
)

export async function getRecommendations(
  userId: string,
  limit = 20
): Promise<Recommendation[]> {
  const response = await apiClient.get<{ recommendations: Recommendation[] }>(
    `/api/recommendations/${userId}`,
    { params: { limit } }
  )
  return response.data.recommendations
}

export async function getSimilarMovies(
  movieId: number,
  limit = 10
): Promise<Recommendation[]> {
  const response = await apiClient.get<{ recommendations: Recommendation[] }>(
    `/api/recommendations/similar/${movieId}`,
    { params: { limit } }
  )
  return response.data.recommendations
}

export async function getTrendingMovies(
  limit = 20
): Promise<Movie[]> {
  const response = await apiClient.get<{ movies: Movie[] }>(
    '/api/movies/trending',
    { params: { limit } }
  )
  return response.data.movies
}

export async function searchMovies(
  query: string,
  page = 1,
  limit = 20
): Promise<PaginatedResponse<Movie>> {
  const response = await apiClient.get<PaginatedResponse<Movie>>(
    '/api/movies/search',
    { params: { q: query, page, limit } }
  )
  return response.data
}

export async function checkHealth(): Promise<{ status: string; version: string }> {
  const response = await apiClient.get<{ status: string; version: string }>('/health')
  return response.data
}

export default apiClient
