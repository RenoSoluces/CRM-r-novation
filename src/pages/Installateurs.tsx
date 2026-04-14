import { useState, useEffect } from 'react'
import { Search, Star, MapPin, Phone, Mail, Wrench, Calendar, CheckCircle, Plus, X } from 'lucide-react'
import { useInstallateursStore } from '@/store/installateurStore'
import { useProduitsStore } from '@/store/produitsStore'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/utils/formatters'
import Badge, { FAMILLE_LABELS, FAMILLE_COLORS } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import type { ZoneIntervention } from '@/types/installateur'
import clsx from 'clsx'

const ZONE_LABELS: Record<ZoneIntervention, string> = {
  H1: 'Zone H1',
  H2: 'Zone H2',
  H3: 'Zone H3',
  france_entiere: 'France entière',
}

const ZONES: ZoneIntervention[] = ['H1', 'H2', 'H3', 'france_entiere']

const STATUT_CHANTIER_COLORS: Record<string, string> = {
  planifie: '#3b82f6', en_cours: '#f59e0b', termine: '#10b981', annule: '#ef4444',
}
const STATUT_CHANTIER_LABELS: Record<string, string> = {
  planifie: 'Planifié', en_cours: 'En cours', termine: 'Terminé', annule: 'Annulé',
}

const EMPTY_FORM = {
  raisonSociale: '',
  siret: '',
  contactNom: '',
  contactPrenom: '',
  contactEmail: '',
  contactTelephone: '',
  adresseRue: '',
  adresseCodePostal: '',
  adresseVille: '',
  zonesIntervention: [] as ZoneIntervention[],
  certifications: '',
  notes: '',
}

