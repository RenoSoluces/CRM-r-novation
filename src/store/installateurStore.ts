import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Installateur, Chantier } from '@/types/installateur'

function mapRow(row: any): Installateur {
  return {
    id: row.id,
    raisonSociale: row.raison_sociale,
    siret: row.siret,
    contact: {
      nom: row.contact_nom,
      prenom: row.contact_prenom,
      email: row.contact_email,
      telephone: row.contact_telephone,
    },
    adresse: {
      rue: row.adresse_rue ?? '',
      codePostal: row.adresse_code_postal ?? '',
      ville: row.adresse_ville ?? '',
    },
    zonesIntervention: row.zones_intervention ?? [],
    produitIds: row.produit_ids ?? [],
    certifications: row.certifications ?? [],
    note: row.note ?? 0,
    nombreChantiers: row.nombre_chantiers ?? 0,
    chantiers: [],
    actif: row.actif,
    notes: row.notes,
    createdAt: row.created_at,
  }
}

interface InstallateurStore {
  installateurs: Installateur[]
  isLoading: boolean
  fetchInstallateurs: () => Promise<void>
  addInstallateur: (i: Omit<Installateur, 'id' | 'chantiers' | 'createdAt'>) => Promise<void>
  updateInstallateur: (id: string, data: Partial<Installateur>) => Promise<void>
  addChantier: (installateurId: string, chantier: Chantier) => void
  updateChantier: (installateurId: string, chantierId: string, data: Partial<Chantier>) => void
  getById: (id: string) => Installateur | undefined
  getByProduit: (produitId: string) => Installateur[]
  getByZone: (zone: string) => Installateur[]
}

export const useInstallateursStore = create<InstallateurStore>()((set, get) => ({
  installateurs: [],
  isLoading: false,

  fetchInstallateurs: async () => {
    set({ isLoading: true })
    const { data, error } = await supabase
      .from('installateurs')
      .select('*')
      .order('raison_sociale')
    if (!error && data) {
      set({ installateurs: data.map(mapRow) })
    }
    set({ isLoading: false })
  },

  addInstallateur: async (payload) => {
    const { data, error } = await supabase
      .from('installateurs')
      .insert({
        raison_sociale: payload.raisonSociale,
        siret: payload.siret,
        contact_nom: payload.contact.nom,
        contact_prenom: payload.contact.prenom,
        contact_email: payload.contact.email,
        contact_telephone: payload.contact.telephone,
        adresse_rue: payload.adresse.rue,
        adresse_code_postal: payload.adresse.codePostal,
        adresse_ville: payload.adresse.ville,
        zones_intervention: payload.zonesIntervention,
        produit_ids: payload.produitIds,
        certifications: payload.certifications,
        note: payload.note,
        nombre_chantiers: payload.nombreChantiers,
        actif: payload.actif,
        notes: payload.notes,
      })
      .select()
      .single()
    if (!error && data) {
      set(s => ({ installateurs: [...s.installateurs, mapRow(data)] }))
    }
  },

  updateInstallateur: async (id, payload) => {
    const { data, error } = await supabase
      .from('installateurs')
      .update({
        raison_sociale: payload.raisonSociale,
        siret: payload.siret,
        contact_nom: payload.contact?.nom,
        contact_prenom: payload.contact?.prenom,
        contact_email: payload.contact?.email,
        contact_telephone: payload.contact?.telephone,
        adresse_rue: payload.adresse?.rue,
        adresse_code_postal: payload.adresse?.codePostal,
        adresse_ville: payload.adresse?.ville,
        zones_intervention: payload.zonesIntervention,
        produit_ids: payload.produitIds,
        certifications: payload.certifications,
        note: payload.note,
        nombre_chantiers: payload.nombreChantiers,
        actif: payload.actif,
        notes: payload.notes,
      })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      set(s => ({
        installateurs: s.installateurs.map(i => i.id === id ? mapRow(data) : i)
      }))
    }
  },

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
  getByProduit: (produitId) => get().installateurs.filter(i => i.produitIds.includes(produitId) && i.actif),
  getByZone: (zone) => get().installateurs.filter(i => i.zonesIntervention.includes(zone) && i.actif),
}))