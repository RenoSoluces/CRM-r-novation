import { supabase } from '@/lib/supabase'
import type { Installateur } from '@/types/installateur'

function mapRow(row: any): Installateur {
  return {
    id: row.id,
    raisonSociale: row.raison_sociale,
    siret: row.siret,
    contact: {
      nom: row.contact_nom,
      prenom: row.contact_prenom,
      email: row.contact_email,
      telephone: row.contact_telephone,
    },
    adresse: {
      rue: row.adresse_rue,
      codePostal: row.adresse_code_postal,
      ville: row.adresse_ville,
    },
    zonesIntervention: row.zones_intervention ?? [],
    produitIds: row.produit_ids ?? [],
    certifications: row.certifications ?? [],
    note: row.note,
    nombreChantiers: row.nombre_chantiers,
    chantiers: [],
    actif: row.actif,
    notes: row.notes,
    createdAt: row.created_at,
  }
}

export async function getInstallateurs(): Promise<Installateur[]> {
  const { data, error } = await supabase
    .from('installateurs')
    .select('*')
    .order('raison_sociale')
  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function createInstallateur(
  payload: Omit<Installateur, 'id' | 'chantiers' | 'createdAt'>
): Promise<Installateur> {
  const { data, error } = await supabase
    .from('installateurs')
    .insert({
      raison_sociale: payload.raisonSociale,
      siret: payload.siret,
      contact_nom: payload.contact.nom,
      contact_prenom: payload.contact.prenom,
      contact_email: payload.contact.email,
      contact_telephone: payload.contact.telephone,
      adresse_rue: payload.adresse.rue,
      adresse_code_postal: payload.adresse.codePostal,
      adresse_ville: payload.adresse.ville,
      zones_intervention: payload.zonesIntervention,
      produit_ids: payload.produitIds,
      certifications: payload.certifications,
      note: payload.note,
      nombre_chantiers: payload.nombreChantiers,
      actif: payload.actif,
      notes: payload.notes,
    })
    .select()
    .single()
  if (error) throw error
  return mapRow(data)
}

export async function updateInstallateur(
  id: string,
  payload: Partial<Omit<Installateur, 'id' | 'chantiers' | 'createdAt'>>
): Promise<Installateur> {
  const { data, error } = await supabase
    .from('installateurs')
    .update({
      raison_sociale: payload.raisonSociale,
      siret: payload.siret,
      contact_nom: payload.contact?.nom,
      contact_prenom: payload.contact?.prenom,
      contact_email: payload.contact?.email,
      contact_telephone: payload.contact?.telephone,
      adresse_rue: payload.adresse?.rue,
      adresse_code_postal: payload.adresse?.codePostal,
      adresse_ville: payload.adresse?.ville,
      zones_intervention: payload.zonesIntervention,
      produit_ids: payload.produitIds,
      certifications: payload.certifications,
      note: payload.note,
      nombre_chantiers: payload.nombreChantiers,
      actif: payload.actif,
      notes: payload.notes,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapRow(data)
}

export async function deleteInstallateur(id: string): Promise<void> {
  const { error } = await supabase
    .from('installateurs')
    .delete()
    .eq('id', id)
  if (error) throw error
}