export default function Installateurs() {
  const { installateurs, isLoading, fetchInstallateurs, addInstallateur } = useInstallateursStore()
  const { produits } = useProduitsStore()
  const { can } = useAuth()
  const [search,    setSearch]    = useState('')
  const [selected,  setSelected]  = useState<string | null>(null)
  const [onglet,    setOnglet]    = useState<'infos' | 'chantiers'>('infos')
  const [showModal, setShowModal] = useState(false)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)

  useEffect(() => { fetchInstallateurs() }, [])

  const filtered = installateurs.filter(i =>
    i.actif && (!search ||
      `${i.raisonSociale} ${i.adresse.ville} ${i.zonesIntervention.join(' ')}`
        .toLowerCase().includes(search.toLowerCase()))
  )

  const inst = installateurs.find(i => i.id === selected)

  function toggleZone(z: ZoneIntervention) {
    setForm(f => ({
      ...f,
      zonesIntervention: f.zonesIntervention.includes(z)
        ? f.zonesIntervention.filter(x => x !== z)
        : [...f.zonesIntervention, z],
    }))
  }

  async function handleSubmit() {
    if (!form.raisonSociale || !form.contactNom || !form.contactTelephone) return
    setSaving(true)
    await addInstallateur({
      raisonSociale: form.raisonSociale,
      siret: form.siret || undefined,
      contact: {
        nom: form.contactNom,
        prenom: form.contactPrenom,
        email: form.contactEmail,
        telephone: form.contactTelephone,
      },
      adresse: {
        rue: form.adresseRue,
        codePostal: form.adresseCodePostal,
        ville: form.adresseVille,
      },
      zonesIntervention: form.zonesIntervention,
      produitIds: [],
      certifications: form.certifications ? form.certifications.split(',').map(c => c.trim()).filter(Boolean) : [],
      note: 0,
      nombreChantiers: 0,
      actif: true,
      notes: form.notes || undefined,
    })
    setSaving(false)
    setShowModal(false)
    setForm(EMPTY_FORM)
  }

  return (
    <div className="flex gap-5 h-[calc(100vh-8rem)]">
      {/* Liste */}
      <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-surface-200 shadow-card flex flex-col overflow-hidden">
        <div className="p-4 border-b border-surface-100 space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-200 bg-surface-50">
            <Search size={13} className="text-surface-400" />
            <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-xs text-surface-700 placeholder-surface-400 outline-none w-full" />
          </div>
          {can('utilisateurs.edit') && (
            <button onClick={() => setShowModal(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition-colors">
              <Plus size={13} /> Ajouter un partenaire
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-surface-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-xs text-surface-400">Chargement…</p>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Wrench} title="Aucun partenaire" />
          ) : filtered.map(i => (
            <button key={i.id} onClick={() => setSelected(i.id)}
              className={clsx('w-full text-left p-4 hover:bg-surface-50 transition-colors',
                selected === i.id && 'bg-brand-50 border-l-2 border-brand-500')}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-surface-800 truncate">{i.raisonSociale}</p>
                  <p className="text-[10px] text-surface-500 mt-0.5 flex items-center gap-1">
                    <MapPin size={9} />{i.adresse.ville}
                  </p>
                </div>
                {i.note > 0 && (
                  <div className="flex items-center gap-1 text-amber-500 flex-shrink-0">
                    <Star size={11} fill="currentColor" />
                    <span className="text-[10px] font-bold">{i.note}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {i.zonesIntervention.map(z => (
                  <span key={z} className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 font-bold">
                    {ZONE_LABELS[z]}
                  </span>
                ))}
              </div>
              {i.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {i.certifications.slice(0, 2).map(c => (
                    <span key={c} className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">{c}</span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Détail */}
      <div className="flex-1 min-w-0">
        {!inst ? (
          <div className="bg-white rounded-xl border border-surface-200 shadow-card h-full flex items-center justify-center">
            <EmptyState icon={Wrench} title="Sélectionnez un partenaire" description="Cliquez sur un partenaire pour voir ses détails." />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-surface-200 shadow-card flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-surface-100">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display font-bold text-surface-800 text-lg">{inst.raisonSociale}</h2>
                  {inst.siret && <p className="text-xs text-surface-400 mt-0.5">SIRET : {inst.siret}</p>}
                </div>
                {inst.note > 0 && (
                  <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                    <Star size={14} fill="#f59e0b" className="text-amber-500" />
                    <span className="font-bold text-amber-700">{inst.note}/5</span>
                  </div>
                )}
              </div>
              {inst.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {inst.certifications.map(c => (
                    <span key={c} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-green-100 text-green-700 font-bold">
                      <CheckCircle size={9} /> {c}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex border-b border-surface-100">
              {(['infos', 'chantiers'] as const).map(o => (
                <button key={o} onClick={() => setOnglet(o)}
                  className={clsx('px-5 py-3 text-xs font-semibold transition-colors border-b-2',
                    onglet === o ? 'border-brand-500 text-brand-600' : 'border-transparent text-surface-500 hover:text-surface-700')}>
                  {o === 'infos' ? 'Informations' : `Chantiers (${inst.chantiers.length})`}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {onglet === 'infos' && (
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <InfoBlock title="Contact">
                      <p className="text-xs font-semibold text-surface-700">{inst.contact.prenom} {inst.contact.nom}</p>
                      <p className="text-xs text-surface-600 flex items-center gap-1.5 mt-1.5"><Phone size={11} />{inst.contact.telephone}</p>
                      {inst.contact.email && (
                        <p className="text-xs text-surface-600 flex items-center gap-1.5 mt-1"><Mail size={11} />{inst.contact.email}</p>
                      )}
                    </InfoBlock>
                    <InfoBlock title="Adresse">
                      {inst.adresse.rue && <p className="text-xs text-surface-700">{inst.adresse.rue}</p>}
                      <p className="text-xs text-surface-700">{inst.adresse.codePostal} {inst.adresse.ville}</p>
                    </InfoBlock>
                    <InfoBlock title="Zones d'intervention">
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {inst.zonesIntervention.map(z => (
                          <span key={z} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-bold">
                            {ZONE_LABELS[z]}
                          </span>
                        ))}
                      </div>
                    </InfoBlock>
                    {inst.notes && (
                      <InfoBlock title="Notes">
                        <p className="text-xs text-surface-600">{inst.notes}</p>
                      </InfoBlock>
                    )}
                  </div>
                  <div>
                    <InfoBlock title="Produits maîtrisés">
                      <div className="space-y-1.5 mt-1">
                        {inst.produitIds.map(pid => {
                          const p = produits.find(pr => pr.id === pid)
                          return p ? (
                            <Badge key={pid} label={FAMILLE_LABELS[p.famille] ?? p.nom} color={FAMILLE_COLORS[p.famille]} size="md" />
                          ) : null
                        })}
                      </div>
                    </InfoBlock>
                  </div>
                </div>
              )}

              {onglet === 'chantiers' && (
                <div>
                  {inst.chantiers.length === 0 ? (
                    <EmptyState icon={Calendar} title="Aucun chantier" description="Pas de chantier assigné pour le moment." />
                  ) : (
                    <div className="space-y-3">
                      {inst.chantiers.map(c => (
                        <div key={c.id} className="p-4 rounded-xl border border-surface-200 hover:border-surface-300 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold text-surface-800">{c.contactNom}</p>
                              <p className="text-[10px] text-surface-500 mt-0.5">{c.produitNom}</p>
                              <p className="text-[10px] text-surface-400 flex items-center gap-1 mt-1">
                                <MapPin size={9} />{c.adresse}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                style={{ background: STATUT_CHANTIER_COLORS[c.statut] + '20', color: STATUT_CHANTIER_COLORS[c.statut] }}>
                                {STATUT_CHANTIER_LABELS[c.statut]}
                              </span>
                              <p className="text-[10px] text-surface-400 mt-1 flex items-center gap-1">
                                <Calendar size={9} />{formatDate(c.dateInstallation)}
                              </p>
                            </div>
                          </div>
                          {c.notes && <p className="text-[10px] text-surface-500 mt-2 pt-2 border-t border-surface-100">{c.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal ajout partenaire */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-surface-100">
              <h3 className="font-display font-bold text-surface-800">Nouveau partenaire</h3>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM) }}
                className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Raison sociale */}
              <Field label="Raison sociale *">
                <input value={form.raisonSociale} onChange={e => setForm(f => ({ ...f, raisonSociale: e.target.value }))}
                  placeholder="Ex : IDEHOME" className={inputClass} />
              </Field>

              <Field label="SIRET">
                <input value={form.siret} onChange={e => setForm(f => ({ ...f, siret: e.target.value }))}
                  placeholder="123 456 789 00012" className={inputClass} />
              </Field>

              {/* Contact */}
              <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider pt-1">Contact</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nom *">
                  <input value={form.contactNom} onChange={e => setForm(f => ({ ...f, contactNom: e.target.value }))}
                    placeholder="Dupont" className={inputClass} />
                </Field>
                <Field label="Prénom">
                  <input value={form.contactPrenom} onChange={e => setForm(f => ({ ...f, contactPrenom: e.target.value }))}
                    placeholder="Jean" className={inputClass} />
                </Field>
              </div>
              <Field label="Téléphone *">
                <input value={form.contactTelephone} onChange={e => setForm(f => ({ ...f, contactTelephone: e.target.value }))}
                  placeholder="06.00.00.00.00" className={inputClass} />
              </Field>
              <Field label="Email">
                <input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                  placeholder="contact@partenaire.fr" className={inputClass} />
              </Field>

              {/* Adresse */}
              <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider pt-1">Adresse</p>
              <Field label="Rue">
                <input value={form.adresseRue} onChange={e => setForm(f => ({ ...f, adresseRue: e.target.value }))}
                  placeholder="12 rue des Artisans" className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Code postal">
                  <input value={form.adresseCodePostal} onChange={e => setForm(f => ({ ...f, adresseCodePostal: e.target.value }))}
                    placeholder="75000" className={inputClass} />
                </Field>
                <Field label="Ville">
                  <input value={form.adresseVille} onChange={e => setForm(f => ({ ...f, adresseVille: e.target.value }))}
                    placeholder="Paris" className={inputClass} />
                </Field>
              </div>

              {/* Zones */}
              <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider pt-1">Zones d'intervention</p>
              <div className="flex flex-wrap gap-2">
                {ZONES.map(z => (
                  <button key={z} type="button" onClick={() => toggleZone(z)}
                    className={clsx('text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors',
                      form.zonesIntervention.includes(z)
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'border-surface-200 text-surface-600 hover:border-brand-300')}>
                    {ZONE_LABELS[z]}
                  </button>
                ))}
              </div>

              {/* Certifications */}
              <Field label="Certifications (séparées par des virgules)">
                <input value={form.certifications} onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))}
                  placeholder="RGE QualiPAC, RGE QualiPV" className={inputClass} />
              </Field>

              {/* Notes */}
              <Field label="Notes internes">
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Informations complémentaires…" rows={3}
                  className={clsx(inputClass, 'resize-none')} />
              </Field>
            </div>

            <div className="flex gap-3 p-5 border-t border-surface-100">
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM) }}
                className="flex-1 py-2.5 rounded-lg border border-surface-200 text-xs font-semibold text-surface-600 hover:bg-surface-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={saving || !form.raisonSociale || !form.contactNom || !form.contactTelephone}
                className="flex-1 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
                {saving ? 'Enregistrement…' : 'Ajouter le partenaire'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-2">{title}</p>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-surface-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputClass = "w-full px-3.5 py-2.5 rounded-lg border border-surface-200 text-xs text-surface-800 placeholder-surface-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"