import type { UserProfile } from '~/utils/types'

export function useCurrentUser() {
  return useState<UserProfile | null>('currentUser', () => null)
}
