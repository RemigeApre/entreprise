import { readItems, readFolders, createFolder, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { Realisation } from '~/utils/types'

export function useRealisations() {
  const { $directus } = useNuxtApp()
  const config = useRuntimeConfig()

  function filesBaseUrl() {
    const base = config.public.directusUrl as string
    return base.startsWith('http') ? base : `${window.location.origin}${base}`
  }

  async function getAll() {
    return await $directus.request(readItems('realisations', {
      fields: ['id', 'titre', 'client', 'lien', 'description', 'tags', 'cover', 'ordre', 'statut', 'date_created'],
      sort: ['ordre', '-date_created'],
      limit: -1,
    })) as Realisation[]
  }

  async function create(data: Partial<Realisation>) {
    return await $directus.request(createItem('realisations', data)) as Realisation
  }

  async function update(id: string, data: Partial<Realisation>) {
    return await $directus.request(updateItem('realisations', id, data)) as Realisation
  }

  async function remove(id: string) {
    await $directus.request(deleteItem('realisations', id))
  }

  async function publish(id: string) {
    return await update(id, { statut: 'publie' })
  }
  async function unpublish(id: string) {
    return await update(id, { statut: 'brouillon' })
  }

  // Renvoie l'id du dossier "realisations" (le cree au besoin).
  // Les covers DOIVENT y vivre : la lecture publique des fichiers y est limitee.
  async function ensureFolderId(): Promise<string> {
    const existing = await $directus.request(readFolders({
      filter: { name: { _eq: 'realisations' } },
      limit: 1,
    }))
    if (existing.length) return existing[0].id
    const created = await $directus.request(createFolder({ name: 'realisations' }))
    return created.id
  }

  // Upload d'une cover dans le dossier realisations, renvoie l'id du fichier.
  async function uploadCover(file: File): Promise<string> {
    const folderId = await ensureFolderId()
    const fd = new FormData()
    fd.append('folder', folderId)
    fd.append('file', file)
    const res = await fetch(`${filesBaseUrl()}/files`, {
      method: 'POST',
      body: fd,
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Upload de la cover impossible')
    const { data } = await res.json()
    return data.id
  }

  function coverUrl(fileId?: string | null): string | null {
    if (!fileId) return null
    const base = config.public.directusUrl as string
    const url = base.startsWith('http') ? base : ''
    return `${url}/assets/${fileId}`
  }

  return { getAll, create, update, remove, publish, unpublish, uploadCover, coverUrl }
}
