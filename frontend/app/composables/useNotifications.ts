import { readItems, updateItem, createItem } from '@directus/sdk'
import type { Notification } from '~/utils/types'

export function useNotifications() {
  const { $directus } = useNuxtApp()

  async function getMyUnread() {
    return await $directus.request(readItems('notifications', {
      filter: {
        utilisateur: { _eq: '$CURRENT_USER' },
        lu: { _eq: false }
      },
      fields: ['id', 'message', 'type', 'lu', 'lien', 'date_created'],
      sort: ['-date_created'],
      limit: 20
    })) as Notification[]
  }

  async function markRead(id: string) {
    return await $directus.request(updateItem('notifications', id, { lu: true })) as Notification
  }

  async function markAllRead() {
    const unread = await getMyUnread()
    for (const n of unread) {
      await $directus.request(updateItem('notifications', n.id, { lu: true }))
    }
  }

  async function createBatch(userIds: string[], message: string, type: string, lien?: string) {
    for (const userId of userIds) {
      await $directus.request(createItem('notifications', {
        utilisateur: userId,
        message,
        type,
        lu: false,
        lien: lien || null
      }))
    }
  }

  return {
    getMyUnread,
    markRead,
    markAllRead,
    createBatch
  }
}
