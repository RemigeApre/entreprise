export type DashboardModule =
  | 'notifications'
  | 'weekSummary'
  | 'activeProjects'
  | 'prospectSummary'
  | 'stageTracker'
  | 'jobListings'
  | 'presence'

export type PlanningDisplayMode = 'week' | 'today' | 'todayNext'
export type PresenceDisplayMode = 'today' | 'todayNext'

export const DASHBOARD_MODULES: { key: DashboardModule; label: string }[] = [
  { key: 'notifications', label: 'Notifications' },
  { key: 'weekSummary', label: 'Mon planning' },
  { key: 'presence', label: 'Qui est la' },
  { key: 'activeProjects', label: 'Projets actifs' },
  { key: 'prospectSummary', label: 'Prospection' },
  { key: 'stageTracker', label: 'Suivi des stagiaires' },
  { key: 'jobListings', label: 'Offres d\'emploi' }
]

export const PLANNING_DISPLAY_OPTIONS: { value: PlanningDisplayMode; label: string }[] = [
  { value: 'todayNext', label: 'Aujourd\'hui + prochain jour' },
  { value: 'today', label: 'Aujourd\'hui' },
  { value: 'week', label: 'Semaine entiere' }
]

export const PRESENCE_DISPLAY_OPTIONS: { value: PresenceDisplayMode; label: string }[] = [
  { value: 'today', label: 'Aujourd\'hui' },
  { value: 'todayNext', label: 'Aujourd\'hui + prochain jour' }
]

const STORAGE_KEY = 'dashboard-hidden-modules'
const PLANNING_MODE_KEY = 'dashboard-planning-mode'
const PRESENCE_MODE_KEY = 'dashboard-presence-mode'

export function useDashboardPreferences() {
  const hiddenModules = useState<Set<DashboardModule>>('dashboard-hidden', () => new Set())
  const planningMode = useState<PlanningDisplayMode>('dashboard-planning-mode', () => 'todayNext')
  const presenceMode = useState<PresenceDisplayMode>('dashboard-presence-mode', () => 'today')

  // Charger depuis localStorage au premier appel cote client
  if (import.meta.client) {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const arr = JSON.parse(stored) as DashboardModule[]
        hiddenModules.value = new Set(arr)
      } catch { /* ignore */ }
    }

    const storedPlanning = localStorage.getItem(PLANNING_MODE_KEY)
    if (storedPlanning && ['week', 'today', 'todayNext'].includes(storedPlanning)) {
      planningMode.value = storedPlanning as PlanningDisplayMode
    }

    const storedPresence = localStorage.getItem(PRESENCE_MODE_KEY)
    if (storedPresence && ['today', 'todayNext'].includes(storedPresence)) {
      presenceMode.value = storedPresence as PresenceDisplayMode
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

  function setPlanningMode(mode: PlanningDisplayMode) {
    planningMode.value = mode
    if (import.meta.client) {
      localStorage.setItem(PLANNING_MODE_KEY, mode)
    }
  }

  function setPresenceMode(mode: PresenceDisplayMode) {
    presenceMode.value = mode
    if (import.meta.client) {
      localStorage.setItem(PRESENCE_MODE_KEY, mode)
    }
  }

  const hiddenCount = computed(() => hiddenModules.value.size)

  return {
    isVisible, hide, show, showAll, hiddenCount, hiddenModules,
    planningMode, setPlanningMode,
    presenceMode, setPresenceMode
  }
}
