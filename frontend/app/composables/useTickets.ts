import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { Ticket } from '~/utils/types'

export function useTickets() {
  const { $directus } = useNuxtApp()

  const ticketFields = [
    'id', 'titre', 'description', 'type', 'statut', 'priorite',
    'projet.id', 'projet.nom',
    'assigne_a.id', 'assigne_a.first_name', 'assigne_a.last_name', 'assigne_a.avatar',
    'rapporte_par.id', 'rapporte_par.first_name', 'rapporte_par.last_name',
    'date_created', 'date_updated', 'user_created'
  ]

  async function getAll(filters?: { projet?: string; statut?: string; type?: string; priorite?: string }) {
    const filter: Record<string, any> = {}
    if (filters?.projet) filter.projet = { _eq: filters.projet }
    if (filters?.statut) filter.statut = { _eq: filters.statut }
    if (filters?.type) filter.type = { _eq: filters.type }
    if (filters?.priorite) filter.priorite = { _eq: filters.priorite }

    return await $directus.request(readItems('project_tickets', {
      fields: ticketFields,
      filter,
      sort: ['-date_created'],
      limit: -1
    })) as Ticket[]
  }

  async function getById(id: string) {
    return await $directus.request(readItem('project_tickets', id, {
      fields: ticketFields
    })) as Ticket
  }

  async function create(data: Partial<Ticket>) {
    return await $directus.request(createItem('project_tickets', data)) as Ticket
  }

  async function update(id: string, data: Partial<Ticket>) {
    return await $directus.request(updateItem('project_tickets', id, data)) as Ticket
  }

  async function remove(id: string) {
    await $directus.request(deleteItem('project_tickets', id))
  }

  return { getAll, getById, create, update, remove }
}
