export type DashboardModule =
  | 'notifications'
  | 'weekSummary'
  | 'activeProjects'
  | 'prospectSummary'
  | 'stageTracker'
  | 'jobListings'

export const DASHBOARD_MODULES: { key: DashboardModule; label: string }[] = [
  { key: 'notifications', label: 'Notifications' },
  { key: 'weekSummary', label: 'Resume de la semaine' },
  { key: 'activeProjects', label: 'Projets actifs' },
  { key: 'prospectSummary', label: 'Prospection' },
  { key: 'stageTracker', label: 'Suivi des stagiaires' },
  { key: 'jobListings', label: 'Offres d\'emploi' }
]

const STORAGE_KEY = 'dashboard-hidden-modules'

export function useDashboardPreferences() {
  const hiddenModules = useState<Set<DashboardModule>>('dashboard-hidden', () => new Set())

  // Charger depuis localStorage au premier appel cote client
  if (import.meta.client) {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const arr = JSON.parse(stored) as DashboardModule[]
        hiddenModules.value = new Set(arr)
      } catch {
        // ignore
      }
    }
  }

  function persist() {
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...hiddenModules.value]))
    }
  }

  function isVisible(key: DashboardModule): boolean {
    return !hiddenModules.value.has(key)
  }

  function hide(key: DashboardModule) {
    hiddenModules.value = new Set([...hiddenModules.value, key])
    persist()
  }

  function show(key: DashboardModule) {
    const next = new Set(hiddenModules.value)
    next.delete(key)
    hiddenModules.value = next
    persist()
  }

  function showAll() {
    hiddenModules.value = new Set()
    persist()
  }

  const hiddenCount = computed(() => hiddenModules.value.size)

  return { isVisible, hide, show, showAll, hiddenCount, hiddenModules }
}
