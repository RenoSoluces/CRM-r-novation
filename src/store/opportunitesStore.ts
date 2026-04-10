import { create } from 'zustand'
import type { Opportunite, EtapePipeline, Activite } from '@/types/opportunite'
import { mockOpportunites } from '@/data/opportunites'

interface OpportunitesStore {
  opportunites: Opportunite[]
  addOpportunite: (o: Opportunite) => void
  updateOpportunite: (id: string, data: Partial<Opportunite>) => void
  moveEtape: (id: string, etape: EtapePipeline) => void
  addActivite: (opportuniteId: string, activite: Activite) => void
  deleteOpportunite: (id: string) => void
  getById: (id: string) => Opportunite | undefined
  getByCommercial: (commercialId: string) => Opportunite[]
  getByApporteur: (apporteurId: string) => Opportunite[]
  getByContact: (contactId: string) => Opportunite[]
  getByEtape: (etape: EtapePipeline) => Opportunite[]
}

export const useOpportunitesStore = create<OpportunitesStore>()((set, get) => ({
  opportunites: mockOpportunites,

  addOpportunite: (o) =>
    set((s) => ({ opportunites: [...s.opportunites, o] })),

  updateOpportunite: (id, data) =>
    set((s) => ({
      opportunites: s.opportunites.map((o) =>
        o.id === id
          ? { ...o, ...data, updatedAt: new Date().toISOString() }
          : o
      ),
    })),

  moveEtape: (id, etape) =>
    set((s) => ({
      opportunites: s.opportunites.map((o) =>
        o.id === id
          ? { ...o, etape, updatedAt: new Date().toISOString() }
          : o
      ),
    })),

  addActivite: (opportuniteId, activite) =>
    set((s) => ({
      opportunites: s.opportunites.map((o) =>
        o.id === opportuniteId
          ? {
              ...o,
              activites: [...o.activites, activite],
              updatedAt: new Date().toISOString(),
            }
          : o
      ),
    })),

  deleteOpportunite: (id) =>
    set((s) => ({
      opportunites: s.opportunites.filter((o) => o.id !== id),
    })),

  getById: (id) =>
    get().opportunites.find((o) => o.id === id),

  getByCommercial: (commercialId) =>
    get().opportunites.filter((o) => o.commercialId === commercialId),

  getByApporteur: (apporteurId) =>
    get().opportunites.filter((o) => o.apporteurId === apporteurId),

  getByContact: (contactId) =>
    get().opportunites.filter((o) => o.contactId === contactId),

  getByEtape: (etape) =>
    get().opportunites.filter((o) => o.etape === etape),
}))