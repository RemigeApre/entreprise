import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { Materiel, AchatPrevu } from '~/utils/types'

export function useMateriel() {
  const { $directus } = useNuxtApp()

  const materielFields = [
    'id', 'nom', 'reference', 'description', 'etat',
    'affecte_a.id', 'affecte_a.first_name', 'affecte_a.last_name',
    'date_achat', 'prix_achat', 'notes', 'date_created'
  ]

  const achatFields = [
    'id', 'nom', 'prix_estime', 'type', 'statut',
    'prochaine_date', 'recurrence_mois', 'notes', 'date_created'
  ]

  async function getAllMateriels() {
    return await $directus.request(readItems('materiels', {
      fields: materielFields,
      sort: ['nom'],
      limit: -1
    })) as Materiel[]
  }

  async function createMateriel(data: Partial<Materiel>) {
    return await $directus.request(createItem('materiels', data)) as Materiel
  }

  async function updateMateriel(id: string, data: Partial<Materiel>) {
    return await $directus.request(updateItem('materiels', id, data)) as Materiel
  }

  async function removeMateriel(id: string) {
    await $directus.request(deleteItem('materiels', id))
  }

  async function getAllAchats() {
    return await $directus.request(readItems('achats_prevus', {
      fields: achatFields,
      sort: ['prochaine_date'],
      limit: -1
    })) as AchatPrevu[]
  }

  async function createAchat(data: Partial<AchatPrevu>) {
    return await $directus.request(createItem('achats_prevus', data)) as AchatPrevu
  }

  async function updateAchat(id: string, data: Partial<AchatPrevu>) {
    return await $directus.request(updateItem('achats_prevus', id, data)) as AchatPrevu
  }

  async function removeAchat(id: string) {
    await $directus.request(deleteItem('achats_prevus', id))
  }

  return {
    getAllMateriels, createMateriel, updateMateriel, removeMateriel,
    getAllAchats, createAchat, updateAchat, removeAchat
  }
}
