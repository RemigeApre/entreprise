import { readItems, updateMe } from '@directus/sdk'
import type { ContactHistory } from '~/utils/types'

export function useProspectQuota() {
  const { $directus } = useNuxtApp()
  const { user, fetchCurrentUser } = useAuth()

  const objectifJour = computed(() => user.value?.objectif_prospection || null)
  const objectifSemaine = computed(() => objectifJour.value ? objectifJour.value * 5 : null)

  const weekContacts = useState<number>('prospect-quota-week', () => 0)
  const todayContacts = useState<number>('prospect-quota-today', () => 0)
  const loading = useState<boolean>('prospect-quota-loading', () => false)

  function getWeekBounds() {
    const now = new Date()
    const day = now.getDay()
    // Monday = 1, Sunday = 0
    const diffToMonday = day === 0 ? 6 : day - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - diffToMonday)
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    return { monday, sunday }
  }

  function getTodayBounds() {
    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  async function loadWeekContacts() {
    if (!user.value) return
    loading.value = true
    try {
      const { monday, sunday } = getWeekBounds()
      const { start: todayStart, end: todayEnd } = getTodayBounds()

      const contacts = await $directus.request(readItems('contacts_history', {
        filter: {
          contacte_par: { _eq: user.value.id },
          date_contact: {
            _gte: monday.toISOString().split('T')[0],
            _lte: sunday.toISOString().split('T')[0]
          }
        },
        fields: ['id', 'date_contact'],
        limit: -1
      })) as Pick<ContactHistory, 'id' | 'date_contact'>[]

      weekContacts.value = contacts.length

      const todayStr = todayStart.toISOString().split('T')[0]
      todayContacts.value = contacts.filter(c =>
        c.date_contact.startsWith(todayStr)
      ).length
    } catch {
      weekContacts.value = 0
      todayContacts.value = 0
    } finally {
      loading.value = false
    }
  }

  async function setObjectif(perDay: number | null) {
    await $directus.request(updateMe({ objectif_prospection: perDay } as any))
    await fetchCurrentUser()
  }

  const progressSemaine = computed(() => {
    if (!objectifSemaine.value) return 0
    return Math.min(Math.round((weekContacts.value / objectifSemaine.value) * 100), 100)
  })

  const progressJour = computed(() => {
    if (!objectifJour.value) return 0
    return Math.min(Math.round((todayContacts.value / objectifJour.value) * 100), 100)
  })

  const hasQuota = computed(() => objectifJour.value !== null && objectifJour.value > 0)

  return {
    objectifJour,
    objectifSemaine,
    weekContacts,
    todayContacts,
    loading,
    loadWeekContacts,
    setObjectif,
    progressSemaine,
    progressJour,
    hasQuota
  }
}
