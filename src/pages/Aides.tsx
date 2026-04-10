import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, ChevronRight } from 'lucide-react'
import { useProduitsStore } from '@/store/produitsStore'
import { formatEuro } from '@/utils/formatters'
import { calculerTrancheMPR, calculerAideMPR, calculerAideCEE, calculerResteACharge, LABELS_TRANCHE, COULEURS_TRANCHE } from '@/utils/aides'
import Badge, { FAMILLE_LABELS, FAMILLE_COLORS } from '@/components/ui/Badge'
import type { TrancheMPR } from '@/types/contact'
import clsx from 'clsx'

export default function Aides() {
  const navigate = useNavigate()
  const { produits } = useProduitsStore()

  const [revenu,    setRevenu]    = useState(28000)
  const [personnes, setPersonnes] = useState(3)
  const [surface,   setSurface]   = useState(50)
  const [montants,  setMontants]  = useState<Record<string, number>>({})

  const tranche = calculerTrancheMPR(revenu, personnes) as TrancheMPR

  const produitsAvecAides = useMemo(() =>
    produits.filter(p => p.actif && (p.aidesMPR.length > 0 || p.aidesCEE.length > 0))
  , [produits])

  function getMontant(produitId: string, defaut: number) {
    return montants[produitId] ?? defaut
  }

  return (
    <div className="space-y-6">
      {/* Simulateur profil */}
      <div className="bg-white rounded-xl border border-brand-200 shadow-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center">
            <Zap size={18} className="text-brand-600" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-surface-800">Simulateur global d'aides</h2>
            <p className="text-xs text-surface-500">Renseignez le profil du ménage pour voir les aides sur tous les produits</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div>
            <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-2">
              Revenu fiscal de référence (€)
            </label>
            <input type="number" value={revenu} onChange={e => setRevenu(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-2">
              Personnes au foyer
            </label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setPersonnes(n)}
                  className={clsx('flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors',
                    personnes === n ? 'bg-brand-600 border-brand-600 text-white' : 'border-surface-200 text-surface-600 hover:bg-surface-50')}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-2">
              Surface de référence (m²)
            </label>
            <input type="number" value={surface} onChange={e => setSurface(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          </div>
        </div>

        {/* Tranche calculée */}
        <div className="mt-4 flex items-center gap-3 p-3 rounded-xl border"
          style={{ borderColor: COULEURS_TRANCHE[tranche] + '40', background: COULEURS_TRANCHE[tranche] + '10' }}>
          <div className="w-4 h-4 rounded-full" style={{ background: COULEURS_TRANCHE[tranche] }} />
          <p className="text-sm font-semibold text-surface-700">
            Tranche MaPrimeRénov' calculée :
            <span className="ml-2 font-bold" style={{ color: COULEURS_TRANCHE[tranche] }}>
              {LABELS_TRANCHE[tranche]}
            </span>
          </p>
        </div>
      </div>

      {/* Tableau des aides par produit */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-100">
          <h3 className="font-display font-semibold text-surface-800">Aides disponibles par produit</h3>
        </div>
        <div className="divide-y divide-surface-50">
          {produitsAvecAides.map(produit => {
            const montant = getMontant(produit.id, produit.prixMoyenVente)
            const aideMPR = calculerAideMPR(produit, tranche, montant)
            const aideCEE = calculerAideCEE(produit, surface)
            const reste   = calculerResteACharge(montant, aideMPR, aideCEE)
            const pctAide = montant > 0 ? Math.round((aideMPR + aideCEE) / montant * 100) : 0

            return (
              <div key={produit.id} className="px-5 py-4 hover:bg-surface-50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Produit */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge label={FAMILLE_LABELS[produit.famille] ?? produit.famille} color={FAMILLE_COLORS[produit.famille]} />
                    </div>
                    <p className="text-sm font-semibold text-surface-800">{produit.nom}</p>

                    {/* Slider montant */}
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-[10px] text-surface-500 whitespace-nowrap">Montant :</span>
                      <input type="range" min={produit.prixMin} max={produit.prixMax} step={500}
                        value={montant} onChange={e => setMontants(m => ({ ...m, [produit.id]: Number(e.target.value) }))}
                        className="flex-1 accent-brand-600 h-1" />
                      <span className="text-xs font-bold text-surface-700 whitespace-nowrap w-20 text-right">{formatEuro(montant)}</span>
                    </div>
                  </div>

                  {/* Aides */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {aideMPR > 0 && (
                      <div className="text-center">
                        <p className="text-sm font-bold text-blue-600">−{formatEuro(aideMPR)}</p>
                        <p className="text-[10px] text-surface-400">MPR</p>
                      </div>
                    )}
                    {aideCEE > 0 && (
                      <div className="text-center">
                        <p className="text-sm font-bold text-cyan-600">−{formatEuro(aideCEE)}</p>
                        <p className="text-[10px] text-surface-400">CEE</p>
                      </div>
                    )}
                    <div className="text-center border-l border-surface-200 pl-4">
                      <p className="font-display font-bold text-lg text-green-600">{formatEuro(reste)}</p>
                      <p className="text-[10px] text-surface-400">Reste à charge</p>
                      {pctAide > 0 && (
                        <p className="text-[10px] font-bold text-green-500">{pctAide}% pris en charge</p>
                      )}
                    </div>
                    <button onClick={() => navigate(`/produits/${produit.id}`)}
                      className="p-2 rounded-lg hover:bg-brand-50 text-surface-400 hover:text-brand-600 transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Note légale */}
      <p className="text-xs text-surface-400 text-center">
        Simulation indicative basée sur les barèmes MaPrimeRénov' 2024 zone B2/C (Aude).
        Les montants réels dépendent du dossier validé par l'ANAH.
      </p>
    </div>
  )
}