import { getEffectiveStatutEmploi } from '~/utils/dates'

export default defineNuxtRouteMiddleware(async (to) => {
  const publicPaths = ['/', '/recrutement', '/le-geai', '/poles', '/soutenir', '/articles', '/rdv', '/comptoir', '/informatique']
  const publicPrefixes = ['/le-geai/', '/rdv/', '/comptoir/', '/informatique/']

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

  // Statut effectif : un 'a_venir' dont la date de debut de contrat est atteinte
  // est traite comme 'actif' (le champ DB peut ne pas avoir ete mis a jour).
  const statut = getEffectiveStatutEmploi(user.value)

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

  // a_venir / test : pas de restriction de routing globale.
  // Les pages admin restent protegees par le middleware `directeur.ts`,
  // et les creneaux planning hors contrat restent verrouilles par PlanningWeekView.
})
