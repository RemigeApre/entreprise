import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { RecruteurDisponibilite } from '~/utils/types'

export function useDisponibilites() {
  const { $directus } = useNuxtApp()

  async function getAll() {
    return await $directus.request(readItems('recruteur_disponibilites', {
      sort: ['jour_semaine', 'heure_debut'],
      limit: -1
    })) as RecruteurDisponibilite[]
  }

  async function create(data: Omit<RecruteurDisponibilite, 'id'>) {
    return await $directus.request(createItem('recruteur_disponibilites', data)) as RecruteurDisponibilite
  }

  async function toggle(id: string, actif: boolean) {
    return await $directus.request(updateItem('recruteur_disponibilites', id, { actif })) as RecruteurDisponibilite
  }

  async function update(id: string, data: Partial<RecruteurDisponibilite>) {
    return await $directus.request(updateItem('recruteur_disponibilites', id, data)) as RecruteurDisponibilite
  }

  async function remove(id: string) {
    await $directus.request(deleteItem('recruteur_disponibilites', id))
  }

  return { getAll, create, toggle, update, remove }
}
