import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, Bell, AlertTriangle } from 'lucide-react'
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

export default function Agenda() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { opportunites }                          = useOpportunitesStore()
  const { contacts }                              = useContactsStore()
  const { getParDestinataire, marquerLue }         = useNotificationsStore()

  const notifications = user ? getParDestinataire(user.id) : []
  const nonLues       = notifications.filter(n => !n.lue)

  // RDV à venir (opps avec dateRdv dans le futur)
  const rdvAvenir = useMemo(() => {
    const now = new Date()
    return opportunites
      .filter(o => o.dateRdv && new Date(o.dateRdv) >= now)
      .sort((a, b) => new Date(a.dateRdv!).getTime() - new Date(b.dateRdv!).getTime())
      .slice(0, 10)
  }, [opportunites])

  // Installations à venir
  const installationsAvenir = useMemo(() => {
    const now = new Date()
    return opportunites
      .filter(o => o.dateInstallation && new Date(o.dateInstallation) >= now)
      .sort((a, b) => new Date(a.dateInstallation!).getTime() - new Date(b.dateInstallation!).getTime())
      .slice(0, 5)
  }, [opportunites])

  // Relances nécessaires (devis sans réponse > 7j)
  const relances = useMemo(() => {
    const now = new Date()
    return opportunites
      .filter(o => {
        if (o.etape !== 'devis_envoye' || !o.dateDevis) return false
        const diff = now.getTime() - new Date(o.dateDevis).getTime()
        return diff > 7 * 24 * 60 * 60 * 1000
      })
      .slice(0, 5)
  }, [opportunites])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[1fr_1fr_320px] gap-5">

        {/* RDV à venir */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <h3 className="font-display font-semibold text-surface-800 text-sm mb-4 flex items-center gap-2">
            <Calendar size={15} className="text-brand-600" /> RDV à venir
          </h3>
          <div className="space-y-3">
            {rdvAvenir.length === 0 ? (
              <p className="text-xs text-surface-400 text-center py-6">Aucun RDV planifié</p>
            ) : rdvAvenir.map(opp => {
              const contact = contacts.find(c => c.id === opp.contactId)
              const isToday = opp.dateRdv && new Date(opp.dateRdv).toDateString() === new Date().toDateString()
              const isTomorrow = opp.dateRdv && new Date(opp.dateRdv).toDateString() === new Date(Date.now() + 86400000).toDateString()
              return (
                <button key={opp.id} onClick={() => navigate(`/opportunites/${opp.id}`)}
                  className={clsx('w-full text-left p-3 rounded-xl border transition-all hover:shadow-sm',
                    isToday ? 'border-brand-300 bg-brand-50' : 'border-surface-200 hover:border-surface-300')}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-surface-800">
                        {contact ? `${contact.prenom} ${contact.nom}` : opp.reference}
                      </p>
                      <p className="text-[10px] text-surface-500 mt-0.5">{opp.reference}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={clsx('text-[10px] font-bold',
                        isToday ? 'text-brand-600' : isTomorrow ? 'text-orange-500' : 'text-surface-500')}>
                        {isToday ? "Aujourd'hui" : isTomorrow ? 'Demain' : formatDate(opp.dateRdv)}
                      </p>
                    </div>
                  </div>
                  {contact?.adresse && (
                    <p className="text-[10px] text-surface-400 mt-1.5 flex items-center gap-1">
                      <MapPin size={9} />{contact.adresse.ville}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Relances + Installations */}
        <div className="space-y-4">
          {/* Relances */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <h3 className="font-display font-semibold text-surface-800 text-sm mb-4 flex items-center gap-2">
              <AlertTriangle size={15} className="text-orange-500" /> Relances nécessaires
            </h3>
            <div className="space-y-2">
              {relances.length === 0 ? (
                <p className="text-xs text-surface-400 text-center py-4">Aucune relance en attente ✓</p>
              ) : relances.map(opp => {
                const contact = contacts.find(c => c.id === opp.contactId)
                return (
                  <button key={opp.id} onClick={() => navigate(`/opportunites/${opp.id}`)}
                    className="w-full text-left p-3 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors">
                    <p className="text-xs font-semibold text-surface-800">
                      {contact ? `${contact.prenom} ${contact.nom}` : opp.reference}
                    </p>
                    <p className="text-[10px] text-orange-600 mt-0.5">
                      Devis envoyé {formatRelative(opp.dateDevis)} · sans réponse
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Installations */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <h3 className="font-display font-semibold text-surface-800 text-sm mb-4 flex items-center gap-2">
              <Clock size={15} className="text-teal-600" /> Installations planifiées
            </h3>
            <div className="space-y-2">
              {installationsAvenir.length === 0 ? (
                <p className="text-xs text-surface-400 text-center py-4">Aucune installation planifiée</p>
              ) : installationsAvenir.map(opp => {
                const contact = contacts.find(c => c.id === opp.contactId)
                return (
                  <button key={opp.id} onClick={() => navigate(`/opportunites/${opp.id}`)}
                    className="w-full text-left p-3 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 transition-colors">
                    <p className="text-xs font-semibold text-surface-800">
                      {contact ? `${contact.prenom} ${contact.nom}` : opp.reference}
                    </p>
                    <p className="text-[10px] text-teal-700 mt-0.5 font-medium">
                      📅 {formatDateLong(opp.dateInstallation)}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Notifications */}
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
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-xs text-surface-400 text-center py-6">Aucune notification</p>
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
    </div>
  )
}