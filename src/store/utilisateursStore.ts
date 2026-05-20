import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types/user'

function mapRow(row: any): User {
  return {
    id: row.id,
    nom: row.nom,
    prenom: row.prenom,
    email: row.email,
    telephone: row.telephone,
    role: row.role,
    regieId: row.regie_id,
    apporteurId: row.apporteur_id,
    actif: row.actif,
    createdAt: row.created_at,
  }
}

interface UtilisateursStore {
  utilisateurs: User[]
  isLoading: boolean
  fetchUtilisateurs:       () => Promise<void>
  createApporteur:         (payload: {
    prenom: string; nom: string; email: string
    telephone?: string; password: string
  }) => Promise<{ success: boolean; error?: string }>
  createAncienCommercial:  (payload: {
    prenom: string; nom: string; telephone?: string; notes?: string
  }) => Promise<{ success: boolean; error?: string }>
}

export const useUtilisateursStore = create<UtilisateursStore>()((set) => ({
  utilisateurs: [],
  isLoading: false,

  fetchUtilisateurs: async () => {
    set({ isLoading: true })
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('nom')
    if (!error && data) set({ utilisateurs: data.map(mapRow) })
    set({ isLoading: false })
  },

  createApporteur: async ({ prenom, nom, email, telephone, password }) => {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { prenom, nom, role: 'apporteur' },
    })
    if (authError) return { success: false, error: authError.message }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        prenom, nom, email,
        telephone: telephone || null,
        role: 'apporteur',
        actif: true,
      })
      .select()
      .single()

    if (profileError) return { success: false, error: profileError.message }
    set(s => ({ utilisateurs: [...s.utilisateurs, mapRow(profileData)] }))
    return { success: true }
  },

  createAncienCommercial: async ({ prenom, nom, telephone, notes }) => {
    // Pas de compte auth — insertion directe dans profiles avec un UUID généré
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        prenom,
        nom,
        email:     null,
        telephone: telephone || null,
        role:      'commercial',
        actif:     false,   // ← inactif = pas d'accès
        notes:     notes || null,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    set(s => ({ utilisateurs: [...s.utilisateurs, mapRow(data)] }))
    return { success: true }
  },
}))