import { useState, useEffect } from 'react'
import { Shield, Users, Check, X, Edit2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUtilisateursStore } from '@/store/utilisateursStore'
import { formatDate, getInitiales } from '@/utils/formatters'
import { PERMISSIONS, type Permission } from '@/utils/permissions'
import type { User, UserRole } from '@/types/user'
import clsx from 'clsx'

const ROLE_COLORS: Record<UserRole, string> = {
  admin:      'bg-red-100 text-red-700',
  dirigeant:  'bg-purple-100 text-purple-700',
  commercial: 'bg-blue-100 text-blue-700',
  apporteur:  'bg-amber-100 text-amber-700',
  regie:      'bg-green-100 text-green-700',
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin:      'Administrateur',
  dirigeant:  'Dirigeant',
  commercial: 'Commercial',
  apporteur:  "Apporteur d'affaires",
  regie:      'Régie Commerciale',
}

const PERMISSION_GROUPS = [
  { label: 'Contacts',      keys: ['contacts.view_all', 'contacts.view_own', 'contacts.create', 'contacts.edit', 'contacts.delete'] },
  { label: 'Opportunités',  keys: ['opportunites.view_all', 'opportunites.view_own', 'opportunites.create', 'opportunites.edit'] },
  { label: 'Produits',      keys: ['produits.view', 'produits.edit', 'produits.view_prix'] },
  { label: 'Installateurs', keys: ['installateurs.view', 'installateurs.edit'] },
  { label: 'Devis',         keys: ['devis.view_all', 'devis.view_own', 'devis.create'] },
  { label: 'Rapports',      keys: ['rapports.view_global', 'rapports.view_own'] },
  { label: 'Admin',         keys: ['utilisateurs.view', 'utilisateurs.edit', 'dashboard.kpi_global'] },
] as const

const ROLES: UserRole[] = ['admin', 'dirigeant', 'commercial', 'apporteur', 'regie']

export default function Utilisateurs() {
  const { user: currentUser, can } = useAuth()
  const { utilisateurs, isLoading, fetchUtilisateurs } = useUtilisateursStore()
  const [selected, setSelected] = useState<User | null>(null)
  const [onglet,   setOnglet]   = useState<'liste' | 'permissions'>('liste')

  useEffect(() => { fetchUtilisateurs() }, [])

  if (!can('utilisateurs.view')) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-12 text-center">
        <Shield size={32} className="text-surface-300 mx-auto mb-3" />
        <p className="text-surface-500 font-semibold">Accès réservé aux administrateurs</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Onglets */}
      <div className="flex gap-2">
        {(['liste', 'permissions'] as const).map(o => (
          <button key={o} onClick={() => setOnglet(o)}
            className={clsx('px-4 py-2 rounded-lg text-xs font-semibold transition-colors',
              onglet === o ? 'bg-brand-600 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50')}>
            {o === 'liste'
              ? isLoading ? 'Utilisateurs…' : `Utilisateurs (${utilisateurs.length})`
              : 'Matrice des permissions'}
          </button>
        ))}
      </div>

      {/* Liste */}
      {onglet === 'liste' && (
        <div className="grid grid-cols-[1fr_400px] gap-5">
          <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-xs text-surface-400">Chargement…</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-100 bg-surface-50">
                    {['Utilisateur', 'Rôle', 'Email', 'Statut', 'Créé le', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50">
                  {utilisateurs.map(u => (
                    <tr key={u.id} onClick={() => setSelected(u)}
                      className={clsx('cursor-pointer transition-colors',
                        selected?.id === u.id ? 'bg-brand-50' : 'hover:bg-surface-50')}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                            {getInitiales(u.prenom, u.nom)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-surface-800">{u.prenom} {u.nom}</p>
                            {u.id === currentUser?.id && (
                              <span className="text-[9px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-full font-bold">Vous</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={clsx('text-[10px] px-2 py-1 rounded-full font-bold', ROLE_COLORS[u.role])}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-surface-600">{u.email}</td>
                      <td className="px-4 py-3.5">
                        <span className={clsx('flex items-center gap-1 text-[10px] font-bold',
                          u.actif ? 'text-green-600' : 'text-surface-400')}>
                          {u.actif ? <Check size={11} /> : <X size={11} />}
                          {u.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-surface-400">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3.5">
                        {can('utilisateurs.edit') && u.id !== currentUser?.id && (
                          <button
                            className="text-[10px] px-2 py-1 rounded-lg bg-surface-100 hover:bg-brand-100 text-surface-600 hover:text-brand-600 transition-colors font-medium">
                            Voir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Détail */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <Users size={32} className="text-surface-200 mb-3" />
                <p className="text-surface-400 text-sm">Sélectionnez un utilisateur</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-lg">
                    {getInitiales(selected.prenom, selected.nom)}
                  </div>
                  <div>
                    <p className="font-display font-bold text-surface-800">{selected.prenom} {selected.nom}</p>
                    <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-bold', ROLE_COLORS[selected.role])}>
                      {ROLE_LABELS[selected.role]}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-surface-600">
                  <p><span className="text-surface-400">Email :</span> {selected.email}</p>
                  {selected.telephone && <p><span className="text-surface-400">Tél :</span> {selected.telephone}</p>}
                  <p><span className="text-surface-400">Créé le :</span> {formatDate(selected.createdAt)}</p>
                </div>
                <div className="pt-3 border-t border-surface-100">
                  <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-2">Permissions du rôle</p>
                  <div className="space-y-1">
                    {Object.entries(PERMISSIONS).filter(([, roles]) =>
                      (roles as UserRole[]).includes(selected.role)
                    ).slice(0, 12).map(([perm]) => (
                      <div key={perm} className="flex items-center gap-2">
                        <Check size={11} className="text-green-500 flex-shrink-0" />
                        <span className="text-[10px] text-surface-600">{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Matrice des permissions */}
      {onglet === 'permissions' && (
        <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                <th className="text-left px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-wider sticky left-0 bg-surface-50 min-w-48">
                  Permission
                </th>
                {ROLES.map(role => (
                  <th key={role} className="px-3 py-3 text-center">
                    <span className={clsx('text-[10px] px-2 py-1 rounded-full font-bold', ROLE_COLORS[role])}>
                      {ROLE_LABELS[role].split(' ')[0]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {PERMISSION_GROUPS.map(group => (
                <>
                  <tr key={group.label} className="bg-surface-50">
                    <td colSpan={6} className="px-4 py-2 text-[10px] font-bold text-surface-600 uppercase tracking-wider">
                      {group.label}
                    </td>
                  </tr>
                  {group.keys.map(perm => (
                    <tr key={perm} className="hover:bg-surface-50">
                      <td className="px-4 py-2.5 text-[10px] text-surface-600 font-mono sticky left-0 bg-white">
                        {perm}
                      </td>
                      {ROLES.map(role => {
                        const has = (PERMISSIONS[perm as Permission] as UserRole[]).includes(role)
                        return (
                          <td key={role} className="px-3 py-2.5 text-center">
                            {has
                              ? <Check size={14} className="text-green-500 mx-auto" />
                              : <X size={14} className="text-surface-200 mx-auto" />}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}