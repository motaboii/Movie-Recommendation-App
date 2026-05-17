'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRecommendations } from '@/hooks/useRecommendations'
import RecommendationCarousel from '@/components/RecommendationCarousel'
import MovieModal from '@/components/MovieModal'
import { SectionSkeleton } from '@/components/LoadingSkeleton'
import type { Movie } from '@/types'

const GENRE_SPOTLIGHTS = [
  {
    name: 'Action',
    description: 'Heart-pounding thrills',
    gradient: 'from-orange-100 to-red-100',
    icon: '⚡',
  },
  {
    name: 'Sci-Fi',
    description: 'Explore the future',
    gradient: 'from-amber-100 to-blue-100',
    icon: '🚀',
  },
  {
    name: 'Drama',
    description: 'Powerful storytelling',
    gradient: 'from-rose-100 to-pink-100',
    icon: '🎭',
  },
  {
    name: 'Comedy',
    description: 'Laugh out loud',
    gradient: 'from-yellow-100 to-orange-100',
    icon: '😄',
  },
]

const STATS = [
  { label: 'Movies', value: '500+', icon: '🎬' },
  { label: 'AI Powered', value: '100%', icon: '🤖' },
  { label: 'Personalized', value: '∞', icon: '✨' },
  { label: 'Genres', value: '20+', icon: '🎭' },
]

const HERO_POSTERS = [
  'https://image.tmdb.org/t/p/w342/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg',
  'https://image.tmdb.org/t/p/w342/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',
  'https://image.tmdb.org/t/p/w342/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg',
  'https://image.tmdb.org/t/p/w342/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
  'https://image.tmdb.org/t/p/w342/xq1Ugd62d23M6rJKSHpCRTmMG7A.jpg',
]

