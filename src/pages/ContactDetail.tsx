import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Save, Trash2, Phone, Mail, MapPin, Home,
  Euro, TrendingUp, Plus, Edit2, Check, X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useContactsStore } from '@/store/contactsStore'
import { useOpportunitesStore } from '@/store/opportunitesStore'
import { useProduitsStore } from '@/store/produitsStore'
import { useInstallateursStore } from '@/store/installateurStore'
import { formatDate, formatEuro } from '@/utils/formatters'
import { calculerTrancheMPR, LABELS_TRANCHE, COULEURS_TRANCHE } from '@/utils/aides'
import Badge, { STATUT_CONTACT_COLORS, STATUT_CONTACT_LABELS, FAMILLE_LABELS, FAMILLE_COLORS } from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Modal from '@/components/ui/Modal'
import { ETAPES_PIPELINE } from '@/types/opportunite'
import type { Opportunite } from '@/types/opportunite'
import type { Contact, StatutContact } from '@/types/contact'
import clsx from 'clsx'

const EMPTY: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'> = {
  type: 'particulier', civilite: 'M.', nom: '', prenom: '',
  email: '', telephone: '', adresse: { rue: '', codePostal: '', ville: '' },
  statut: 'prospect', commercialId: '', source: '',
}

export default function ContactDetail() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const { user, can } = useAuth()
  const { contacts, addContact, updateContact, deleteContact, getById } = useContactsStore()
  const { opportunites } = useOpportunitesStore()
  const { produits }     = useProduitsStore()
  const { installateurs } = useInstallateursStore()

  const isNew     = !id || id === 'nouveau'
  const existing  = isNew ? undefined : getById(id!)
  const [form,    setForm]    = useState<Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>>(
    existing ? { ...existing } : { ...EMPTY, commercialId: user?.id ?? '' }
  )
  const [editing,    setEditing]    = useState<boolean>(isNew)
  const [confirm,    setConfirm]    = useState(false)
  const [showOppModal, setShowOppModal] = useState(false)

  const myOpps = opportunites.filter(o => o.contactId === (isNew ? '' : id))

  const tranche = form.revenuFiscal && form.nombrePersonnes
    ? calculerTrancheMPR(form.revenuFiscal, form.nombrePersonnes)
    : form.trancheMPR

 async function handleSave() {
  if (!form.nom || !form.prenom || !form.email) return
  if (isNew) {
    const contact = await addContact({
      ...form,
      trancheMPR: tranche,
      commercialId: user?.id ?? '',
    })
    if (contact) navigate('/contacts')
  } else {
    await updateContact(id!, { ...form, trancheMPR: tranche })
    setEditing(false)
  }
  }

  function handleDelete() {
    deleteContact(id!)
    navigate('/contacts')
  }

  const canEdit = can('contacts.edit')

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/contacts')}
          className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 transition-colors">
          <ArrowLeft size={16} /> Retour aux contacts
        </button>
        <div className="flex items-center gap-2">
          {!isNew && canEdit && !editing && (
            <>
              <button onClick={() => setConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-xs font-medium transition-colors">
                <Trash2 size={13} /> Supprimer
              </button>
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition-colors">
                <Edit2 size={13} /> Modifier
              </button>
            </>
          )}
          {editing && (
            <>
              {!isNew && (
                <button onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-50 text-xs font-medium transition-colors">
                  <X size={13} /> Annuler
                </button>
              )}
              <button onClick={handleSave}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition-colors">
                <Save size={13} /> {isNew ? 'Créer le contact' : 'Enregistrer'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-5">
        {/* Colonne principale */}
        <div className="space-y-4">

          {/* Identité */}
          <Section title="Identité">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type de contact">
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'particulier' | 'professionnel' }))}
                  disabled={!editing} className={inputCls(editing)}>
                  <option value="particulier">Particulier</option>
                  <option value="professionnel">Professionnel</option>
                </select>
              </Field>
              <Field label="Civilité">
                <select value={form.civilite ?? ''} onChange={e => setForm(f => ({ ...f, civilite: e.target.value as Contact['civilite'] }))}
                  disabled={!editing} className={inputCls(editing)}>
                  <option value="">—</option>
                  <option value="M.">M.</option>
                  <option value="Mme">Mme</option>
                  <option value="M. et Mme">M. et Mme</option>
                </select>
              </Field>
              <Field label="Prénom *">
                <input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                  disabled={!editing} className={inputCls(editing)} placeholder="Prénom" />
              </Field>
              <Field label="Nom *">
                <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  disabled={!editing} className={inputCls(editing)} placeholder="Nom" />
              </Field>
              <Field label="Statut">
                <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value as StatutContact }))}
                  disabled={!editing} className={inputCls(editing)}>
                  <option value="prospect">Prospect</option>
                  <option value="client">Client</option>
                  <option value="perdu">Perdu</option>
                  <option value="inactif">Inactif</option>
                </select>
              </Field>
              <Field label="Source">
                <input value={form.source ?? ''} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                  disabled={!editing} className={inputCls(editing)} placeholder="Ex: Bouche à oreille" />
              </Field>
            </div>
          </Section>

          {/* Coordonnées */}
          <Section title="Coordonnées">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email *">
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  disabled={!editing} className={inputCls(editing)} placeholder="email@exemple.fr" />
              </Field>
              <Field label="Téléphone *">
                <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                  disabled={!editing} className={inputCls(editing)} placeholder="06 XX XX XX XX" />
              </Field>
              <Field label="Rue" className="col-span-2">
                <input value={form.adresse.rue} onChange={e => setForm(f => ({ ...f, adresse: { ...f.adresse, rue: e.target.value } }))}
                  disabled={!editing} className={inputCls(editing)} placeholder="N° et nom de rue" />
              </Field>
              <Field label="Code postal">
                <input value={form.adresse.codePostal} onChange={e => setForm(f => ({ ...f, adresse: { ...f.adresse, codePostal: e.target.value } }))}
                  disabled={!editing} className={inputCls(editing)} placeholder="11000" />
              </Field>
              <Field label="Ville">
                <input value={form.adresse.ville} onChange={e => setForm(f => ({ ...f, adresse: { ...f.adresse, ville: e.target.value } }))}
                  disabled={!editing} className={inputCls(editing)} placeholder="Carcassonne" />
              </Field>
            </div>
          </Section>

          {/* Logement */}
          {form.type === 'particulier' && (
            <Section title="Logement">
              <div className="grid grid-cols-3 gap-4">
                <Field label="Type de logement">
                  <select value={form.typeLogement ?? ''} onChange={e => setForm(f => ({ ...f, typeLogement: e.target.value as Contact['typeLogement'] }))}
                    disabled={!editing} className={inputCls(editing)}>
                    <option value="">—</option>
                    <option value="maison">Maison</option>
                    <option value="appartement">Appartement</option>
                    <option value="local_commercial">Local commercial</option>
                  </select>
                </Field>
                <Field label="Année construction">
                  <input type="number" value={form.anneeConstruction ?? ''} onChange={e => setForm(f => ({ ...f, anneeConstruction: parseInt(e.target.value) || undefined }))}
                    disabled={!editing} className={inputCls(editing)} placeholder="1985" />
                </Field>
                <Field label="Surface habitable (m²)">
                  <input type="number" value={form.surfaceHabitable ?? ''} onChange={e => setForm(f => ({ ...f, surfaceHabitable: parseInt(e.target.value) || undefined }))}
                    disabled={!editing} className={inputCls(editing)} placeholder="120" />
                </Field>
              </div>
            </Section>
          )}

          {/* Ressources / MPR */}
          {form.type === 'particulier' && (
            <Section title="Ressources & Éligibilité MPR">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Revenu fiscal de référence (€)">
                  <input type="number" value={form.revenuFiscal ?? ''} onChange={e => setForm(f => ({ ...f, revenuFiscal: parseInt(e.target.value) || undefined }))}
                    disabled={!editing} className={inputCls(editing)} placeholder="28000" />
                </Field>
                <Field label="Nombre de personnes au foyer">
                  <input type="number" min={1} max={10} value={form.nombrePersonnes ?? ''} onChange={e => setForm(f => ({ ...f, nombrePersonnes: parseInt(e.target.value) || undefined }))}
                    disabled={!editing} className={inputCls(editing)} placeholder="3" />
                </Field>
              </div>
              {tranche && (
                <div className="mt-3 flex items-center gap-3 p-3 rounded-lg border"
                  style={{ borderColor: COULEURS_TRANCHE[tranche] + '40', background: COULEURS_TRANCHE[tranche] + '10' }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: COULEURS_TRANCHE[tranche] }} />
                  <div>
                    <p className="text-xs font-semibold text-surface-700">Tranche MPR calculée</p>
                    <p className="text-sm font-bold" style={{ color: COULEURS_TRANCHE[tranche] }}>{LABELS_TRANCHE[tranche]}</p>
                  </div>
                  <Check size={16} style={{ color: COULEURS_TRANCHE[tranche] }} className="ml-auto" />
                </div>
              )}
            </Section>
          )}

          {/* Notes */}
          <Section title="Notes">
            <textarea value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              disabled={!editing} rows={3}
              className={clsx(inputCls(editing), 'resize-none')}
              placeholder="Informations complémentaires, remarques…" />
          </Section>
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">
          {/* Résumé */}
          {!isNew && existing && (
            <div className="bg-white rounded-xl border border-surface-200 shadow-card p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-lg font-display">
                  {existing.prenom.charAt(0)}{existing.nom.charAt(0)}
                </div>
                <div>
                  <p className="font-display font-bold text-surface-800">{existing.prenom} {existing.nom}</p>
                  <Badge label={STATUT_CONTACT_LABELS[existing.statut]} color={STATUT_CONTACT_COLORS[existing.statut]} />
                </div>
              </div>
              <div className="space-y-2 text-xs text-surface-600">
                <p className="flex items-center gap-2"><Phone size={12} className="text-surface-400" />{existing.telephone}</p>
                <p className="flex items-center gap-2"><Mail size={12} className="text-surface-400" />{existing.email}</p>
                <p className="flex items-center gap-2"><MapPin size={12} className="text-surface-400" />{existing.adresse.ville}</p>
                {existing.surfaceHabitable && (
                  <p className="flex items-center gap-2"><Home size={12} className="text-surface-400" />{existing.surfaceHabitable} m²</p>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-surface-100 text-[10px] text-surface-400 space-y-1">
                <p>Créé le {formatDate(existing.createdAt)}</p>
                <p>Modifié le {formatDate(existing.updatedAt)}</p>
              </div>
            </div>
          )}

          {/* Opportunités liées */}
          {!isNew && (
            <div className="bg-white rounded-xl border border-surface-200 shadow-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-surface-800 text-sm">Opportunités</h3>
                {can('opportunites.create') && (
                  <button onClick={() => setShowOppModal(true)}
                    className="text-brand-600 hover:text-brand-700 text-[10px] flex items-center gap-1 font-medium">
                    <Plus size={11} /> Nouvelle
                  </button>
                )}
              </div>
              {myOpps.length === 0 ? (
                <p className="text-xs text-surface-400 text-center py-4">Aucune opportunité</p>
              ) : (
                <div className="space-y-2">
                  {myOpps.map(opp => {
                    const produit = produits.find(p => p.id === opp.produitId)
                    const etapeInfo = ETAPES_PIPELINE.find(e => e.id === opp.etape)
                    return (
                      <button key={opp.id} onClick={() => navigate(`/opportunites/${opp.id}`)}
                        className="w-full text-left p-3 rounded-lg border border-surface-200 hover:border-surface-300 hover:bg-surface-50 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-surface-700">{opp.reference}</p>
                          {etapeInfo && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                              style={{ background: etapeInfo.couleur + '20', color: etapeInfo.couleur }}>
                              {etapeInfo.label}
                            </span>
                          )}
                        </div>
                        {produit && (
                          <Badge label={FAMILLE_LABELS[produit.famille] ?? produit.nom}
                            color={FAMILLE_COLORS[produit.famille]} size="sm" />
                        )}
                        {opp.montantDevis && (
                          <p className="text-xs text-surface-600 mt-1 flex items-center gap-1">
                            <Euro size={10} />{formatEuro(opp.montantDevis)}
                          </p>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={handleDelete}
        title="Supprimer ce contact ?" message="Cette action est irréversible." confirmLabel="Supprimer" danger />

      {!isNew && id && (
        <CreateOpportuniteModal
          open={showOppModal}
          onClose={() => setShowOppModal(false)}
          contactId={id}
          commercialId={user?.id ?? ''}
          onCreated={(oppId) => { setShowOppModal(false); navigate(`/opportunites/${oppId}`) }}
        />
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
      <h3 className="font-display font-semibold text-surface-800 text-sm mb-4">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function inputCls(editing: boolean) {
  return clsx(
    'w-full px-3 py-2 rounded-lg border text-xs outline-none transition-all',
    editing
      ? 'border-surface-200 bg-white text-surface-800 focus:border-brand-400 focus:ring-2 focus:ring-brand-100'
      : 'border-transparent bg-surface-50 text-surface-700 cursor-default'
  )
}

// ── Modale création opportunité ──────────────────────────────────────────────
function CreateOpportuniteModal({ open, onClose, contactId, commercialId, onCreated }: {
  open: boolean
  onClose: () => void
  contactId: string
  commercialId: string
  onCreated: (oppId: string) => void
}) {
  const { produits }      = useProduitsStore()
  const { installateurs } = useInstallateursStore()
  const { addOpportunite, opportunites } = useOpportunitesStore()

  const [produitId,      setProduitId]      = useState(produits[0]?.id ?? '')
  const [installateurId, setInstallateurId] = useState('')
  const [montantDevis,   setMontantDevis]   = useState('')
  const [montantMPR,     setMontantMPR]     = useState('')
  const [montantCEE,     setMontantCEE]     = useState('')
  const [notes,          setNotes]          = useState('')

  const produitChoisi = produits.find(p => p.id === produitId)
  const installateursFiltres = produitId
    ? installateurs.filter(i => i.produitIds.includes(produitId) && i.actif)
    : installateurs.filter(i => i.actif)

  const montantNet = montantDevis
    ? Math.max(0, Number(montantDevis) - Number(montantMPR || 0) - Number(montantCEE || 0))
    : 0

  async function handleCreate() {
  if (!produitId) return
  const ref = `OPP-${new Date().getFullYear()}-${String(opportunites.length + 1).padStart(3, '0')}`
  const opp = await addOpportunite({
    reference: ref,
    contactId,
    produitId,
    etape: 'nouveau_lead',
    montantDevis:    montantDevis  ? Number(montantDevis)  : undefined,
    montantAidesMPR: montantMPR   ? Number(montantMPR)    : undefined,
    montantAidesCEE: montantCEE   ? Number(montantCEE)    : undefined,
    montantNet:      montantDevis  ? montantNet            : undefined,
    installateurId:  installateurId || undefined,
    commercialId,
    dossierMPR: montantMPR ? { statut: 'a_constituer' } : undefined,
    dossierCEE: montantCEE ? { statut: 'a_constituer' } : undefined,
    activites: [],
    notes,
  })
  if (opp) onCreated(opp.id)
}

  const fieldCls = 'w-full px-3 py-2 rounded-lg border border-surface-200 text-xs text-surface-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 bg-white'

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle opportunité" size="md">
      <div className="space-y-4">
        {/* Produit */}
        <div>
          <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1.5">
            Produit *
          </label>
          <select value={produitId} onChange={e => { setProduitId(e.target.value); setInstallateurId('') }}
            className={fieldCls}>
            {produits.filter(p => p.actif).map(p => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
          {produitChoisi && (
            <p className="text-[10px] text-surface-400 mt-1">
              Prix moyen : {produitChoisi.prixMin.toLocaleString('fr-FR')} € – {produitChoisi.prixMax.toLocaleString('fr-FR')} €
            </p>
          )}
        </div>

        {/* Installateur */}
        {installateursFiltres.length > 0 && (
          <div>
            <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1.5">
              Installateur
            </label>
            <select value={installateurId} onChange={e => setInstallateurId(e.target.value)} className={fieldCls}>
              <option value="">— Choisir un installateur —</option>
              {installateursFiltres.map(i => (
                <option key={i.id} value={i.id}>{i.raisonSociale} ({i.adresse.ville})</option>
              ))}
            </select>
          </div>
        )}

        {/* Montants */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1.5">
              Montant devis (€)
            </label>
            <input type="number" value={montantDevis} onChange={e => setMontantDevis(e.target.value)}
              placeholder="14000" className={fieldCls} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1.5">
              Aide MPR (€)
            </label>
            <input type="number" value={montantMPR} onChange={e => setMontantMPR(e.target.value)}
              placeholder="5000" className={fieldCls} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1.5">
              Aide CEE (€)
            </label>
            <input type="number" value={montantCEE} onChange={e => setMontantCEE(e.target.value)}
              placeholder="1500" className={fieldCls} />
          </div>
        </div>

        {/* Reste à charge calculé */}
        {montantDevis && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
            <span className="text-xs text-green-700">Reste à charge estimé</span>
            <span className="text-sm font-bold text-green-700">
              {montantNet.toLocaleString('fr-FR')} €
            </span>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1.5">
            Notes
          </label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            rows={2} placeholder="Remarques, informations complémentaires…"
            className={clsx(fieldCls, 'resize-none')} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-surface-200 text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleCreate} disabled={!produitId}
            className="flex-1 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            <TrendingUp size={14} /> Créer l'opportunité
          </button>
        </div>
      </div>
    </Modal>
  )
}