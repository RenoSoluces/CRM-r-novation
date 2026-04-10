export type TypeContact = 'particulier' | 'professionnel'
export type StatutContact = 'prospect' | 'client' | 'perdu' | 'inactif'
export type TrancheMPR = 'tres_modeste' | 'modeste' | 'intermediaire' | 'superieure'

export interface Adresse {
  rue: string
  codePostal: string
  ville: string
  departement?: string
}

export interface Contact {
  id: string
  type: TypeContact
  civilite?: 'M.' | 'Mme' | 'M. et Mme'
  nom: string
  prenom: string
  email: string
  telephone: string
  telephoneSecondaire?: string
  adresse: Adresse
  statut: StatutContact

  // Infos logement
  typeLogement?: 'maison' | 'appartement' | 'local_commercial'
  anneeConstruction?: number
  surfaceHabitable?: number
  typeChaufface?: string

  // Infos financières pour calcul aides
  revenuFiscal?: number
  nombrePersonnes?: number
  trancheMPR?: TrancheMPR

  // Rattachement
  commercialId: string
  apporteurId?: string
  regieId?: string

  source?: string
  notes?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}