import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  LayoutGrid,
  List,
  Euro,
  ChevronRight,
  Search,
  CheckCircle,
  XCircle,
} from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { useOpportunitesStore } from '@/store/opportunitesStore'
import { useContactsStore } from '@/store/contactsStore'
import { useProduitsStore } from '@/store/produitsStore'
import { useUtilisateursStore } from '@/store/utilisateursStore'

import { formatEuro, formatDate, truncate } from '@/utils/formatters'

import Badge, {
  FAMILLE_LABELS,
  FAMILLE_COLORS,
  STATUT_DOSSIER_COLORS,
  STATUT_DOSSIER_LABELS,
} from '@/components/ui/Badge'

import EmptyState from '@/components/ui/EmptyState'

import {
  ETAPES_PIPELINE,
  type EtapePipeline,
} from '@/types/opportunite'

import clsx from 'clsx'

type Onglet = 'actives' | 'terminees' | 'perdues'

const ETAPES_KANBAN = ETAPES_PIPELINE.filter(
  e => !['pose_livree', 'sav_suivi', 'perdu'].includes(e.id)
)

function isActive(o: any) {
  const etapeFinale = ['pose_livree', 'sav_suivi', 'perdu'].includes(o.etape)
  const commSoc = o.commission?.montantSociete ?? 0
  const commPayee = o.commissionPayee ?? 0
  const commPayee_ = commSoc > 0 && commPayee < commSoc

  return !etapeFinale || commPayee_
}

function isTerminee(o: any) {
  const etapeFinale = ['pose_livree', 'sav_suivi'].includes(o.etape)
  const commSoc = o.commission?.montantSociete ?? 0
  const commPayee = o.commissionPayee ?? 0
  const estPayee = commSoc === 0 || commPayee >= commSoc

  return etapeFinale && estPayee
}

