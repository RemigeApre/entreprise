import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { Article } from '~/utils/types'

export function useArticles() {
  const { $directus } = useNuxtApp()

  async function getAll() {
    return await $directus.request(readItems('articles', {
      fields: [
        'id', 'titre', 'contenu', 'statut', 'date_publication',
        'auteur.id', 'auteur.first_name', 'auteur.last_name',
        'date_created', 'date_updated'
      ],
      sort: ['-date_created'],
      limit: -1
    })) as Article[]
  }

  async function getById(id: string) {
    return await $directus.request(readItem('articles', id, {
      fields: ['*', 'auteur.id', 'auteur.first_name', 'auteur.last_name', 'auteur.avatar']
    })) as Article
  }

  async function create(data: Partial<Article>) {
    return await $directus.request(createItem('articles', data)) as Article
  }

  async function update(id: string, data: Partial<Article>) {
    return await $directus.request(updateItem('articles', id, data)) as Article
  }

  async function remove(id: string) {
    await $directus.request(deleteItem('articles', id))
  }

  async function publish(id: string) {
    return await update(id, {
      statut: 'publie',
      date_publication: new Date().toISOString()
    })
  }

  async function unpublish(id: string) {
    return await update(id, {
      statut: 'brouillon',
      date_publication: null
    })
  }

  return {
    getAll,
    getById,
    create,
    update,
    remove,
    publish,
    unpublish
  }
}
