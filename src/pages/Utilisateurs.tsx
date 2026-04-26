import { useState, useEffect } from 'react'
import { Shield, Users, Check, X, Edit2, UserPlus, Eye, EyeOff } from 'lucide-react'
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

const EMPTY_APPORTEUR_FORM = {
  prenom: '', nom: '', email: '', telephone: '', password: '', confirmPassword: '',
}

export default function Utilisateurs() {
  const { user: currentUser, can } = useAuth()
  const { utilisateurs, isLoading, fetchUtilisateurs, createApporteur } = useUtilisateursStore()

  const [selected,       setSelected]       = useState<User | null>(null)
  const [onglet,         setOnglet]         = useState<'liste' | 'permissions'>('liste')
  const [showModal,      setShowModal]      = useState(false)
  const [showPassword,   setShowPassword]   = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [saveResult,     setSaveResult]     = useState<{ success: boolean; message: string } | null>(null)
  const [form,           setForm]           = useState(EMPTY_APPORTEUR_FORM)

  useEffect(() => { fetchUtilisateurs() }, [])

  if (!can('utilisateurs.view')) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-12 text-center">
        <Shield size={32} className="text-surface-300 mx-auto mb-3" />
        <p className="text-surface-500 font-semibold">Accès réservé aux administrateurs</p>
      </div>
    )
  }

  async function handleCreateApporteur() {
    if (!form.prenom || !form.nom || !form.email || !form.password) return
    if (form.password !== form.confirmPassword) {
      setSaveResult({ success: false, message: 'Les mots de passe ne correspondent pas.' })
      return
    }
    if (form.password.length < 8) {
      setSaveResult({ success: false, message: 'Le mot de passe doit faire au moins 8 caractères.' })
      return
    }
    setSaving(true)
    setSaveResult(null)
    const result = await createApporteur({
      prenom: form.prenom, nom: form.nom,
      email: form.email, telephone: form.telephone || undefined,
      password: form.password,
    })
    setSaving(false)
    if (result.success) {
      setSaveResult({ success: true, message: 'Compte apporteur créé avec succès !' })
      setForm(EMPTY_APPORTEUR_FORM)
      setTimeout(() => { setShowModal(false); setSaveResult(null) }, 1500)
    } else {
      setSaveResult({ success: false, message: result.error ?? 'Erreur lors de la création.' })
    }
  }

  return (
    <div className="space-y-5">

      {/* Onglets + bouton créer apporteur */}
      <div className="flex items-center justify-between">
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
        {can('utilisateurs.edit') && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors">
            <UserPlus size={13} /> Créer un compte apporteur
          </button>
        )}
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
                          <button className="text-[10px] px-2 py-1 rounded-lg bg-surface-100 hover:bg-brand-100 text-surface-600 hover:text-brand-600 transition-colors font-medium">
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

          {/* Détail utilisateur */}
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

      {/* Matrice permissions */}
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
                      <td className="px-4 py-2.5 text-[10px] text-surface-600 font-mono sticky left-0 bg-white">{perm}</td>
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

      {/* ── Modal création compte apporteur ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-surface-100">
              <div>
                <h3 className="font-display font-bold text-surface-800">Créer un compte apporteur</h3>
                <p className="text-xs text-surface-400 mt-0.5">L'apporteur recevra ses identifiants de connexion.</p>
              </div>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_APPORTEUR_FORM); setSaveResult(null) }}
                className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prénom *">
                  <input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                    placeholder="Jean" className={inputClass} />
                </Field>
                <Field label="Nom *">
                  <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                    placeholder="Dupont" className={inputClass} />
                </Field>
              </div>
              <Field label="Email *">
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="jean.dupont@email.com" className={inputClass} />
              </Field>
              <Field label="Téléphone">
                <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                  placeholder="06.00.00.00.00" className={inputClass} />
              </Field>
              <Field label="Mot de passe *">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 8 caractères"
                    className={clsx(inputClass, 'pr-10')}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>
              <Field label="Confirmer le mot de passe *">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Répétez le mot de passe"
                  className={inputClass}
                />
              </Field>

              {saveResult && (
                <div className={clsx('p-3 rounded-lg text-xs font-medium',
                  saveResult.success ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100')}>
                  {saveResult.message}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-5 border-t border-surface-100">
              <button onClick={() => { setShowModal(false); setForm(EMPTY_APPORTEUR_FORM); setSaveResult(null) }}
                className="flex-1 py-2.5 rounded-lg border border-surface-200 text-xs font-semibold text-surface-600 hover:bg-surface-50 transition-colors">
                Annuler
              </button>
              <button
                onClick={handleCreateApporteur}
                disabled={saving || !form.prenom || !form.nom || !form.email || !form.password || !form.confirmPassword}
                className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
                {saving ? 'Création…' : 'Créer le compte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-surface-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputClass = "w-full px-3.5 py-2.5 rounded-lg border border-surface-200 text-xs text-surface-800 placeholder-surface-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"