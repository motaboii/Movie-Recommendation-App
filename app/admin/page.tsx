'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { TableRowSkeleton } from '@/components/LoadingSkeleton'
import type { Movie } from '@/types'

const ALL_GENRES = [
  'Action', 'Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Romance',
  'Thriller', 'Animation', 'Documentary', 'Fantasy', 'Crime', 'Adventure',
]

interface Toast {
  message: string
  type: 'success' | 'error'
}

interface MovieFormData {
  title: string
  overview: string
  genres: string[]
  cast_members: string
  director: string
  poster_url: string
  backdrop_url: string
  release_year: string
  runtime: string
  language: string
  average_rating: string
}

const emptyForm: MovieFormData = {
  title: '',
  overview: '',
  genres: [],
  cast_members: '',
  director: '',
  poster_url: '',
  backdrop_url: '',
  release_year: new Date().getFullYear().toString(),
  runtime: '',
  language: 'en',
  average_rating: '',
}

export default function AdminPage() {
  const { user } = useAuth()
  const [movies, setMovies] = useState<Movie[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [form, setForm] = useState<MovieFormData>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const LIMIT = 10
  const supabase = createClient()

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchMovies = useCallback(async () => {
    setLoading(true)
    const from = (page - 1) * LIMIT
    const to = from + LIMIT - 1

    let query = supabase.from('movies').select('*', { count: 'exact' })
    if (searchTerm) query = query.ilike('title', `%${searchTerm}%`)
    query = query.order('id', { ascending: false }).range(from, to)

    const { data, count, error } = await query
    if (!error) {
      setMovies((data as Movie[]) || [])
      setTotal(count || 0)
    }
    setLoading(false)
  }, [page, searchTerm, supabase])

  useEffect(() => {
    fetchMovies()
  }, [fetchMovies])

  const validateForm = (): string | null => {
    if (!form.title.trim()) return 'Title is required'
    if (!form.overview.trim()) return 'Overview is required'
    if (form.genres.length === 0) return 'Select at least one genre'
    if (!form.director.trim()) return 'Director is required'
    if (!form.release_year || isNaN(parseInt(form.release_year))) return 'Valid release year required'
    if (form.average_rating && (parseFloat(form.average_rating) < 0 || parseFloat(form.average_rating) > 10)) {
      return 'Rating must be between 0 and 10'
    }
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const validationError = validateForm()
    if (validationError) { showToast(validationError, 'error'); return }

    setFormLoading(true)
    try {
      const payload = {
        title: form.title.trim(),
        overview: form.overview.trim(),
        genres: form.genres,
        cast_members: form.cast_members.split(',').map((s) => s.trim()).filter(Boolean),
        director: form.director.trim(),
        poster_url: form.poster_url.trim() || null,
        backdrop_url: form.backdrop_url.trim() || null,
        release_year: parseInt(form.release_year),
        runtime: form.runtime ? parseInt(form.runtime) : null,
        language: form.language.trim() || 'en',
        average_rating: form.average_rating ? parseFloat(form.average_rating) : null,
        vote_count: 0,
      }

      if (editingId) {
        const { error } = await supabase.from('movies').update(payload).eq('id', editingId)
        if (error) throw error
        showToast('Movie updated successfully ✓', 'success')
      } else {
        const { error } = await supabase.from('movies').insert(payload)
        if (error) throw error
        showToast('Movie added successfully ✓', 'success')
      }

      setForm(emptyForm)
      setEditingId(null)
      setShowForm(false)
      fetchMovies()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Operation failed', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (movie: Movie) => {
    setForm({
      title: movie.title,
      overview: movie.overview,
      genres: movie.genres || [],
      cast_members: movie.cast_members?.join(', ') || '',
      director: movie.director,
      poster_url: movie.poster_url || '',
      backdrop_url: movie.backdrop_url || '',
      release_year: movie.release_year?.toString() || '',
      runtime: movie.runtime?.toString() || '',
      language: movie.language || 'en',
      average_rating: movie.average_rating?.toString() || '',
    })
    setEditingId(movie.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from('movies').delete().eq('id', id)
      if (error) throw error
      showToast('Movie deleted', 'success')
      setDeleteConfirm(null)
      fetchMovies()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error')
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  const InputField = ({
    label, id, type = 'text', value, onChange, placeholder, required = false, ...rest
  }: {
    label: string; id: string; type?: string; value: string; onChange: (v: string) => void;
    placeholder?: string; required?: boolean; [key: string]: unknown
  }) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-white/5 border border-black/5 rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder:text-slate-500 focus:border-orange-500/60 transition-all"
        {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
      />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-scale-in ${
            toast.type === 'success'
              ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
              : 'bg-red-500/20 border border-red-500/30 text-red-300'
          }`}
        >
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">
            Admin Panel <span className="gradient-text">— Manage Movies</span>
          </h1>
          <p className="text-charcoal-muted text-sm mt-0.5">
            {user?.email} · {total.toLocaleString()} movies in database
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Total stat chip */}
          <div className="flex items-center gap-2 glass-card rounded-xl px-4 py-2.5">
            <span className="text-2xl font-black gradient-text">{total}</span>
            <span className="text-xs text-charcoal-muted">Total Movies</span>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm) }}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-charcoal text-sm font-medium px-4 py-2.5 rounded-xl transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'} />
            </svg>
            {showForm ? 'Cancel' : 'Add Movie'}
          </button>
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-6 animate-scale-in">
          <h2 className="text-lg font-bold text-charcoal mb-5">
            {editingId ? '✏️ Edit Movie' : '➕ Add New Movie'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Title" id="title" value={form.title}
                onChange={(v) => setForm({ ...form, title: v })}
                placeholder="The Dark Knight" required
              />
              <InputField
                label="Director" id="director" value={form.director}
                onChange={(v) => setForm({ ...form, director: v })}
                placeholder="Christopher Nolan" required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-1.5">
                Overview <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.overview}
                onChange={(e) => setForm({ ...form, overview: e.target.value })}
                placeholder="Brief movie description..."
                required
                rows={3}
                className="w-full bg-white/5 border border-black/5 rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder:text-slate-500 focus:border-orange-500/60 transition-all resize-none"
              />
            </div>

            {/* Genres */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
                Genres <span className="text-red-400">*</span>
                <span className="ml-2 normal-case text-slate-500 font-normal">({form.genres.length} selected)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_GENRES.map((g) => {
                  const active = form.genres.includes(g)
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          genres: active
                            ? form.genres.filter((x) => x !== g)
                            : [...form.genres, g],
                        })
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        active
                          ? 'bg-orange-600/30 text-orange-300 border-orange-500/50'
                          : 'bg-white/5 text-charcoal-muted border-black/5 hover:border-orange-500/30 hover:text-orange-300'
                      }`}
                    >
                      {active && '✓ '}{g}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField
                label="Release Year" id="release_year" type="number" value={form.release_year}
                onChange={(v) => setForm({ ...form, release_year: v })}
                placeholder="2024" required
              />
              <InputField
                label="Runtime (min)" id="runtime" type="number" value={form.runtime}
                onChange={(v) => setForm({ ...form, runtime: v })}
                placeholder="120"
              />
              <InputField
                label="Language Code" id="language" value={form.language}
                onChange={(v) => setForm({ ...form, language: v })}
                placeholder="en"
              />
            </div>

            <InputField
              label="Cast (comma-separated)" id="cast_members" value={form.cast_members}
              onChange={(v) => setForm({ ...form, cast_members: v })}
              placeholder="Actor One, Actor Two, Actor Three"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Poster URL" id="poster_url" value={form.poster_url}
                onChange={(v) => setForm({ ...form, poster_url: v })}
                placeholder="https://..."
              />
              <InputField
                label="Backdrop URL" id="backdrop_url" value={form.backdrop_url}
                onChange={(v) => setForm({ ...form, backdrop_url: v })}
                placeholder="https://..."
              />
            </div>

            <InputField
              label="Average Rating (0–10)" id="average_rating" type="number" value={form.average_rating}
              onChange={(v) => setForm({ ...form, average_rating: v })}
              placeholder="7.5"
            />

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={formLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 text-charcoal font-semibold px-6 py-2.5 rounded-xl transition-all disabled:opacity-50"
              >
                {formLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : editingId ? 'Update Movie' : 'Add Movie'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm) }}
                className="px-5 py-2.5 glass-card hover:bg-white/10 text-charcoal-muted font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Movies Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Table Header + Search */}
        <div className="flex items-center justify-between gap-4 p-5 border-b border-black/5">
          <h2 className="text-base font-bold text-charcoal">All Movies</h2>
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
              placeholder="Search movies..."
              className="w-full bg-white/5 border border-black/5 rounded-xl pl-10 pr-4 py-2 text-sm text-charcoal placeholder:text-slate-500 focus:border-orange-500/50 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500">
                <th className="text-left px-5 py-3 font-semibold">Movie</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Year</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Rating</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Genres</th>
                <th className="text-right px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: LIMIT }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
                : movies.map((movie) => (
                    <tr
                      key={movie.id}
                      className="border-b border-white/5 hover:bg-white/3 transition-colors group"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {movie.poster_url ? (
                            <div className="w-8 h-11 rounded-lg overflow-hidden flex-none bg-white/5">
                              <img src={movie.poster_url} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-8 h-11 rounded-lg bg-orange-900/20 flex-none" />
                          )}
                          <div>
                            <p className="font-medium text-charcoal line-clamp-1">{movie.title}</p>
                            <p className="text-xs text-slate-500 line-clamp-1">{movie.director}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-charcoal-muted hidden md:table-cell">{movie.release_year}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {movie.average_rating ? (
                          <span className="text-yellow-400 font-medium">
                            ⭐ {movie.average_rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {movie.genres?.slice(0, 2).map((g) => (
                            <span key={g} className="text-xs bg-orange-600/15 text-orange-400 px-2 py-0.5 rounded-full">
                              {g}
                            </span>
                          ))}
                          {(movie.genres?.length || 0) > 2 && (
                            <span className="text-xs text-slate-500">+{movie.genres.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(movie)}
                            className="p-1.5 rounded-lg text-charcoal-muted hover:text-charcoal hover:bg-orange-600/20 transition-all"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {deleteConfirm === movie.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(movie.id)}
                                className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 transition-all"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-xs text-charcoal-muted hover:text-charcoal px-2 py-1 rounded hover:bg-white/5 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(movie.id)}
                              className="p-1.5 rounded-lg text-charcoal-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-black/5">
            <p className="text-xs text-slate-500">
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total.toLocaleString()}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 glass-card rounded-lg text-xs text-charcoal-muted hover:text-charcoal hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ← Prev
              </button>
              <span className="px-3 py-1.5 text-xs text-charcoal-muted">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 glass-card rounded-lg text-xs text-charcoal-muted hover:text-charcoal hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && movies.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-slate-500">No movies found{searchTerm ? ` for "${searchTerm}"` : ''}.</p>
          </div>
        )}
      </div>
    </div>
  )
}
