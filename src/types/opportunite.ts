export type EtapePipeline =
  | 'nouveau_lead'
  | 'qualification'
  | 'rdv_planifie'
  | 'rdv_effectue'
  | 'devis_envoye'
  | 'dossier_mpr_cee'
  | 'signe'
  | 'installation_planifiee'
  | 'pose_livree'
  | 'sav_suivi'
  | 'perdu'

export interface EtapeInfo {
  id: EtapePipeline
  label: string
  couleur: string
}

export const ETAPES_PIPELINE: EtapeInfo[] = [
  { id: 'nouveau_lead',           label: 'Nouveau Lead',          couleur: '#6b7280' },
  { id: 'qualification',          label: 'Qualification',         couleur: '#3b82f6' },
  { id: 'rdv_planifie',           label: 'RDV Planifié',          couleur: '#8b5cf6' },
  { id: 'rdv_effectue',           label: 'RDV Effectué',          couleur: '#f59e0b' },
  { id: 'devis_envoye',           label: 'Devis Envoyé',          couleur: '#f97316' },
  { id: 'dossier_mpr_cee',        label: 'Dossier MPR/CEE',       couleur: '#06b6d4' },
  { id: 'signe',                  label: 'Signé ✓',               couleur: '#10b981' },
  { id: 'installation_planifiee', label: 'Installation Planifiée',couleur: '#14b8a6' },
  { id: 'pose_livree',            label: 'Posé / Livré',          couleur: '#22c55e' },
  { id: 'sav_suivi',              label: 'SAV / Suivi',           couleur: '#84cc16' },
  { id: 'perdu',                  label: 'Perdu',                 couleur: '#ef4444' },
]

export interface Activite {
  id: string
  type: 'appel' | 'email' | 'rdv' | 'note' | 'devis' | 'signature' | 'installation'
  titre: string
  description?: string
  date: string
  auteurId: string
}

export interface DossierAide {
  statut: 'a_constituer' | 'en_cours' | 'depose' | 'valide' | 'verse'
  montant?: number
  dateDepot?: string
  dateVersement?: string
}

export interface Commission {
  montantSociete?: number
  montantCommercial?: number
  montantApporteur?: number
  commissionPayee?: number
}

export interface Opportunite {
  id: string
  reference: string
  contactId: string
  produitId: string
  etape: EtapePipeline
  montantDevis?: number
  montantAidesMPR?: number
  montantAidesCEE?: number
  montantNet?: number
  installateurId?: string
  commercialId: string
  apporteurId?: string
  regieId?: string
  commission?: Commission
  commissionPayee?: number

  dateCreation: string
  dateRdv?: string
  dateDevis?: string
  dateSignature?: string
  dateInstallation?: string

  dossierMPR?: DossierAide
  dossierCEE?: DossierAide

  activites: Activite[]
  notes?: string
  updatedAt: string
}