import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types/notification'

function mapRow(row: any): Notification {
  return {
    id: row.id,
    type: row.type,
    titre: row.titre,
    message: row.message,
    lienId: row.lien_id,
    lienType: row.lien_type,
    destinataireId: row.destinataire_id,
    lue: row.lue,
    traitee: row.traitee ?? false,
    dateEcheance: row.date_echeance,
    createdAt: row.created_at,
  }
}

interface NotificationsStore {
  notifications: Notification[]
  isLoading: boolean
  fetchNotifications: () => Promise<void>
  marquerLue: (id: string) => Promise<void>
  marquerTraitee: (id: string) => Promise<void>
  marquerToutesLues: (destinataireId: string) => Promise<void>
  ajouterNotification: (n: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>
  supprimerNotification: (id: string) => Promise<void>
  getNonLues: (destinataireId: string) => Notification[]
  getParDestinataire: (destinataireId: string) => Notification[]
}

export const useNotificationsStore = create<NotificationsStore>()((set, get) => ({
  notifications: [],
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true })
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) set({ notifications: data.map(mapRow) })
    set({ isLoading: false })
  },

  marquerLue: async (id) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ lue: true })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      set(s => ({ notifications: s.notifications.map(n => n.id === id ? mapRow(data) : n) }))
    }
  },

  marquerTraitee: async (id) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ traitee: true, lue: true })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      set(s => ({ notifications: s.notifications.map(n => n.id === id ? mapRow(data) : n) }))
    }
  },

  marquerToutesLues: async (destinataireId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ lue: true })
      .eq('destinataire_id', destinataireId)
      .eq('lue', false)
    if (!error) {
      set(s => ({
        notifications: s.notifications.map(n =>
          n.destinataireId === destinataireId ? { ...n, lue: true } : n
        ),
      }))
    }
  },

  ajouterNotification: async (n) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        type: n.type,
        titre: n.titre,
        message: n.message,
        lien_id: n.lienId,
        lien_type: n.lienType,
        destinataire_id: n.destinataireId,
        lue: n.lue ?? false,
        traitee: n.traitee ?? false,
        date_echeance: n.dateEcheance,
      })
      .select()
      .single()
    if (!error && data) {
      set(s => ({ notifications: [mapRow(data), ...s.notifications] }))
    }
  },

  supprimerNotification: async (id) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id)
    if (!error) set(s => ({ notifications: s.notifications.filter(n => n.id !== id) }))
  },

  getNonLues: (destinataireId) =>
    get().notifications.filter(n => n.destinataireId === destinataireId && !n.lue),

  getParDestinataire: (destinataireId) =>
    get().notifications.filter(n => n.destinataireId === destinataireId),
}))
