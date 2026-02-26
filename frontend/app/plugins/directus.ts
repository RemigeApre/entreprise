import { createDirectus, rest, authentication } from '@directus/sdk'
import type { DirectusSchema } from '~/utils/types'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Server-side: use internal Docker URL (http://directus:8055)
  // Client-side: use public URL or resolve relative path to absolute
  let url: string
  if (import.meta.server) {
    url = config.directusUrl as string
  } else {
    const publicUrl = config.public.directusUrl as string
    url = publicUrl.startsWith('http') ? publicUrl : `${window.location.origin}${publicUrl}`
  }

  const client = createDirectus<DirectusSchema>(url)
    .with(authentication('cookie', { credentials: 'include' }))
    .with(rest({ credentials: 'include' }))

  return {
    provide: {
      directus: client
    }
  }
})