export default function Opportunites() {
  const { user, can } = useAuth()

  const navigate = useNavigate()

  const {
    opportunites,
    moveEtape,
    fetchOpportunites,
  } = useOpportunitesStore()

  const { contacts } = useContactsStore()

  const { produits } = useProduitsStore()

  const {
    utilisateurs,
    fetchUtilisateurs,
  } = useUtilisateursStore()

  const [onglet, setOnglet] = useState<Onglet>('actives')
  const [vue, setVue] = useState<'kanban' | 'liste'>('kanban')
  const [search, setSearch] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)

  useEffect(() => {
    fetchOpportunites()
    fetchUtilisateurs()
  }, [])

  const myOpps = useMemo(() => {
    const all = can('opportunites.view_all')
      ? opportunites
      : user?.role === 'apporteur'
      ? opportunites.filter(o => o.apporteurId === user.id)
      : opportunites.filter(o => o.commercialId === user?.id)

    return search
      ? all.filter(o => {
          const c = contacts.find(ct => ct.id === o.contactId)

          return (
            o.reference.toLowerCase().includes(search.toLowerCase()) ||
            (c &&
              `${c.prenom} ${c.nom}`
                .toLowerCase()
                .includes(search.toLowerCase()))
          )
        })
      : all
  }, [opportunites, user, can, search, contacts])

  const oppsActives = useMemo(
    () => myOpps.filter(isActive),
    [myOpps]
  )

  const oppsTerminees = useMemo(
    () => myOpps.filter(isTerminee),
    [myOpps]
  )

  const oppsPerdues = useMemo(
    () => myOpps.filter(o => o.etape === 'perdu'),
    [myOpps]
  )

  const oppsOnglet =
    onglet === 'actives'
      ? oppsActives
      : onglet === 'terminees'
      ? oppsTerminees
      : oppsPerdues

  const valeurPipeline = oppsActives.reduce(
    (s, o) => s + (o.montantDevis ?? 0),
    0
  )

  const valeurTerminees = oppsTerminees.reduce(
    (s, o) => s + (o.montantDevis ?? 0),
    0
  )

  function onDragStart(oppId: string) {
    setDragId(oppId)
  }

  function onDrop(etape: EtapePipeline) {
    if (dragId) {
      moveEtape(dragId, etape)
      setDragId(null)
    }
  }

  return (
    <div className="space-y-4">

      {/* KANBAN */}
      {onglet === 'actives' && vue === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {ETAPES_KANBAN.map(etape => {
            const items = oppsActives.filter(o => o.etape === etape.id)

            return (
              <div
                key={etape.id}
                className="min-w-[220px] flex-shrink-0"
                onDragOver={e => e.preventDefault()}
                onDrop={() => onDrop(etape.id)}
              >
                <div className="space-y-2">

                  {items.map(opp => {

                    const contact = contacts.find(
                      c => c.id === opp.contactId
                    )

                    const produit = produits.find(
                      p => p.id === opp.produitId
                    )

                    const commercial = utilisateurs.find(
                      u => u.id === opp.commercialId
                    )

                    return (
                      <div
                        key={opp.id}
                        draggable
                        onDragStart={() => onDragStart(opp.id)}
                        onClick={() =>
                          navigate(`/opportunites/${opp.id}`)
                        }
                        className={clsx(
                          'p-3 bg-white rounded-xl border cursor-pointer hover:border-brand-300 hover:shadow-card transition-all',
                          dragId === opp.id && 'opacity-50'
                        )}
                      >

                        <div>
                          <p className="text-xs font-semibold text-surface-800 truncate">
                            {contact
                              ? `${contact.prenom} ${contact.nom}`
                              : opp.reference}
                          </p>

                          {commercial && (
                            <p className="text-[10px] text-surface-500 mt-1">
                              Commercial : {commercial.prenom} {commercial.nom}
                            </p>
                          )}
                        </div>

                        {opp.montantDevis && (
                          <p className="text-xs font-bold text-surface-700 mt-1">
                            {formatEuro(opp.montantDevis)}
                          </p>
                        )}

                        {produit && (
                          <div className="mt-2">
                            <Badge
                              label={
                                truncate(
                                  FAMILLE_LABELS[produit.famille] ??
                                    produit.nom,
                                  20
                                )
                              }
                              color={FAMILLE_COLORS[produit.famille]}
                            />
                          </div>
                        )}

                      </div>
                    )
                  })}

                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TABLEAU */}
      {(onglet !== 'actives' || vue === 'liste') && (
        <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">

          {oppsOnglet.length === 0 ? (
            <EmptyState
              icon={List}
              title="Aucune opportunité"
              description=""
            />
          ) : (
            <table className="w-full">

              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">

                  {[
                    'Référence',
                    'Contact',
                    'Commercial',
                    'Produit',
                    'Montant',
                    'Étape',
                    'Date',
                    '',
                  ].map(h => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}

                </tr>
              </thead>

              <tbody className="divide-y divide-surface-50">

                {oppsOnglet.map(opp => {

                  const contact = contacts.find(
                    c => c.id === opp.contactId
                  )

                  const produit = produits.find(
                    p => p.id === opp.produitId
                  )

                  const commercial = utilisateurs.find(
                    u => u.id === opp.commercialId
                  )

                  const etapeInfo = ETAPES_PIPELINE.find(
                    e => e.id === opp.etape
                  )

                  return (
                    <tr
                      key={opp.id}
                      onClick={() =>
                        navigate(`/opportunites/${opp.id}`)
                      }
                      className="hover:bg-surface-50 cursor-pointer transition-colors"
                    >

                      <td className="px-4 py-3.5 text-xs font-mono font-medium text-surface-700">
                        {opp.reference}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-surface-700">
                        {contact
                          ? `${contact.prenom} ${contact.nom}`
                          : '—'}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-surface-700">
                        {commercial
                          ? `${commercial.prenom} ${commercial.nom}`
                          : '—'}
                      </td>

                      <td className="px-4 py-3.5">
                        {produit && (
                          <Badge
                            label={
                              FAMILLE_LABELS[produit.famille] ??
                              produit.nom
                            }
                            color={FAMILLE_COLORS[produit.famille]}
                          />
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs font-semibold text-surface-800">
                        {formatEuro(opp.montantDevis)}
                      </td>

                      <td className="px-4 py-3.5">
                        {etapeInfo && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{
                              background:
                                etapeInfo.couleur + '20',
                              color: etapeInfo.couleur,
                            }}
                          >
                            {etapeInfo.label}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-surface-400">
                        {formatDate(opp.dateCreation)}
                      </td>

                      <td className="px-4 py-3.5">
                        <ChevronRight
                          size={14}
                          className="text-surface-300"
                        />
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