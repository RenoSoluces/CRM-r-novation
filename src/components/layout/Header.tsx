import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Plus, X, Check, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationsStore } from '@/store/notificationsStore'
import { useContactsStore } from '@/store/contactsStore'
import { useOpportunitesStore } from '@/store/opportunitesStore'
import { formatRelative } from '@/utils/formatters'
import clsx from 'clsx'

const NOTIF_ICONS: Record<string, string> = {
  rappel_rdv:         '📅',
  relance_prospect:   '🔔',
  suivi_dossier_mpr:  '📋',
  suivi_dossier_cee:  '💶',
  devis_en_attente:   '📄',
  installation_proche:'🔧',
  nouveau_lead:       '⭐',
  info:               'ℹ️',
}

export default function Header({ title }: { title: string }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { getNonLues, getParDestinataire, marquerLue, marquerToutesLues } =
    useNotificationsStore()
  const { contacts } = useContactsStore()
  const { opportunites } = useOpportunitesStore()

  const [query, setQuery]           = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)

  const notifRef  = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const nonLues     = user ? getNonLues(user.id) : []
  const toutesNotifs = user ? getParDestinataire(user.id) : []

  // Ferme les panneaux au clic extérieur
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current  && !notifRef.current.contains(e.target as Node))  setShowNotifs(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Résultats de recherche live
  const results =
    query.length >= 2
      ? [
          ...contacts
            .filter((c) =>
              `${c.prenom} ${c.nom} ${c.email} ${c.telephone}`
                .toLowerCase()
                .includes(query.toLowerCase())
            )
            .slice(0, 4)
            .map((c) => ({
              id: c.id,
              tag: 'Contact',
              label: `${c.prenom} ${c.nom}`,
              sub: c.email,
              to: `/contacts/${c.id}`,
            })),
          ...opportunites
            .filter((o) =>
              o.reference.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 3)
            .map((o) => ({
              id: o.id,
              tag: 'Opportunité',
              label: o.reference,
              sub: o.etape,
              to: `/opportunites/${o.id}`,
            })),
        ]
      : []

  return (
    <header className="h-14 bg-white border-b border-surface-200 flex items-center justify-between px-6 flex-shrink-0">

      {/* Titre */}
      <h1 className="font-display font-semibold text-surface-800 text-lg">
        {title}
      </h1>

      {/* Actions */}
      <div className="flex items-center gap-3">

        {/* Barre de recherche */}
        <div ref={searchRef} className="relative">
          <div
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all',
              showSearch || query
                ? 'w-72 border-brand-400 bg-white shadow-sm'
                : 'w-56 border-surface-200 bg-surface-50 hover:border-surface-300'
            )}
          >
            <Search size={14} className="text-surface-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Rechercher un contact, devis…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSearch(true) }}
              onFocus={() => setShowSearch(true)}
              className="bg-transparent text-xs text-surface-700 placeholder-surface-400 outline-none w-full"
            />
            {query && (
              <button onClick={() => { setQuery(''); setShowSearch(false) }}>
                <X size={12} className="text-surface-400 hover:text-surface-600" />
              </button>
            )}
          </div>

          {/* Résultats */}
          {showSearch && results.length > 0 && (
            <div className="absolute top-full mt-1 right-0 w-80 bg-white rounded-xl border border-surface-200 shadow-card-hover z-50 overflow-hidden">
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    navigate(r.to)
                    setQuery('')
                    setShowSearch(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-50 transition-colors text-left"
                >
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide bg-brand-100 text-brand-700 flex-shrink-0">
                    {r.tag}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-surface-800 truncate">
                      {r.label}
                    </p>
                    <p className="text-[10px] text-surface-500 truncate">{r.sub}</p>
                  </div>
                  <ChevronRight size={12} className="text-surface-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cloche notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="relative p-2 rounded-lg hover:bg-surface-100 transition-colors"
          >
            <Bell size={16} className="text-surface-600" />
            {nonLues.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                {nonLues.length}
              </span>
            )}
          </button>

          {/* Panneau notifications */}
          {showNotifs && (
            <div className="absolute top-full mt-1 right-0 w-96 bg-white rounded-xl border border-surface-200 shadow-card-hover z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
                <p className="font-display font-semibold text-sm text-surface-800">
                  Notifications{' '}
                  {nonLues.length > 0 && (
                    <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                      {nonLues.length}
                    </span>
                  )}
                </p>
                {nonLues.length > 0 && (
                  <button
                    onClick={() => user && marquerToutesLues(user.id)}
                    className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
                  >
                    <Check size={11} /> Tout lire
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-surface-50">
                {toutesNotifs.length === 0 ? (
                  <p className="text-center text-surface-400 text-xs py-8">
                    Aucune notification
                  </p>
                ) : (
                  toutesNotifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => marquerLue(n.id)}
                      className={clsx(
                        'w-full flex gap-3 px-4 py-3 text-left hover:bg-surface-50 transition-colors',
                        !n.lue && 'bg-brand-50'
                      )}
                    >
                      <span className="text-base flex-shrink-0 mt-0.5">
                        {NOTIF_ICONS[n.type] ?? 'ℹ️'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={clsx(
                            'text-xs font-medium truncate',
                            n.lue ? 'text-surface-500' : 'text-surface-800'
                          )}
                        >
                          {n.titre}
                        </p>
                        <p className="text-[10px] text-surface-400 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-surface-400 mt-1">
                          {formatRelative(n.createdAt)}
                        </p>
                      </div>
                      {!n.lue && (
                        <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bouton nouveau contact */}
        <button
          onClick={() => navigate('/contacts/nouveau')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
        >
          <Plus size={14} />
          Nouveau contact
        </button>
      </div>
    </header>
  )
} 