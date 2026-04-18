import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, Target, Users, Percent,
  Phone, Mail, FileText, Trophy, ArrowRight, Star,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useOpportunitesStore } from '@/store/opportunitesStore'
import { useContactsStore } from '@/store/contactsStore'
import { useProduitsStore } from '@/store/produitsStore'
import { ETAPES_PIPELINE } from '@/types/opportunite'
import { formatEuro, formatRelative, truncate } from '@/utils/formatters'
import Badge, { FAMILLE_COLORS, FAMILLE_LABELS } from '@/components/ui/Badge'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import clsx from 'clsx'

ChartJS.register(ArcElement, Tooltip, Legend)

const ETAPES_DASHBOARD = [
  'nouveau_lead',
  'qualification',
  'devis_envoye',
  'dossier_mpr_cee',
  'signe',
] as const

const ACTIVITE_ICONS: Record<string, React.ReactNode> = {
  appel:        <Phone size={11} />,
  email:        <Mail size={11} />,
  rdv:          <Target size={11} />,
  devis:        <FileText size={11} />,
  signature:    <Trophy size={11} />,
  installation: <Star size={11} />,
  note:         <FileText size={11} />,
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f97316']

export default function Dashboard() {
  const { user, can } = useAuth()
  const navigate      = useNavigate()
  const { opportunites } = useOpportunitesStore()
  const { contacts }     = useContactsStore()
  const { produits }     = useProduitsStore()

  /* ── Filtrer selon le rôle ── */
  const myOpps = useMemo(() => {
    if (can('opportunites.view_all')) return opportunites
    if (user?.role === 'apporteur')   return opportunites.filter(o => o.apporteurId === user.id)
    return opportunites.filter(o => o.commercialId === user?.id)
  }, [opportunites, user, can])

  const myContacts = useMemo(() => {
    if (can('contacts.view_all'))   return contacts
    if (user?.role === 'apporteur') return contacts.filter(c => c.apporteurId === user.id)
    return contacts.filter(c => c.commercialId === user?.id)
  }, [contacts, user, can])

  /* ── KPIs ── */
  const commissionEnCours = myOpps
    .filter(o => o.etape !== 'perdu')
    .reduce((sum, o) => {
      const due  = o.commission?.montantCommercial ?? 0
      const paid = o.commissionPayee ?? 0
      return sum + Math.max(0, due - paid)
    }, 0)

  const oppsActives = myOpps.filter(
    o => !['perdu', 'pose_livree', 'sav_suivi'].includes(o.etape)
  )
  const valeurPipeline = oppsActives.reduce((sum, o) => sum + (o.montantDevis ?? 0), 0)

  const now = new Date()
  const nouveauxLeads = myContacts.filter(c => {
    const diff = now.getTime() - new Date(c.createdAt).getTime()
    return diff < 7 * 24 * 60 * 60 * 1000
  })

  const gagnes = myOpps.filter(o => ['signe', 'pose_livree'].includes(o.etape)).length
  const totalFermes = myOpps.filter(
    o => !['nouveau_lead', 'qualification'].includes(o.etape)
  ).length
  const tauxConversion = totalFermes > 0 ? Math.round((gagnes / totalFermes) * 100) : 0

  /* ── Pipeline kanban ── */
  const colonnes = ETAPES_DASHBOARD.map(etapeId => {
    const info  = ETAPES_PIPELINE.find(e => e.id === etapeId)!
    const items = myOpps.filter(o => o.etape === etapeId)
    return { ...info, items }
  })

  /* ── Activités récentes ── */
  const recentActivites = useMemo(() => {
    const all: {
      activite: (typeof myOpps[0]['activites'][0])
      opp: typeof myOpps[0]
      contact: typeof contacts[0] | undefined
    }[] = []
    myOpps.forEach(opp => {
      const contact = contacts.find(c => c.id === opp.contactId)
      ;(opp.activites ?? []).forEach(a => all.push({ activite: a, opp, contact }))
    })
    return all
      .sort((a, b) => new Date(b.activite.date).getTime() - new Date(a.activite.date).getTime())
      .slice(0, 6)
  }, [myOpps, contacts])

  /* ── Top produits ── */
  const topProduits = useMemo(() => {
    const counts: Record<string, number> = {}
    myOpps.forEach(o => {
      if (o.produitId) counts[o.produitId] = (counts[o.produitId] ?? 0) + 1
    })
    const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([produitId, count]) => ({
        produit: produits.find(p => p.id === produitId),
        count,
        pct: Math.round((count / total) * 100),
      }))
      .filter(x => x.produit)
  }, [myOpps, produits])

  const pieData = {
    labels: topProduits.map(({ produit }) =>
      truncate(FAMILLE_LABELS[produit!.famille] ?? produit!.nom, 20)
    ),
    datasets: [{
      data: topProduits.map(({ pct }) => pct),
      backgroundColor: PIE_COLORS.slice(0, topProduits.length),
      borderWidth: 2,
      borderColor: '#ffffff',
    }],
  }

  return (
    <div className="space-y-5">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Commission en cours"
          value={formatEuro(commissionEnCours)}
          sub="Commissions non encore payées"
          icon={<TrendingUp size={20} />}
          color="green"
        />
        <KpiCard
          label="Opportunités actives"
          value={String(oppsActives.length)}
          sub={`Valeur pipeline : ${formatEuro(valeurPipeline)}`}
          icon={<Target size={20} />}
          color="orange"
        />
        <KpiCard
          label="Nouveaux leads"
          value={String(nouveauxLeads.length)}
          trend={`+${nouveauxLeads.length} cette semaine`}
          trendUp
          icon={<Users size={20} />}
          color="blue"
        />
        <KpiCard
          label="Taux conversion"
          value={`${tauxConversion}%`}
          trend="-2% vs objectif"
          trendUp={false}
          icon={<Percent size={20} />}
          color="red"
        />
      </div>

      {/* ── Pipeline + Sidebar ── */}
      <div className="grid grid-cols-[1fr_300px] gap-5">

        {/* Pipeline Kanban */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-surface-800">Pipeline commercial</h2>
            <button
              onClick={() => navigate('/opportunites')}
              className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
            >
              Voir tout <ArrowRight size={12} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {colonnes.map(col => (
              <div key={col.id} className="min-w-[155px] flex-1">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500">
                    {col.label.replace(' ✓', '')}
                  </span>
                  <span
                    className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: col.couleur + '22', color: col.couleur }}
                  >
                    {col.items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {col.items.slice(0, 3).map(opp => {
                    const contact = contacts.find(c => c.id === opp.contactId)
                    const produit = produits.find(p => p.id === opp.produitId)
                    return (
                      <button
                        key={opp.id}
                        onClick={() => navigate(`/opportunites/${opp.id}`)}
                        className="w-full text-left p-2.5 bg-surface-50 hover:bg-surface-100 rounded-lg border border-surface-200 hover:border-surface-300 transition-all hover:shadow-sm"
                      >
                        <p className="text-xs font-semibold text-surface-800 leading-tight truncate">
                          {contact ? `${contact.civilite ?? ''} ${contact.nom}`.trim() : opp.reference}
                        </p>
                        {opp.montantDevis && (
                          <p className="text-xs text-surface-600 mt-0.5">{formatEuro(opp.montantDevis)}</p>
                        )}
                        {contact && (
                          <p className="text-[10px] text-surface-400 truncate">
                            {contact.prenom} {contact.nom}
                          </p>
                        )}
                        {produit && (
                          <div className="mt-1.5">
                            <Badge
                              label={truncate(FAMILLE_LABELS[produit.famille] ?? produit.nom, 16)}
                              color={FAMILLE_COLORS[produit.famille]}
                            />
                          </div>
                        )}
                      </button>
                    )
                  })}
                  {col.items.length > 3 && (
                    <p className="text-[10px] text-surface-400 text-center py-1">
                      +{col.items.length - 3} autres
                    </p>
                  )}
                  {col.items.length === 0 && (
                    <div className="h-16 border-2 border-dashed border-surface-200 rounded-lg flex items-center justify-center">
                      <span className="text-[10px] text-surface-300">Vide</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">

          {/* Activités récentes */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-4">
            <h3 className="font-display font-semibold text-surface-800 text-sm mb-3">
              Activités récentes
            </h3>
            <div className="space-y-1">
              {recentActivites.length === 0 ? (
                <p className="text-xs text-surface-400 text-center py-6">Aucune activité</p>
              ) : (
                recentActivites.map(({ activite, opp, contact }) => (
                  <button
                    key={activite.id}
                    onClick={() => navigate(`/opportunites/${opp.id}`)}
                    className="w-full flex items-start gap-2.5 text-left hover:bg-surface-50 rounded-lg p-1.5 -mx-1.5 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {ACTIVITE_ICONS[activite.type] ?? <FileText size={11} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-surface-700 truncate">{activite.titre}</p>
                      {contact && (
                        <p className="text-[10px] text-surface-400 truncate">
                          {contact.prenom} {contact.nom}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-surface-400 flex-shrink-0">
                      {formatRelative(activite.date)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Top produits — camembert */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-4">
            <h3 className="font-display font-semibold text-surface-800 text-sm mb-3">
              Top produits
            </h3>
            {topProduits.length === 0 ? (
              <p className="text-xs text-surface-400 text-center py-2">Aucune donnée</p>
            ) : (
              <>
                <div className="space-y-1 mb-3">
                  {topProduits.map(({ produit, pct }, i) => (
                    <div key={produit!.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                          style={{ background: PIE_COLORS[i] }}
                        />
                        <span className="text-xs text-surface-700 truncate">
                          {truncate(FAMILLE_LABELS[produit!.famille] ?? produit!.nom, 18)}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-surface-700 flex-shrink-0">{pct}%</span>
                    </div>
                  ))}
                </div>
                <div className="h-[160px] flex items-center justify-center">
                  <Doughnut
                    data={pieData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: '55%',
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: ctx => ` ${ctx.label} : ${ctx.parsed}%`,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

/* ── Composant KPI Card ── */
function KpiCard({
  label, value, sub, trend, trendUp, icon, color,
}: {
  label: string
  value: string
  sub?: string
  trend?: string
  trendUp?: boolean
  icon: React.ReactNode
  color: 'green' | 'orange' | 'blue' | 'red'
}) {
  const palette = {
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-500', border: 'border-orange-100' },
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-500',    border: 'border-red-100' },
  }[color]

  return (
    <div className={clsx('bg-white rounded-xl border shadow-card p-5', palette.border)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-surface-500 uppercase tracking-wide">{label}</p>
        <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center', palette.bg, palette.icon)}>
          {icon}
        </div>
      </div>
      <p className="font-display font-bold text-2xl text-surface-900">{value}</p>
      {sub && <p className="text-xs text-surface-500 mt-1">{sub}</p>}
      {trend && (
        <p className={clsx('text-xs mt-1.5 font-medium flex items-center gap-1', trendUp ? 'text-green-600' : 'text-red-500')}>
          {trendUp ? '▲' : '▼'} {trend}
        </p>
      )}
    </div>
  )
}