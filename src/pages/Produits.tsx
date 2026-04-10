import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, ChevronRight, Euro, Tag } from 'lucide-react'
import { useProduitsStore } from '@/store/produitsStore'
import { useAuth } from '@/hooks/useAuth'
import { formatEuro } from '@/utils/formatters'
import Badge, { FAMILLE_LABELS, FAMILLE_COLORS } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import clsx from 'clsx'

export default function Produits() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const { produits } = useProduitsStore()
  const [categorie, setCategorie] = useState<'tous' | 'particulier' | 'professionnel'>('tous')

  const filtered = produits.filter(p =>
    p.actif && (categorie === 'tous' || p.categorie === categorie)
  )

  const particuliers    = produits.filter(p => p.actif && p.categorie === 'particulier')
  const professionnels  = produits.filter(p => p.actif && p.categorie === 'professionnel')

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total produits',   value: produits.filter(p => p.actif).length, color: 'bg-brand-50 text-brand-600' },
          { label: 'Particuliers',     value: particuliers.length,                   color: 'bg-blue-50 text-blue-600' },
          { label: 'Professionnels',   value: professionnels.length,                 color: 'bg-purple-50 text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-surface-200 shadow-card p-4 flex items-center gap-4">
            <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', s.color)}>
              <Package size={18} />
            </div>
            <div>
              <p className="font-display font-bold text-2xl text-surface-900">{s.value}</p>
              <p className="text-xs text-surface-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2">
        {(['tous', 'particulier', 'professionnel'] as const).map(c => (
          <button key={c} onClick={() => setCategorie(c)}
            className={clsx('px-4 py-2 rounded-lg text-xs font-semibold transition-colors',
              categorie === c ? 'bg-brand-600 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50')}>
            {c === 'tous' ? 'Tous' : c === 'particulier' ? 'Particuliers' : 'Professionnels'}
          </button>
        ))}
      </div>

      {/* Grille produits */}
      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="Aucun produit" description="Aucun produit actif dans cette catégorie." />
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(produit => (
            <button key={produit.id} onClick={() => navigate(`/produits/${produit.id}`)}
              className="bg-white rounded-xl border border-surface-200 shadow-card hover:shadow-card-hover hover:border-brand-200 transition-all text-left p-5 group">
              {/* Badge famille */}
              <div className="flex items-start justify-between mb-3">
                <Badge label={FAMILLE_LABELS[produit.famille] ?? produit.famille} color={FAMILLE_COLORS[produit.famille]} size="md" />
                <ChevronRight size={14} className="text-surface-300 group-hover:text-brand-400 transition-colors mt-0.5" />
              </div>

              {/* Nom */}
              <h3 className="font-display font-semibold text-surface-800 text-sm leading-snug mb-1">
                {produit.nom}
              </h3>
              <p className="text-[11px] text-surface-500 line-clamp-2 mb-4">{produit.description}</p>

              {/* Prix */}
              {can('produits.view_prix') && (
                <div className="flex items-center gap-2 mb-3">
                  <Euro size={12} className="text-surface-400" />
                  <span className="text-xs font-bold text-surface-700">{formatEuro(produit.prixMoyenVente)}</span>
                  <span className="text-[10px] text-surface-400">moy. · {formatEuro(produit.prixMin)} – {formatEuro(produit.prixMax)}</span>
                </div>
              )}

              {/* Aides */}
              <div className="flex flex-wrap gap-1">
                {produit.aidesMPR.length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">MPR</span>
                )}
                {produit.aidesCEE.map(cee => (
                  <span key={cee.code} className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-cyan-100 text-cyan-700">
                    {cee.code}
                  </span>
                ))}
                {produit.aidesMPR.length === 0 && produit.aidesCEE.length === 0 && (
                  <span className="text-[9px] text-surface-400">Sans aide spécifique</span>
                )}
              </div>

              {/* Nb installateurs */}
              <div className="mt-3 pt-3 border-t border-surface-100 flex items-center gap-1.5">
                <Tag size={10} className="text-surface-400" />
                <span className="text-[10px] text-surface-400">
                  {produit.installateurIds.length} installateur{produit.installateurIds.length > 1 ? 's' : ''} partenaire{produit.installateurIds.length > 1 ? 's' : ''}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}