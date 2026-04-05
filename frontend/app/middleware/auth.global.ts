export default defineNuxtRouteMiddleware(async (to) => {
  const publicPaths = ['/', '/recrutement', '/le-geai', '/poles', '/soutenir', '/articles', '/rdv']
  const publicPrefixes = ['/le-geai/', '/rdv/']

  const path = to.path.replace(/\/+$/, '') || '/'
  if (publicPaths.some(route => path === route) || publicPrefixes.some(prefix => to.path.startsWith(prefix))) {
    return
  }

  const { user, fetchCurrentUser, refresh } = useAuth()

  if (!user.value) {
    // Le plugin auth.client.ts a deja tente refresh + fetchCurrentUser au demarrage.
    // Ce fallback ne s'execute que si la session expire en cours de navigation.
    await refresh().catch(() => {})
    await fetchCurrentUser()

    if (!user.value) {
      return navigateTo('/')
    }
  }

  const statut = user.value?.statut_emploi

  // Termine : rediriger vers la page des anciens (pas de deconnexion)
  if (statut === 'termine') {
    if (path !== '/anciens') {
      return navigateTo('/anciens')
    }
    return
  }

  // Bloquer l'acces a /anciens pour les non-termines
  if (path === '/anciens') {
    return navigateTo('/dashboard')
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
