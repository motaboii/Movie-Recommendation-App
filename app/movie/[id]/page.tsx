import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Movie } from '@/types'
import MovieDetailClient from './MovieDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: movie } = await supabase
    .from('movies')
    .select('title, overview')
    .eq('id', parseInt(id))
    .single()

  return {
    title: movie?.title || 'Movie Details',
    description: movie?.overview?.slice(0, 155) || 'View movie details on CineAI',
  }
}

export default async function MovieDetailPage({ params }: PageProps) {
  const { id } = await params
  const movieId = parseInt(id)

  if (isNaN(movieId)) notFound()

  const supabase = await createClient()
  const { data: movie, error } = await supabase
    .from('movies')
    .select('*')
    .eq('id', movieId)
    .single()

  if (error || !movie) notFound()

  const typedMovie = movie as Movie

  const runtime = typedMovie.runtime
    ? `${Math.floor(typedMovie.runtime / 60)}h ${typedMovie.runtime % 60}m`
    : null

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-charcoal-muted transition-colors">Home</Link>
          <span>/</span>
          <Link href="/browse" className="hover:text-charcoal-muted transition-colors">Browse</Link>
          <span>/</span>
          <span className="text-charcoal-muted line-clamp-1">{typedMovie.title}</span>
        </nav>
      </div>

      {/* Backdrop Header */}
      <div className="relative h-[60vh] mt-4 overflow-hidden">
        {typedMovie.backdrop_url ? (
          <Image
            src={typedMovie.backdrop_url}
            alt={typedMovie.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-950 via-slate-900 to-amber-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/80 via-transparent to-transparent" />

        {/* Header Content */}
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="flex items-end gap-6">
            {/* Poster Thumbnail */}
            {typedMovie.poster_url && (
              <div className="hidden md:block flex-none w-32 rounded-xl overflow-hidden shadow-2xl">
                <Image
                  src={typedMovie.poster_url}
                  alt={typedMovie.title}
                  width={128}
                  height={192}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-charcoal leading-tight mb-2">
                {typedMovie.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-charcoal-muted">
                {typedMovie.release_year && (
                  <span className="bg-white/10 px-2.5 py-1 rounded-lg font-medium">
                    {typedMovie.release_year}
                  </span>
                )}
                {runtime && <span>{runtime}</span>}
                {typedMovie.language && (
                  <span className="uppercase text-xs font-bold bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg">
                    {typedMovie.language}
                  </span>
                )}
                {typedMovie.average_rating > 0 && (
                  <div className="flex items-center gap-1.5 bg-yellow-500/15 text-yellow-400 px-2.5 py-1 rounded-lg">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-bold">{typedMovie.average_rating.toFixed(1)}</span>
                    <span className="text-xs text-yellow-400/70">
                      ({typedMovie.vote_count?.toLocaleString()})
                    </span>
                  </div>
                )}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 mt-3">
                {typedMovie.genres?.map((genre) => (
                  <Link
                    key={genre}
                    href={`/browse?genre=${genre}`}
                    className="genre-pill hover:bg-orange-600/30 transition-colors"
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            {typedMovie.overview && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Overview</h2>
                <p className="text-charcoal-muted leading-relaxed">{typedMovie.overview}</p>
              </div>
            )}

            {/* Cast */}
            {typedMovie.cast_members && typedMovie.cast_members.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Cast</h2>
                <div className="flex flex-wrap gap-2">
                  {typedMovie.cast_members.map((actor) => (
                    <div
                      key={actor}
                      className="flex items-center gap-2 bg-white/5 border border-black/5 rounded-xl px-3 py-2"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-600/40 to-amber-600/40 flex items-center justify-center text-xs font-bold text-charcoal">
                        {actor[0]}
                      </div>
                      <span className="text-sm text-charcoal-muted">{actor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Client-side interactive section */}
            <MovieDetailClient movie={typedMovie} movieId={movieId} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-charcoal">Movie Info</h3>
              {[
                { label: 'Director', value: typedMovie.director },
                { label: 'Release Year', value: typedMovie.release_year?.toString() },
                { label: 'Runtime', value: runtime },
                { label: 'Language', value: typedMovie.language?.toUpperCase() },
                { label: 'Rating', value: typedMovie.average_rating ? `${typedMovie.average_rating.toFixed(1)}/10` : null },
                { label: 'Votes', value: typedMovie.vote_count?.toLocaleString() },
              ]
                .filter((item) => item.value)
                .map((item) => (
                  <div key={item.label} className="flex justify-between items-start gap-2">
                    <span className="text-xs text-slate-500 font-medium">{item.label}</span>
                    <span className="text-xs text-charcoal-muted text-right">{item.value}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
