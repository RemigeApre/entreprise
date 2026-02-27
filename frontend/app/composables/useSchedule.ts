import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { ScheduleEntry, ScheduleCategorie } from '~/utils/types'

export function useSchedule() {
  const { $directus } = useNuxtApp()

  async function getEntries(userId: string, startDate: string, endDate: string) {
    return await $directus.request(readItems('schedule_entries', {
      filter: {
        utilisateur: { _eq: userId },
        date: { _gte: startDate, _lte: endDate }
      },
      fields: [
        'id', 'date', 'heure_debut', 'heure_fin', 'titre', 'categorie', 'description',
        'utilisateur.id', 'utilisateur.first_name', 'utilisateur.last_name',
        'date_created', 'user_created'
      ],
      sort: ['date', 'heure_debut'],
      limit: -1
    })) as ScheduleEntry[]
  }

  async function createEntry(data: {
    utilisateur: string
    date: string
    heure_debut: string
    heure_fin: string
    titre: string
    categorie: ScheduleCategorie
    description?: string
  }) {
    return await $directus.request(createItem('schedule_entries', data)) as ScheduleEntry
  }

  async function updateEntry(id: string, data: Partial<ScheduleEntry>) {
    return await $directus.request(updateItem('schedule_entries', id, data)) as ScheduleEntry
  }

  async function deleteEntry(id: string) {
    await $directus.request(deleteItem('schedule_entries', id))
  }

  return { getEntries, createEntry, updateEntry, deleteEntry }
}
