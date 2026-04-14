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
  fetchUtilisateurs: () => Promise<void>
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
    if (!error && data) {
      set({ utilisateurs: data.map(mapRow) })
    }
    set({ isLoading: false })
  },
}))