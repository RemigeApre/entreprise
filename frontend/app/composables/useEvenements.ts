import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { Evenement, EvenementParticipant, EvenementParticipantStatut, EvenementType } from '~/utils/types'

const EVENT_FIELDS = [
  'id', 'titre', 'description', 'lieu', 'date_debut', 'date_fin', 'toute_journee',
  'couleur', 'type', 'date_created', 'user_created',
  'organisateur.id', 'organisateur.first_name', 'organisateur.last_name',
  'participants.id', 'participants.statut',
  'participants.user.id', 'participants.user.first_name', 'participants.user.last_name'
]

export function useEvenements() {
  const { $directus } = useNuxtApp()

  async function getMyEvents(userId: string, startDate: string, endDate: string) {
    return await $directus.request(readItems('evenements', {
      filter: {
        _and: [
          {
            _or: [
              { organisateur: { _eq: userId } },
              { participants: { user: { _eq: userId } } }
            ]
          },
          { date_debut: { _lte: endDate + 'T23:59:59' } },
          { date_fin: { _gte: startDate + 'T00:00:00' } }
        ]
      },
      fields: EVENT_FIELDS,
      sort: ['date_debut'],
      limit: -1
    })) as Evenement[]
  }

  async function createEvent(data: {
    titre: string
    description?: string | null
    lieu?: string | null
    date_debut: string
    date_fin: string
    toute_journee?: boolean
    couleur?: string | null
    type?: EvenementType
    organisateur: string
  }) {
    return await $directus.request(createItem('evenements', {
      titre: data.titre,
      description: data.description ?? null,
      lieu: data.lieu ?? null,
      date_debut: data.date_debut,
      date_fin: data.date_fin,
      toute_journee: data.toute_journee ?? false,
      couleur: data.couleur ?? null,
      type: data.type ?? 'personnel',
      organisateur: data.organisateur
    })) as Evenement
  }

  async function updateEvent(id: string, data: Partial<{
    titre: string
    description: string | null
    lieu: string | null
    date_debut: string
    date_fin: string
    toute_journee: boolean
    couleur: string | null
    type: EvenementType
  }>) {
    return await $directus.request(updateItem('evenements', id, data)) as Evenement
  }

  async function deleteEvent(id: string) {
    await $directus.request(deleteItem('evenements', id))
  }

  async function addParticipants(eventId: string, userIds: string[]) {
    for (const userId of userIds) {
      await $directus.request(createItem('evenements_participants', {
        evenement: eventId,
        user: userId,
        statut: 'invite'
      }))
    }
  }

  async function removeParticipant(participantId: string) {
    await $directus.request(deleteItem('evenements_participants', participantId))
  }

  async function respondToInvitation(participantId: string, statut: EvenementParticipantStatut) {
    return await $directus.request(updateItem('evenements_participants', participantId, { statut })) as EvenementParticipant
  }

  return {
    getMyEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    addParticipants,
    removeParticipant,
    respondToInvitation
  }
}
