import { createDirectus, rest, authentication } from '@directus/sdk'
import type { DirectusSchema } from '~/utils/types'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Server-side: use internal Docker URL (http://directus:8055)
  // Client-side: use public URL (https://domain.com/api)
  const url = import.meta.server
    ? (config.directusUrl as string)
    : (config.public.directusUrl as string)

  const client = createDirectus<DirectusSchema>(url)
    .with(authentication('cookie', { credentials: 'include' }))
    .with(rest({ credentials: 'include' }))

  return {
    provide: {
      directus: client
    }
  }
})
