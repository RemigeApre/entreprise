import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { Transaction } from '~/utils/types'

export function useFinance() {
  const { $directus } = useNuxtApp()

  const fields = [
    'id', 'libelle', 'montant', 'type',
    'categorie.id', 'categorie.label', 'categorie.icone', 'categorie.sous_categorie', 'categorie.type',
    'date', 'recurrence', 'notes', 'projet.id', 'projet.nom',
    'date_created', 'user_created'
  ]

  async function getAll() {
    return await $directus.request(readItems('transactions', {
      fields,
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
