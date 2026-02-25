import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { PlanningEntry, PlanningPeriode, PlanningType, PlanningStatut } from '~/utils/types'

export function usePlanning() {
  const { $directus } = useNuxtApp()

  async function getEntries(userId: string, startDate: string, endDate: string) {
    return await $directus.request(readItems('planning_entries', {
      filter: {
        utilisateur: { _eq: userId },
        date: { _gte: startDate, _lte: endDate }
      },
      fields: [
        'id', 'date', 'periode', 'type', 'statut', 'motif', 'heures', 'commentaire',
        'valide_par.id', 'valide_par.first_name', 'valide_par.last_name',
        'date_validation', 'utilisateur.id', 'utilisateur.first_name', 'utilisateur.last_name'
      ],
      sort: ['date', 'periode'],
      limit: -1
    })) as PlanningEntry[]
  }

  async function createEntry(data: {
    utilisateur: string
    date: string
    periode: PlanningPeriode
    type: PlanningType
    statut?: PlanningStatut
    motif?: string
    heures?: number
  }) {
    const statut = data.statut || (data.type === 'conge' ? 'en_attente' : 'valide')
    return await $directus.request(createItem('planning_entries', {
      ...data,
      statut
    })) as PlanningEntry
  }

  async function updateEntry(id: string, data: Partial<PlanningEntry>) {
    return await $directus.request(updateItem('planning_entries', id, data)) as PlanningEntry
  }

  async function deleteEntry(id: string) {
    await $directus.request(deleteItem('planning_entries', id))
  }

  async function validateEntry(id: string, valideurId: string) {
    return await updateEntry(id, {
      statut: 'valide',
      valide_par: valideurId,
      date_validation: new Date().toISOString()
    } as any)
  }

  async function refuseEntry(id: string, valideurId: string) {
    return await updateEntry(id, {
      statut: 'refuse',
      valide_par: valideurId,
      date_validation: new Date().toISOString()
    } as any)
  }

  async function getWorkedStats(userId: string, year: number) {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const entries = await $directus.request(readItems('planning_entries', {
      filter: {
        utilisateur: { _eq: userId },
        date: { _gte: startDate, _lte: endDate },
        type: { _eq: 'travail' },
        statut: { _eq: 'valide' }
      },
      fields: ['id', 'date', 'heures'],
      limit: -1
    })) as PlanningEntry[]

    const totalHalfDays = entries.length
    const totalHours = entries.reduce((sum, e) => sum + (e.heures || 3.5), 0)
    const uniqueDays = new Set(entries.map(e => e.date)).size

    return {
      totalHalfDays,
      totalHours,
      totalDays: uniqueDays
    }
  }

  async function getTeamEntries(userIds: string[], startDate: string, endDate: string) {
    return await $directus.request(readItems('planning_entries', {
      filter: {
        utilisateur: { _in: userIds },
        date: { _gte: startDate, _lte: endDate }
      },
      fields: [
        'id', 'date', 'periode', 'type', 'statut',
        'utilisateur.id', 'utilisateur.first_name', 'utilisateur.last_name'
      ],
      sort: ['utilisateur', 'date', 'periode'],
      limit: -1
    })) as PlanningEntry[]
  }

  return {
    getEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    validateEntry,
    refuseEntry,
    getWorkedStats,
    getTeamEntries
  }
}
