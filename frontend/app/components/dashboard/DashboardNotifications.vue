<script setup lang="ts">
import type { Notification } from '~/utils/types'

const { getMyUnread, markRead, markAllRead } = useNotifications()

const notifications = ref<Notification[]>([])

async function fetchNotifications() {
  try {
    notifications.value = await getMyUnread()
  } catch (e) {
    console.error('Erreur chargement notifications:', e)
  }
}

async function handleMarkRead(id: string) {
  await markRead(id)
  await fetchNotifications()
}

async function handleMarkAllRead() {
  await markAllRead()
  await fetchNotifications()
}

function getIcon(type: Notification['type']): string {
  const icons: Record<Notification['type'], string> = {
    planning_modifie: 'i-lucide-calendar-check',
    conge_statut: 'i-lucide-palm-tree',
    info: 'i-lucide-info'
  }
  return icons[type] ?? 'i-lucide-info'
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffJ = Math.floor(diffH / 24)

  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin}min`
  if (diffH < 24) return `il y a ${diffH}h`
  return `il y a ${diffJ}j`
}

onMounted(fetchNotifications)
</script>

<template>
  <UCard v-if="notifications.length">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-semibold">Notifications</h3>
          <UBadge color="primary" variant="subtle" size="xs">{{ notifications.length }}</UBadge>
        </div>
        <UButton label="Tout lire" variant="ghost" size="xs" @click="handleMarkAllRead" />
      </div>
    </template>
    <div class="space-y-3">
      <div v-for="notif in notifications" :key="notif.id" class="flex items-start gap-3">
        <UIcon :name="getIcon(notif.type)" class="size-5 text-primary mt-0.5 shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-sm text-stone-700 dark:text-stone-300">{{ notif.message }}</p>
          <p class="text-xs text-stone-400 mt-0.5">{{ formatRelativeTime(notif.date_created) }}</p>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <UButton v-if="notif.lien" icon="i-lucide-external-link" variant="ghost" size="xs" :to="notif.lien" />
          <UButton icon="i-lucide-check" variant="ghost" size="xs" @click="handleMarkRead(notif.id)" />
        </div>
      </div>
    </div>
  </UCard>
</template>