export default function HomePage() {
  const { user, profile, isAdmin } = useAuth()
  const { recommendations, loading: recsLoading } = useRecommendations(user?.id)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/50 via-cream-bg to-amber-100/50" />

        {/* Floating movie poster collage */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:flex items-center justify-center">
          <div className="relative w-full h-full">
            {HERO_POSTERS.map((url, i) => {
              const positions = [
                'top-12 right-24 rotate-3',
                'top-32 right-64 -rotate-6',
                'top-4 right-48 rotate-1',
                'bottom-24 right-32 -rotate-3',
                'bottom-8 right-56 rotate-5',
              ]
              const sizes = ['w-36 h-52', 'w-32 h-48', 'w-40 h-56', 'w-28 h-44', 'w-32 h-48']
              const floatClasses = [
                'animate-float',
                'animate-float-delayed',
                'animate-float',
                'animate-float-delayed',
                'animate-float',
              ]
              const delays = ['delay-0', 'delay-300', 'delay-700', 'delay-500', 'delay-200']
              return (
                <div
                  key={i}
                  className={`absolute ${positions[i]} ${sizes[i]} ${floatClasses[i]} ${delays[i]} rounded-xl overflow-hidden shadow-2xl`}
                  style={{ animationDelay: `${i * 0.4}s` }}
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const el = e.currentTarget
                      el.parentElement!.style.background = `linear-gradient(135deg, #fef3c7, #ffedd5)`
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 py-24">
          <div className="max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-orange-100 border border-orange-200 rounded-full px-4 py-1.5 mb-6 animate-fade-in-up shadow-sm">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-sm text-orange-700 font-medium">AI-Powered Recommendations</span>
            </div>

            {/* Heading */}
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6 animate-fade-in-up stagger-1 text-charcoal"
              style={{ animationDelay: '0.1s' }}
            >
              Discover Your{' '}
              <span className="gradient-text block">Next Favorite</span>
              <span className="text-charcoal">Film</span>
            </h1>

            <p
              className="text-lg text-charcoal-muted mb-8 leading-relaxed animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              CineAI learns your taste and curates personalized movie recommendations
              you&apos;ll love — powered by real machine learning.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-wrap gap-3 animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              <Link
                href="/browse"
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
                </svg>
                Browse Movies
              </Link>
              {!user ? (
                <Link
                  href="/signup"
                  className="flex items-center gap-2 bg-white hover:bg-orange-50 border border-black/5 text-charcoal font-semibold px-6 py-3 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Get Started Free
                </Link>
              ) : !isAdmin ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 bg-white hover:bg-orange-50 border border-black/5 text-charcoal font-semibold px-6 py-3 rounded-xl transition-all shadow-sm hover:-translate-y-0.5"
                >
                  My Dashboard
                </Link>
              ) : (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 bg-white hover:bg-orange-50 border border-black/5 text-charcoal font-semibold px-6 py-3 rounded-xl transition-all shadow-sm hover:-translate-y-0.5"
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cream-bg to-transparent pointer-events-none" />
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-cream-card/50 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-2xl font-black gradient-text">{stat.value}</span>
                <span className="text-xs text-slate-500 font-medium">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Personalized Recommendations */}
        {user && !isAdmin && (
          <div className="animate-fade-in-up">
            {recsLoading ? (
              <SectionSkeleton />
            ) : (
              <RecommendationCarousel
                movies={recommendations}
                title="🎯 Picks For You"
                subtitle={`Personalized recommendations for ${profile?.username || user.email?.split('@')[0]}`}
                onMovieClick={setSelectedMovie}
              />
            )}
          </div>
        )}

        {/* Trending Now */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {recsLoading ? (
            <SectionSkeleton />
          ) : (
            <RecommendationCarousel
              movies={recommendations.slice(0, 15)}
              title="🔥 Trending Now"
              subtitle="Most popular movies right now"
              onMovieClick={setSelectedMovie}
            />
          )}
        </div>

        {/* Genre Spotlight */}
        <section className="py-8">
          <div className="mb-6">
            <h2 className="section-title gradient-text">🎬 Genre Spotlight</h2>
            <p className="text-charcoal-muted text-sm mt-1">Explore movies by category</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {GENRE_SPOTLIGHTS.map((genre, i) => (
              <Link
                key={genre.name}
                href={`/browse?genre=${genre.name}`}
                className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${genre.gradient} border border-black/5 hover:scale-105 transition-all duration-300 group cursor-pointer animate-fade-in-up`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="absolute -right-4 -bottom-4 text-7xl opacity-20 group-hover:opacity-30 transition-opacity">
                  {genre.icon}
                </div>
                <span className="text-3xl mb-3 block">{genre.icon}</span>
                <h3 className="text-charcoal font-bold text-lg">{genre.name}</h3>
                <p className="text-charcoal/70 text-sm mt-0.5">{genre.description}</p>
                <div className="mt-4 flex items-center gap-1 text-charcoal/60 text-xs font-medium group-hover:text-charcoal/90 transition-colors">
                  Browse
                  <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Top Rated */}
        {!recsLoading && recommendations.length > 5 && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <RecommendationCarousel
              movies={recommendations.slice(5, 20)}
              title="⭐ Top Rated"
              subtitle="Critically acclaimed masterpieces"
              onMovieClick={setSelectedMovie}
            />
          </div>
        )}

        {/* CTA Section */}
        {!user && (
          <section className="py-12 text-center">
            <div className="glass-card rounded-3xl p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-amber-600/10" />
              <div className="relative">
                <div className="text-5xl mb-4">🎬</div>
                <h2 className="text-3xl font-bold text-charcoal mb-3">
                  Ready to Find Your Next Obsession?
                </h2>
                <p className="text-charcoal-muted mb-8 max-w-md mx-auto">
                  Create a free account to get personalized recommendations, save favorites,
                  and rate movies.
                </p>
                <div className="flex justify-center gap-4">
                  <Link
                    href="/signup"
                    className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-charcoal font-bold px-8 py-3 rounded-xl transition-all shadow-lg animate-pulse-glow"
                  >
                    Create Free Account
                  </Link>
                  <Link
                    href="/browse"
                    className="glass-card hover:bg-white/10 text-charcoal font-semibold px-8 py-3 rounded-xl transition-all"
                  >
                    Browse First
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Movie Modal */}
      <MovieModal
        movie={selectedMovie}
        isOpen={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </div>
  )
}
