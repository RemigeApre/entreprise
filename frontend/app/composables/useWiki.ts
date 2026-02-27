import { readItems } from '@directus/sdk'
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

  return { getPages }
}
