import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, Bell, AlertTriangle, ChevronLeft, ChevronRight, Handshake } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useOpportunitesStore } from '@/store/opportunitesStore'
import { useContactsStore } from '@/store/contactsStore'
import { useNotificationsStore } from '@/store/notificationsStore'
import { formatDate, formatDateLong, formatRelative } from '@/utils/formatters'
import clsx from 'clsx'

const NOTIF_ICONS: Record<string, string> = {
  rappel_rdv: '📅', relance_prospect: '🔔', suivi_dossier_mpr: '📋',
  suivi_dossier_cee: '💶', devis_en_attente: '📄', installation_proche: '🔧',
  nouveau_lead: '⭐', info: 'ℹ️',
}

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

type VueType = 'semaine' | 'mois'

type Evenement = {
  id: string
  oppId: string
  type: 'rdv' | 'installation' | 'relance' | 'paiement_partenaire'
  date: Date
  label: string
  contact?: string
  ville?: string
}

function getDebutSemaine(date: Date): Date {
  const d = new Date(date)
  const jour = d.getDay()
  const diff = (jour === 0 ? -6 : 1 - jour)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

export default function Agenda() {
  const { user, can } = useAuth()
  const navigate      = useNavigate()
  const { opportunites }                   = useOpportunitesStore()
  const { contacts }                       = useContactsStore()
  const { getParDestinataire, marquerLue } = useNotificationsStore()

  const [vue, setVue]           = useState<VueType>('semaine')
  const [dateRef, setDateRef]   = useState(new Date())

  const notifications = user ? getParDestinataire(user.id) : []
  const nonLues       = notifications.filter(n => !n.lue)

  /* ── Filtrer les opps selon le rôle ── */
  const myOpps = useMemo(() => {
    if (can('opportunites.view_all')) return opportunites
    return opportunites.filter(o => o.commercialId === user?.id)
  }, [opportunites, user, can])

  /* ── Construire tous les événements ── */
  const evenements = useMemo(() => {
    const evs: Evenement[] = []
    myOpps.forEach(opp => {
      const contact = contacts.find(c => c.id === opp.contactId)
      const nom     = contact ? `${contact.prenom} ${contact.nom}` : opp.reference
      const ville   = contact?.adresse?.ville

      if (opp.dateRdv) evs.push({
        id: `rdv-${opp.id}`, oppId: opp.id, type: 'rdv',
        date: new Date(opp.dateRdv), label: nom, contact: nom, ville,
      })
      if (opp.dateInstallation) evs.push({
        id: `inst-${opp.id}`, oppId: opp.id, type: 'installation',
        date: new Date(opp.dateInstallation), label: nom, contact: nom, ville,
      })
      if (opp.dateRelance) evs.push({
        id: `rel-${opp.id}`, oppId: opp.id, type: 'relance',
        date: new Date(opp.dateRelance), label: nom, contact: nom, ville,
      })
      if (can('opportunites.view_all') && opp.datePaiementPartenaire) evs.push({
        id: `pay-${opp.id}`, oppId: opp.id, type: 'paiement_partenaire',
        date: new Date(opp.datePaiementPartenaire), label: nom, contact: nom, ville,
      })
    })
    return evs
  }, [myOpps, contacts, can])

  /* ── Navigation ── */
  function prev() {
    const d = new Date(dateRef)
    vue === 'semaine' ? d.setDate(d.getDate() - 7) : d.setMonth(d.getMonth() - 1)
    setDateRef(d)
  }
  function next() {
    const d = new Date(dateRef)
    vue === 'semaine' ? d.setDate(d.getDate() + 7) : d.setMonth(d.getMonth() + 1)
    setDateRef(d)
  }
  function today() { setDateRef(new Date()) }

  /* ── Jours de la semaine affichée ── */
  const joursSemaine = useMemo(() => {
    const debut = getDebutSemaine(dateRef)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(debut)
      d.setDate(debut.getDate() + i)
      return d
    })
  }, [dateRef])

  /* ── Jours du mois affiché ── */
  const joursMois = useMemo(() => {
    const annee = dateRef.getFullYear()
    const mois  = dateRef.getMonth()
    const premier = new Date(annee, mois, 1)
    const dernier = new Date(annee, mois + 1, 0)
    const debutGrid = getDebutSemaine(premier)
    const jours: Date[] = []
    const cur = new Date(debutGrid)
    while (cur <= dernier || jours.length % 7 !== 0) {
      jours.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
      if (jours.length > 42) break
    }
    return jours
  }, [dateRef])

  const TYPE_STYLES = {
    rdv:                 { bg: 'bg-brand-100',  text: 'text-brand-700',  dot: 'bg-brand-500',  label: 'RDV' },
    installation:        { bg: 'bg-teal-100',   text: 'text-teal-700',   dot: 'bg-teal-500',   label: 'Installation' },
    relance:             { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', label: 'Relance' },
    paiement_partenaire: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Paiement partenaire' },
  }

  /* ── Listes latérales ── */
  const now = new Date()

  const rdvAvenir = myOpps
    .filter(o => o.dateRdv && new Date(o.dateRdv) >= now)
    .sort((a, b) => new Date(a.dateRdv!).getTime() - new Date(b.dateRdv!).getTime())
    .slice(0, 8)

  const installationsAvenir = myOpps
    .filter(o => o.dateInstallation && new Date(o.dateInstallation) >= now)
    .sort((a, b) => new Date(a.dateInstallation!).getTime() - new Date(b.dateInstallation!).getTime())
    .slice(0, 5)

  const relancesAVenir = myOpps
    .filter(o => o.dateRelance && new Date(o.dateRelance) >= now)
    .sort((a, b) => new Date(a.dateRelance!).getTime() - new Date(b.dateRelance!).getTime())
    .slice(0, 5)

  const relancesAuto = myOpps
    .filter(o => {
      if (o.etape !== 'devis_envoye' || !o.dateDevis || o.dateRelance) return false
      const diff = now.getTime() - new Date(o.dateDevis).getTime()
      return diff > 7 * 24 * 60 * 60 * 1000
    })
    .slice(0, 5)

  const paiementsPartenaires = can('opportunites.view_all')
    ? myOpps
        .filter(o => o.datePaiementPartenaire && new Date(o.datePaiementPartenaire) >= now)
        .sort((a, b) => new Date(a.datePaiementPartenaire!).getTime() - new Date(b.datePaiementPartenaire!).getTime())
        .slice(0, 5)
    : []

  return (
    <div className="space-y-5">

      {/* ── Calendrier ── */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">

        {/* Header calendrier */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={prev}
              className="w-7 h-7 rounded-lg border border-surface-200 flex items-center justify-center hover:bg-surface-50 transition-colors">
              <ChevronLeft size={14} />
            </button>
            <button onClick={next}
              className="w-7 h-7 rounded-lg border border-surface-200 flex items-center justify-center hover:bg-surface-50 transition-colors">
              <ChevronRight size={14} />
            </button>
            <button onClick={today}
              className="px-3 py-1 rounded-lg border border-surface-200 text-xs font-medium text-surface-600 hover:bg-surface-50 transition-colors">
              Aujourd'hui
            </button>
            <h2 className="font-display font-semibold text-surface-800 text-sm">
              {vue === 'semaine'
                ? `${joursSemaine[0].getDate()} – ${joursSemaine[6].getDate()} ${MOIS[joursSemaine[6].getMonth()]} ${joursSemaine[6].getFullYear()}`
                : `${MOIS[dateRef.getMonth()]} ${dateRef.getFullYear()}`
              }
            </h2>
          </div>

          {/* Légende + switch vue */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {Object.entries(TYPE_STYLES).map(([type, s]) => (
                (!can('opportunites.view_all') && type === 'paiement_partenaire') ? null : (
                  <div key={type} className="flex items-center gap-1">
                    <span className={clsx('w-2 h-2 rounded-full', s.dot)} />
                    <span className="text-[10px] text-surface-500">{s.label}</span>
                  </div>
                )
              ))}
            </div>
            <div className="flex rounded-lg border border-surface-200 overflow-hidden">
              <button
                onClick={() => setVue('semaine')}
                className={clsx('px-3 py-1.5 text-xs font-medium transition-colors',
                  vue === 'semaine' ? 'bg-brand-600 text-white' : 'text-surface-600 hover:bg-surface-50')}
              >
                Semaine
              </button>
              <button
                onClick={() => setVue('mois')}
                className={clsx('px-3 py-1.5 text-xs font-medium transition-colors',
                  vue === 'mois' ? 'bg-brand-600 text-white' : 'text-surface-600 hover:bg-surface-50')}
              >
                Mois
              </button>
            </div>
          </div>
        </div>

        {/* ── Vue Semaine ── */}
        {vue === 'semaine' && (
          <div className="grid grid-cols-7 gap-2">
            {joursSemaine.map((jour, idx) => {
              const isToday    = isSameDay(jour, new Date())
              const evsJour    = evenements.filter(e => isSameDay(e.date, jour))
              return (
                <div key={idx}
                  className={clsx('rounded-xl border p-2 min-h-[120px]',
                    isToday ? 'border-brand-300 bg-brand-50' : 'border-surface-100 bg-surface-50')}
                >
                  <div className="text-center mb-2">
                    <p className="text-[10px] text-surface-400 uppercase tracking-wider">{JOURS[idx]}</p>
                    <p className={clsx('text-sm font-bold',
                      isToday ? 'text-brand-600' : 'text-surface-700')}>
                      {jour.getDate()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {evsJour.map(ev => {
                      const s = TYPE_STYLES[ev.type]
                      return (
                        <button key={ev.id}
                          onClick={() => navigate(`/opportunites/${ev.oppId}`)}
                          className={clsx('w-full text-left px-1.5 py-1 rounded-md text-[10px] font-medium truncate transition-opacity hover:opacity-80', s.bg, s.text)}
                        >
                          {ev.label}
                        </button>
                      )
                    })}
                    {evsJour.length === 0 && (
                      <p className="text-[10px] text-surface-300 text-center mt-4">—</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Vue Mois ── */}
        {vue === 'mois' && (
          <div>
            <div className="grid grid-cols-7 mb-1">
              {JOURS.map(j => (
                <p key={j} className="text-[10px] font-bold text-surface-400 uppercase tracking-wider text-center py-1">
                  {j}
                </p>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {joursMois.map((jour, idx) => {
                const isToday      = isSameDay(jour, new Date())
                const isCurMonth   = jour.getMonth() === dateRef.getMonth()
                const evsJour      = evenements.filter(e => isSameDay(e.date, jour))
                return (
                  <div key={idx}
                    className={clsx('rounded-lg border p-1.5 min-h-[70px]',
                      isToday       ? 'border-brand-300 bg-brand-50'
                      : isCurMonth  ? 'border-surface-100 bg-white'
                      : 'border-surface-50 bg-surface-50 opacity-40')}
                  >
                    <p className={clsx('text-xs font-bold mb-1',
                      isToday ? 'text-brand-600' : 'text-surface-600')}>
                      {jour.getDate()}
                    </p>
                    <div className="space-y-0.5">
                      {evsJour.slice(0, 2).map(ev => {
                        const s = TYPE_STYLES[ev.type]
                        return (
                          <button key={ev.id}
                            onClick={() => navigate(`/opportunites/${ev.oppId}`)}
                            className={clsx('w-full text-left px-1 py-0.5 rounded text-[9px] font-medium truncate', s.bg, s.text)}
                          >
                            {ev.label}
                          </button>
                        )
                      })}
                      {evsJour.length > 2 && (
                        <p className="text-[9px] text-surface-400 pl-1">+{evsJour.length - 2}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Listes ── */}
      <div className={clsx('grid gap-5', can('opportunites.view_all') ? 'grid-cols-4' : 'grid-cols-3')}>

        {/* RDV à venir */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-4">
          <h3 className="font-display font-semibold text-surface-800 text-sm mb-3 flex items-center gap-2">
            <Calendar size={14} className="text-brand-600" /> RDV à venir
          </h3>
          <div className="space-y-2">
            {rdvAvenir.length === 0 ? (
              <p className="text-xs text-surface-400 text-center py-4">Aucun RDV planifié</p>
            ) : rdvAvenir.map(opp => {
              const contact = contacts.find(c => c.id === opp.contactId)
              const isToday = opp.dateRdv && isSameDay(new Date(opp.dateRdv), new Date())
              const isTomorrow = opp.dateRdv && isSameDay(new Date(opp.dateRdv), new Date(Date.now() + 86400000))
              return (
                <button key={opp.id} onClick={() => navigate(`/opportunites/${opp.id}`)}
                  className={clsx('w-full text-left p-2.5 rounded-xl border transition-all hover:shadow-sm',
                    isToday ? 'border-brand-300 bg-brand-50' : 'border-surface-200 hover:border-surface-300')}>
                  <p className="text-xs font-semibold text-surface-800 truncate">
                    {contact ? `${contact.prenom} ${contact.nom}` : opp.reference}
                  </p>
                  <p className={clsx('text-[10px] font-bold mt-0.5',
                    isToday ? 'text-brand-600' : isTomorrow ? 'text-orange-500' : 'text-surface-500')}>
                    {isToday ? "Aujourd'hui" : isTomorrow ? 'Demain' : formatDate(opp.dateRdv)}
                  </p>
                  {contact?.adresse && (
                    <p className="text-[10px] text-surface-400 mt-0.5 flex items-center gap-1">
                      <MapPin size={9} />{contact.adresse.ville}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Relances */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-4">
          <h3 className="font-display font-semibold text-surface-800 text-sm mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-orange-500" /> Relances
          </h3>
          <div className="space-y-2">
            {/* Relances planifiées */}
            {relancesAVenir.map(opp => {
              const contact = contacts.find(c => c.id === opp.contactId)
              return (
                <button key={opp.id} onClick={() => navigate(`/opportunites/${opp.id}`)}
                  className="w-full text-left p-2.5 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors">
                  <p className="text-xs font-semibold text-surface-800 truncate">
                    {contact ? `${contact.prenom} ${contact.nom}` : opp.reference}
                  </p>
                  <p className="text-[10px] text-orange-600 mt-0.5 font-medium">
                    Planifiée le {formatDate(opp.dateRelance)}
                  </p>
                </button>
              )
            })}
            {/* Relances auto (devis sans réponse) */}
            {relancesAuto.map(opp => {
              const contact = contacts.find(c => c.id === opp.contactId)
              return (
                <button key={opp.id} onClick={() => navigate(`/opportunites/${opp.id}`)}
                  className="w-full text-left p-2.5 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors">
                  <p className="text-xs font-semibold text-surface-800 truncate">
                    {contact ? `${contact.prenom} ${contact.nom}` : opp.reference}
                  </p>
                  <p className="text-[10px] text-orange-600 mt-0.5">
                    Devis sans réponse {formatRelative(opp.dateDevis)}
                  </p>
                </button>
              )
            })}
            {relancesAVenir.length === 0 && relancesAuto.length === 0 && (
              <p className="text-xs text-surface-400 text-center py-4">Aucune relance ✓</p>
            )}
          </div>
        </div>

        {/* Installations */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-4">
          <h3 className="font-display font-semibold text-surface-800 text-sm mb-3 flex items-center gap-2">
            <Clock size={14} className="text-teal-600" /> Installations
          </h3>
          <div className="space-y-2">
            {installationsAvenir.length === 0 ? (
              <p className="text-xs text-surface-400 text-center py-4">Aucune installation planifiée</p>
            ) : installationsAvenir.map(opp => {
              const contact = contacts.find(c => c.id === opp.contactId)
              return (
                <button key={opp.id} onClick={() => navigate(`/opportunites/${opp.id}`)}
                  className="w-full text-left p-2.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 transition-colors">
                  <p className="text-xs font-semibold text-surface-800 truncate">
                    {contact ? `${contact.prenom} ${contact.nom}` : opp.reference}
                  </p>
                  <p className="text-[10px] text-teal-700 mt-0.5 font-medium">
                    {formatDateLong(opp.dateInstallation)}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Paiements partenaires — admin uniquement */}
        {can('opportunites.view_all') && (
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-4">
            <h3 className="font-display font-semibold text-surface-800 text-sm mb-3 flex items-center gap-2">
              <Handshake size={14} className="text-purple-600" /> Paiements partenaires
            </h3>
            <div className="space-y-2">
              {paiementsPartenaires.length === 0 ? (
                <p className="text-xs text-surface-400 text-center py-4">Aucun paiement planifié</p>
              ) : paiementsPartenaires.map(opp => {
                const contact = contacts.find(c => c.id === opp.contactId)
                return (
                  <button key={opp.id} onClick={() => navigate(`/opportunites/${opp.id}`)}
                    className="w-full text-left p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors">
                    <p className="text-xs font-semibold text-surface-800 truncate">
                      {contact ? `${contact.prenom} ${contact.nom}` : opp.reference}
                    </p>
                    <p className="text-[10px] text-purple-700 mt-0.5 font-medium">
                      {formatDateLong(opp.datePaiementPartenaire)}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {/* ── Notifications ── */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
        <h3 className="font-display font-semibold text-surface-800 text-sm mb-4 flex items-center gap-2">
          <Bell size={15} className="text-surface-500" />
          Notifications
          {nonLues.length > 0 && (
            <span className="ml-auto text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">
              {nonLues.length} nouvelles
            </span>
          )}
        </h3>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-xs text-surface-400 text-center py-6 col-span-2">Aucune notification</p>
          ) : notifications.map(n => (
            <button key={n.id} onClick={() => marquerLue(n.id)}
              className={clsx('w-full text-left p-3 rounded-xl border transition-colors',
                n.lue ? 'border-surface-100 hover:bg-surface-50' : 'border-brand-200 bg-brand-50 hover:bg-brand-100')}>
              <div className="flex items-start gap-2">
                <span className="text-sm flex-shrink-0">{NOTIF_ICONS[n.type] ?? 'ℹ️'}</span>
                <div className="flex-1 min-w-0">
                  <p className={clsx('text-xs font-medium truncate', n.lue ? 'text-surface-600' : 'text-surface-800')}>
                    {n.titre}
                  </p>
                  <p className="text-[10px] text-surface-400 mt-0.5">{formatRelative(n.createdAt)}</p>
                </div>
                {!n.lue && <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1" />}
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}