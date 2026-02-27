export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/', '/login', '/recrutement']

  if (publicRoutes.some(route => to.path === route)) {
    return
  }

  const { user, fetchCurrentUser, refresh } = useAuth()

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
      return navigateTo('/login')
    }
  }
})
