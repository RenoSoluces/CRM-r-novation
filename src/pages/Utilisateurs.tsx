import { useState, useEffect } from 'react'
import { Shield, Users, Check, X, UserPlus, Eye, EyeOff, History } from 'lucide-react'
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

const EMPTY_ANCIEN_FORM = {
  prenom: '', nom: '', telephone: '', notes: '',
}

export default function Utilisateurs() {
  const { user: currentUser, can } = useAuth()
  const { utilisateurs, isLoading, fetchUtilisateurs, createApporteur, createAncienCommercial } = useUtilisateursStore()

  const [selected,          setSelected]          = useState<User | null>(null)
  const [onglet,            setOnglet]            = useState<'liste' | 'permissions'>('liste')
  const [showApporteur,     setShowApporteur]     = useState(false)
  const [showAncien,        setShowAncien]        = useState(false)
  const [showPassword,      setShowPassword]      = useState(false)
  const [savingApporteur,   setSavingApporteur]   = useState(false)
  const [savingAncien,      setSavingAncien]      = useState(false)
  const [resultApporteur,   setResultApporteur]   = useState<{ success: boolean; message: string } | null>(null)
  const [resultAncien,      setResultAncien]      = useState<{ success: boolean; message: string } | null>(null)
  const [formApporteur,     setFormApporteur]     = useState(EMPTY_APPORTEUR_FORM)
  const [formAncien,        setFormAncien]        = useState(EMPTY_ANCIEN_FORM)

  useEffect(() => { fetchUtilisateurs() }, [])

  if (!can('utilisateurs.view')) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-12 text-center">
        <Shield size={32} className="text-surface-300 mx-auto mb-3" />
        <p className="text-surface-500 font-semibold">Accès réservé aux administrateurs</p>
      </div>
    )
  }

  /* ── Séparer actifs / inactifs ── */
  const utilisateursActifs   = utilisateurs.filter(u => u.actif)
  const utilisateursInactifs = utilisateurs.filter(u => !u.actif)

  async function handleCreateApporteur() {
    if (!formApporteur.prenom || !formApporteur.nom || !formApporteur.email || !formApporteur.password) return
    if (formApporteur.password !== formApporteur.confirmPassword) {
      setResultApporteur({ success: false, message: 'Les mots de passe ne correspondent pas.' })
      return
    }
    if (formApporteur.password.length < 8) {
      setResultApporteur({ success: false, message: 'Le mot de passe doit faire au moins 8 caractères.' })
      return
    }
    setSavingApporteur(true)
    setResultApporteur(null)
    const result = await createApporteur({
      prenom: formApporteur.prenom, nom: formApporteur.nom,
      email: formApporteur.email, telephone: formApporteur.telephone || undefined,
      password: formApporteur.password,
    })
    setSavingApporteur(false)
    if (result.success) {
      setResultApporteur({ success: true, message: 'Compte apporteur créé !' })
      setFormApporteur(EMPTY_APPORTEUR_FORM)
      setTimeout(() => { setShowApporteur(false); setResultApporteur(null) }, 1500)
    } else {
      setResultApporteur({ success: false, message: result.error ?? 'Erreur lors de la création.' })
    }
  }

  async function handleCreateAncien() {
    if (!formAncien.prenom || !formAncien.nom) return
    setSavingAncien(true)
    setResultAncien(null)
    const result = await createAncienCommercial({
      prenom: formAncien.prenom, nom: formAncien.nom,
      telephone: formAncien.telephone || undefined,
      notes: formAncien.notes || undefined,
    })
    setSavingAncien(false)
    if (result.success) {
      setResultAncien({ success: true, message: 'Ancien commercial ajouté à l\'historique !' })
      setFormAncien(EMPTY_ANCIEN_FORM)
      setTimeout(() => { setShowAncien(false); setResultAncien(null) }, 1500)
    } else {
      setResultAncien({ success: false, message: result.error ?? 'Erreur lors de la création.' })
    }
  }

  return (
    <div className="space-y-5">

      {/* Onglets + boutons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['liste', 'permissions'] as const).map(o => (
            <button key={o} onClick={() => setOnglet(o)}
              className={clsx('px-4 py-2 rounded-lg text-xs font-semibold transition-colors',
                onglet === o ? 'bg-brand-600 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50')}>
              {o === 'liste'
                ? isLoading ? 'Utilisateurs…' : `Utilisateurs (${utilisateursActifs.length})`
                : 'Matrice des permissions'}
            </button>
          ))}
        </div>
        {can('utilisateurs.edit') && (
          <div className="flex gap-2">
            <button onClick={() => setShowAncien(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-surface-600 hover:bg-surface-700 text-white rounded-lg text-xs font-semibold transition-colors">
              <History size={13} /> Ancien commercial
            </button>
            <button onClick={() => setShowApporteur(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors">
              <UserPlus size={13} /> Créer un compte apporteur
            </button>
          </div>
        )}
      </div>

      {/* Liste */}
      {onglet === 'liste' && (
        <div className="grid grid-cols-[1fr_400px] gap-5">
          <div className="space-y-4">

            {/* Utilisateurs actifs */}
            <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-surface-100 bg-surface-50">
                <p className="text-xs font-bold text-surface-600 uppercase tracking-wider">
                  Actifs ({utilisateursActifs.length})
                </p>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center h-20">
                  <p className="text-xs text-surface-400">Chargement…</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-100">
                      {['Utilisateur', 'Rôle', 'Email', 'Créé le', ''].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-50">
                    {utilisateursActifs.map(u => (
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
                        <td className="px-4 py-3.5 text-xs text-surface-600">{u.email ?? '—'}</td>
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

            {/* Anciens commerciaux */}
            {utilisateursInactifs.length > 0 && (
              <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
                <div className="px-4 py-3 border-b border-surface-100 bg-surface-50">
                  <p className="text-xs font-bold text-surface-500 uppercase tracking-wider flex items-center gap-2">
                    <History size={12} /> Anciens commerciaux ({utilisateursInactifs.length})
                  </p>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-100">
                      {['Nom', 'Rôle', 'Téléphone', 'Ajouté le'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-50">
                    {utilisateursInactifs.map(u => (
                      <tr key={u.id} onClick={() => setSelected(u)}
                        className={clsx('cursor-pointer transition-colors opacity-70',
                          selected?.id === u.id ? 'bg-surface-100' : 'hover:bg-surface-50')}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-300 flex items-center justify-center text-white text-xs font-bold">
                              {getInitiales(u.prenom, u.nom)}
                            </div>
                            <p className="text-xs font-semibold text-surface-600">{u.prenom} {u.nom}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={clsx('text-[10px] px-2 py-1 rounded-full font-bold opacity-60', ROLE_COLORS[u.role])}>
                            {ROLE_LABELS[u.role]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-surface-500">{u.telephone ?? '—'}</td>
                        <td className="px-4 py-3.5 text-xs text-surface-400">{formatDate(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                  <div className={clsx('w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg',
                    selected.actif ? 'bg-brand-600' : 'bg-surface-400')}>
                    {getInitiales(selected.prenom, selected.nom)}
                  </div>
                  <div>
                    <p className="font-display font-bold text-surface-800">{selected.prenom} {selected.nom}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-bold', ROLE_COLORS[selected.role])}>
                        {ROLE_LABELS[selected.role]}
                      </span>
                      {!selected.actif && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-surface-100 text-surface-500">
                          Ancien — sans accès
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-surface-600">
                  {selected.email && <p><span className="text-surface-400">Email :</span> {selected.email}</p>}
                  {selected.telephone && <p><span className="text-surface-400">Tél :</span> {selected.telephone}</p>}
                  <p><span className="text-surface-400">Ajouté le :</span> {formatDate(selected.createdAt)}</p>
                </div>
                {selected.actif && (
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
                )}
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
      {showApporteur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-surface-100">
              <div>
                <h3 className="font-display font-bold text-surface-800">Créer un compte apporteur</h3>
                <p className="text-xs text-surface-400 mt-0.5">L'apporteur pourra se connecter au CRM.</p>
              </div>
              <button onClick={() => { setShowApporteur(false); setFormApporteur(EMPTY_APPORTEUR_FORM); setResultApporteur(null) }}
                className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prénom *">
                  <input value={formApporteur.prenom} onChange={e => setFormApporteur(f => ({ ...f, prenom: e.target.value }))}
                    placeholder="Jean" className={inputClass} />
                </Field>
                <Field label="Nom *">
                  <input value={formApporteur.nom} onChange={e => setFormApporteur(f => ({ ...f, nom: e.target.value }))}
                    placeholder="Dupont" className={inputClass} />
                </Field>
              </div>
              <Field label="Email *">
                <input type="email" value={formApporteur.email} onChange={e => setFormApporteur(f => ({ ...f, email: e.target.value }))}
                  placeholder="jean.dupont@email.com" className={inputClass} />
              </Field>
              <Field label="Téléphone">
                <input value={formApporteur.telephone} onChange={e => setFormApporteur(f => ({ ...f, telephone: e.target.value }))}
                  placeholder="06.00.00.00.00" className={inputClass} />
              </Field>
              <Field label="Mot de passe *">
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={formApporteur.password}
                    onChange={e => setFormApporteur(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 8 caractères" className={clsx(inputClass, 'pr-10')} />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>
              <Field label="Confirmer le mot de passe *">
                <input type={showPassword ? 'text' : 'password'} value={formApporteur.confirmPassword}
                  onChange={e => setFormApporteur(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Répétez le mot de passe" className={inputClass} />
              </Field>
              {resultApporteur && (
                <div className={clsx('p-3 rounded-lg text-xs font-medium',
                  resultApporteur.success ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100')}>
                  {resultApporteur.message}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-surface-100">
              <button onClick={() => { setShowApporteur(false); setFormApporteur(EMPTY_APPORTEUR_FORM); setResultApporteur(null) }}
                className="flex-1 py-2.5 rounded-lg border border-surface-200 text-xs font-semibold text-surface-600 hover:bg-surface-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleCreateApporteur}
                disabled={savingApporteur || !formApporteur.prenom || !formApporteur.nom || !formApporteur.email || !formApporteur.password || !formApporteur.confirmPassword}
                className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
                {savingApporteur ? 'Création…' : 'Créer le compte'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal ancien commercial ── */}
      {showAncien && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-surface-100">
              <div>
                <h3 className="font-display font-bold text-surface-800">Ajouter un ancien commercial</h3>
                <p className="text-xs text-surface-400 mt-0.5">Pour l'historique uniquement — sans accès au CRM.</p>
              </div>
              <button onClick={() => { setShowAncien(false); setFormAncien(EMPTY_ANCIEN_FORM); setResultAncien(null) }}
                className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prénom *">
                  <input value={formAncien.prenom} onChange={e => setFormAncien(f => ({ ...f, prenom: e.target.value }))}
                    placeholder="Jean" className={inputClass} />
                </Field>
                <Field label="Nom *">
                  <input value={formAncien.nom} onChange={e => setFormAncien(f => ({ ...f, nom: e.target.value }))}
                    placeholder="Dupont" className={inputClass} />
                </Field>
              </div>
              <Field label="Téléphone">
                <input value={formAncien.telephone} onChange={e => setFormAncien(f => ({ ...f, telephone: e.target.value }))}
                  placeholder="06.00.00.00.00" className={inputClass} />
              </Field>
              <Field label="Notes (optionnel)">
                <textarea value={formAncien.notes} onChange={e => setFormAncien(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ex: période d'activité, secteur…" rows={2}
                  className={clsx(inputClass, 'resize-none')} />
              </Field>
              {resultAncien && (
                <div className={clsx('p-3 rounded-lg text-xs font-medium',
                  resultAncien.success ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100')}>
                  {resultAncien.message}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-surface-100">
              <button onClick={() => { setShowAncien(false); setFormAncien(EMPTY_ANCIEN_FORM); setResultAncien(null) }}
                className="flex-1 py-2.5 rounded-lg border border-surface-200 text-xs font-semibold text-surface-600 hover:bg-surface-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleCreateAncien}
                disabled={savingAncien || !formAncien.prenom || !formAncien.nom}
                className="flex-1 py-2.5 rounded-lg bg-surface-700 hover:bg-surface-800 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
                {savingAncien ? 'Ajout…' : 'Ajouter'}
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