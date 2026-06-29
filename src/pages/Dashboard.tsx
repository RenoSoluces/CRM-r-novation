import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, FileText, ChevronRight, Plus, FolderOpen,
  Wallet, Clock, TrendingUp,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useOpportunitesStore } from '@/store/opportunitesStore'
import { useContactsStore } from '@/store/contactsStore'
import { formatEuro } from '@/utils/formatters'
import clsx from 'clsx'

// ── Objectif mensuel fixe (€) — ajustez ici si besoin ──
const OBJECTIF_MENSUEL_EUR = 5000

type FiltreTaches = 'tout' | 'dossiers' | 'rdv'

function isActive(o: any) {
  const etapeFinale   = ['pose_livree', 'sav_suivi', 'perdu'].includes(o.etape)
  const commSoc       = o.commission?.montantSociete ?? 0
  const commPayee     = o.commissionPayee ?? 0
  const commEnAttente = commSoc > 0 && commPayee < commSoc
  return !etapeFinale || commEnAttente
}

function formatDateLongFr(date: Date) {
  const str = date.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default function Dashboard() {
  const { user, can } = useAuth()
  const navigate = useNavigate()
  const { opportunites, fetchOpportunites } = useOpportunitesStore()
  const { contacts, fetchContacts }         = useContactsStore()

  const [filtreTaches, setFiltreTaches] = useState<FiltreTaches>('tout')

  // ── FIX : récupère les données au montage ──
  useEffect(() => {
    fetchOpportunites()
    fetchContacts()
  }, [])

  const myOpps = useMemo(() => {
    if (can('opportunites.view_all')) return opportunites
    if (user?.role === 'apporteur')   return opportunites.filter(o => o.apporteurId === user.id)
    return opportunites.filter(o => o.commercialId === user?.id)
  }, [opportunites, user, can])

  function getMaCommission(o: typeof myOpps[0]) {
    if (user?.role === 'apporteur') return o.commission?.montantApporteur ?? 0
    if (can('opportunites.view_all')) return o.commission?.montantSociete ?? 0
    return o.commission?.montantCommercial ?? 0
  }

  const now = new Date()
  const moisActuel    = now.getMonth()
  const anneeActuelle = now.getFullYear()

  const commissionCeMois = myOpps
    .filter(o => {
      if (!o.dateSignature) return false
      const d = new Date(o.dateSignature)
      return d.getMonth() === moisActuel && d.getFullYear() === anneeActuelle
    })
    .reduce((s, o) => s + getMaCommission(o), 0)

  const commissionEnAttente = myOpps
    .filter(o => o.etape !== 'perdu')
    .reduce((s, o) => {
      const due  = o.commission?.montantCommercial ?? 0
      const paid = o.commissionPayee ?? 0
      return s + Math.max(0, due - paid)
    }, 0)

  const pctObjectif = Math.min(100, Math.round((commissionCeMois / OBJECTIF_MENSUEL_EUR) * 100))

  const oppsActives = myOpps.filter(isActive)
  const dossiersAFinaliser = oppsActives.filter(
    o => !['signe', 'pose_livree', 'sav_suivi'].includes(o.etape)
  )

  const tachesDossiers = dossiersAFinaliser
  const tachesRdv = myOpps.filter(o => {
    if (!o.dateRdv) return false
    return new Date(o.dateRdv).toDateString() === now.toDateString()
  })

  const tachesAffichees =
    filtreTaches === 'dossiers' ? tachesDossiers.map(o => ({ ...o, __type: 'dossier' as const })) :
    filtreTaches === 'rdv'      ? tachesRdv.map(o => ({ ...o, __type: 'rdv' as const })) :
    [
      ...tachesDossiers.map(o => ({ ...o, __type: 'dossier' as const })),
      ...tachesRdv.map(o => ({ ...o, __type: 'rdv' as const })),
    ]

  const totalTaches = tachesDossiers.length + tachesRdv.length

  const oppsDuMois = myOpps.filter(o => {
    const d = new Date(o.dateCreation)
    return d.getMonth() === moisActuel && d.getFullYear() === anneeActuelle
  })
  const pipelineBrouillon = oppsDuMois.filter(o =>
    ['nouveau_lead', 'qualification', 'rdv_planifie', 'rdv_effectue', 'devis_envoye'].includes(o.etape)
  ).length
  const pipelineSigne  = oppsDuMois.filter(o => o.etape === 'signe').length
  const pipelineDepose = oppsDuMois.filter(o => o.etape === 'dossier_mpr_cee').length
  const pipelinePaye   = oppsDuMois.filter(o => ['pose_livree', 'sav_suivi'].includes(o.etape)).length

  function getContact(contactId: string) {
    return contacts.find(c => c.id === contactId)
  }

  return (
    <div className="space-y-5">

      {/* En-tête */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">
            Bonjour {user?.prenom} 👋
          </p>
          <h1 className="font-display font-bold text-2xl text-surface-900 mt-0.5">
            {formatDateLongFr(now)}
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Tu as <strong className="text-surface-700">{totalTaches}</strong> action{totalTaches > 1 ? 's' : ''} à traiter
            et <strong className="text-surface-700">{tachesRdv.length}</strong> rendez-vous aujourd'hui.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/agenda')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-surface-200 bg-white text-surface-700 text-xs font-semibold hover:bg-surface-50 transition-colors"
          >
            <Calendar size={14} /> Créer RDV
          </button>
          {can('opportunites.create') && (
            <button
              onClick={() => navigate('/contacts')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus size={14} /> Nouveau dossier
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Commission ce mois"
          value={formatEuro(commissionCeMois)}
          sub={commissionEnAttente === 0 ? 'Aucun versement en attente' : `${formatEuro(commissionEnAttente)} en attente de versement`}
          icon={<Wallet size={18} />}
          color="green"
        />
        <KpiCard
          label="En attente"
          value={formatEuro(commissionEnAttente)}
          sub={commissionEnAttente === 0 ? 'Rien à régler' : 'À régulariser'}
          icon={<Clock size={18} />}
          color="orange"
        />
        <KpiCard
          label="Objectif mensuel"
          value={`${pctObjectif}%`}
          progress={pctObjectif}
          sub={`${formatEuro(commissionCeMois)} / ${formatEuro(OBJECTIF_MENSUEL_EUR)}`}
          icon={<TrendingUp size={18} />}
          color="blue"
        />
        <KpiCard
          label="Dossiers actifs"
          value={String(oppsActives.length)}
          sub={`${dossiersAFinaliser.length} à finaliser`}
          icon={<FolderOpen size={18} />}
          color="surface"
        />
      </div>

      {/* Tâches + Agenda/Pipeline */}
      <div className="grid grid-cols-[1fr_360px] gap-5">

        {/* À faire aujourd'hui */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-display font-semibold text-surface-800">
                À faire aujourd'hui
              </h2>
              <p className="text-xs text-surface-400 mt-0.5">Tes prochaines actions, par priorité</p>
            </div>
            <div className="flex rounded-lg border border-surface-200 overflow-hidden">
              {([
                { key: 'tout',     label: 'Tout',     count: totalTaches },
                { key: 'dossiers', label: 'Dossiers', count: tachesDossiers.length },
                { key: 'rdv',      label: 'RDV',      count: tachesRdv.length },
              ] as const).map(f => (
                <button key={f.key} onClick={() => setFiltreTaches(f.key)}
                  className={clsx('px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors',
                    filtreTaches === f.key ? 'bg-surface-900 text-white' : 'text-surface-600 hover:bg-surface-50')}>
                  {f.label}
                  <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                    filtreTaches === f.key ? 'bg-white/20 text-white' : 'bg-surface-100 text-surface-500')}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {totalTaches > 0 && (
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-2">
              Prioritaire
            </p>
          )}

          <div className="space-y-2">
            {tachesAffichees.length === 0 ? (
              <p className="text-xs text-surface-400 text-center py-10">Aucune action en attente 🎉</p>
            ) : tachesAffichees.map((opp: any) => {
              const contact = getContact(opp.contactId)
              const isRdv = opp.__type === 'rdv'
              return (
                <button key={`${opp.__type}-${opp.id}`}
                  onClick={() => navigate(`/opportunites/${opp.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-surface-100 hover:border-surface-200 hover:bg-surface-50 transition-colors text-left"
                >
                  <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                    isRdv ? 'bg-brand-100 text-brand-600' : 'bg-orange-100 text-orange-500')}>
                    {isRdv ? <Calendar size={15} /> : <FileText size={15} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-surface-800 truncate">
                        {isRdv ? 'Rendez-vous aujourd\'hui' : 'Finaliser et transmettre le dossier'}
                      </p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-orange-100 text-orange-600 flex-shrink-0">
                        À FAIRE
                      </span>
                    </div>
                    <p className="text-xs text-surface-500 mt-0.5 truncate">
                      {contact ? `${contact.prenom} ${contact.nom}`.toUpperCase() : opp.reference}
                      {' · '}#{opp.reference}
                      {contact?.adresse?.ville && ` · ${contact.adresse.ville} ${contact.adresse.codePostal ?? ''}`}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-surface-300 flex-shrink-0" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">

          {/* Agenda du jour */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-4">
            <h3 className="font-display font-semibold text-surface-800 text-sm flex items-center gap-2">
              <Calendar size={15} className="text-brand-600" /> Agenda du jour
            </h3>
            <p className="text-xs text-surface-400 mt-0.5 mb-3">
              {tachesRdv.length === 0 ? 'Aucun rendez-vous' : `${tachesRdv.length} rendez-vous`}
            </p>

            {tachesRdv.length === 0 ? (
              <div className="rounded-xl border border-dashed border-surface-200 bg-surface-50 py-8 flex flex-col items-center justify-center text-center mb-3">
                <Calendar size={20} className="text-surface-300 mb-2" />
                <p className="text-xs text-surface-400">Aucun rendez-vous programmé.</p>
              </div>
            ) : (
              <div className="space-y-2 mb-3">
                {tachesRdv.map(opp => {
                  const contact = getContact(opp.contactId)
                  const heure = opp.dateRdv
                    ? new Date(opp.dateRdv).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                    : ''
                  return (
                    <button key={opp.id} onClick={() => navigate(`/opportunites/${opp.id}`)}
                      className="w-full flex items-center justify-between gap-2 p-2.5 rounded-lg bg-surface-50 hover:bg-surface-100 transition-colors text-left">
                      <p className="text-xs font-semibold text-surface-800 truncate">
                        {contact ? `${contact.prenom} ${contact.nom}` : opp.reference}
                      </p>
                      <span className="text-xs font-bold text-brand-600 flex-shrink-0">{heure}</span>
                    </button>
                  )
                })}
              </div>
            )}

            <button onClick={() => navigate('/agenda')}
              className="w-full py-2 rounded-lg border border-dashed border-surface-200 text-xs font-semibold text-surface-500 hover:bg-surface-50 transition-colors flex items-center justify-center gap-1.5">
              <Plus size={12} /> Planifier un rendez-vous
            </button>
          </div>

          {/* Pipeline du mois */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-4">
            <h3 className="font-display font-semibold text-surface-800 text-sm">Pipeline du mois</h3>
            <p className="text-xs text-surface-400 mt-0.5 mb-3">Répartition par étape</p>

            <div className="grid grid-cols-2 gap-2">
              <PipelineStat label="Brouillon" value={pipelineBrouillon} bg="bg-surface-100" text="text-surface-700" />
              <PipelineStat label="Signé"     value={pipelineSigne}     bg="bg-green-100"   text="text-green-700" />
              <PipelineStat label="Déposé"    value={pipelineDepose}    bg="bg-amber-100"   text="text-amber-700" />
              <PipelineStat label="Payé"      value={pipelinePaye}      bg="bg-surface-100" text="text-surface-600" />
            </div>

            <button onClick={() => navigate('/opportunites')}
              className="w-full mt-3 text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center justify-center gap-1">
              Voir le pipeline complet <ChevronRight size={12} />
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

function KpiCard({
  label, value, sub, icon, color, progress,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  color: 'green' | 'orange' | 'blue' | 'surface'
  progress?: number
}) {
  const palette = {
    green:   { bg: 'bg-green-50',  icon: 'bg-white text-green-600',         border: 'border-green-100' },
    orange:  { bg: 'bg-orange-50', icon: 'bg-white text-orange-500',        border: 'border-orange-100' },
    blue:    { bg: 'bg-blue-50',   icon: 'bg-white text-blue-600',          border: 'border-blue-100' },
    surface: { bg: 'bg-white',     icon: 'bg-surface-100 text-surface-600', border: 'border-surface-200' },
  }[color]

  return (
    <div className={clsx('rounded-xl border shadow-card p-5', palette.bg, palette.border)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold text-surface-500 uppercase tracking-wide">{label}</p>
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', palette.icon)}>
          {icon}
        </div>
      </div>
      <p className="font-display font-bold text-2xl text-surface-900">{value}</p>
      {progress !== undefined && (
        <div className="h-1.5 bg-white/70 rounded-full overflow-hidden mt-3 mb-1.5">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      )}
      {sub && <p className="text-xs text-surface-500 mt-1">{sub}</p>}
    </div>
  )
}

function PipelineStat({ label, value, bg, text }: { label: string; value: number; bg: string; text: string }) {
  return (
    <div className={clsx('rounded-xl p-3 text-center', bg)}>
      <p className={clsx('font-display font-bold text-xl', text)}>{value}</p>
      <p className="text-[10px] text-surface-500 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  )
}
