<script setup lang="ts">
import { readUser } from '@directus/sdk'
import type { PlanningEntry, UserProfile } from '~/utils/types'
import { getMonday, addDays, formatDate } from '~/utils/dates'

const route = useRoute()
const { $directus } = useNuxtApp()
const { getEntries } = usePlanning()

const userId = route.params.userId as string
const entries = ref<PlanningEntry[]>([])
const targetUser = ref<UserProfile | null>(null)
const loading = ref(true)

async function loadUser() {
  try {
    const data = await $directus.request(readUser(userId, {
      fields: ['id', 'first_name', 'last_name', 'email', 'avatar', 'role.name', 'categorie.nom', 'actif']
    }))
    targetUser.value = data as unknown as UserProfile
  } catch {
    await navigateTo('/equipe')
  }
}

async function loadEntries(mondayStr: string) {
  loading.value = true
  try {
    const monday = new Date(mondayStr)
    const friday = addDays(monday, 4)
    entries.value = await getEntries(userId, mondayStr, formatDate(friday))
  } finally {
    loading.value = false
  }
}

const userName = computed(() => {
  if (!targetUser.value) return ''
  const { first_name, last_name } = targetUser.value
  return [first_name, last_name].filter(Boolean).join(' ') || targetUser.value.email
})

onMounted(loadUser)
</script>

<template>
  <div class="flex flex-col h-full">
    <UDashboardNavbar :title="`Planning de ${userName}`">
      <template #right>
        <UButton
          label="Retour"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          to="/equipe"
        />
      </template>
    </UDashboardNavbar>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <PlanningWeekView
        :entries="entries"
        readonly
        @week-change="loadEntries"
      />
    </div>
  </div>
</template>
