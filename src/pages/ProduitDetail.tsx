import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Euro, Zap, Star } from 'lucide-react'
import { useProduitsStore } from '@/store/produitsStore'
import { useInstallateursStore } from '@/store/installateurStore'
import { useAuth } from '@/hooks/useAuth'
import { formatEuro } from '@/utils/formatters'
import { calculerAideMPR, calculerAideCEE, calculerResteACharge, calculerTrancheMPR, LABELS_TRANCHE, COULEURS_TRANCHE } from '@/utils/aides'
import Badge, { FAMILLE_LABELS, FAMILLE_COLORS } from '@/components/ui/Badge'
import type { TrancheMPR } from '@/types/contact'

export default function ProduitDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { can } = useAuth()
  const { getById } = useProduitsStore()
  const { installateurs } = useInstallateursStore()
  const produit = getById(id!)

  // Simulateur
  const [montant,     setMontant]     = useState(produit?.prixMoyenVente ?? 0)
  const [revenu,      setRevenu]      = useState(28000)
  const [personnes,   setPersonnes]   = useState(3)
  const [surface,     setSurface]     = useState(50)

  if (!produit) return (
    <div className="text-center py-20">
      <p className="text-surface-400">Produit introuvable</p>
      <button onClick={() => navigate('/produits')} className="text-brand-600 text-sm mt-2">← Retour</button>
    </div>
  )

  const tranche     = calculerTrancheMPR(revenu, personnes) as TrancheMPR
  const aideMPR     = calculerAideMPR(produit, tranche, montant)
  const aideCEE     = calculerAideCEE(produit, surface)
  const resteCharge = calculerResteACharge(montant, aideMPR, aideCEE)

  const mesInstallateurs = installateurs.filter(i => produit.installateurIds.includes(i.id) && i.actif)

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/produits')}
          className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 transition-colors">
          <ArrowLeft size={16} /> Catalogue
        </button>
        <Badge label={FAMILLE_LABELS[produit.famille] ?? produit.famille} color={FAMILLE_COLORS[produit.famille]} size="md" />
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-5">
        {/* Infos produit */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-6">
            <h1 className="font-display font-bold text-surface-900 text-xl mb-2">{produit.nom}</h1>
            <p className="text-sm text-surface-600 leading-relaxed">{produit.description}</p>

            {/* Caractéristiques */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              {produit.caracteristiques.map(c => (
                <div key={c.label} className="bg-surface-50 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">{c.label}</p>
                  <p className="text-sm font-semibold text-surface-800 mt-0.5">{c.valeur}</p>
                </div>
              ))}
            </div>

            {/* Prix */}
            {can('produits.view_prix') && (
              <div className="mt-5 pt-5 border-t border-surface-100">
                <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">Tarification</p>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="font-display font-bold text-2xl text-surface-900">{formatEuro(produit.prixMoyenVente)}</p>
                    <p className="text-[10px] text-surface-500">Prix moyen</p>
                  </div>
                  <div className="h-10 w-px bg-surface-200" />
                  <div className="text-center">
                    <p className="font-display font-semibold text-surface-700">{formatEuro(produit.prixMin)}</p>
                    <p className="text-[10px] text-surface-500">Minimum</p>
                  </div>
                  <div className="h-10 w-px bg-surface-200" />
                  <div className="text-center">
                    <p className="font-display font-semibold text-surface-700">{formatEuro(produit.prixMax)}</p>
                    <p className="text-[10px] text-surface-500">Maximum</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Aides indicatives */}
          {produit.aidesMPR.length > 0 && (
            <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
              <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-4">Aides MaPrimeRénov' indicatives</p>
              <div className="space-y-2">
                {produit.aidesMPR.map(aide => (
                  <div key={aide.tranche} className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: aide.couleur + '10' }}>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: aide.couleur }} />
                    <span className="text-xs font-semibold text-surface-700 flex-1">{aide.label}</span>
                    <span className="text-xs font-bold" style={{ color: aide.couleur }}>
                      {formatEuro(aide.montantMin)} – {formatEuro(aide.montantMax)}
                    </span>
                    <span className="text-[10px] text-surface-400">{aide.tauxMin}–{aide.tauxMax}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Aides CEE */}
          {produit.aidesCEE.length > 0 && (
            <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
              <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-4">Aides CEE applicables</p>
              <div className="space-y-2">
                {produit.aidesCEE.map(cee => (
                  <div key={cee.code} className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                    <div>
                      <p className="text-xs font-bold text-cyan-700">{cee.code}</p>
                      <p className="text-[10px] text-cyan-600">{cee.label}</p>
                      {cee.conditions && <p className="text-[10px] text-surface-500 mt-0.5">{cee.conditions}</p>}
                    </div>
                    <p className="text-sm font-bold text-cyan-700">
                      {formatEuro(cee.montantIndicatif)} {cee.unite !== '€' ? cee.unite : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Installateurs */}
          {mesInstallateurs.length > 0 && (
            <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
              <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-4">Installateurs partenaires</p>
              <div className="space-y-3">
                {mesInstallateurs.map(inst => (
                  <button key={inst.id} onClick={() => navigate('/installateurs')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-surface-200 hover:border-brand-200 hover:bg-surface-50 transition-all text-left">
                    <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs flex-shrink-0">
                      {inst.raisonSociale.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-surface-800 truncate">{inst.raisonSociale}</p>
                      <p className="text-[10px] text-surface-500">{inst.zonesIntervention.join(', ')}</p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={11} fill="currentColor" />
                      <span className="text-[10px] font-bold">{inst.note}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Simulateur aides */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-brand-200 shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center">
                <Zap size={14} className="text-brand-600" />
              </div>
              <h3 className="font-display font-semibold text-surface-800 text-sm">Simulateur d'aides</h3>
            </div>

            <div className="space-y-4">
              <SimField label="Montant des travaux (€)">
                <input type="range" min={produit.prixMin} max={produit.prixMax} step={500}
                  value={montant} onChange={e => setMontant(Number(e.target.value))}
                  className="w-full accent-brand-600" />
                <div className="flex justify-between text-[10px] text-surface-400 mt-0.5">
                  <span>{formatEuro(produit.prixMin)}</span>
                  <span className="font-bold text-brand-600">{formatEuro(montant)}</span>
                  <span>{formatEuro(produit.prixMax)}</span>
                </div>
              </SimField>

              {produit.aidesMPR.length > 0 && (
                <>
                  <SimField label="Revenu fiscal de référence (€)">
                    <input type="number" value={revenu} onChange={e => setRevenu(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-surface-200 text-xs outline-none focus:border-brand-400" />
                  </SimField>
                  <SimField label="Personnes au foyer">
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setPersonnes(n)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            personnes === n ? 'bg-brand-600 border-brand-600 text-white' : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                          }`}>{n}</button>
                      ))}
                    </div>
                  </SimField>
                </>
              )}

              {produit.aidesCEE.some(c => c.unite === '€/m²') && (
                <SimField label="Surface concernée (m²)">
                  <input type="number" value={surface} onChange={e => setSurface(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 text-xs outline-none focus:border-brand-400" />
                </SimField>
              )}
            </div>

            {/* Résultats */}
            <div className="mt-5 pt-4 border-t border-surface-100 space-y-2">
              {produit.aidesMPR.length > 0 && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-surface-600">Tranche MPR</p>
                    <p className="text-[10px] font-medium" style={{ color: COULEURS_TRANCHE[tranche] }}>
                      {LABELS_TRANCHE[tranche]}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-blue-600">−{formatEuro(aideMPR)}</p>
                </div>
              )}
              {produit.aidesCEE.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-surface-600">Aide CEE</p>
                  <p className="text-sm font-bold text-cyan-600">−{formatEuro(aideCEE)}</p>
                </div>
              )}
              <div className="pt-2 border-t border-surface-100 flex items-center justify-between">
                <p className="text-xs font-semibold text-surface-700">Reste à charge estimé</p>
                <p className="font-display font-bold text-lg text-green-600">{formatEuro(resteCharge)}</p>
              </div>
              <p className="text-[10px] text-surface-400 text-center mt-1">
                Simulation indicative — montants réels variables selon dossier
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SimField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  )
}