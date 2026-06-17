import { createDirectus, rest, withToken } from '@directus/sdk'
import type { DirectusSchema } from '~/utils/types'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const { getValidToken } = useDirectusAuth()
  const router = useRouter()

  let url: string
  if (import.meta.server) {
    url = config.directusUrl as string
  } else {
    const pub = config.public.directusUrl as string
    url = pub.startsWith('http') ? pub : `${window.location.origin}${pub}`
  }

  const client = createDirectus<DirectusSchema>(url).with(rest())
  const _req = client.request.bind(client)

  // Token du Comptoir (scope), stocke par la page comptoir apres saisie du PIN.
  // Le comptoir est autonome : il n'utilise PAS la session intranet.
  function comptoirToken(): string | null {
    if (!import.meta.client) return null
    try {
      const raw = localStorage.getItem('_comptoir')
      if (!raw) return null
      const s = JSON.parse(raw)
      if (!s?.token) return null
      if (Date.now() - (s.authenticatedAt || 0) > 12 * 60 * 60 * 1000) return null
      return s.token as string
    } catch { return null }
  }

  // Wrap request() pour injecter le bon Bearer token a chaque appel.
  const authedRequest = async <T>(req: ReturnType<typeof withToken> | any): Promise<T> => {
    let token: string | null = null
    if (import.meta.client && router.currentRoute.value.path.startsWith('/comptoir')) {
      token = comptoirToken()
    }
    if (!token) token = await getValidToken()
    return token ? _req<T>(withToken(token, req)) : _req<T>(req)
  }

  return {
    provide: {
      directus: { ...client, request: authedRequest }
    }
  }
})
