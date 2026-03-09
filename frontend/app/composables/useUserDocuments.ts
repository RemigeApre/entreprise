import { readItems, createItem, deleteItem } from '@directus/sdk'
import type { UserDocument } from '~/utils/types'

export function useUserDocuments() {
  const { $directus } = useNuxtApp()
  const config = useRuntimeConfig()

  async function getDocuments(userId: string) {
    return await $directus.request(readItems('user_documents', {
      filter: { utilisateur: { _eq: userId } },
      fields: ['id', 'nom', 'fichier', 'date_created'],
      sort: ['-date_created'],
      limit: -1
    })) as UserDocument[]
  }

  async function uploadDocument(userId: string, nom: string, file: File) {
    // 1. Upload file to directus_files
    const formData = new FormData()
    formData.append('file', file)

    const baseUrl = config.public.directusUrl as string
    const url = baseUrl.startsWith('http') ? baseUrl : `${window.location.origin}${baseUrl}`

    const res = await fetch(`${url}/files`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })

    if (!res.ok) throw new Error('Upload failed')
    const { data } = await res.json()
    const fileId = data.id

    // 2. Create junction entry
    return await $directus.request(createItem('user_documents', {
      utilisateur: userId,
      fichier: fileId,
      nom
    })) as UserDocument
  }

  async function removeDocument(docId: number) {
    await $directus.request(deleteItem('user_documents', docId))
  }

  function getFileUrl(fileId: string) {
    const baseUrl = config.public.directusUrl as string
    const url = baseUrl.startsWith('http') ? baseUrl : ''
    return `${url}/assets/${fileId}`
  }

  return { getDocuments, uploadDocument, removeDocument, getFileUrl }
}
