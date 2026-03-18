import { createDirectus, rest } from '@directus/sdk'
import type { DirectusSchema } from '~/utils/types'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const { getValidToken } = useDirectusAuth()

  let url: string
  if (import.meta.server) {
    url = config.directusUrl as string
  } else {
    const pub = config.public.directusUrl as string
    url = pub.startsWith('http') ? pub : `${window.location.origin}${pub}`
  }

  const authedFetch: typeof globalThis.fetch = async (input, init) => {
    const token = await getValidToken()
    if (token) {
      const headers = new Headers((init?.headers) as HeadersInit | undefined)
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      init = { ...(init || {}), headers }
    }
    return globalThis.fetch(input, init)
  }

  const client = createDirectus<DirectusSchema>(url, { globals: { fetch: authedFetch } }).with(rest())

  return {
    provide: {
      directus: client
    }
  }
})
