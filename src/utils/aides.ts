import type { Produit } from '@/types/produit'
import type { TrancheMPR } from '@/types/contact'

// Plafonds de ressources 2024 — Zone B2/C (Aude, Occitanie)
// Index = nombre de personnes - 1 (plafonné à 4)
const PLAFONDS_MPR: Record<TrancheMPR, number[]> = {
  tres_modeste:  [17009, 24875, 29917, 34948, 39990],
  modeste:       [21805, 31889, 38349, 44809, 51269],
  intermediaire: [30549, 44907, 54071, 63235, 72399],
  superieure:    [Infinity, Infinity, Infinity, Infinity, Infinity],
}

export const LABELS_TRANCHE: Record<TrancheMPR, string> = {
  tres_modeste:  'Très modeste (Bleu)',
  modeste:       'Modeste (Jaune)',
  intermediaire: 'Intermédiaire (Violet)',
  superieure:    'Supérieure (Rose)',
}

export const COULEURS_TRANCHE: Record<TrancheMPR, string> = {
  tres_modeste:  '#3b82f6',
  modeste:       '#10b981',
  intermediaire: '#f59e0b',
  superieure:    '#ef4444',
}

export function calculerTrancheMPR(
  revenuFiscal: number,
  nombrePersonnes: number
): TrancheMPR {
  const idx = Math.min(Math.max(nombrePersonnes - 1, 0), 4)
  if (revenuFiscal <= PLAFONDS_MPR.tres_modeste[idx])  return 'tres_modeste'
  if (revenuFiscal <= PLAFONDS_MPR.modeste[idx])        return 'modeste'
  if (revenuFiscal <= PLAFONDS_MPR.intermediaire[idx])  return 'intermediaire'
  return 'superieure'
}

export function getAideMPRPourTranche(produit: Produit, tranche: TrancheMPR) {
  return produit.aidesMPR.find(a => a.tranche === tranche)
}

export function calculerAideMPR(
  produit: Produit,
  tranche: TrancheMPR,
  montantTravaux: number
): number {
  const aide = getAideMPRPourTranche(produit, tranche)
  if (!aide) return 0
  const montantCalcule = Math.round(montantTravaux * aide.tauxMax / 100)
  return Math.min(montantCalcule, aide.montantMax)
}

export function calculerAideCEE(produit: Produit, surfaceM2 = 50): number {
  return produit.aidesCEE.reduce((sum, cee) => {
    if (cee.unite === '€') return sum + cee.montantIndicatif
    if (cee.unite === '€/m²') return sum + cee.montantIndicatif * surfaceM2
    return sum + cee.montantIndicatif
  }, 0)
}

export function calculerResteACharge(
  montantTravaux: number,
  aideMPR: number,
  aideCEE: number
): number {
  return Math.max(0, montantTravaux - aideMPR - aideCEE)
}