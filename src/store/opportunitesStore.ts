import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Opportunite, EtapePipeline, Activite, Commission } from '@/types/opportunite'

function mapRow(row: any): Opportunite {
  return {
    id: row.id,
    reference: row.reference,
    contactId: row.contact_id,
    produitId: row.produit_id,
    etape: row.etape,
    montantDevis: row.montant_devis,
    montantAidesMPR: row.montant_aides_mpr,
    montantAidesCEE: row.montant_aides_cee,
    montantNet: row.montant_net,
    installateurId: row.installateur_id,
    commercialId: row.commercial_id,
    apporteurId: row.apporteur_id,
    regieId: row.regie_id,
    commission: {
      montantSociete:    row.commission_societe,
      montantCommercial: row.commission_commercial,
      montantApporteur:  row.commission_apporteur,
    },
    commissionPayee: row.commission_payee ?? 0, 
    dateCreation:     row.date_creation,
    dateRdv:          row.date_rdv,
    dateDevis:        row.date_devis,
    dateSignature:    row.date_signature,
    dateInstallation: row.date_installation,
    dossierMPR: row.dossier_mpr,
    dossierCEE: row.dossier_cee,
    activites:  row.activites ?? [],
    notes:      row.notes,
    updatedAt:  row.updated_at,
  }
}

interface OpportunitesStore {
  opportunites: Opportunite[]
  isLoading: boolean
  fetchOpportunites:  () => Promise<void>
  addOpportunite:     (o: Omit<Opportunite, 'id' | 'dateCreation' | 'updatedAt'>) => Promise<Opportunite | null>
  updateOpportunite:  (id: string, data: Partial<Opportunite>) => Promise<void>
  updateCommission:   (id: string, commission: Commission) => Promise<void>
  payerCommission:    (id: string, montant: number) => Promise<void>
  moveEtape:          (id: string, etape: EtapePipeline) => Promise<void>
  addActivite:        (opportuniteId: string, activite: Activite) => Promise<void>
  deleteOpportunite:  (id: string) => Promise<void>
  getById:            (id: string) => Opportunite | undefined
  getByCommercial:    (commercialId: string) => Opportunite[]
  getByApporteur:     (apporteurId: string) => Opportunite[]
  getByContact:       (contactId: string) => Opportunite[]
  getByEtape:         (etape: EtapePipeline) => Opportunite[]
}

export const useOpportunitesStore = create<OpportunitesStore>()((set, get) => ({
  opportunites: [],
  isLoading: false,

  fetchOpportunites: async () => {
    set({ isLoading: true })
    const { data, error } = await supabase
      .from('opportunites')
      .select('*')
      .order('date_creation', { ascending: false })
    if (!error && data) set({ opportunites: data.map(mapRow) })
    set({ isLoading: false })
  },

  addOpportunite: async (payload) => {
    const { data, error } = await supabase
      .from('opportunites')
      .insert({
        reference:             payload.reference,
        contact_id:            payload.contactId,
        produit_id:            payload.produitId,
        etape:                 payload.etape,
        montant_devis:         payload.montantDevis,
        montant_aides_mpr:     payload.montantAidesMPR,
        montant_aides_cee:     payload.montantAidesCEE,
        montant_net:           payload.montantNet,
        installateur_id:       payload.installateurId || null,
        commercial_id:         payload.commercialId,
        apporteur_id:          payload.apporteurId || null,
        regie_id:              payload.regieId || null,
        commission_societe:    payload.commission?.montantSociete,
        commission_commercial: payload.commission?.montantCommercial,
        commission_apporteur:  payload.commission?.montantApporteur,
        commission_payee:      0,
        date_rdv:              payload.dateRdv,
        date_devis:            payload.dateDevis,
        date_signature:        payload.dateSignature,
        date_installation:     payload.dateInstallation,
        dossier_mpr:           payload.dossierMPR ?? null,
        dossier_cee:           payload.dossierCEE ?? null,
        activites:             payload.activites ?? [],
        notes:                 payload.notes,
      })
      .select()
      .single()
    if (!error && data) {
      const opp = mapRow(data)
      set(s => ({ opportunites: [opp, ...s.opportunites] }))
      return opp
    }
    return null
  },

  updateOpportunite: async (id, payload) => {
    const current = get().opportunites.find(o => o.id === id)
    if (!current) return
    const { data, error } = await supabase
      .from('opportunites')
      .update({
        etape:             payload.etape,
        montant_devis:     payload.montantDevis,
        montant_aides_mpr: payload.montantAidesMPR,
        montant_aides_cee: payload.montantAidesCEE,
        montant_net:       payload.montantNet,
        installateur_id:   payload.installateurId,
        apporteur_id:      payload.apporteurId,
        dossier_mpr:       payload.dossierMPR,
        dossier_cee:       payload.dossierCEE,
        activites:         payload.activites,
        notes:             payload.notes,
        date_rdv:          payload.dateRdv,
        date_devis:        payload.dateDevis,
        date_signature:    payload.dateSignature,
        date_installation: payload.dateInstallation,
        updated_at:        new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      set(s => ({ opportunites: s.opportunites.map(o => o.id === id ? mapRow(data) : o) }))
    }
  },

  updateCommission: async (id, commission) => {
    const { data, error } = await supabase
      .from('opportunites')
      .update({
        commission_societe:    commission.montantSociete,
        commission_commercial: commission.montantCommercial,
        commission_apporteur:  commission.montantApporteur,
        updated_at:            new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      set(s => ({ opportunites: s.opportunites.map(o => o.id === id ? mapRow(data) : o) }))
    }
  },

  payerCommission: async (id, montant) => {
    const { data, error } = await supabase
      .from('opportunites')
      .update({
        commission_payee: montant,
        updated_at:       new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      set(s => ({ opportunites: s.opportunites.map(o => o.id === id ? mapRow(data) : o) }))
    }
  },

  moveEtape: async (id, etape) => {
    const { data, error } = await supabase
      .from('opportunites')
      .update({ etape, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      set(s => ({ opportunites: s.opportunites.map(o => o.id === id ? mapRow(data) : o) }))
    }
  },

  addActivite: async (opportuniteId, activite) => {
    const opp = get().opportunites.find(o => o.id === opportuniteId)
    if (!opp) return
    const newActivites = [...(opp.activites ?? []), activite]
    const { data, error } = await supabase
      .from('opportunites')
      .update({ activites: newActivites, updated_at: new Date().toISOString() })
      .eq('id', opportuniteId)
      .select()
      .single()
    if (!error && data) {
      set(s => ({ opportunites: s.opportunites.map(o => o.id === opportuniteId ? mapRow(data) : o) }))
    }
  },

  deleteOpportunite: async (id) => {
    const { error } = await supabase.from('opportunites').delete().eq('id', id)
    if (!error) set(s => ({ opportunites: s.opportunites.filter(o => o.id !== id) }))
  },

  getById:         (id)           => get().opportunites.find(o => o.id === id),
  getByCommercial: (commercialId) => get().opportunites.filter(o => o.commercialId === commercialId),
  getByApporteur:  (apporteurId)  => get().opportunites.filter(o => o.apporteurId === apporteurId),
  getByContact:    (contactId)    => get().opportunites.filter(o => o.contactId === contactId),
  getByEtape:      (etape)        => get().opportunites.filter(o => o.etape === etape),
}))