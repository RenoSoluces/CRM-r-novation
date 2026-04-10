import { create } from 'zustand'
import type { Notification } from '@/types/notification'

const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'rappel_rdv',
    titre: 'RDV demain — Famille Martin',
    message: 'RDV visite technique prévu le 05/02 à 10h00 à Carcassonne.',
    lienId: 'o1',
    lienType: 'opportunite',
    destinataireId: 'u3',
    lue: false,
    dateEcheance: '2025-02-05',
    createdAt: '2025-02-04',
  },
  {
    id: 'n2',
    type: 'relance_prospect',
    titre: 'Relance — Pierre Fontaine',
    message: 'Devis envoyé il y a 7 jours sans réponse. Penser à relancer.',
    lienId: 'o3',
    lienType: 'opportunite',
    destinataireId: 'u4',
    lue: false,
    dateEcheance: '2025-02-06',
    createdAt: '2025-02-05',
  },
  {
    id: 'n3',
    type: 'suivi_dossier_mpr',
    titre: 'Dossier MPR à constituer — Dupuis',
    message: "Le dossier MaPrimeRénov' pour Alain Dupuis doit être soumis avant le 28/02.",
    lienId: 'o2',
    lienType: 'opportunite',
    destinataireId: 'u3',
    lue: false,
    dateEcheance: '2025-02-28',
    createdAt: '2025-02-01',
  },
  {
    id: 'n4',
    type: 'nouveau_lead',
    titre: 'Nouveau lead — Lucas Petit',
    message: 'Nouveau prospect entrant via le site web, intéressé par panneaux photovoltaïques.',
    lienId: 'o7',
    lienType: 'opportunite',
    destinataireId: 'u3',
    lue: true,
    createdAt: '2025-01-25',
  },
  {
    id: 'n5',
    type: 'installation_proche',
    titre: 'Installation dans 3 jours — Fontaine',
    message: 'Chantier PV 9kWc prévu le 05/03. Vérifier confirmation installateur Solaire Occitanie.',
    lienId: 'o3',
    lienType: 'opportunite',
    destinataireId: 'u4',
    lue: false,
    dateEcheance: '2025-03-05',
    createdAt: '2025-03-02',
  },
  {
    id: 'n6',
    type: 'suivi_dossier_cee',
    titre: 'CEE versé — Famille Bernard',
    message: 'La prime CEE de 800€ a été versée pour le dossier isolation combles.',
    lienId: 'o4',
    lienType: 'opportunite',
    destinataireId: 'u4',
    lue: true,
    createdAt: '2025-01-08',
  },
]

interface NotificationsStore {
  notifications: Notification[]
  marquerLue: (id: string) => void
  marquerToutesLues: (destinataireId: string) => void
  ajouterNotification: (n: Notification) => void
  supprimerNotification: (id: string) => void
  getNonLues: (destinataireId: string) => Notification[]
  getParDestinataire: (destinataireId: string) => Notification[]
}

export const useNotificationsStore = create<NotificationsStore>()((set, get) => ({
  notifications: mockNotifications,

  marquerLue: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, lue: true } : n
      ),
    })),

  marquerToutesLues: (destinataireId) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.destinataireId === destinataireId ? { ...n, lue: true } : n
      ),
    })),

  ajouterNotification: (n) =>
    set((s) => ({ notifications: [n, ...s.notifications] })),

  supprimerNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),

  getNonLues: (destinataireId) =>
    get().notifications.filter(
      (n) => n.destinataireId === destinataireId && !n.lue
    ),

  getParDestinataire: (destinataireId) =>
    get().notifications.filter(
      (n) => n.destinataireId === destinataireId
    ),
}))