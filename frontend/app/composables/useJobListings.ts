import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { OffreEmploi } from '~/utils/types'

export function useJobListings() {
  const { $directus } = useNuxtApp()

  async function getAll() {
    return await $directus.request(readItems('offres_emploi', {
      fields: [
        'id', 'titre', 'description', 'type_contrat', 'localisation',
        'salaire_min', 'salaire_max', 'salaire_periode',
        'categorie.id', 'categorie.nom',
        'competences_requises', 'avantages',
        'publie', 'date_publication', 'date_expiration',
        'date_created', 'date_updated'
      ],
      sort: ['-date_created'],
      limit: -1
    })) as OffreEmploi[]
  }

  async function getById(id: string) {
    return await $directus.request(readItem('offres_emploi', id, {
      fields: ['*', 'categorie.id', 'categorie.nom', 'categorie.couleur']
    })) as OffreEmploi
  }

  async function create(data: Partial<OffreEmploi>) {
    return await $directus.request(createItem('offres_emploi', data)) as OffreEmploi
  }

  async function update(id: string, data: Partial<OffreEmploi>) {
    return await $directus.request(updateItem('offres_emploi', id, data)) as OffreEmploi
  }

  async function remove(id: string) {
    await $directus.request(deleteItem('offres_emploi', id))
  }

  async function togglePublish(id: string, publie: boolean) {
    return await update(id, {
      publie,
      date_publication: publie ? new Date().toISOString() : null
    })
  }

  return {
    getAll,
    getById,
    create,
    update,
    remove,
    togglePublish
  }
}
