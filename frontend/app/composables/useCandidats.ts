import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { Candidat, CandidatCommentaire, CandidatStatut } from '~/utils/types'

export function useCandidats() {
  const { $directus } = useNuxtApp()

  const candidatFields = [
    'id', 'prenom', 'nom', 'email', 'telephone', 'linkedin',
    'source', 'statut', 'ecole', 'note_evaluation', 'notes', 'cv',
    'offre.id', 'offre.titre', 'offre.type_contrat',
    'date_created', 'date_updated', 'user_created'
  ]

  async function getAll() {
    return await $directus.request(readItems('candidats', {
      fields: candidatFields,
      sort: ['-date_created'],
      limit: -1
    })) as Candidat[]
  }

  async function getById(id: string) {
    return await $directus.request(readItem('candidats', id, {
      fields: [
        ...candidatFields,
        'commentaires.id', 'commentaires.contenu',
        'commentaires.auteur.id', 'commentaires.auteur.first_name', 'commentaires.auteur.last_name',
        'commentaires.date_created'
      ]
    })) as Candidat
  }

  async function create(data: Partial<Candidat>) {
    return await $directus.request(createItem('candidats', data)) as Candidat
  }

  async function update(id: string, data: Partial<Candidat>) {
    return await $directus.request(updateItem('candidats', id, data)) as Candidat
  }

  async function remove(id: string) {
    await $directus.request(deleteItem('candidats', id))
  }

  async function addComment(data: { candidat: string; contenu: string; auteur: string }) {
    return await $directus.request(createItem('candidat_commentaires', data)) as CandidatCommentaire
  }

  async function removeComment(id: string) {
    await $directus.request(deleteItem('candidat_commentaires', id))
  }

  function getCvUrl(fileId: string) {
    const config = useRuntimeConfig()
    const baseUrl = config.public.directusUrl as string
    const url = baseUrl.startsWith('http') ? baseUrl : ''
    return `${url}/assets/${fileId}`
  }

  return { getAll, getById, create, update, remove, addComment, removeComment, getCvUrl }
}
