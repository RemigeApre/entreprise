<script setup lang="ts">
import type { UserProfile } from '~/utils/types'

definePageMeta({
  middleware: ['directeur']
})

const { getAllUsers, updateExistingUser } = useUsers()
const toast = useToast()

const { data: users, status, refresh } = useAsyncData('admin-users', getAllUsers)

const search = ref('')
const statusFilter = ref('all')
const togglingId = ref<string | null>(null)

const statusFilterOptions = [
  { label: 'Tous', value: 'all' },
  { label: 'Actifs', value: 'active' },
  { label: 'Inactifs', value: 'inactive' }
]

function getUserName(u: UserProfile) {
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}

function getRoleName(u: UserProfile) {
  return typeof u.role === 'string' ? u.role : u.role?.name || '-'
}

const filteredUsers = computed(() => {
  if (!users.value) return []
  let result = users.value

  if (statusFilter.value === 'active') {
    result = result.filter((u: UserProfile) => u.actif)
  } else if (statusFilter.value === 'inactive') {
    result = result.filter((u: UserProfile) => !u.actif)
  }

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((u: UserProfile) => {
      const name = [u.first_name, u.last_name].filter(Boolean).join(' ').toLowerCase()
      return name.includes(q) || u.email.toLowerCase().includes(q)
    })
  }

  return result
})

const userStats = computed(() => {
  if (!users.value) return { total: 0, actifs: 0, inactifs: 0 }
  const total = users.value.length
  const actifs = users.value.filter((u: UserProfile) => u.actif).length
  return { total, actifs, inactifs: total - actifs }
})

async function handleToggleActive(user: UserProfile) {
  togglingId.value = user.id
  try {
    await updateExistingUser(user.id, { actif: !user.actif })
    toast.add({
      title: user.actif ? 'Utilisateur desactive' : 'Utilisateur active',
      color: 'success'
    })
    refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la mise a jour', color: 'error' })
  } finally {
    togglingId.value = null
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <UDashboardNavbar title="Utilisateurs">
      <template #right>
        <UButton
          label="Nouvel utilisateur"
          icon="i-lucide-plus"
          size="sm"
          to="/admin/utilisateurs/nouveau"
        />
      </template>
    </UDashboardNavbar>

    <div class="flex-1 overflow-y-auto">
      <div class="p-4 sm:p-6 space-y-4">
        <!-- Stats -->
        <div class="flex items-center gap-6 text-sm">
          <span class="text-stone-500 dark:text-stone-400">
            <strong class="text-stone-900 dark:text-stone-100">{{ userStats.total }}</strong> utilisateurs
          </span>
          <span class="text-stone-500 dark:text-stone-400">
            <strong class="text-emerald-600 dark:text-emerald-400">{{ userStats.actifs }}</strong> actifs
          </span>
          <span v-if="userStats.inactifs" class="text-stone-500 dark:text-stone-400">
            <strong class="text-red-500">{{ userStats.inactifs }}</strong> inactifs
          </span>
        </div>

        <!-- Filters -->
        <div class="flex items-center gap-3">
          <UInput
            v-model="search"
            placeholder="Rechercher un utilisateur..."
            icon="i-lucide-search"
            class="flex-1 max-w-sm"
            size="sm"
          />
          <USelectMenu
            v-model="statusFilter"
            :items="statusFilterOptions"
            value-key="value"
            class="w-32"
            size="sm"
          />
        </div>

        <!-- Loading -->
        <div v-if="status === 'pending'" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="size-6 text-primary animate-spin" />
        </div>

        <!-- Empty -->
        <div v-else-if="!filteredUsers.length" class="text-center py-12">
          <UIcon name="i-lucide-users" class="size-10 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
          <p class="text-stone-500 dark:text-stone-400">Aucun utilisateur trouve</p>
        </div>

        <!-- User list -->
        <div v-else class="space-y-2">
          <div
            v-for="u in filteredUsers"
            :key="u.id"
            class="flex items-center gap-4 p-3 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
          >
            <UAvatar :alt="getUserName(u)" size="md" />

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <NuxtLink
                  :to="`/admin/utilisateurs/${u.id}`"
                  class="font-medium text-stone-900 dark:text-white hover:text-primary transition-colors truncate"
                >
                  {{ getUserName(u) }}
                </NuxtLink>
                <UBadge
                  :color="u.actif ? 'success' : 'error'"
                  variant="subtle"
                  size="xs"
                >
                  {{ u.actif ? 'Actif' : 'Inactif' }}
                </UBadge>
              </div>
              <p class="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                {{ u.email }}
              </p>
            </div>

            <div class="hidden sm:flex items-center gap-2 shrink-0">
              <UBadge variant="subtle" size="xs">
                {{ getRoleName(u) }}
              </UBadge>
              <UBadge
                v-if="u.type_contrat"
                variant="outline"
                size="xs"
                color="neutral"
              >
                {{ u.type_contrat }}
              </UBadge>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <UTooltip :text="u.actif ? 'Desactiver' : 'Activer'">
                <UButton
                  :icon="u.actif ? 'i-lucide-user-x' : 'i-lucide-user-check'"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :loading="togglingId === u.id"
                  @click="handleToggleActive(u)"
                />
              </UTooltip>
              <UTooltip text="Modifier">
                <UButton
                  icon="i-lucide-pencil"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :to="`/admin/utilisateurs/${u.id}`"
                />
              </UTooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
