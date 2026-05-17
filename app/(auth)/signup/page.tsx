'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const ALL_GENRES = [
  'Action', 'Drama', 'Comedy', 'Sci-Fi', 'Horror',
  'Romance', 'Thriller', 'Animation', 'Documentary', 'Fantasy',
]

function PasswordStrength({ password }: { password: string }) {
  const getStrength = () => {
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }

  const strength = getStrength()
  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong']
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-amber-500', 'bg-green-500']
  const textColors = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-amber-400', 'text-green-400']

  if (!password) return null

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < strength ? colors[strength] : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <span className={`text-xs font-medium ${textColors[strength]}`}>
        {labels[strength]}
      </span>
    </div>
  )
}

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signUp } = useAuth()
  const router = useRouter()

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : prev.length < 5
        ? [...prev, genre]
        : prev
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim()) {
      setError('Username is required')
      return
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await signUp({ email, password, username, preferred_genres: selectedGenres })
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create account. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 py-10">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-orange-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-amber-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <span className="text-2xl font-bold gradient-text">CineAI</span>
          </Link>
          <h1 className="text-2xl font-bold text-charcoal mt-6">Create your account</h1>
          <p className="text-charcoal-muted text-sm mt-1">Start discovering great movies today</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 mb-6 text-sm animate-scale-in">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-sm font-medium text-charcoal-muted">
                Username
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  id="username"
                  type="text"
                  required
                  minLength={3}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="cinephile42"
                  className="w-full bg-white/5 border border-black/5 rounded-xl pl-10 pr-4 py-3 text-sm text-charcoal placeholder:text-slate-500 focus:border-orange-500/60 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-charcoal-muted">
                Email
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-black/5 rounded-xl pl-10 pr-4 py-3 text-sm text-charcoal placeholder:text-slate-500 focus:border-orange-500/60 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-charcoal-muted">
                Password
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-white/5 border border-black/5 rounded-xl pl-10 pr-11 py-3 text-sm text-charcoal placeholder:text-slate-500 focus:border-orange-500/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted hover:text-charcoal transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-charcoal-muted">
                Confirm Password
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={`w-full bg-white/5 border rounded-xl pl-10 pr-4 py-3 text-sm text-charcoal placeholder:text-slate-500 focus:border-orange-500/60 transition-all ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-500/40'
                      : confirmPassword && password === confirmPassword
                      ? 'border-amber-500/40'
                      : 'border-black/5'
                  }`}
                />
                {confirmPassword && password === confirmPassword && (
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>

            {/* Genre Preferences */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-charcoal-muted">
                Favorite Genres
                <span className="ml-2 text-xs text-slate-500">
                  ({selectedGenres.length}/5 selected)
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_GENRES.map((genre) => {
                  const isSelected = selectedGenres.includes(genre)
                  const isDisabled = !isSelected && selectedGenres.length >= 5
                  return (
                    <button
                      key={genre}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => toggleGenre(genre)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                        isSelected
                          ? 'bg-orange-600/30 text-orange-300 border-orange-500/50'
                          : isDisabled
                          ? 'bg-white/2 text-slate-600 border-white/5 cursor-not-allowed'
                          : 'bg-white/5 text-charcoal-muted border-black/5 hover:bg-orange-600/15 hover:text-orange-300 hover:border-orange-500/30'
                      }`}
                    >
                      {isSelected && '✓ '}{genre}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-charcoal font-semibold rounded-xl transition-all shadow-lg shadow-orange-900/40 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-charcoal-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
