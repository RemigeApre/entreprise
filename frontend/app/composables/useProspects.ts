import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { Prospect, ContactHistory, ContactCanal } from '~/utils/types'

export function useProspects() {
  const { $directus } = useNuxtApp()

  const prospectFields = [
    'id', 'nom_entreprise', 'secteur', 'adresse', 'telephone', 'email', 'site_web',
    'date_premier_contact', 'notes', 'statut',
    'prospecteur.id', 'prospecteur.first_name', 'prospecteur.last_name',
    'date_created', 'date_updated'
  ]

  async function getAll() {
    return await $directus.request(readItems('prospects', {
      fields: prospectFields,
      sort: ['-date_created'],
      limit: -1
    })) as Prospect[]
  }

  async function getById(id: string) {
    return await $directus.request(readItem('prospects', id, {
      fields: [
        ...prospectFields,
        'historique_contacts.id', 'historique_contacts.canal', 'historique_contacts.date_contact',
        'historique_contacts.notes', 'historique_contacts.contacte_par.id',
        'historique_contacts.contacte_par.first_name', 'historique_contacts.contacte_par.last_name',
        'historique_contacts.date_created'
      ]
    })) as Prospect
  }

  async function create(data: Partial<Prospect>) {
    return await $directus.request(createItem('prospects', data)) as Prospect
  }

  async function update(id: string, data: Partial<Prospect>) {
    return await $directus.request(updateItem('prospects', id, data)) as Prospect
  }

  async function remove(id: string) {
    await $directus.request(deleteItem('prospects', id))
  }

  async function addContact(data: {
    prospect: string
    canal: ContactCanal
    date_contact: string
    notes: string
    contacte_par: string
  }) {
    return await $directus.request(createItem('contacts_history', data)) as ContactHistory
  }

  return {
    getAll,
    getById,
    create,
    update,
    remove,
    addContact
  }
}
