import { createDirectus, rest, authentication } from '@directus/sdk'
import type { DirectusSchema } from '~/utils/types'

const STORAGE_KEY = 'directus_auth'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  let url: string
  if (import.meta.server) {
    url = config.directusUrl as string
  } else {
    const publicUrl = config.public.directusUrl as string
    url = publicUrl.startsWith('http') ? publicUrl : `${window.location.origin}${publicUrl}`
  }

  const storage = import.meta.client
    ? {
        get() {
          try {
            const v = localStorage.getItem(STORAGE_KEY)
            return v ? JSON.parse(v) : null
          } catch { return null }
        },
        set(value: Record<string, unknown> | null) {
          try {
            if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
            else localStorage.removeItem(STORAGE_KEY)
          } catch {}
        }
      }
    : undefined

  const client = createDirectus<DirectusSchema>(url)
    .with(authentication('json', { storage } as never))
    .with(rest())

  return {
    provide: {
      directus: client
    }
  }
})
