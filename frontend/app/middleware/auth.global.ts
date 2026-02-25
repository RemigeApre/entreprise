export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/', '/login', '/recrutement']

  if (publicRoutes.some(route => to.path === route)) {
    return
  }

  const { user, fetchCurrentUser, refresh } = useAuth()

  if (!user.value) {
    const refreshed = await refresh()
    if (refreshed) {
      await fetchCurrentUser()
    }

    if (!user.value) {
      return navigateTo('/login')
    }
  }
})
