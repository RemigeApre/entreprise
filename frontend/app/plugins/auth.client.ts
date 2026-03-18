/**
 * Pre-initialise l'utilisateur connecte avant le premier middleware de navigation.
 * Evite que le middleware auth.global bloque la navigation avec 2 appels HTTP sequentiels.
 */
export default defineNuxtPlugin(async () => {
  const { user, refresh, fetchCurrentUser } = useAuth()

  if (!user.value) {
    await refresh().catch(() => {})
    await fetchCurrentUser()
  }
})
