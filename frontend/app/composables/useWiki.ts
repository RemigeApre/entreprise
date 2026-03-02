import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { WikiPage } from '~/utils/types'

export function useWiki() {
  const { $directus } = useNuxtApp()

  async function getPages(): Promise<WikiPage[]> {
    return await $directus.request(readItems('wiki_pages', {
      fields: ['*'],
      filter: { actif: { _eq: true } },
      sort: ['ordre']
    })) as WikiPage[]
  }

  async function getPage(slug: string): Promise<WikiPage | null> {
    const items = await $directus.request(readItems('wiki_pages', {
      fields: ['*'],
      filter: { slug: { _eq: slug }, actif: { _eq: true } },
      limit: 1
    })) as WikiPage[]
    return items[0] || null
  }

  async function createPage(data: { titre: string; slug: string; contenu: string; icone?: string; ordre?: number }): Promise<WikiPage> {
    return await $directus.request(createItem('wiki_pages', {
      ...data,
      actif: true,
      ordre: data.ordre ?? 99
    })) as WikiPage
  }

  async function updatePage(id: string, data: Partial<WikiPage>): Promise<WikiPage> {
    return await $directus.request(updateItem('wiki_pages', id, data)) as WikiPage
  }

  async function deletePage(id: string): Promise<void> {
    await $directus.request(deleteItem('wiki_pages', id))
  }

  return { getPages, getPage, createPage, updatePage, deletePage }
}
