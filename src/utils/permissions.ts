import type { UserRole } from '@/types/user'

export const PERMISSIONS = {
  // Contacts
  'contacts.view_all':          ['admin', 'dirigeant'] as UserRole[],
  'contacts.view_own':          ['admin', 'dirigeant', 'commercial', 'apporteur', 'regie'] as UserRole[],
  'contacts.create':            ['admin', 'dirigeant', 'commercial', 'apporteur', 'regie'] as UserRole[],
  'contacts.edit':              ['admin', 'dirigeant', 'commercial'] as UserRole[],
  'contacts.delete':            ['admin'] as UserRole[],

  // Opportunités
  'opportunites.view_all':      ['admin', 'dirigeant'] as UserRole[],
  'opportunites.view_own':      ['admin', 'dirigeant', 'commercial', 'apporteur', 'regie'] as UserRole[],
  'opportunites.create':        ['admin', 'dirigeant', 'commercial'] as UserRole[],
  'opportunites.edit':          ['admin', 'dirigeant', 'commercial'] as UserRole[],
  'opportunites.delete':        ['admin'] as UserRole[],

  // Produits
  'produits.view':              ['admin', 'dirigeant', 'commercial', 'apporteur', 'regie'] as UserRole[],
  'produits.edit':              ['admin', 'dirigeant'] as UserRole[],
  'produits.view_prix':         ['admin', 'dirigeant', 'commercial'] as UserRole[],

  // Installateurs
  'installateurs.view':         ['admin', 'dirigeant', 'commercial'] as UserRole[],
  'installateurs.edit':         ['admin', 'dirigeant'] as UserRole[],

  // Devis
  'devis.view_all':             ['admin', 'dirigeant'] as UserRole[],
  'devis.view_own':             ['admin', 'dirigeant', 'commercial'] as UserRole[],
  'devis.create':               ['admin', 'dirigeant', 'commercial'] as UserRole[],
  'devis.edit':                 ['admin', 'dirigeant', 'commercial'] as UserRole[],

  // Rapports
  'rapports.view_global':       ['admin', 'dirigeant'] as UserRole[],
  'rapports.view_own':          ['admin', 'dirigeant', 'commercial', 'regie'] as UserRole[],

  // Utilisateurs
  'utilisateurs.view':          ['admin', 'dirigeant'] as UserRole[],
  'utilisateurs.edit':          ['admin'] as UserRole[],

  // Dashboard
  'dashboard.kpi_global':       ['admin', 'dirigeant'] as UserRole[],
  'dashboard.kpi_own':          ['admin', 'dirigeant', 'commercial', 'apporteur', 'regie'] as UserRole[],
} as const

export type Permission = keyof typeof PERMISSIONS

export function hasPermission(role: UserRole | null, permission: Permission): boolean {
  if (!role) return false
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(role)
}

export function canViewContact(
  role: UserRole,
  contactCommercialId: string,
  contactApporteurId: string | undefined,
  currentUserId: string
): boolean {
  if (hasPermission(role, 'contacts.view_all')) return true
  if (role === 'commercial') return contactCommercialId === currentUserId
  if (role === 'apporteur') return contactApporteurId === currentUserId
  return false
}

export function canViewOpportunite(
  role: UserRole,
  oppCommercialId: string,
  oppApporteurId: string | undefined,
  currentUserId: string
): boolean {
  if (hasPermission(role, 'opportunites.view_all')) return true
  if (role === 'commercial') return oppCommercialId === currentUserId
  if (role === 'apporteur') return oppApporteurId === currentUserId
  return false
}