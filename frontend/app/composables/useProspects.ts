import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { Prospect, ContactHistory, ContactCanal, ContactResultat, ProspectOffre, OffreProspectStatut } from '~/utils/types'

export function useProspects() {
  const { $directus } = useNuxtApp()

  async function getAll() {
    return await $directus.request(readItems('prospects', {
      fields: [
        '*',
        'prospecteur.id', 'prospecteur.first_name', 'prospecteur.last_name',
        'historique_contacts.id', 'historique_contacts.resultat',
        'historique_contacts.date_contact', 'historique_contacts.canal'
      ],
      sort: ['-date_created'],
      limit: -1
    })) as Prospect[]
  }

  async function getClients() {
    return await $directus.request(readItems('prospects', {
      filter: { statut: { _eq: 'client' } },
      fields: [
        '*',
        'prospecteur.id', 'prospecteur.first_name', 'prospecteur.last_name'
      ],
      sort: ['-date_created'],
      limit: -1
    })) as Prospect[]
  }

  async function getById(id: string) {
    return await $directus.request(readItem('prospects', id, {
      fields: [
        '*',
        'prospecteur.id', 'prospecteur.first_name', 'prospecteur.last_name',
        'historique_contacts.id', 'historique_contacts.canal', 'historique_contacts.resultat',
        'historique_contacts.date_contact', 'historique_contacts.notes',
        'historique_contacts.contacte_par.id',
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
    resultat: ContactResultat
    date_contact: string
    notes: string
    contacte_par: string
  }) {
    return await $directus.request(createItem('contacts_history', data)) as ContactHistory
  }

  async function addOffre(data: {
    prospect: string
    titre: string
    montant: number | null
    statut: OffreProspectStatut
    notes: string
    ajoutee_par: string
  }) {
    return await $directus.request(createItem('prospect_offres', data)) as ProspectOffre
  }

  async function updateOffre(id: string, data: Partial<ProspectOffre>) {
    return await $directus.request(updateItem('prospect_offres', id, data)) as ProspectOffre
  }

  async function removeOffre(id: string) {
    await $directus.request(deleteItem('prospect_offres', id))
  }

  return {
    getAll,
    getClients,
    getById,
    create,
    update,
    remove,
    addContact,
    addOffre,
    updateOffre,
    removeOffre
  }
}
