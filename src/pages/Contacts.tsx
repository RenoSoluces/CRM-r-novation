import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users, Building2, Phone, Mail, MapPin, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useContactsStore } from '@/store/contactsStore'
import { formatDate } from '@/utils/formatters'
import Badge, { STATUT_CONTACT_COLORS, STATUT_CONTACT_LABELS } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import type { StatutContact, TypeContact } from '@/types/contact'
import clsx from 'clsx'

const TRANCHE_COLORS: Record<string, string> = {
  tres_modeste: '#3b82f6', modeste: '#10b981',
  intermediaire: '#f59e0b', superieure: '#ef4444',
}
const TRANCHE_LABELS: Record<string, string> = {
  tres_modeste: 'Très modeste', modeste: 'Modeste',
  intermediaire: 'Intermédiaire', superieure: 'Supérieure',
}

export default function Contacts() {
  const { user, can } = useAuth()
  const navigate = useNavigate()
  const { contacts } = useContactsStore()

  const [search,       setSearch]       = useState('')
  const [filtreStatut, setFiltreStatut] = useState<StatutContact | 'tous'>('tous')
  const [filtreType,   setFiltreType]   = useState<TypeContact | 'tous'>('tous')

  const mesContacts = useMemo(() => {
    if (can('contacts.view_all')) return contacts
    if (user?.role === 'apporteur') return contacts.filter(c => c.apporteurId === user.id)
    return contacts.filter(c => c.commercialId === user?.id)
  }, [contacts, user, can])

  const filtered = useMemo(() => mesContacts.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      `${c.prenom} ${c.nom} ${c.email} ${c.telephone} ${c.adresse.ville}`.toLowerCase().includes(q)
    const matchStatut = filtreStatut === 'tous' || c.statut === filtreStatut
    const matchType   = filtreType   === 'tous' || c.type   === filtreType
    return matchSearch && matchStatut && matchType
  }), [mesContacts, search, filtreStatut, filtreType])

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total contacts', value: mesContacts.length,                                          color: 'blue',   icon: <Users size={18} /> },
          { label: 'Prospects',      value: mesContacts.filter(c => c.statut === 'prospect').length,     color: 'orange', icon: <Search size={18} /> },
          { label: 'Clients',        value: mesContacts.filter(c => c.statut === 'client').length,       color: 'green',  icon: <Building2 size={18} /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-surface-200 shadow-card p-4 flex items-center gap-4">
            <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', {
              'bg-blue-50 text-blue-600': s.color === 'blue',
              'bg-orange-50 text-orange-500': s.color === 'orange',
              'bg-green-50 text-green-600': s.color === 'green',
            })}>{s.icon}</div>
            <div>
              <p className="font-display font-bold text-2xl text-surface-900">{s.value}</p>
              <p className="text-xs text-surface-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-card p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-200 bg-surface-50 flex-1 min-w-48">
          <Search size={14} className="text-surface-400" />
          <input type="text" placeholder="Rechercher par nom, email, ville…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-xs text-surface-700 placeholder-surface-400 outline-none w-full" />
        </div>
        <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value as StatutContact | 'tous')}
          className="px-3 py-2 rounded-lg border border-surface-200 text-xs text-surface-700 bg-white outline-none cursor-pointer">
          <option value="tous">Tous les statuts</option>
          <option value="prospect">Prospects</option>
          <option value="client">Clients</option>
          <option value="perdu">Perdus</option>
          <option value="inactif">Inactifs</option>
        </select>
        <select value={filtreType} onChange={e => setFiltreType(e.target.value as TypeContact | 'tous')}
          className="px-3 py-2 rounded-lg border border-surface-200 text-xs text-surface-700 bg-white outline-none cursor-pointer">
          <option value="tous">Tous les types</option>
          <option value="particulier">Particuliers</option>
          <option value="professionnel">Professionnels</option>
        </select>
        {can('contacts.create') && (
          <button onClick={() => navigate('/contacts/nouveau')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm ml-auto">
            <Plus size={14} /> Nouveau contact
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="Aucun contact trouvé"
            description="Modifiez vos filtres ou créez un nouveau contact." />
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  {['Contact', 'Coordonnées', 'Localisation', 'Tranche MPR', 'Statut', 'Créé le', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-wider first:pl-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {filtered.map(c => (
                  <tr key={c.id} onClick={() => navigate(`/contacts/${c.id}`)}
                    className="hover:bg-surface-50 cursor-pointer transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={clsx('w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0',
                          c.type === 'professionnel' ? 'bg-surface-600' : 'bg-brand-600')}>
                          {c.type === 'professionnel' ? <Building2 size={14} /> : `${c.prenom.charAt(0)}${c.nom.charAt(0)}`}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-surface-800">
                            {c.civilite && <span className="text-surface-400 mr-1">{c.civilite}</span>}
                            {c.prenom} {c.nom}
                          </p>
                          <p className="text-[10px] text-surface-400">{c.source ?? (c.type === 'particulier' ? 'Particulier' : 'Professionnel')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 space-y-0.5">
                      <p className="text-xs text-surface-600 flex items-center gap-1"><Phone size={10} className="text-surface-400" />{c.telephone}</p>
                      <p className="text-xs text-surface-500 flex items-center gap-1 truncate max-w-[160px]"><Mail size={10} className="text-surface-400" />{c.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-surface-600 flex items-center gap-1">
                        <MapPin size={10} className="text-surface-400" />{c.adresse.ville} ({c.adresse.codePostal.slice(0, 2)})
                      </p>
                      {c.surfaceHabitable && <p className="text-[10px] text-surface-400 mt-0.5">{c.surfaceHabitable} m²</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      {c.trancheMPR
                        ? <Badge label={TRANCHE_LABELS[c.trancheMPR]} color={TRANCHE_COLORS[c.trancheMPR]} />
                        : <span className="text-surface-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge label={STATUT_CONTACT_LABELS[c.statut]} color={STATUT_CONTACT_COLORS[c.statut]} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-surface-400">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3.5"><ChevronRight size={14} className="text-surface-300" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-surface-100 bg-surface-50">
              <p className="text-xs text-surface-500">
                {filtered.length} contact{filtered.length > 1 ? 's' : ''}{filtered.length !== mesContacts.length ? ` sur ${mesContacts.length}` : ''}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}