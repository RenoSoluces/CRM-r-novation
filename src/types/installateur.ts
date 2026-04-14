export type StatutChantier = 'planifie' | 'en_cours' | 'termine' | 'annule'
export type ZoneIntervention = 'H1' | 'H2' | 'H3' | 'france_entiere'

export interface Chantier {
  id: string
  opportuniteId: string
  contactNom: string
  produitNom: string
  dateInstallation: string
  statut: StatutChantier
  adresse: string
  notes?: string
}

export interface Installateur {
  id: string
  raisonSociale: string
  siret?: string
  contact: {
    nom: string
    prenom: string
    email: string
    telephone: string
  }
  adresse: {
    rue: string
    codePostal: string
    ville: string
  }
  zonesIntervention: ZoneIntervention[]
  produitIds: string[]
  certifications: string[]
  note: number
  nombreChantiers: number
  chantiers: Chantier[]
  actif: boolean
  notes?: string
  createdAt: string
}