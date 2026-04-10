import { create } from 'zustand'
import type { Installateur, Chantier } from '@/types/installateur'
import { mockInstallateurs } from '@/data/installateurs'

interface InstallateurStore {
  installateurs: Installateur[]
  addInstallateur: (i: Installateur) => void
  updateInstallateur: (id: string, data: Partial<Installateur>) => void
  addChantier: (installateurId: string, chantier: Chantier) => void
  updateChantier: (installateurId: string, chantierId: string, data: Partial<Chantier>) => void
  getById: (id: string) => Installateur | undefined
  getByProduit: (produitId: string) => Installateur[]
  getByZone: (departement: string) => Installateur[]
}

export const useInstallateursStore = create<InstallateurStore>()((set, get) => ({
  installateurs: mockInstallateurs,

  addInstallateur: (i) =>
    set(s => ({ installateurs: [...s.installateurs, i] })),

  updateInstallateur: (id, data) =>
    set(s => ({
      installateurs: s.installateurs.map(i =>
        i.id === id ? { ...i, ...data } : i
      ),
    })),

  addChantier: (installateurId, chantier) =>
    set(s => ({
      installateurs: s.installateurs.map(i =>
        i.id === installateurId
          ? { ...i, chantiers: [...i.chantiers, chantier], nombreChantiers: i.nombreChantiers + 1 }
          : i
      ),
    })),

  updateChantier: (installateurId, chantierId, data) =>
    set(s => ({
      installateurs: s.installateurs.map(i =>
        i.id === installateurId
          ? { ...i, chantiers: i.chantiers.map(c => c.id === chantierId ? { ...c, ...data } : c) }
          : i
      ),
    })),

  getById: (id) => get().installateurs.find(i => i.id === id),

  getByProduit: (produitId) =>
    get().installateurs.filter(i => i.produitIds.includes(produitId) && i.actif),

  getByZone: (departement) =>
    get().installateurs.filter(i => i.zonesIntervention.includes(departement) && i.actif),
}))