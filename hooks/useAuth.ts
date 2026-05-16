'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
}

interface SignUpData {
  email: string
  password: string
  username: string
  preferred_genres?: string[]
}

interface SignInData {
  email: string
  password: string
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  })

  const supabase = createClient()

  const fetchProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data as UserProfile
    },
    [supabase]
  )

  useEffect(() => {
    // Get initial session
    const initSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setState({ user: session.user, profile, loading: false })
      } else {
        setState({ user: null, profile: null, loading: false })
      }
    }

    initSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setState({ user: session.user, profile, loading: false })
      } else {
        setState({ user: null, profile: null, loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  const signIn = async ({ email, password }: SignInData) => {
    setState((prev) => ({ ...prev, loading: true }))
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setState((prev) => ({ ...prev, loading: false }))
      throw error
    }

    if (data.user) {
      const profile = await fetchProfile(data.user.id)
      setState({ user: data.user, profile, loading: false })
    }

    return data
  }

  const signUp = async ({
    email,
    password,
    username,
    preferred_genres = [],
  }: SignUpData) => {
    setState((prev) => ({ ...prev, loading: true }))

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    })

    if (error) {
      setState((prev) => ({ ...prev, loading: false }))
      throw error
    }

    if (data.user) {
      // The database trigger automatically creates the profile row on auth signup,
      // so we just need to update it with any additional info like preferred_genres.
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username,
          preferred_genres,
        })
        .eq('id', data.user.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
      }

      const profile = await fetchProfile(data.user.id)
      setState({ user: data.user, profile, loading: false })
    }

    return data
  }

  const signOut = async () => {
    setState((prev) => ({ ...prev, loading: true }))
    const { error } = await supabase.auth.signOut()
    if (error) {
      setState((prev) => ({ ...prev, loading: false }))
      throw error
    }
    setState({ user: null, profile: null, loading: false })
  }

  const isAdmin = state.user?.email?.toLowerCase().includes('admin') || false

  return {
    user: state.user,
    profile: state.profile,
    loading: state.loading,
    isAdmin,
    signIn,
    signUp,
    signOut,
  }
}
