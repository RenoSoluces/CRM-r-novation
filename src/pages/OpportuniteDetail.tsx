import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, MapPin, Plus, Save, ChevronRight, Edit2, Calendar, Wrench, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useOpportunitesStore } from '@/store/opportunitesStore'
import { useContactsStore } from '@/store/contactsStore'
import { useProduitsStore } from '@/store/produitsStore'
import { useInstallateursStore } from '@/store/installateurStore'
import { formatDate, formatEuro, formatRelative } from '@/utils/formatters'
import Badge, {
  FAMILLE_LABELS, FAMILLE_COLORS,
  STATUT_DOSSIER_COLORS, STATUT_DOSSIER_LABELS,
} from '@/components/ui/Badge'
import { ETAPES_PIPELINE, type EtapePipeline, type Activite } from '@/types/opportunite'
import clsx from 'clsx'

const ACTIVITE_ICONS: Record<string, string> = {
  appel: '📞', email: '✉️', rdv: '📅', devis: '📄',
  signature: '✅', installation: '🔧', note: '📝',
}

function toInputValue(iso?: string) {
  if (!iso) return ''
  return iso.slice(0, 16)
}

export default function OpportuniteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, can } = useAuth()
  const {
    opportunites, updateOpportunite, moveEtape, addActivite,
    updateCommission, payerCommission, fetchOpportunites,
  } = useOpportunitesStore()
  const { contacts, fetchContacts }         = useContactsStore()
  const { produits }                        = useProduitsStore()
  const { installateurs, fetchInstallateurs } = useInstallateursStore()

  const [newActivite, setNewActivite]       = useState({ type: 'note' as Activite['type'], titre: '' })
  const [showForm, setShowForm]             = useState(false)
  const [editCommission, setEditCommission] = useState(false)
  const [editDates, setEditDates]           = useState(false)
  const [editInstallateurs, setEditInstallateurs] = useState(false)
  const [commissionForm, setCommissionForm] = useState({
    montantSociete: 0, montantCommercial: 0, montantApporteur: 0,
  })
  const [datesForm, setDatesForm] = useState({
    dateRdv: '', dateDevis: '', dateSignature: '',
    dateInstallation: '', dateRelance: '', datePaiementPartenaire: '',
  })
  const [installateurIds, setInstallateurIds] = useState<string[]>([])

  useEffect(() => {
    fetchOpportunites()
    fetchContacts()
    fetchInstallateurs()
  }, [])

  const opp = opportunites.find(o => o.id === id)

  useEffect(() => {
    if (opp?.commission) {
      setCommissionForm({
        montantSociete:    opp.commission.montantSociete    ?? 0,
        montantCommercial: opp.commission.montantCommercial ?? 0,
        montantApporteur:  opp.commission.montantApporteur  ?? 0,
      })
    }
  }, [opp?.id])

  useEffect(() => {
    if (opp) {
      setDatesForm({
        dateRdv:                toInputValue(opp.dateRdv),
        dateDevis:              toInputValue(opp.dateDevis),
        dateSignature:          toInputValue(opp.dateSignature),
        dateInstallation:       toInputValue(opp.dateInstallation),
        dateRelance:            toInputValue(opp.dateRelance),
        datePaiementPartenaire: toInputValue(opp.datePaiementPartenaire),
      })
      setInstallateurIds(opp.installateurIds ?? [])
    }
  }, [opp?.id])

  if (!opp) return (
    <div className="text-center py-20">
      <p className="text-surface-400">Chargement…</p>
    </div>
  )

  const contact    = contacts.find(c => c.id === opp.contactId)
  const produit    = produits.find(p => p.id === opp.produitId)
  const etapeInfo  = ETAPES_PIPELINE.find(e => e.id === opp.etape)
  const etapeIndex = ETAPES_PIPELINE.findIndex(e => e.id === opp.etape)
  const aidesTotal = (opp.montantAidesMPR ?? 0) + (opp.montantAidesCEE ?? 0)

  const commDue  = opp.commission?.montantCommercial ?? 0
  const commPaid = opp.commissionPayee ?? 0
  const commLeft = Math.max(0, commDue - commPaid)

  // Installateurs liés à cette opportunité
  const installateursDuDossier = installateurs.filter(i =>
    (opp.installateurIds ?? []).includes(i.id)
  )

  function handleMoveEtape(etape: EtapePipeline) {
    moveEtape(opp!.id, etape)
  }

  async function handleAddActivite() {
    if (!newActivite.titre.trim()) return
    const a: Activite = {
      id: `a${Date.now()}`, ...newActivite,
      date: new Date().toISOString(), auteurId: user?.id ?? '',
    }
    await addActivite(opp!.id, a)
    setNewActivite({ type: 'note', titre: '' })
    setShowForm(false)
  }

  async function handleSaveDates() {
    await updateOpportunite(opp!.id, {
      dateRdv:                datesForm.dateRdv                ? new Date(datesForm.dateRdv).toISOString()                : undefined,
      dateDevis:              datesForm.dateDevis               ? new Date(datesForm.dateDevis).toISOString()               : undefined,
      dateSignature:          datesForm.dateSignature           ? new Date(datesForm.dateSignature).toISOString()           : undefined,
      dateInstallation:       datesForm.dateInstallation        ? new Date(datesForm.dateInstallation).toISOString()        : undefined,
      dateRelance:            datesForm.dateRelance             ? new Date(datesForm.dateRelance).toISOString()             : undefined,
      datePaiementPartenaire: datesForm.datePaiementPartenaire  ? new Date(datesForm.datePaiementPartenaire).toISOString()  : undefined,
    })
    setEditDates(false)
  }

  async function handleSaveInstallateurs() {
    await updateOpportunite(opp!.id, { installateurIds })
    setEditInstallateurs(false)
  }

  function toggleInstallateur(instId: string) {
    setInstallateurIds(ids =>
      ids.includes(instId) ? ids.filter(i => i !== instId) : [...ids, instId]
    )
  }

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/opportunites')}
          className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 transition-colors">
          <ArrowLeft size={16} /> Retour aux opportunités
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-surface-500">{opp.reference}</span>
          {etapeInfo && (
            <span className="text-xs px-3 py-1 rounded-full font-bold"
              style={{ background: etapeInfo.couleur + '20', color: etapeInfo.couleur }}>
              {etapeInfo.label}
            </span>
          )}
        </div>
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-card p-4">
        <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">Avancement du dossier</p>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {ETAPES_PIPELINE.filter(e => e.id !== 'perdu').map((etape, idx) => {
            const isActive    = etape.id === opp.etape
            const isPassed    = idx < etapeIndex
            const isClickable = can('opportunites.edit')
            return (
              <div key={etape.id} className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => isClickable && handleMoveEtape(etape.id)}
                  className={clsx(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all',
                    isActive  && 'text-white shadow-sm',
                    isPassed  && 'text-white opacity-70',
                    !isActive && !isPassed && 'bg-surface-100 text-surface-400',
                    isClickable && !isActive && 'hover:opacity-90 cursor-pointer',
                  )}
                  style={isActive || isPassed ? { background: etape.couleur } : {}}
                >
                  {etape.label.replace(' ✓', '')}
                </button>
                {idx < ETAPES_PIPELINE.length - 2 && (
                  <ChevronRight size={12} className="text-surface-300 flex-shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-5">

        {/* Colonne principale */}
        <div className="space-y-4">

          {/* Montants */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <h3 className="font-display font-semibold text-surface-800 text-sm mb-4">Montants</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Devis total',    value: opp.montantDevis,    color: 'text-surface-800' },
                { label: 'Aide MPR',       value: opp.montantAidesMPR, color: 'text-blue-600' },
                { label: 'Aide CEE',       value: opp.montantAidesCEE, color: 'text-cyan-600' },
                { label: 'Reste à charge', value: opp.montantNet,      color: 'text-green-600' },
              ].map(m => (
                <div key={m.label} className="bg-surface-50 rounded-xl p-3 text-center">
                  <p className={clsx('font-display font-bold text-lg', m.color)}>
                    {formatEuro(m.value)}
                  </p>
                  <p className="text-[10px] text-surface-500 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
            {aidesTotal > 0 && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100 text-center">
                <p className="text-xs text-green-700 font-medium">
                  Économie totale grâce aux aides : <strong>{formatEuro(aidesTotal)}</strong>
                  {opp.montantDevis ? ` (${Math.round(aidesTotal / opp.montantDevis * 100)}% du devis)` : ''}
                </p>
              </div>
            )}
          </div>

          {/* Dossiers aides */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <h3 className="font-display font-semibold text-surface-800 text-sm mb-4">Dossiers d'aides</h3>
            <div className="grid grid-cols-2 gap-4">
              {(['dossierMPR', 'dossierCEE'] as const).map(key => {
                const dossier = opp[key]
                const label   = key === 'dossierMPR' ? 'MaPrimeRénov\'' : 'Certificats CEE'
                if (!dossier) return (
                  <div key={key} className="p-4 border-2 border-dashed border-surface-200 rounded-xl flex items-center justify-center">
                    <p className="text-xs text-surface-400">{label} — non applicable</p>
                  </div>
                )
                return (
                  <div key={key} className="p-4 rounded-xl border border-surface-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-surface-700">{label}</p>
                      <Badge label={STATUT_DOSSIER_LABELS[dossier.statut]} color={STATUT_DOSSIER_COLORS[dossier.statut]} />
                    </div>
                    {dossier.montant && (
                      <p className="text-sm font-bold text-surface-800">{formatEuro(dossier.montant)}</p>
                    )}
                    {dossier.dateDepot && (
                      <p className="text-[10px] text-surface-400">Déposé le {formatDate(dossier.dateDepot)}</p>
                    )}
                    {dossier.dateVersement && (
                      <p className="text-[10px] text-green-600 font-medium">Versé le {formatDate(dossier.dateVersement)}</p>
                    )}
                    {can('opportunites.edit') && (
                      <select
                        value={dossier.statut}
                        onChange={e => updateOpportunite(opp.id, {
                          [key]: { ...dossier, statut: e.target.value as typeof dossier.statut }
                        })}
                        className="w-full px-2 py-1.5 rounded-lg border border-surface-200 text-xs text-surface-700 bg-white outline-none mt-1"
                      >
                        <option value="a_constituer">À constituer</option>
                        <option value="en_cours">En cours</option>
                        <option value="depose">Déposé</option>
                        <option value="valide">Validé</option>
                        <option value="verse">Versé</option>
                      </select>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Activités */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-surface-800 text-sm">Historique des activités</h3>
              {can('opportunites.edit') && (
                <button onClick={() => setShowForm(v => !v)}
                  className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium">
                  <Plus size={13} /> Ajouter
                </button>
              )}
            </div>
            {showForm && (
              <div className="mb-4 p-3 bg-surface-50 rounded-xl border border-surface-200 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newActivite.type}
                    onChange={e => setNewActivite(a => ({ ...a, type: e.target.value as Activite['type'] }))}
                    className="px-2 py-1.5 rounded-lg border border-surface-200 text-xs text-surface-700 bg-white outline-none"
                  >
                    {['appel', 'email', 'rdv', 'devis', 'signature', 'installation', 'note'].map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                  <input
                    value={newActivite.titre}
                    onChange={e => setNewActivite(a => ({ ...a, titre: e.target.value }))}
                    placeholder="Description de l'activité"
                    className="px-2 py-1.5 rounded-lg border border-surface-200 text-xs text-surface-700 outline-none focus:border-brand-400"
                    onKeyDown={e => e.key === 'Enter' && handleAddActivite()}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddActivite}
                    className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition-colors">
                    <Save size={12} /> Enregistrer
                  </button>
                  <button onClick={() => setShowForm(false)}
                    className="px-3 py-1.5 rounded-lg border border-surface-200 text-xs text-surface-600 hover:bg-surface-50">
                    Annuler
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {[...(opp.activites ?? [])].reverse().map(a => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    {ACTIVITE_ICONS[a.type] ?? '📝'}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-surface-800">{a.titre}</p>
                    {a.description && (
                      <p className="text-[10px] text-surface-500 mt-0.5">{a.description}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-surface-400 flex-shrink-0">{formatRelative(a.date)}</span>
                </div>
              ))}
              {(opp.activites ?? []).length === 0 && (
                <p className="text-xs text-surface-400 text-center py-4">Aucune activité enregistrée</p>
              )}
            </div>
          </div>

        </div>

        {/* Colonne droite */}
        <div className="space-y-4">

          {/* Contact */}
          {contact && (
            <div className="bg-white rounded-xl border border-surface-200 shadow-card p-4">
              <h3 className="font-display font-semibold text-surface-800 text-sm mb-3">Contact</h3>
              <button onClick={() => navigate(`/contacts/${contact.id}`)} className="w-full text-left group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
                    {contact.prenom.charAt(0)}{contact.nom.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-800 group-hover:text-brand-600 transition-colors">
                      {contact.prenom} {contact.nom}
                    </p>
                    {contact.trancheMPR && (
                      <span className="text-[10px] text-surface-500">{contact.trancheMPR.replace('_', ' ')}</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-surface-600">
                  <p className="flex items-center gap-2"><Phone size={11} className="text-surface-400" />{contact.telephone}</p>
                  <p className="flex items-center gap-2"><Mail size={11} className="text-surface-400" />{contact.email}</p>
                  <p className="flex items-center gap-2"><MapPin size={11} className="text-surface-400" />{contact.adresse.ville}</p>
                </div>
              </button>
            </div>
          )}

          {/* Produit */}
          {produit && (
            <div className="bg-white rounded-xl border border-surface-200 shadow-card p-4">
              <h3 className="font-display font-semibold text-surface-800 text-sm mb-3">Produit</h3>
              <Badge label={FAMILLE_LABELS[produit.famille] ?? produit.nom} color={FAMILLE_COLORS[produit.famille]} size="md" />
              <p className="text-xs font-semibold text-surface-800 mt-2">{produit.nom}</p>
              <p className="text-[10px] text-surface-500 mt-0.5 line-clamp-2">{produit.description}</p>
            </div>
          )}

          {/* ── Installateurs ── */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-surface-800 text-sm flex items-center gap-1.5">
                <Wrench size={13} className="text-surface-400" /> Installateurs
              </h3>
              {can('opportunites.edit') && !editInstallateurs && (
                <button onClick={() => setEditInstallateurs(true)}
                  className="flex items-center gap-1 text-[10px] text-brand-600 hover:text-brand-700 font-medium">
                  <Edit2 size={11} /> Modifier
                </button>
              )}
            </div>

            {editInstallateurs ? (
              <div className="space-y-2">
                {/* Sélecteur multi-installateurs */}
                <div className="max-h-48 overflow-y-auto space-y-1 border border-surface-200 rounded-lg p-2">
                  {installateurs.filter(i => i.actif).length === 0 ? (
                    <p className="text-xs text-surface-400 text-center py-3">Aucun installateur disponible</p>
                  ) : installateurs.filter(i => i.actif).map(inst => (
                    <button
                      key={inst.id}
                      onClick={() => toggleInstallateur(inst.id)}
                      className={clsx(
                        'w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between gap-2',
                        installateurIds.includes(inst.id)
                          ? 'bg-brand-50 border border-brand-200 text-brand-700'
                          : 'hover:bg-surface-50 border border-transparent text-surface-700'
                      )}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{inst.raisonSociale}</p>
                        <p className="text-[10px] text-surface-400">{inst.adresse.ville}</p>
                      </div>
                      {installateurIds.includes(inst.id) && (
                        <X size={12} className="text-brand-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setEditInstallateurs(false); setInstallateurIds(opp.installateurIds ?? []) }}
                    className="flex-1 py-2 rounded-lg border border-surface-200 text-xs font-medium text-surface-600 hover:bg-surface-50 transition-colors">
                    Annuler
                  </button>
                  <button onClick={handleSaveInstallateurs}
                    className="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors">
                    Enregistrer
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {installateursDuDossier.length === 0 ? (
                  <p className="text-[10px] text-surface-400 text-center py-3">Aucun installateur assigné</p>
                ) : installateursDuDossier.map(inst => (
                  <div key={inst.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-50 border border-surface-100">
                    <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <Wrench size={12} className="text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Admin voit le nom complet, les autres aussi mais sans détails de contact */}
                      <p className="text-xs font-semibold text-surface-800 truncate">{inst.raisonSociale}</p>
                      {can('installateurs.view') && (
                        <p className="text-[10px] text-surface-400 truncate">{inst.adresse.ville}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Commissions */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-surface-800 text-sm">Commissions</h3>
              {can('utilisateurs.edit') && !editCommission && (
                <button onClick={() => setEditCommission(true)}
                  className="flex items-center gap-1 text-[10px] text-brand-600 hover:text-brand-700 font-medium">
                  <Edit2 size={11} /> Modifier
                </button>
              )}
            </div>
            {can('utilisateurs.edit') ? (
              editCommission ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1">Commission société (€)</label>
                    <input type="number" value={commissionForm.montantSociete}
                      onChange={e => setCommissionForm(f => ({ ...f, montantSociete: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-lg border border-surface-200 text-xs outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1">Commission commercial (€)</label>
                    <input type="number" value={commissionForm.montantCommercial}
                      onChange={e => setCommissionForm(f => ({ ...f, montantCommercial: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-lg border border-surface-200 text-xs outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
                  </div>
                  {opp.apporteurId && (
                    <div>
                      <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1">Commission apporteur (€)</label>
                      <input type="number" value={commissionForm.montantApporteur}
                        onChange={e => setCommissionForm(f => ({ ...f, montantApporteur: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-lg border border-surface-200 text-xs outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setEditCommission(false)}
                      className="flex-1 py-2 rounded-lg border border-surface-200 text-xs font-medium text-surface-600 hover:bg-surface-50 transition-colors">
                      Annuler
                    </button>
                    <button onClick={async () => { await updateCommission(opp.id, commissionForm); setEditCommission(false) }}
                      className="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors">
                      Enregistrer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-surface-500">Société</span>
                    <span className="text-xs font-semibold text-surface-800">{formatEuro(opp.commission?.montantSociete)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-surface-500">Commercial</span>
                    <span className="text-xs font-semibold text-surface-800">{formatEuro(commDue)}</span>
                  </div>
                  {opp.apporteurId && (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-surface-500">Apporteur</span>
                      <span className="text-xs font-semibold text-surface-800">{formatEuro(opp.commission?.montantApporteur)}</span>
                    </div>
                  )}
                  {commDue > 0 && (
                    <div className="mt-3 pt-3 border-t border-surface-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-surface-500">Déjà payé</span>
                        <span className="text-xs font-semibold text-green-600">{formatEuro(commPaid)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-surface-600">Reste à payer</span>
                        <span className="text-xs font-bold text-orange-600">{formatEuro(commLeft)}</span>
                      </div>
                      {commLeft > 0 ? (
                        <button onClick={() => payerCommission(opp.id, commDue)}
                          className="w-full mt-1 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors">
                          Marquer comme payée
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-green-50 border border-green-100">
                          <span className="text-xs font-semibold text-green-600">Commission payée ✓</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="space-y-2">
                {user?.role === 'commercial' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-surface-500">Ma commission</span>
                      <span className="text-xs font-semibold text-surface-800">{formatEuro(commDue)}</span>
                    </div>
                    {commPaid > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-surface-500">Déjà reçu</span>
                        <span className="text-xs font-semibold text-green-600">{formatEuro(commPaid)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-surface-600">À recevoir</span>
                      <span className="text-xs font-bold text-orange-600">{formatEuro(commLeft)}</span>
                    </div>
                  </>
                )}
                {user?.role === 'apporteur' && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-surface-500">Ma commission</span>
                    <span className="text-xs font-semibold text-green-600">{formatEuro(opp.commission?.montantApporteur)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dates clés */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-surface-800 text-sm flex items-center gap-1.5">
                <Calendar size={13} className="text-surface-400" /> Dates clés
              </h3>
              {can('opportunites.edit') && !editDates && (
                <button onClick={() => setEditDates(true)}
                  className="flex items-center gap-1 text-[10px] text-brand-600 hover:text-brand-700 font-medium">
                  <Edit2 size={11} /> Modifier
                </button>
              )}
            </div>
            {editDates ? (
              <div className="space-y-2.5">
                {[
                  { label: 'RDV',              key: 'dateRdv' },
                  { label: 'Devis envoyé',     key: 'dateDevis' },
                  { label: 'Signature',        key: 'dateSignature' },
                  { label: 'Installation',     key: 'dateInstallation' },
                  { label: 'Relance',          key: 'dateRelance' },
                  ...(can('opportunites.view_all') ? [{ label: 'Paiement partenaire', key: 'datePaiementPartenaire' }] : []),
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1">{label}</label>
                    <input
                      type="datetime-local"
                      value={datesForm[key as keyof typeof datesForm]}
                      onChange={e => setDatesForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-2 py-1.5 rounded-lg border border-surface-200 text-xs text-surface-700 outline-none focus:border-brand-400 bg-white"
                    />
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setEditDates(false)}
                    className="flex-1 py-2 rounded-lg border border-surface-200 text-xs font-medium text-surface-600 hover:bg-surface-50 transition-colors">
                    Annuler
                  </button>
                  <button onClick={handleSaveDates}
                    className="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors">
                    Enregistrer
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { label: 'Création',         date: opp.dateCreation },
                  { label: 'RDV',              date: opp.dateRdv },
                  { label: 'Devis envoyé',     date: opp.dateDevis },
                  { label: 'Signature',        date: opp.dateSignature },
                  { label: 'Installation',     date: opp.dateInstallation },
                  { label: 'Relance',          date: opp.dateRelance },
                  ...(can('opportunites.view_all') ? [{ label: 'Paiement partenaire', date: opp.datePaiementPartenaire }] : []),
                ].filter(d => d.date).map(d => (
                  <div key={d.label} className="flex items-center justify-between">
                    <span className="text-[10px] text-surface-500">{d.label}</span>
                    <span className="text-[10px] font-medium text-surface-700">{formatDate(d.date)}</span>
                  </div>
                ))}
                {!opp.dateRdv && !opp.dateDevis && !opp.dateSignature && !opp.dateInstallation && !opp.dateRelance && (
                  <p className="text-[10px] text-surface-400 text-center py-2">Aucune date renseignée</p>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}