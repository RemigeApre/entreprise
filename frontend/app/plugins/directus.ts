import { createDirectus, rest, withToken } from '@directus/sdk'
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

  const client = createDirectus<DirectusSchema>(url).with(rest())

  // Wrap request() to inject Bearer token on every call — no changes needed in composables
  const _req = client.request.bind(client)
  const authedRequest = async <T>(req: ReturnType<typeof withToken> | any): Promise<T> => {
    const token = await getValidToken()
    return token ? _req<T>(withToken(token, req)) : _req<T>(req)
  }

  return {
    provide: {
      directus: { ...client, request: authedRequest }
    }
  }
})
