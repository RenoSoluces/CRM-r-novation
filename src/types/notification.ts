export type TypeNotification =
  | 'rappel_rdv'
  | 'relance_prospect'
  | 'suivi_dossier_mpr'
  | 'suivi_dossier_cee'
  | 'devis_en_attente'
  | 'installation_proche'
  | 'nouveau_lead'
  | 'info'

export interface Notification {
  id: string
  type: TypeNotification
  titre: string
  message: string
  lienId?: string
  lienType?: 'opportunite' | 'contact'
  destinataireId: string
  lue: boolean
  dateEcheance?: string
  createdAt: string
}