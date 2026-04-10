import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useOpportunitesStore } from '@/store/opportunitesStore'
import { useContactsStore } from '@/store/contactsStore'
import { useProduitsStore } from '@/store/produitsStore'
import { formatEuro } from '@/utils/formatters'
import { FAMILLE_LABELS, FAMILLE_COLORS } from '@/components/ui/Badge'
import { ETAPES_PIPELINE } from '@/types/opportunite'
import clsx from 'clsx'

export default function Rapports() {
  const { user, can } = useAuth()
  const { opportunites } = useOpportunitesStore()
  const { contacts }     = useContactsStore()
  const { produits }     = useProduitsStore()

  const myOpps = useMemo(() => {
    if (can('rapports.view_global')) return opportunites
    return opportunites.filter(o => o.commercialId === user?.id)
  }, [opportunites, user, can])

  const myContacts = useMemo(() => {
    if (can('rapports.view_global')) return contacts
    return contacts.filter(c => c.commercialId === user?.id)
  }, [contacts, user, can])

  // KPIs globaux
  const caTotal     = myOpps.filter(o => ['signe', 'pose_livree'].includes(o.etape)).reduce((s, o) => s + (o.montantDevis ?? 0), 0)
  const aidesMPR    = myOpps.reduce((s, o) => s + (o.montantAidesMPR ?? 0), 0)
  const aidesCEE    = myOpps.reduce((s, o) => s + (o.montantAidesCEE ?? 0), 0)
  const nbGagnes    = myOpps.filter(o => ['signe', 'pose_livree'].includes(o.etape)).length
  const nbPerdus    = myOpps.filter(o => o.etape === 'perdu').length
  const nbTotal     = myOpps.filter(o => !['nouveau_lead'].includes(o.etape)).length
  const tauxConv    = nbTotal > 0 ? Math.round(nbGagnes / nbTotal * 100) : 0
  const panierMoyen = nbGagnes > 0 ? Math.round(caTotal / nbGagnes) : 0

  // Par produit
  const parProduit = useMemo(() => {
    const acc: Record<string, { count: number; ca: number }> = {}
    myOpps.forEach(o => {
      if (!acc[o.produitId]) acc[o.produitId] = { count: 0, ca: 0 }
      acc[o.produitId].count++
      if (['signe', 'pose_livree'].includes(o.etape)) acc[o.produitId].ca += o.montantDevis ?? 0
    })
    return Object.entries(acc)
      .map(([pid, data]) => ({ produit: produits.find(p => p.id === pid), ...data }))
      .filter(x => x.produit)
      .sort((a, b) => b.count - a.count)
  }, [myOpps, produits])

  const maxCount = Math.max(...parProduit.map(p => p.count), 1)

  // Par étape
  const parEtape = ETAPES_PIPELINE.map(e => ({
    ...e, count: myOpps.filter(o => o.etape === e.id).length,
  }))

  // Par source
  const parSource = useMemo(() => {
    const acc: Record<string, number> = {}
    myContacts.forEach(c => {
      const s = c.source ?? 'Inconnue'
      acc[s] = (acc[s] ?? 0) + 1
    })
    return Object.entries(acc).sort((a, b) => b[1] - a[1])
  }, [myContacts])
  const maxSource = Math.max(...parSource.map(s => s[1]), 1)

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'CA signé total',  value: formatEuro(caTotal),   color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Taux conversion', value: `${tauxConv}%`,        color: 'text-brand-600',  bg: 'bg-brand-50' },
          { label: 'Panier moyen',    value: formatEuro(panierMoyen), color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Aides générées',  value: formatEuro(aidesMPR + aidesCEE), color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <p className="text-xs text-surface-500 mb-2">{k.label}</p>
            <p className={clsx('font-display font-bold text-2xl', k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Par produit */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <h3 className="font-display font-semibold text-surface-800 text-sm mb-4">Performance par produit</h3>
          <div className="space-y-3">
            {parProduit.map(({ produit, count, ca }) => (
              <div key={produit!.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-surface-700 font-medium">{FAMILLE_LABELS[produit!.famille] ?? produit!.nom}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-surface-400">{count} dossiers</span>
                    <span className="text-xs font-bold text-surface-700">{formatEuro(ca)}</span>
                  </div>
                </div>
                <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.round(count / maxCount * 100)}%`, background: FAMILLE_COLORS[produit!.famille] ?? '#22c55e' }} />
                </div>
              </div>
            ))}
            {parProduit.length === 0 && <p className="text-xs text-surface-400 text-center py-4">Aucune donnée</p>}
          </div>
        </div>

        {/* Par étape */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <h3 className="font-display font-semibold text-surface-800 text-sm mb-4">Répartition du pipeline</h3>
          <div className="space-y-2">
            {parEtape.filter(e => e.count > 0).map(e => (
              <div key={e.id} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.couleur }} />
                <span className="text-xs text-surface-600 flex-1">{e.label.replace(' ✓', '')}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.round(e.count / myOpps.length * 100)}%`, background: e.couleur }} />
                  </div>
                  <span className="text-xs font-bold text-surface-700 w-4 text-right">{e.count}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Résumé gains / pertes */}
          <div className="mt-4 pt-4 border-t border-surface-100 grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="font-display font-bold text-xl text-green-600">{nbGagnes}</p>
              <p className="text-[10px] text-green-700">Dossiers gagnés</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="font-display font-bold text-xl text-red-500">{nbPerdus}</p>
              <p className="text-[10px] text-red-600">Dossiers perdus</p>
            </div>
          </div>
        </div>

        {/* Aides générées */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <h3 className="font-display font-semibold text-surface-800 text-sm mb-4">Aides financières générées</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
              <p className="font-display font-bold text-2xl text-blue-600">{formatEuro(aidesMPR)}</p>
              <p className="text-xs text-blue-700 mt-1">MaPrimeRénov'</p>
            </div>
            <div className="bg-cyan-50 rounded-xl p-4 text-center border border-cyan-100">
              <p className="font-display font-bold text-2xl text-cyan-600">{formatEuro(aidesCEE)}</p>
              <p className="text-xs text-cyan-700 mt-1">Certificats CEE</p>
            </div>
          </div>
          <div className="mt-3 bg-green-50 rounded-xl p-4 text-center border border-green-100">
            <p className="font-display font-bold text-2xl text-green-600">{formatEuro(aidesMPR + aidesCEE)}</p>
            <p className="text-xs text-green-700">Total aides générées pour les clients</p>
          </div>
        </div>

        {/* Sources */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <h3 className="font-display font-semibold text-surface-800 text-sm mb-4">Sources des contacts</h3>
          <div className="space-y-2.5">
            {parSource.map(([source, count]) => (
              <div key={source}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-surface-700 truncate flex-1">{source}</span>
                  <span className="text-xs font-bold text-surface-600 ml-2">{count}</span>
                </div>
                <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-400 rounded-full"
                    style={{ width: `${Math.round(count / maxSource * 100)}%` }} />
                </div>
              </div>
            ))}
            {parSource.length === 0 && <p className="text-xs text-surface-400 text-center py-4">Aucune donnée</p>}
          </div>
        </div>
      </div>
    </div>
  )
}