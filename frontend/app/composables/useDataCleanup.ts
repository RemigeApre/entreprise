import { readItems, deleteItem } from '@directus/sdk'
import type { WikiPage, Category } from '~/utils/types'

interface DuplicateGroup<T> {
  key: string
  items: T[]
  toDelete: T[]
}

export function useDataCleanup() {
  const { $directus } = useNuxtApp()

  // --- Wiki pages: deduplicate by slug ---

  async function findWikiDuplicates(): Promise<DuplicateGroup<WikiPage>[]> {
    const all = await $directus.request(readItems('wiki_pages', {
      fields: ['id', 'titre', 'slug', 'date_created'],
      sort: ['date_created'],
      limit: -1
    })) as WikiPage[]

    const groups = new Map<string, WikiPage[]>()
    for (const page of all) {
      const list = groups.get(page.slug) || []
      list.push(page)
      groups.set(page.slug, list)
    }

    const duplicates: DuplicateGroup<WikiPage>[] = []
    for (const [slug, items] of groups) {
      if (items.length > 1) {
        duplicates.push({ key: slug, items, toDelete: items.slice(1) })
      }
    }
    return duplicates
  }

  async function cleanWikiDuplicates(): Promise<number> {
    const duplicates = await findWikiDuplicates()
    let count = 0
    for (const group of duplicates) {
      for (const item of group.toDelete) {
        await $directus.request(deleteItem('wiki_pages', item.id))
        count++
      }
    }
    return count
  }

  // --- Categories: deduplicate by nom ---

  async function findCategoryDuplicates(): Promise<DuplicateGroup<Category>[]> {
    const all = await $directus.request(readItems('categories', {
      fields: ['id', 'nom', 'description', 'couleur'],
      sort: ['id'],
      limit: -1
    })) as Category[]

    const groups = new Map<string, Category[]>()
    for (const cat of all) {
      const list = groups.get(cat.nom) || []
      list.push(cat)
      groups.set(cat.nom, list)
    }

    const duplicates: DuplicateGroup<Category>[] = []
    for (const [nom, items] of groups) {
      if (items.length > 1) {
        duplicates.push({ key: nom, items, toDelete: items.slice(1) })
      }
    }
    return duplicates
  }

  async function cleanCategoryDuplicates(): Promise<number> {
    const duplicates = await findCategoryDuplicates()
    let count = 0
    for (const group of duplicates) {
      for (const item of group.toDelete) {
        await $directus.request(deleteItem('categories', item.id))
        count++
      }
    }
    return count
  }

  // --- Monitored sites: deduplicate by url ---

  async function findSiteDuplicates(): Promise<DuplicateGroup<{ id: string; nom: string; url: string }>[]> {
    const all = await $directus.request(readItems('monitored_sites', {
      fields: ['id', 'nom', 'url'],
      sort: ['id'],
      limit: -1
    })) as { id: string; nom: string; url: string }[]

    const groups = new Map<string, typeof all>()
    for (const site of all) {
      const list = groups.get(site.url) || []
      list.push(site)
      groups.set(site.url, list)
    }

    const duplicates: DuplicateGroup<typeof all[0]>[] = []
    for (const [url, items] of groups) {
      if (items.length > 1) {
        duplicates.push({ key: url, items, toDelete: items.slice(1) })
      }
    }
    return duplicates
  }

  async function cleanSiteDuplicates(): Promise<number> {
    const duplicates = await findSiteDuplicates()
    let count = 0
    for (const group of duplicates) {
      for (const item of group.toDelete) {
        await $directus.request(deleteItem('monitored_sites', item.id))
        count++
      }
    }
    return count
  }

  return {
    findWikiDuplicates, cleanWikiDuplicates,
    findCategoryDuplicates, cleanCategoryDuplicates,
    findSiteDuplicates, cleanSiteDuplicates
  }
}
