import { readMe } from '@directus/sdk'
import type { UserProfile } from '~/utils/types'

export function useAuth() {
  const { $directus } = useNuxtApp()
  const user = useCurrentUser()

  const fetchCurrentUser = async () => {
    try {
      const me = await $directus.request(readMe({
        fields: ['*', 'role.*', 'categorie.*'] as any
      }))
      user.value = me as unknown as UserProfile
      return user.value
    } catch {
      user.value = null
      return null
    }
  }

  const login = async (email: string, password: string) => {
    await $directus.login({ email, password })
    await fetchCurrentUser()
  }

  const logout = async () => {
    try {
      await $directus.logout()
    } catch {
      // Ignore logout errors
    }
    user.value = null
    await navigateTo('/login')
  }

  const refresh = async () => {
    try {
      await $directus.refresh()
      return true
    } catch {
      return false
    }
  }

  const isDirecteur = computed(() => {
    if (!user.value) return false
    const role = user.value.role
    if (!role || typeof role === 'string') return false
    return role.name === 'Directeur' || role.name === 'Administrator'
  })

  const roleName = computed(() => {
    if (!user.value) return null
    const role = user.value.role
    if (!role || typeof role === 'string') return null
    return role.name
  })

  const hasSchoolDays = computed(() => {
    const name = roleName.value
    return name === 'Alternant' || name === 'Stagiaire'
  })

  const hasHourTracking = computed(() => {
    const name = roleName.value
    return name === 'Freelance' || name === 'Alternant' || name === 'Stagiaire'
  })

  return {
    user,
    login,
    logout,
    refresh,
    fetchCurrentUser,
    isDirecteur,
    roleName,
    hasSchoolDays,
    hasHourTracking
  }
}
