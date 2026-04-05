import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { Transaction } from '~/utils/types'

export function useFinance() {
  const { $directus } = useNuxtApp()

  async function getAll() {
    // Use wildcard + explicit relations to be tolerant of missing fields
    return await $directus.request(readItems('transactions', {
      fields: [
        '*',
        'categorie.id', 'categorie.label', 'categorie.icone', 'categorie.sous_categorie', 'categorie.type',
        'projet.id', 'projet.nom'
      ],
      sort: ['-date'],
      limit: -1
    })) as Transaction[]
  }

  async function create(data: Partial<Transaction>) {
    return await $directus.request(createItem('transactions', data)) as Transaction
  }

  async function update(id: string, data: Partial<Transaction>) {
    return await $directus.request(updateItem('transactions', id, data)) as Transaction
  }

  async function remove(id: string) {
    await $directus.request(deleteItem('transactions', id))
  }

  return { getAll, create, update, remove }
}
