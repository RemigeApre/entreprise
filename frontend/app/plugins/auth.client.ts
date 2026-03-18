/**
 * Pre-initialise l'utilisateur connecte avant le premier middleware de navigation.
 * Evite que le middleware auth.global bloque la navigation avec 2 appels HTTP sequentiels.
 */
export default defineNuxtPlugin(async () => {
  // Bootstrap tokens from localStorage — necessary when SSR hydration has set useState to null
  // (landing page first load, then navigate to intranet, or page reload on SSR page with valid session)
  const { init } = useDirectusAuth()
  init()

  const { user, refresh, fetchCurrentUser } = useAuth()

  if (!user.value) {
    await refresh().catch(() => {})
    await fetchCurrentUser()
  }
})
