import { create } from 'zustand'
import type { Produit } from '@/types/produit'
import { mockProduits } from '@/data/produits'

interface ProduitsStore {
  produits: Produit[]
  addProduit: (p: Produit) => void
  updateProduit: (id: string, data: Partial<Produit>) => void
  deleteProduit: (id: string) => void
  getById: (id: string) => Produit | undefined
  getByCategorie: (categorie: 'particulier' | 'professionnel') => Produit[]
}

export const useProduitsStore = create<ProduitsStore>()((set, get) => ({
  produits: mockProduits,

  addProduit: (p) =>
    set((s) => ({ produits: [...s.produits, p] })),

  updateProduit: (id, data) =>
    set((s) => ({
      produits: s.produits.map((p) =>
        p.id === id
          ? { ...p, ...data, updatedAt: new Date().toISOString() }
          : p
      ),
    })),

  deleteProduit: (id) =>
    set((s) => ({ produits: s.produits.filter((p) => p.id !== id) })),

  getById: (id) =>
    get().produits.find((p) => p.id === id),

  getByCategorie: (categorie) =>
    get().produits.filter((p) => p.categorie === categorie),
}))