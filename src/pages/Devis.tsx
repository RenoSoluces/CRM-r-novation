import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, ChevronRight, Euro } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useOpportunitesStore } from '@/store/opportunitesStore'
import { useContactsStore } from '@/store/contactsStore'
import { useProduitsStore } from '@/store/produitsStore'
import { formatEuro, formatDate } from '@/utils/formatters'
import Badge, { FAMILLE_LABELS, FAMILLE_COLORS, STATUT_DOSSIER_COLORS, STATUT_DOSSIER_LABELS } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'

// Un "devis" = toute opportunité ayant un montantDevis défini
export default function Devis() {
  const { user, can } = useAuth()
  const navigate = useNavigate()
  const { opportunites } = useOpportunitesStore()
  const { contacts }     = useContactsStore()
  const { produits }     = useProduitsStore()

  const devis = useMemo(() => {
    const all = can('devis.view_all') ? opportunites
      : opportunites.filter(o => o.commercialId === user?.id)
    return all.filter(o => o.montantDevis !== undefined)
      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
  }, [opportunites, user, can])

  const totalCA   = devis.filter(d => ['signe', 'pose_livree'].includes(d.etape)).reduce((s, d) => s + (d.montantDevis ?? 0), 0)
  const totalPipe = devis.filter(d => !['perdu', 'pose_livree', 'sav_suivi'].includes(d.etape)).reduce((s, d) => s + (d.montantDevis ?? 0), 0)

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Devis total',       value: devis.length,      sub: 'tous statuts',       color: 'bg-surface-100 text-surface-600' },
          { label: 'CA signé',          value: formatEuro(totalCA), sub: 'contrats signés',  color: 'bg-green-50 text-green-600' },
          { label: 'Pipeline',          value: formatEuro(totalPipe), sub: 'en cours',        color: 'bg-blue-50 text-blue-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${k.color}`}>
              <Euro size={18} />
            </div>
            <p className="font-display font-bold text-xl text-surface-900">{k.value}</p>
            <p className="text-xs text-surface-500">{k.label}</p>
            <p className="text-[10px] text-surface-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        {devis.length === 0 ? (
          <EmptyState icon={FileText} title="Aucun devis" description="Les devis apparaîtront ici dès qu'un montant est saisi sur une opportunité." />
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  {['Référence', 'Client', 'Produit', 'Montant HT', 'Aide MPR', 'Aide CEE', 'Net client', 'Statut MPR', 'Date', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {devis.map(d => {
                  const contact = contacts.find(c => c.id === d.contactId)
                  const produit = produits.find(p => p.id === d.produitId)
                  return (
                    <tr key={d.id} onClick={() => navigate(`/opportunites/${d.id}`)}
                      className="hover:bg-surface-50 cursor-pointer transition-colors">
                      <td className="px-4 py-3.5 text-xs font-mono font-medium text-surface-700">{d.reference}</td>
                      <td className="px-4 py-3.5 text-xs font-medium text-surface-800">
                        {contact ? `${contact.prenom} ${contact.nom}` : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        {produit && <Badge label={FAMILLE_LABELS[produit.famille] ?? produit.nom} color={FAMILLE_COLORS[produit.famille]} />}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-bold text-surface-800">{formatEuro(d.montantDevis)}</td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-blue-600">{d.montantAidesMPR ? `−${formatEuro(d.montantAidesMPR)}` : '—'}</td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-cyan-600">{d.montantAidesCEE ? `−${formatEuro(d.montantAidesCEE)}` : '—'}</td>
                      <td className="px-4 py-3.5 text-xs font-bold text-green-600">{d.montantNet ? formatEuro(d.montantNet) : '—'}</td>
                      <td className="px-4 py-3.5">
                        {d.dossierMPR
                          ? <Badge label={STATUT_DOSSIER_LABELS[d.dossierMPR.statut]} color={STATUT_DOSSIER_COLORS[d.dossierMPR.statut]} />
                          : <span className="text-surface-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-surface-400">{formatDate(d.dateDevis ?? d.dateCreation)}</td>
                      <td className="px-4 py-3.5"><ChevronRight size={14} className="text-surface-300" /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-surface-100 bg-surface-50">
              <p className="text-xs text-surface-500">{devis.length} devis</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}