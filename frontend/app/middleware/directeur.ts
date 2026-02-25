export default defineNuxtRouteMiddleware(() => {
  const { isDirecteur } = useAuth()

  if (!isDirecteur.value) {
    return navigateTo('/dashboard')
  }
})
