export type CategorieProduit = 'particulier' | 'professionnel'

export type FamilleProduit =
  | 'pac_air_eau'
  | 'pac_air_air'
  | 'ballon_thermodynamique'
  | 'systeme_solaire_combine'
  | 'isolation_exterieure'
  | 'isolation_combles'
  | 'photovoltaique'
  | 'renovation_ampleur'
  | 'cee_professionnel'
  | 'visite_technique'  // ← ajout

export interface PrixPartenaire {
  installateurId: string
  prix: number
}

export interface AideMPR {
  tranche: 'tres_modeste' | 'modeste' | 'intermediaire' | 'superieure'
  label: string
  couleur: string
  montantMin: number
  montantMax: number
  tauxMin: number
  tauxMax: number
}

export interface AideCEE {
  code: string
  label: string
  montantIndicatif: number
  unite: '€' | '€/m²' | '€/kWc' | '€/kWh'
  conditions?: string
}

export interface Caracteristique {
  label: string
  valeur: string
}

export interface Produit {
  id: string
  categorie: CategorieProduit
  famille: FamilleProduit
  nom: string
  description: string
  caracteristiques: Caracteristique[]
  prixMoyenVente: number
  prixMin: number
  prixMax: number
  prixParPartenaire?: PrixPartenaire[]  // ← ajout
  aidesMPR: AideMPR[]
  aidesCEE: AideCEE[]
  installateurIds: string[]
  fichesCEE?: string[]
  actif: boolean
  createdAt: string
  updatedAt: string
}