import { createDirectus, rest, authentication } from '@directus/sdk'
import type { DirectusSchema } from '~/utils/types'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const client = createDirectus<DirectusSchema>(config.public.directusUrl as string)
    .with(authentication('cookie', { credentials: 'include' }))
    .with(rest({ credentials: 'include' }))

  return {
    provide: {
      directus: client
    }
  }
})
