export interface Movie {
  id: number
  title: string
  overview: string
  genres: string[]
  cast_members: string[]
  director: string
  poster_url: string
  backdrop_url: string
  release_year: number
  average_rating: number
  vote_count: number
  runtime: number
  language: string
}

export interface UserProfile {
  id: string
  username: string
  avatar_url?: string
  preferred_genres: string[]
  created_at: string
}

export interface UserFavorite {
  id: string
  user_id: string
  movie_id: number
  created_at: string
  movie?: Movie
}

export interface UserRating {
  id: string
  user_id: string
  movie_id: number
  rating: number
  created_at: string
  movie?: Movie
}

export interface WatchHistory {
  id: string
  user_id: string
  movie_id: number
  watched_at: string
  progress_percent: number
  movie?: Movie
}

export interface Recommendation {
  movie_id: number
  score: number
  reason: string
  movie?: Movie
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export type Genre = string
