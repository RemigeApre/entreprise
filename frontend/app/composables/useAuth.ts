import { readMe } from '@directus/sdk'
import type { UserProfile } from '~/utils/types'
import { CONTRACTS_WITH_SCHOOL_DAYS, CONTRACTS_WITH_HOUR_TRACKING } from '~/utils/constants'

export function useAuth() {
  const { $directus } = useNuxtApp()
  const user = useCurrentUser()
  const { getValidToken, login: authLogin, logout: authLogout } = useDirectusAuth()

  const fetchCurrentUser = async () => {
    try {
      const token = await getValidToken()
      if (!token) { user.value = null; return null }
      const me = await $directus.request(readMe({ fields: ['*', 'role.*', 'categorie.*'] as any }))
      user.value = me as unknown as UserProfile
      return user.value
    } catch {
      user.value = null
      return null
    }
  }

  const login = async (email: string, password: string) => {
    await authLogin(email, password)
    await fetchCurrentUser()
  }

  const logout = async () => {
    await authLogout()
    user.value = null
    if (import.meta.client) {
      window.location.replace('/')
    } else {
      navigateTo('/')
    }
  }

  const refresh = async () => {
    try {
      return !!(await getValidToken())
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

  // Les caracteristiques metier sont derivees du `type_contrat` (et non du role).
  // Les listes de reference sont dans `~/utils/constants`.
  const hasSchoolDays = computed(() => {
    const c = user.value?.type_contrat
    return !!c && CONTRACTS_WITH_SCHOOL_DAYS.includes(c)
  })

  const hasHourTracking = computed(() => {
    const c = user.value?.type_contrat
    return !!c && CONTRACTS_WITH_HOUR_TRACKING.includes(c)
  })

  const isProspecteur = computed(() => {
    if (!user.value) return false
    if (isDirecteur.value) return true
    return !!user.value.actif_prospection
  })

  return {
    user,
    login,
    logout,
    refresh,
    fetchCurrentUser,
    isDirecteur,
    hasSchoolDays,
    hasHourTracking,
    isProspecteur
  }
}
