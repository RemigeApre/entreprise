import { readItems, createItem } from '@directus/sdk'
import type { CandidatBookingToken } from '~/utils/types'

export function useBookingTokens() {
  const { $directus } = useNuxtApp()

  async function getActiveToken(candidatId: string): Promise<CandidatBookingToken | null> {
    const now = new Date().toISOString()
    const items = await $directus.request(readItems('candidat_booking_tokens', {
      filter: {
        candidat: { _eq: candidatId },
        utilise: { _eq: false },
        expires_at: { _gt: now }
      },
      fields: ['id', 'token', 'candidat', 'expires_at', 'utilise'],
      sort: ['-expires_at'],
      limit: 1
    })) as CandidatBookingToken[]
    return items[0] || null
  }

  async function createToken(candidatId: string, daysValid = 7): Promise<CandidatBookingToken> {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + daysValid)

    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    const token = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')

    return await $directus.request(createItem('candidat_booking_tokens', {
      token,
      candidat: candidatId,
      expires_at: expiresAt.toISOString(),
      utilise: false
    })) as CandidatBookingToken
  }

  return { getActiveToken, createToken }
}
