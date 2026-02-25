import { readItems, createItem, updateItem } from '@directus/sdk'
import type { CongeRequest, CongeType } from '~/utils/types'

export function useLeaveRequests() {
  const { $directus } = useNuxtApp()

  async function getMyRequests(userId: string) {
    return await $directus.request(readItems('conges_requests', {
      filter: {
        demandeur: { _eq: userId }
      },
      fields: [
        'id', 'date_debut', 'date_fin', 'motif', 'type_conge', 'statut',
        'reponse_commentaire', 'traite_par.id', 'traite_par.first_name', 'traite_par.last_name',
        'date_traitement', 'date_created'
      ],
      sort: ['-date_created'],
      limit: -1
    })) as CongeRequest[]
  }

  async function getAllPending() {
    return await $directus.request(readItems('conges_requests', {
      filter: {
        statut: { _eq: 'en_attente' }
      },
      fields: [
        'id', 'date_debut', 'date_fin', 'motif', 'type_conge', 'statut',
        'demandeur.id', 'demandeur.first_name', 'demandeur.last_name', 'demandeur.avatar',
        'date_created'
      ],
      sort: ['date_created'],
      limit: -1
    })) as CongeRequest[]
  }

  async function createRequest(data: {
    date_debut: string
    date_fin: string
    motif: string
    type_conge: CongeType
    demandeur: string
  }) {
    return await $directus.request(createItem('conges_requests', {
      ...data,
      statut: 'en_attente'
    })) as CongeRequest
  }

  async function approveRequest(id: string, traitePar: string, commentaire?: string) {
    return await $directus.request(updateItem('conges_requests', id, {
      statut: 'approuve',
      traite_par: traitePar,
      reponse_commentaire: commentaire || null,
      date_traitement: new Date().toISOString()
    })) as CongeRequest
  }

  async function refuseRequest(id: string, traitePar: string, commentaire?: string) {
    return await $directus.request(updateItem('conges_requests', id, {
      statut: 'refuse',
      traite_par: traitePar,
      reponse_commentaire: commentaire || null,
      date_traitement: new Date().toISOString()
    })) as CongeRequest
  }

  return {
    getMyRequests,
    getAllPending,
    createRequest,
    approveRequest,
    refuseRequest
  }
}
