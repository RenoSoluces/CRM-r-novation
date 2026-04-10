import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/user'
import { mockUsers } from '@/data/users'

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  switchUser: (userId: string) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, _password: string) => {
        const found = mockUsers.find(
          (u: User) =>
            u.email.toLowerCase() === email.toLowerCase() && u.actif
        )
        if (found) {
          set({ user: found, isAuthenticated: true })
          return true
        }
        return false
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      switchUser: (userId: string) => {
        const found = mockUsers.find((u: User) => u.id === userId)
        if (found) set({ user: found, isAuthenticated: true })
      },
    }),
    { name: 'crm-reno-auth' }
  )
)