import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types/user'

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  loadSession: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  loadSession: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (profile) {
        set({ user: profile as User, isAuthenticated: true })
      }
    }
    set({ isLoading: false })
  },

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    console.log('Supabase auth response:', { data, error })

    if (error || !data.user) return false

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    console.log('Profile response:', { profile, profileError })

    if (profile) {
      set({ user: profile as User, isAuthenticated: true })
      return true
    }
    return false
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, isAuthenticated: false })
  },
}))