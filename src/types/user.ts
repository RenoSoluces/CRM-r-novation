export type UserRole = 'admin' | 'dirigeant' | 'commercial' | 'apporteur' | 'regie'

export interface User {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  role: UserRole
  regieId?: string
  apporteurId?: string
  actif: boolean
  createdAt: string
}