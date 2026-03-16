export default defineNuxtRouteMiddleware(async (to) => {
  const publicPaths = ['/', '/recrutement', '/le-geai', '/poles', '/soutenir', '/articles']
  const publicPrefixes = ['/le-geai/']

  const path = to.path.replace(/\/+$/, '') || '/'
  if (publicPaths.some(route => path === route) || publicPrefixes.some(prefix => to.path.startsWith(prefix))) {
    return
  }

  const { user, fetchCurrentUser, refresh, logout } = useAuth()

  if (!user.value) {
    // Tenter le refresh du token (cookie httpOnly)
    const refreshed = await refresh()
    if (refreshed) {
      await fetchCurrentUser()
    }

    // Fallback : tenter un fetch direct si le SDK a un token en memoire
    if (!user.value) {
      await fetchCurrentUser()
    }

    if (!user.value) {
      return navigateTo('/')
    }
  }

  const statut = user.value?.statut_emploi

  // Termine : pas de connexion possible — deconnecter immediatement
  if (statut === 'termine') {
    await logout()
    return navigateTo('/')
  }

  // A venir : uniquement planning (presence)
  if (statut === 'a_venir') {
    const allowed = ['/dashboard', '/planning', '/profil']
    const isAllowed = allowed.some(p => path === p || path.startsWith(p + '/'))
    if (!isAllowed) {
      return navigateTo('/dashboard')
    }
  }

  // Test : connexion possible, acces complet (pour tester l'interface)
  // Pas de restriction supplementaire
})
