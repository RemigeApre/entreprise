<script setup lang="ts">
import type { UserProfile } from '~/utils/types'

const route = useRoute()
const { isDirecteur } = useAuth()
const { getUserById } = useUsers()

const userId = route.params.userId as string

const { data: member, status } = useAsyncData(`user-${userId}`, () => getUserById(userId))

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

function formatDateFr(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="flex flex-col h-full">
    <UDashboardNavbar :title="member ? getUserName(member) : 'Profil'">
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
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <div v-else-if="member" class="max-w-2xl space-y-6">
        <!-- Profile header -->
        <UCard>
          <div class="flex items-center gap-4">
            <UAvatar :alt="getUserName(member)" size="xl" />
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ getUserName(member) }}
              </h2>
              <p class="text-gray-500 dark:text-gray-400">{{ member.email }}</p>
              <div class="flex items-center gap-2 mt-2">
                <UBadge variant="subtle">{{ getRoleName(member) }}</UBadge>
                <UBadge v-if="getCategoryName(member)" variant="outline" color="neutral">
                  {{ getCategoryName(member) }}
                </UBadge>
                <UBadge v-if="member.type_contrat" variant="outline" color="neutral">
                  {{ member.type_contrat }}
                </UBadge>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Contract info (Directeur only) -->
        <UCard v-if="isDirecteur">
          <template #header>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Informations contrat</h3>
          </template>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Debut de contrat</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ formatDateFr(member.date_debut_contrat) }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Fin de contrat</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ formatDateFr(member.date_fin_contrat) }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Fin de periode d'essai</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ formatDateFr(member.date_fin_periode_essai) }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Statut</span>
              <UBadge :color="member.actif ? 'green' : 'red'" variant="subtle" size="sm">
                {{ member.actif ? 'Actif' : 'Inactif' }}
              </UBadge>
            </div>
          </div>
        </UCard>

        <!-- Quick actions -->
        <div class="flex gap-3">
          <UButton
            :to="`/planning/${member.id}`"
            label="Voir le planning"
            icon="i-lucide-calendar"
            variant="subtle"
          />
          <UButton
            v-if="isDirecteur"
            :to="`/admin/utilisateurs/${member.id}`"
            label="Modifier"
            icon="i-lucide-pencil"
            variant="subtle"
            color="neutral"
          />
        </div>
      </div>
    </div>
  </div>
</template>
