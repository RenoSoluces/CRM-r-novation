import { create } from 'zustand'
import type { Contact } from '@/types/contact'
import { mockContacts } from '@/data/contacts'

interface ContactsStore {
  contacts: Contact[]
  addContact: (c: Contact) => void
  updateContact: (id: string, data: Partial<Contact>) => void
  deleteContact: (id: string) => void
  getById: (id: string) => Contact | undefined
  getByCommercial: (commercialId: string) => Contact[]
  getByApporteur: (apporteurId: string) => Contact[]
}

export const useContactsStore = create<ContactsStore>()((set, get) => ({
  contacts: mockContacts,

  addContact: (c) =>
    set((s) => ({ contacts: [...s.contacts, c] })),

  updateContact: (id, data) =>
    set((s) => ({
      contacts: s.contacts.map((c) =>
        c.id === id
          ? { ...c, ...data, updatedAt: new Date().toISOString() }
          : c
      ),
    })),

  deleteContact: (id) =>
    set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),

  getById: (id) =>
    get().contacts.find((c) => c.id === id),

  getByCommercial: (commercialId) =>
    get().contacts.filter((c) => c.commercialId === commercialId),

  getByApporteur: (apporteurId) =>
    get().contacts.filter((c) => c.apporteurId === apporteurId),
}))