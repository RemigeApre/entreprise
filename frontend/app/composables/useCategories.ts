import { readItems } from '@directus/sdk'
import type { Category } from '~/utils/types'

export function useCategories() {
  const { $directus } = useNuxtApp()

  async function getAll() {
    return await $directus.request(readItems('categories', {
      fields: ['id', 'nom', 'description', 'couleur'],
      sort: ['nom'],
      limit: -1
    })) as Category[]
  }

  return { getAll }
}
