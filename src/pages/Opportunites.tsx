import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, LayoutGrid, List, Euro, ChevronRight, Search, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useOpportunitesStore } from '@/store/opportunitesStore'
import { useContactsStore } from '@/store/contactsStore'
import { useProduitsStore } from '@/store/produitsStore'
import { useUtilisateursStore } from '@/store/utilisateursStore'
import { formatEuro, formatDate, truncate } from '@/utils/formatters'
import Badge, { FAMILLE_LABELS, FAMILLE_COLORS, STATUT_DOSSIER_COLORS, STATUT_DOSSIER_LABELS } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { ETAPES_PIPELINE, type EtapePipeline } from '@/types/opportunite'
import clsx from 'clsx'

type Onglet = 'actives' | 'terminees' | 'perdues'

// ── FIX : toutes les étapes sauf 'perdu' dans le kanban ──
const ETAPES_KANBAN = ETAPES_PIPELINE.filter(e => e.id !== 'perdu')

function isActive(o: any) {
  if (o.etape === 'perdu') return false

  return !(o.dateInstallation && o.datePaiementPartenaire)
}

function isTerminee(o: any) {
  return !!o.dateInstallation && !!o.datePaiementPartenaire
}

export default function Opportunites() {
  const { user, can } = useAuth()
  const navigate = useNavigate()
  const { opportunites, moveEtape, fetchOpportunites }   = useOpportunitesStore()
  const { contacts }                                      = useContactsStore()
  const { produits }                                      = useProduitsStore()
  const { utilisateurs, fetchUtilisateurs }               = useUtilisateursStore()

  const [onglet, setOnglet] = useState<Onglet>('actives')
  const [vue,    setVue]    = useState<'kanban' | 'liste'>('kanban')
  const [search, setSearch] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)

  useEffect(() => {
    fetchOpportunites()
    fetchUtilisateurs()
  }, [])

  /* ── Opps selon le rôle ── */
  const myOpps = useMemo(() => {
    const all = can('opportunites.view_all') ? opportunites
      : user?.role === 'apporteur' ? opportunites.filter(o => o.apporteurId === user.id)
      : opportunites.filter(o => o.commercialId === user?.id)
    return search
      ? all.filter(o => {
          const c = contacts.find(ct => ct.id === o.contactId)
          return o.reference.toLowerCase().includes(search.toLowerCase()) ||
            (c && `${c.prenom} ${c.nom}`.toLowerCase().includes(search.toLowerCase()))
        })
      : all
  }, [opportunites, user, can, search, contacts])

  /* ── Séparation actives / terminées / perdues ── */
  const oppsActives   = useMemo(() => myOpps.filter(isActive),                       [myOpps])
  const oppsTerminees = useMemo(() => myOpps.filter(isTerminee),                     [myOpps])
  const oppsPerdues   = useMemo(() => myOpps.filter(o => o.etape === 'perdu'),       [myOpps])

  const oppsOnglet = onglet === 'actives' ? oppsActives
    : onglet === 'terminees' ? oppsTerminees
    : oppsPerdues

  /* ── KPIs ── */
  const valeurPipeline  = oppsActives.reduce((s, o) => s + (o.montantDevis ?? 0), 0)
  const valeurTerminees = oppsTerminees.reduce((s, o) => s + (o.montantDevis ?? 0), 0)

  /* ── Helper nom commercial ── */
  function getNomCommercial(commercialId: string) {
    const u = utilisateurs.find(u => u.id === commercialId)
    return u ? `${u.prenom} ${u.nom}` : null
  }

  function onDragStart(oppId: string) { setDragId(oppId) }
  function onDrop(etape: EtapePipeline) {
    if (dragId) { moveEtape(dragId, etape); setDragId(null) }
  }

  return (
    <div className="space-y-4">

      {/* ── KPIs ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pipeline actif',    value: formatEuro(valeurPipeline),   color: 'bg-orange-50 text-orange-500' },
          { label: 'Dossiers actifs',   value: String(oppsActives.length),   color: 'bg-blue-50 text-blue-600' },
          { label: 'Dossiers terminés', value: String(oppsTerminees.length), color: 'bg-green-50 text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-surface-200 shadow-card p-4">
            <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center mb-2', s.color)}>
              <Euro size={16} />
            </div>
            <p className="font-display font-bold text-xl text-surface-900">{s.value}</p>
            <p className="text-xs text-surface-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Barre d'outils ── */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* Onglets */}
        <div className="flex rounded-lg border border-surface-200 overflow-hidden bg-white">
          {([
            { key: 'actives',   label: 'Actives',   count: oppsActives.length,   color: 'text-orange-600' },
            { key: 'terminees', label: 'Terminées', count: oppsTerminees.length, color: 'text-green-600'  },
            { key: 'perdues',   label: 'Perdues',   count: oppsPerdues.length,   color: 'text-red-500'    },
          ] as const).map(o => (
            <button key={o.key} onClick={() => { setOnglet(o.key); if (o.key !== 'actives') setVue('liste') }}
              className={clsx('px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5',
                onglet === o.key ? 'bg-brand-600 text-white' : 'text-surface-600 hover:bg-surface-50')}>
              {o.label}
              <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                onglet === o.key ? 'bg-white/20 text-white' : 'bg-surface-100 ' + o.color)}>
                {o.count}
              </span>
            </button>
          ))}
        </div>

        {/* Recherche */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-200 bg-white flex-1 max-w-64">
          <Search size={14} className="text-surface-400" />
          <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-xs text-surface-700 placeholder-surface-400 outline-none w-full" />
        </div>

        {/* Switch kanban/liste — actives uniquement */}
        {onglet === 'actives' && (
          <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-1">
            <button onClick={() => setVue('kanban')}
              className={clsx('p-1.5 rounded-md transition-colors',
                vue === 'kanban' ? 'bg-white shadow-sm text-brand-600' : 'text-surface-500 hover:text-surface-700')}>
              <LayoutGrid size={15} />
            </button>
            <button onClick={() => setVue('liste')}
              className={clsx('p-1.5 rounded-md transition-colors',
                vue === 'liste' ? 'bg-white shadow-sm text-brand-600' : 'text-surface-500 hover:text-surface-700')}>
              <List size={15} />
            </button>
          </div>
        )}

        {can('opportunites.create') && (
          <button onClick={() => navigate('/contacts')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm ml-auto">
            <Plus size={14} /> Nouvelle opportunité
          </button>
        )}
      </div>

      {/* ── Kanban actives ── */}
      {onglet === 'actives' && vue === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {ETAPES_KANBAN.map(etape => {
            const items  = oppsActives.filter(o => o.etape === etape.id)
            const valeur = items.reduce((s, o) => s + (o.montantDevis ?? 0), 0)
            return (
              <div key={etape.id} className="min-w-[220px] flex-shrink-0"
                onDragOver={e => e.preventDefault()}
                onDrop={() => onDrop(etape.id)}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: etape.couleur }} />
                    <span className="text-[11px] font-bold text-surface-600 uppercase tracking-wide">
                      {etape.label.replace(' ✓', '')}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: etape.couleur + '20', color: etape.couleur }}>
                    {items.length}
                  </span>
                </div>
                {valeur > 0 && (
                  <p className="text-[10px] text-surface-400 px-1 mb-2">{formatEuro(valeur)}</p>
                )}
                <div className="space-y-2">
                  {items.map(opp => {
                    const contact   = contacts.find(c => c.id === opp.contactId)
                    const produit   = produits.find(p => p.id === opp.produitId)
                    const nomCommercial = getNomCommercial(opp.commercialId)
                    const commSoc       = opp.commission?.montantSociete ?? 0
                    const commPayee     = opp.commissionPayee ?? 0
                    const commEnAttente = commSoc > 0 && commPayee < commSoc
                    return (
                      <div key={opp.id} draggable
                        onDragStart={() => onDragStart(opp.id)}
                        onClick={() => navigate(`/opportunites/${opp.id}`)}
                        className={clsx(
                          'p-3 bg-white rounded-xl border cursor-pointer hover:border-brand-300 hover:shadow-card transition-all',
                          commEnAttente ? 'border-orange-200' : 'border-surface-200',
                          dragId === opp.id && 'opacity-50'
                        )}>
                        <p className="text-xs font-semibold text-surface-800 truncate">
                          {contact ? `${contact.prenom} ${contact.nom}` : opp.reference}
                        </p>
                        {/* ── Nom du commercial ── */}
                        {nomCommercial && can('opportunites.view_all') && (
                          <p className="text-[10px] text-brand-600 font-medium mt-0.5 truncate">
                            {nomCommercial}
                          </p>
                        )}
                        {opp.montantDevis && (
                          <p className="text-xs font-bold text-surface-700 mt-1">{formatEuro(opp.montantDevis)}</p>
                        )}
                        {opp.montantNet && (
                          <p className="text-[10px] text-green-600">Net : {formatEuro(opp.montantNet)}</p>
                        )}
                        {produit && (
                          <div className="mt-2">
                            <Badge
                              label={truncate(FAMILLE_LABELS[produit.famille] ?? produit.nom, 20)}
                              color={FAMILLE_COLORS[produit.famille]}
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2 gap-1">
                          <span className="text-[10px] text-surface-400 truncate">{opp.reference}</span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {commEnAttente && (
                              <span className="text-[9px] px-1 py-0.5 rounded font-bold bg-orange-100 text-orange-600">
                                Comm. due
                              </span>
                            )}
                            {opp.dossierMPR && (
                              <span className="text-[9px] px-1 py-0.5 rounded font-bold"
                                style={{ background: STATUT_DOSSIER_COLORS[opp.dossierMPR.statut] + '20', color: STATUT_DOSSIER_COLORS[opp.dossierMPR.statut] }}>
                                MPR
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {items.length === 0 && (
                    <div className="h-20 border-2 border-dashed border-surface-200 rounded-xl flex items-center justify-center">
                      <span className="text-[10px] text-surface-300">Glisser ici</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Vue liste (actives en liste, ou terminées/perdues) ── */}
      {(onglet !== 'actives' || vue === 'liste') && (
        <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">

          {onglet === 'terminees' && oppsTerminees.length > 0 && (
            <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center gap-3">
              <CheckCircle size={14} className="text-green-600" />
              <span className="text-xs text-green-700 font-medium">
                {oppsTerminees.length} dossier{oppsTerminees.length > 1 ? 's' : ''} terminé{oppsTerminees.length > 1 ? 's' : ''} — {formatEuro(valeurTerminees)} de CA
              </span>
            </div>
          )}
          {onglet === 'perdues' && oppsPerdues.length > 0 && (
            <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-3">
              <XCircle size={14} className="text-red-500" />
              <span className="text-xs text-red-700 font-medium">
                {oppsPerdues.length} dossier{oppsPerdues.length > 1 ? 's' : ''} perdu{oppsPerdues.length > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {oppsOnglet.length === 0 ? (
            <EmptyState icon={List}
              title={
                onglet === 'actives'   ? 'Aucune opportunité active'  :
                onglet === 'terminees' ? 'Aucun dossier terminé'       :
                'Aucun dossier perdu'
              }
              description={onglet === 'actives' ? 'Toutes les opportunités sont terminées ou perdues.' : ''}
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  {[
                    'Référence', 'Contact', 'Commercial', 'Produit', 'Montant', 'Aides', 'Étape',
                    ...(onglet === 'actives' ? ['Commission'] : []),
                    'Date', '',
                  ].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {oppsOnglet.map(opp => {
                  const contact       = contacts.find(c => c.id === opp.contactId)
                  const produit       = produits.find(p => p.id === opp.produitId)
                  const etapeInfo     = ETAPES_PIPELINE.find(e => e.id === opp.etape)
                  const nomCommercial = getNomCommercial(opp.commercialId)
                  const commSoc       = opp.commission?.montantSociete ?? 0
                  const commPayee     = opp.commissionPayee ?? 0
                  const commEnAttente = commSoc > 0 && commPayee < commSoc
                  return (
                    <tr key={opp.id} onClick={() => navigate(`/opportunites/${opp.id}`)}
                      className="hover:bg-surface-50 cursor-pointer transition-colors">
                      <td className="px-4 py-3.5 text-xs font-mono font-medium text-surface-700">{opp.reference}</td>
                      <td className="px-4 py-3.5 text-xs text-surface-700">
                        {contact ? `${contact.prenom} ${contact.nom}` : '—'}
                      </td>
                      {/* ── Nom du commercial ── */}
                      <td className="px-4 py-3.5 text-xs text-brand-600 font-medium">
                        {nomCommercial ?? '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        {produit && (
                          <Badge label={FAMILLE_LABELS[produit.famille] ?? produit.nom} color={FAMILLE_COLORS[produit.famille]} />
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-surface-800">
                        {formatEuro(opp.montantDevis)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          {opp.dossierMPR && (
                            <Badge label={`MPR ${STATUT_DOSSIER_LABELS[opp.dossierMPR.statut]}`} color={STATUT_DOSSIER_COLORS[opp.dossierMPR.statut]} />
                          )}
                          {opp.dossierCEE && (
                            <Badge label={`CEE ${STATUT_DOSSIER_LABELS[opp.dossierCEE.statut]}`} color={STATUT_DOSSIER_COLORS[opp.dossierCEE.statut]} />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {etapeInfo && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ background: etapeInfo.couleur + '20', color: etapeInfo.couleur }}>
                            {etapeInfo.label}
                          </span>
                        )}
                      </td>
                      {onglet === 'actives' && (
                        <td className="px-4 py-3.5">
                          {commEnAttente ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-100 text-orange-600">
                              {formatEuro(commSoc - commPayee)} due
                            </span>
                          ) : commSoc > 0 ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-600">
                              Payée ✓
                            </span>
                          ) : null}
                        </td>
                      )}
                      <td className="px-4 py-3.5 text-xs text-surface-400">{formatDate(opp.dateCreation)}</td>
                      <td className="px-4 py-3.5">
                        <ChevronRight size={14} className="text-surface-300" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
