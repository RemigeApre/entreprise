import type { UserProfile } from '~/utils/types'

export function getUserRoleName(user: UserProfile | null): string | null {
  if (!user) return null
  if (typeof user.role === 'string') return null
  return user.role.name
}

export function isAdmin(user: UserProfile | null): boolean {
  if (!user) return false
  if (typeof user.role === 'string') return false
  return user.role.admin_access || user.role.name === 'Directeur'
}

export function canManageJobListings(user: UserProfile | null): boolean {
  return isAdmin(user)
}

export function canValidateLeave(user: UserProfile | null): boolean {
  return isAdmin(user)
}

export function canManageUsers(user: UserProfile | null): boolean {
  return isAdmin(user)
}
