<script setup lang="ts">
import type { UserProfile } from '~/utils/types'

const { isDirecteur } = useAuth()
const { getActiveUsers } = useUsers()

const { data: users, status } = useAsyncData('team', getActiveUsers)

const search = ref('')

const filteredUsers = computed(() => {
  if (!users.value) return []
  if (!search.value) return users.value
  const q = search.value.toLowerCase()
  return users.value.filter((u: UserProfile) => {
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ').toLowerCase()
    return name.includes(q) || u.email.toLowerCase().includes(q)
  })
})

function getUserName(u: UserProfile) {
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}

function getRoleName(u: UserProfile) {
  if (typeof u.role === 'string') return ''
  return u.role.name
}

function getCategoryName(u: UserProfile) {
  if (!u.categorie || typeof u.categorie === 'string') return null
  return u.categorie.nom
}
</script>

<template>
  <div>
    <UDashboardNavbar title="Equipe">
      <template #right>
        <div class="flex items-center gap-2">
          <UInput
            v-model="search"
            placeholder="Rechercher..."
            icon="i-lucide-search"
            class="w-64"
          />
          <UButton
            v-if="isDirecteur"
            label="Nouvel utilisateur"
            icon="i-lucide-user-plus"
            color="primary"
            to="/admin/utilisateurs/nouveau"
          />
        </div>
      </template>
    </UDashboardNavbar>

    <div class="p-4 sm:p-6">
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <div v-else-if="!filteredUsers.length" class="text-center py-12">
        <UIcon name="i-lucide-users" class="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p class="text-gray-500 dark:text-gray-400">Aucun membre trouve</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <UCard
          v-for="member in filteredUsers"
          :key="member.id"
          class="card-hover-warm cursor-pointer"
          @click="navigateTo(`/equipe/${member.id}`)"
        >
          <div class="flex items-center gap-3">
            <UAvatar
              :alt="getUserName(member)"
              size="lg"
            />
            <div class="min-w-0 flex-1">
              <h3 class="font-semibold text-gray-900 dark:text-white truncate">
                {{ getUserName(member) }}
              </h3>
              <div class="flex items-center gap-2 mt-0.5">
                <UBadge variant="subtle" size="xs">
                  {{ getRoleName(member) }}
                </UBadge>
                <UBadge v-if="getCategoryName(member)" variant="outline" size="xs" color="neutral">
                  {{ getCategoryName(member) }}
                </UBadge>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                {{ member.email }}
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
