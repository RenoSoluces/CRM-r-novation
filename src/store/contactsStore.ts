import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Contact } from '@/types/contact'

function mapRow(row: any): Contact {
  return {
    id: row.id,
    type: row.type,
    civilite: row.civilite,
    nom: row.nom,
    prenom: row.prenom,
    email: row.email,
    telephone: row.telephone,
    telephoneSecondaire: row.telephone_secondaire,
    adresse: {
      rue: row.adresse_rue ?? '',
      codePostal: row.adresse_code_postal ?? '',
      ville: row.adresse_ville ?? '',
      departement: row.adresse_departement,
    },
    statut: row.statut,
    typeLogement: row.type_logement,
    anneeConstruction: row.annee_construction,
    surfaceHabitable: row.surface_habitable,
    typeChaufface: row.type_chauffage,
    revenuFiscal: row.revenu_fiscal,
    nombrePersonnes: row.nombre_personnes,
    trancheMPR: row.tranche_mpr,
    commercialId: row.commercial_id,
    apporteurId: row.apporteur_id,
    regieId: row.regie_id,
    source: row.source,
    notes: row.notes,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

interface ContactsStore {
  contacts: Contact[]
  isLoading: boolean
  fetchContacts: () => Promise<void>
  addContact: (c: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Contact | null>
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>
  deleteContact: (id: string) => Promise<void>
  getById: (id: string) => Contact | undefined
  getByCommercial: (commercialId: string) => Contact[]
  getByApporteur: (apporteurId: string) => Contact[]
}

export const useContactsStore = create<ContactsStore>()((set, get) => ({
  contacts: [],
  isLoading: false,

  fetchContacts: async () => {
    set({ isLoading: true })
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) {
      set({ contacts: data.map(mapRow) })
    }
    set({ isLoading: false })
  },

  addContact: async (payload) => {
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        type: payload.type,
        civilite: payload.civilite,
        nom: payload.nom,
        prenom: payload.prenom,
        email: payload.email,
        telephone: payload.telephone,
        telephone_secondaire: payload.telephoneSecondaire,
        adresse_rue: payload.adresse.rue,
        adresse_code_postal: payload.adresse.codePostal,
        adresse_ville: payload.adresse.ville,
        adresse_departement: payload.adresse.departement,
        statut: payload.statut,
        type_logement: payload.typeLogement,
        annee_construction: payload.anneeConstruction,
        surface_habitable: payload.surfaceHabitable,
        type_chauffage: payload.typeChaufface,
        revenu_fiscal: payload.revenuFiscal,
        nombre_personnes: payload.nombrePersonnes,
        tranche_mpr: payload.trancheMPR,
        commercial_id: payload.commercialId,
        apporteur_id: payload.apporteurId,
        regie_id: payload.regieId,
        source: payload.source,
        notes: payload.notes,
        tags: payload.tags ?? [],
      })
      .select()
      .single()
    if (!error && data) {
      const contact = mapRow(data)
      set(s => ({ contacts: [contact, ...s.contacts] }))
      return contact
    }
    return null
  },

  updateContact: async (id, payload) => {
    const { data, error } = await supabase
      .from('contacts')
      .update({
        type: payload.type,
        civilite: payload.civilite,
        nom: payload.nom,
        prenom: payload.prenom,
        email: payload.email,
        telephone: payload.telephone,
        telephone_secondaire: payload.telephoneSecondaire,
        adresse_rue: payload.adresse?.rue,
        adresse_code_postal: payload.adresse?.codePostal,
        adresse_ville: payload.adresse?.ville,
        adresse_departement: payload.adresse?.departement,
        statut: payload.statut,
        type_logement: payload.typeLogement,
        annee_construction: payload.anneeConstruction,
        surface_habitable: payload.surfaceHabitable,
        type_chauffage: payload.typeChaufface,
        revenu_fiscal: payload.revenuFiscal,
        nombre_personnes: payload.nombrePersonnes,
        tranche_mpr: payload.trancheMPR,
        commercial_id: payload.commercialId,
        apporteur_id: payload.apporteurId,
        regie_id: payload.regieId,
        source: payload.source,
        notes: payload.notes,
        tags: payload.tags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      set(s => ({
        contacts: s.contacts.map(c => c.id === id ? mapRow(data) : c)
      }))
    }
  },

  deleteContact: async (id) => {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
    if (!error) {
      set(s => ({ contacts: s.contacts.filter(c => c.id !== id) }))
    }
  },

  getById: (id) => get().contacts.find(c => c.id === id),
  getByCommercial: (commercialId) => get().contacts.filter(c => c.commercialId === commercialId),
  getByApporteur: (apporteurId) => get().contacts.filter(c => c.apporteurId === apporteurId),
}))