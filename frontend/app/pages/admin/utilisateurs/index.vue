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

const columns = [
  { key: 'user', label: 'Utilisateur' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'type_contrat', label: 'Contrat' },
  { key: 'actif', label: 'Statut' },
  { key: 'actions', label: '' }
]

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
  <div>
    <UDashboardNavbar title="Gestion des utilisateurs">
      <template #right>
        <USelectMenu
          v-model="statusFilter"
          :items="statusFilterOptions"
          value-key="value"
          class="w-36"
        />
        <UInput
          v-model="search"
          placeholder="Rechercher..."
          icon="i-lucide-search"
          class="w-64"
        />
        <UButton
          label="Nouvel utilisateur"
          icon="i-lucide-plus"
          to="/admin/utilisateurs/nouveau"
        />
      </template>
    </UDashboardNavbar>

    <div class="p-4 sm:p-6">
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <div v-else-if="!filteredUsers.length" class="text-center py-12">
        <UIcon name="i-lucide-users" class="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p class="text-gray-500 dark:text-gray-400">Aucun utilisateur trouve</p>
        <UButton
          label="Creer un utilisateur"
          icon="i-lucide-plus"
          class="mt-4"
          to="/admin/utilisateurs/nouveau"
        />
      </div>

      <UTable
        v-else
        :data="filteredUsers"
        :columns="columns"
        class="w-full"
      >
        <template #user-cell="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar
              :alt="getUserName(row.original)"
              size="sm"
            />
            <span class="font-medium text-gray-900 dark:text-white">
              {{ getUserName(row.original) }}
            </span>
          </div>
        </template>

        <template #email-cell="{ row }">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ row.original.email }}
          </span>
        </template>

        <template #role-cell="{ row }">
          <UBadge variant="subtle" size="sm">
            {{ getRoleName(row.original) }}
          </UBadge>
        </template>

        <template #type_contrat-cell="{ row }">
          <UBadge
            v-if="row.original.type_contrat"
            variant="outline"
            size="sm"
            color="neutral"
          >
            {{ row.original.type_contrat }}
          </UBadge>
          <span v-else class="text-sm text-gray-400">-</span>
        </template>

        <template #actif-cell="{ row }">
          <UBadge
            :color="row.original.actif ? 'success' : 'error'"
            variant="subtle"
            size="sm"
          >
            {{ row.original.actif ? 'Actif' : 'Inactif' }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end gap-2">
            <UTooltip :text="row.original.actif ? 'Desactiver' : 'Activer'">
              <UButton
                :icon="row.original.actif ? 'i-lucide-user-x' : 'i-lucide-user-check'"
                color="neutral"
                variant="ghost"
                size="sm"
                :loading="togglingId === row.original.id"
                @click="handleToggleActive(row.original)"
              />
            </UTooltip>
            <UTooltip text="Modifier">
              <UButton
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                size="sm"
                :to="`/admin/utilisateurs/${row.original.id}`"
              />
            </UTooltip>
          </div>
        </template>
      </UTable>
    </div>
  </div>
</template>
