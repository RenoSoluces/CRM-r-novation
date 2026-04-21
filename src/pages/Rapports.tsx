import { useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useOpportunitesStore } from '@/store/opportunitesStore'
import { useContactsStore } from '@/store/contactsStore'
import { useProduitsStore } from '@/store/produitsStore'
import { formatEuro } from '@/utils/formatters'
import { FAMILLE_LABELS, FAMILLE_COLORS } from '@/components/ui/Badge'
import { ETAPES_PIPELINE } from '@/types/opportunite'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import clsx from 'clsx'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement)

const MOIS_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

type Periode = '3mois' | '6mois' | '12mois' | 'tout'

export default function Rapports() {
  const { user, can } = useAuth()
  const { opportunites } = useOpportunitesStore()
  const { contacts }     = useContactsStore()
  const { produits }     = useProduitsStore()
  const [periode, setPeriode] = useState<Periode>('12mois')

  const myOpps = useMemo(() => {
    if (can('rapports.view_global')) return opportunites
    return opportunites.filter(o => o.commercialId === user?.id)
  }, [opportunites, user, can])

  const myContacts = useMemo(() => {
    if (can('rapports.view_global')) return contacts
    return contacts.filter(c => c.commercialId === user?.id)
  }, [contacts, user, can])

  /* ── Filtre période ── */
  const oppsFiltered = useMemo(() => {
    if (periode === 'tout') return myOpps
    const mois = periode === '3mois' ? 3 : periode === '6mois' ? 6 : 12
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - mois)
    return myOpps.filter(o => new Date(o.dateCreation) >= cutoff)
  }, [myOpps, periode])

  /* ── KPIs globaux ── */
  const caTotal     = oppsFiltered.filter(o => ['signe', 'pose_livree'].includes(o.etape)).reduce((s, o) => s + (o.montantDevis ?? 0), 0)
  const aidesMPR    = oppsFiltered.reduce((s, o) => s + (o.montantAidesMPR ?? 0), 0)
  const aidesCEE    = oppsFiltered.reduce((s, o) => s + (o.montantAidesCEE ?? 0), 0)
  const nbGagnes    = oppsFiltered.filter(o => ['signe', 'pose_livree'].includes(o.etape)).length
  const nbPerdus    = oppsFiltered.filter(o => o.etape === 'perdu').length
  const nbTotal     = oppsFiltered.filter(o => !['nouveau_lead'].includes(o.etape)).length
  const tauxConv    = nbTotal > 0 ? Math.round(nbGagnes / nbTotal * 100) : 0
  const panierMoyen = nbGagnes > 0 ? Math.round(caTotal / nbGagnes) : 0

  /* ── Commissions (admin seulement) ── */
  const commSocieteTotal    = opportunites.reduce((s, o) => s + (o.commission?.montantSociete ?? 0), 0)
  const commSocieteEnCours  = opportunites.filter(o => o.etape !== 'perdu').reduce((s, o) => s + (o.commission?.montantSociete ?? 0), 0)
  const commCommerciauxTotal = opportunites.reduce((s, o) => s + (o.commission?.montantCommercial ?? 0), 0)
  const commCommerciauxPayees = opportunites.reduce((s, o) => s + (o.commissionPayee ?? 0), 0)
  const commCommerciauxDues  = Math.max(0, commCommerciauxTotal - commCommerciauxPayees)
  const commApporteursTotal  = opportunites.reduce((s, o) => s + (o.commission?.montantApporteur ?? 0), 0)

  /* ── CA par mois (12 derniers mois) ── */
  const caParMois = useMemo(() => {
    const now   = new Date()
    const mois  = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now)
      d.setMonth(d.getMonth() - (11 - i))
      return { mois: d.getMonth(), annee: d.getFullYear(), ca: 0, nb: 0 }
    })
    myOpps
      .filter(o => ['signe', 'pose_livree'].includes(o.etape) && o.dateSignature)
      .forEach(o => {
        const d = new Date(o.dateSignature!)
        const idx = mois.findIndex(m => m.mois === d.getMonth() && m.annee === d.getFullYear())
        if (idx !== -1) { mois[idx].ca += o.montantDevis ?? 0; mois[idx].nb++ }
      })
    return mois
  }, [myOpps])

  /* ── Par produit ── */
  const parProduit = useMemo(() => {
    const acc: Record<string, { count: number; ca: number }> = {}
    oppsFiltered.forEach(o => {
      if (!acc[o.produitId]) acc[o.produitId] = { count: 0, ca: 0 }
      acc[o.produitId].count++
      if (['signe', 'pose_livree'].includes(o.etape)) acc[o.produitId].ca += o.montantDevis ?? 0
    })
    return Object.entries(acc)
      .map(([pid, data]) => ({ produit: produits.find(p => p.id === pid), ...data }))
      .filter(x => x.produit)
      .sort((a, b) => b.count - a.count)
  }, [oppsFiltered, produits])

  /* ── Par étape ── */
  const parEtape = ETAPES_PIPELINE.map(e => ({
    ...e, count: oppsFiltered.filter(o => o.etape === e.id).length,
  })).filter(e => e.count > 0)

  /* ── Par source ── */
  const parSource = useMemo(() => {
    const acc: Record<string, number> = {}
    myContacts.forEach(c => { const s = c.source ?? 'Inconnue'; acc[s] = (acc[s] ?? 0) + 1 })
    return Object.entries(acc).sort((a, b) => b[1] - a[1])
  }, [myContacts])

  /* ── Par commercial (admin) ── */
  const parCommercial = useMemo(() => {
    if (!can('rapports.view_global')) return []
    const acc: Record<string, { nb: number; ca: number; commDue: number; commPayee: number }> = {}
    opportunites.forEach(o => {
      if (!acc[o.commercialId]) acc[o.commercialId] = { nb: 0, ca: 0, commDue: 0, commPayee: 0 }
      acc[o.commercialId].nb++
      if (['signe', 'pose_livree'].includes(o.etape)) acc[o.commercialId].ca += o.montantDevis ?? 0
      acc[o.commercialId].commDue   += o.commission?.montantCommercial ?? 0
      acc[o.commercialId].commPayee += o.commissionPayee ?? 0
    })
    return Object.entries(acc)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.ca - a.ca)
  }, [opportunites, can])

  /* ── Données Chart CA mensuel ── */
  const caChartData = {
    labels: caParMois.map(m => MOIS_LABELS[m.mois]),
    datasets: [{
      label: 'CA signé (€)',
      data: caParMois.map(m => m.ca),
      backgroundColor: '#3b82f620',
      borderColor: '#3b82f6',
      borderWidth: 2,
      pointBackgroundColor: '#3b82f6',
      tension: 0.3,
      fill: true,
    }],
  }

  /* ── Données Chart produits ── */
  const produitsChartData = {
    labels: parProduit.slice(0, 6).map(p => FAMILLE_LABELS[p.produit!.famille] ?? p.produit!.nom),
    datasets: [
      {
        label: 'Nb dossiers',
        data: parProduit.slice(0, 6).map(p => p.count),
        backgroundColor: parProduit.slice(0, 6).map(p => (FAMILLE_COLORS[p.produit!.famille] ?? '#22c55e') + '99'),
        borderColor: parProduit.slice(0, 6).map(p => FAMILLE_COLORS[p.produit!.famille] ?? '#22c55e'),
        borderWidth: 1,
      },
    ],
  }

  /* ── Données Chart pipeline ── */
  const pipelineChartData = {
    labels: parEtape.map(e => e.label.replace(' ✓', '')),
    datasets: [{
      data: parEtape.map(e => e.count),
      backgroundColor: parEtape.map(e => e.couleur + '99'),
      borderColor: parEtape.map(e => e.couleur),
      borderWidth: 1,
    }],
  }

  /* ── Données Chart commissions (admin) ── */
  const commChartData = {
    labels: ['Société', 'Commerciaux payées', 'Commerciaux dues', 'Apporteurs'],
    datasets: [{
      data: [commSocieteTotal, commCommerciauxPayees, commCommerciauxDues, commApporteursTotal],
      backgroundColor: ['#8b5cf699', '#10b98199', '#f59e0b99', '#3b82f699'],
      borderColor:     ['#8b5cf6',   '#10b981',   '#f59e0b',   '#3b82f6'],
      borderWidth: 1,
    }],
  }

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } },
  }

  return (
    <div className="space-y-5">

      {/* ── Filtre période ── */}
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-surface-800 text-lg">Rapports & Analyses</h1>
        <div className="flex rounded-lg border border-surface-200 overflow-hidden">
          {(['3mois', '6mois', '12mois', 'tout'] as Periode[]).map(p => (
            <button key={p} onClick={() => setPeriode(p)}
              className={clsx('px-3 py-1.5 text-xs font-medium transition-colors',
                periode === p ? 'bg-brand-600 text-white' : 'text-surface-600 hover:bg-surface-50')}>
              {p === 'tout' ? 'Tout' : p === '3mois' ? '3 mois' : p === '6mois' ? '6 mois' : '12 mois'}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPIs globaux ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'CA signé',        value: formatEuro(caTotal),      color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-100' },
          { label: 'Taux conversion', value: `${tauxConv}%`,           color: 'text-brand-600',  bg: 'bg-brand-50',  border: 'border-brand-100' },
          { label: 'Panier moyen',    value: formatEuro(panierMoyen),  color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100' },
          { label: 'Aides générées',  value: formatEuro(aidesMPR + aidesCEE), color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
        ].map(k => (
          <div key={k.label} className={clsx('bg-white rounded-xl border shadow-card p-5', k.border)}>
            <p className="text-xs text-surface-500 uppercase tracking-wide mb-2">{k.label}</p>
            <p className={clsx('font-display font-bold text-2xl', k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Commissions admin ── */}
      {can('rapports.view_global') && (
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <h3 className="font-display font-semibold text-surface-800 text-sm mb-4">Commissions — vue globale</h3>
          <div className="grid grid-cols-[1fr_280px] gap-6">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Comm. société totale',     value: commSocieteTotal,       color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', sub: 'Depuis la création' },
                { label: 'Comm. société en cours',   value: commSocieteEnCours,     color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', sub: 'Opps actives' },
                { label: 'Comm. commerciaux payées', value: commCommerciauxPayees,  color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-100',  sub: 'Déjà versées' },
                { label: 'Comm. commerciaux dues',   value: commCommerciauxDues,    color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', sub: 'Reste à payer' },
                { label: 'Comm. apporteurs total',   value: commApporteursTotal,    color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100',   sub: 'Tous apporteurs' },
                { label: 'Total commissions dues',   value: commCommerciauxDues + commApporteursTotal, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', sub: 'À décaisser' },
              ].map(k => (
                <div key={k.label} className={clsx('rounded-xl border p-3', k.bg, k.border)}>
                  <p className="text-[10px] text-surface-500 uppercase tracking-wide mb-1">{k.label}</p>
                  <p className={clsx('font-display font-bold text-xl', k.color)}>{formatEuro(k.value)}</p>
                  <p className="text-[10px] text-surface-400 mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>
            <div style={{ height: 220 }}>
              <Doughnut data={commChartData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, padding: 8 } } },
              }} />
            </div>
          </div>
        </div>
      )}

      {/* ── CA mensuel ── */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
        <h3 className="font-display font-semibold text-surface-800 text-sm mb-4">
          CA signé — 12 derniers mois
        </h3>
        <div style={{ height: 220 }}>
          <Line data={caChartData} options={{
            ...chartOptions,
            plugins: { legend: { display: false }, tooltip: {
              callbacks: { label: ctx => ` ${formatEuro(ctx.parsed.y)}` }
            }},
            scales: {
              y: { beginAtZero: true, ticks: { font: { size: 10 }, callback: v => formatEuro(Number(v)) } },
              x: { ticks: { font: { size: 10 } } },
            },
          }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">

        {/* Produits */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <h3 className="font-display font-semibold text-surface-800 text-sm mb-4">Performance par produit</h3>
          <div style={{ height: 200 }}>
            <Bar data={produitsChartData} options={{
              ...chartOptions,
              plugins: { legend: { display: false } },
            }} />
          </div>
          <div className="mt-3 space-y-1.5">
            {parProduit.slice(0, 5).map(({ produit, count, ca }) => (
              <div key={produit!.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm" style={{ background: FAMILLE_COLORS[produit!.famille] ?? '#22c55e', display: 'inline-block' }} />
                  <span className="text-surface-600">{FAMILLE_LABELS[produit!.famille] ?? produit!.nom}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-surface-400">{count} dossiers</span>
                  <span className="font-bold text-surface-700">{formatEuro(ca)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <h3 className="font-display font-semibold text-surface-800 text-sm mb-4">Répartition du pipeline</h3>
          <div style={{ height: 200 }}>
            <Doughnut data={pipelineChartData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: 'right', labels: { font: { size: 10 }, padding: 6 } } },
            }} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-green-50 rounded-lg p-2.5 text-center border border-green-100">
              <p className="font-display font-bold text-lg text-green-600">{nbGagnes}</p>
              <p className="text-[10px] text-green-700">Dossiers gagnés</p>
            </div>
            <div className="bg-red-50 rounded-lg p-2.5 text-center border border-red-100">
              <p className="font-display font-bold text-lg text-red-500">{nbPerdus}</p>
              <p className="text-[10px] text-red-600">Dossiers perdus</p>
            </div>
          </div>
        </div>

        {/* Aides */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <h3 className="font-display font-semibold text-surface-800 text-sm mb-4">Aides financières générées</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
              <p className="font-display font-bold text-xl text-blue-600">{formatEuro(aidesMPR)}</p>
              <p className="text-xs text-blue-700 mt-1">MaPrimeRénov'</p>
            </div>
            <div className="bg-cyan-50 rounded-xl p-4 text-center border border-cyan-100">
              <p className="font-display font-bold text-xl text-cyan-600">{formatEuro(aidesCEE)}</p>
              <p className="text-xs text-cyan-700 mt-1">Certificats CEE</p>
            </div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
            <p className="font-display font-bold text-2xl text-green-600">{formatEuro(aidesMPR + aidesCEE)}</p>
            <p className="text-xs text-green-700">Total aides générées pour les clients</p>
          </div>
        </div>

        {/* Sources */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <h3 className="font-display font-semibold text-surface-800 text-sm mb-4">Sources des contacts</h3>
          <div className="space-y-2.5">
            {parSource.map(([source, count]) => {
              const pct = Math.round(count / Math.max(...parSource.map(s => s[1]), 1) * 100)
              return (
                <div key={source}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-surface-700 truncate flex-1">{source}</span>
                    <span className="text-xs font-bold text-surface-600 ml-2">{count}</span>
                  </div>
                  <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {parSource.length === 0 && <p className="text-xs text-surface-400 text-center py-4">Aucune donnée</p>}
          </div>
        </div>

      </div>

      {/* ── Par commercial (admin uniquement) ── */}
      {can('rapports.view_global') && parCommercial.length > 0 && (
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <h3 className="font-display font-semibold text-surface-800 text-sm mb-4">Performance par commercial</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="text-left text-[10px] font-bold text-surface-400 uppercase tracking-wider pb-2">Commercial</th>
                  <th className="text-right text-[10px] font-bold text-surface-400 uppercase tracking-wider pb-2">Dossiers</th>
                  <th className="text-right text-[10px] font-bold text-surface-400 uppercase tracking-wider pb-2">CA signé</th>
                  <th className="text-right text-[10px] font-bold text-surface-400 uppercase tracking-wider pb-2">Comm. due</th>
                  <th className="text-right text-[10px] font-bold text-surface-400 uppercase tracking-wider pb-2">Comm. payée</th>
                  <th className="text-right text-[10px] font-bold text-surface-400 uppercase tracking-wider pb-2">Reste</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {parCommercial.map(c => (
                  <tr key={c.id} className="hover:bg-surface-50">
                    <td className="py-2 text-surface-700 font-medium">{c.id.slice(0, 8)}…</td>
                    <td className="py-2 text-right text-surface-600">{c.nb}</td>
                    <td className="py-2 text-right font-bold text-green-600">{formatEuro(c.ca)}</td>
                    <td className="py-2 text-right text-surface-600">{formatEuro(c.commDue)}</td>
                    <td className="py-2 text-right text-green-600">{formatEuro(c.commPayee)}</td>
                    <td className="py-2 text-right font-bold text-orange-600">{formatEuro(Math.max(0, c.commDue - c.commPayee))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-surface-400 mt-2">* Les noms des commerciaux s'afficheront une fois la table profiles connectée</p>
        </div>
      )}

    </div>
  )
}