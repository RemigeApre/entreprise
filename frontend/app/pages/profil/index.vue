<script setup lang="ts">
import type { UserProfile } from '~/utils/types'

const { user, logout, roleName } = useAuth()

function getUserName(u: UserProfile) {
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}

function getRoleName(u: UserProfile) {
  if (typeof u.role === 'string') return u.role
  return u.role.name
}

function getCategoryName(u: UserProfile) {
  if (!u.categorie || typeof u.categorie === 'string') return null
  return u.categorie.nom
}

function formatDateFr(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function getRoleColor(name: string) {
  const colors: Record<string, string> = {
    Directeur: 'red',
    Employe: 'blue',
    Freelance: 'orange',
    Alternant: 'purple',
    Stagiaire: 'yellow'
  }
  return colors[name] || 'neutral'
}

const loggingOut = ref(false)

async function handleLogout() {
  loggingOut.value = true
  try {
    await logout()
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div>
    <UDashboardNavbar title="Mon profil" />

    <div class="p-4 sm:p-6">
      <div v-if="!user" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <div v-else class="max-w-2xl space-y-6">
        <!-- En-tete du profil -->
        <UCard>
          <div class="flex items-center gap-4">
            <UAvatar
              :alt="getUserName(user)"
              size="xl"
            />
            <div class="min-w-0 flex-1">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ getUserName(user) }}
              </h2>
              <p class="text-gray-500 dark:text-gray-400">{{ user.email }}</p>
              <div class="flex flex-wrap items-center gap-2 mt-2">
                <UBadge :color="getRoleColor(getRoleName(user))" variant="subtle">
                  {{ getRoleName(user) }}
                </UBadge>
                <UBadge v-if="getCategoryName(user)" variant="outline" color="neutral">
                  {{ getCategoryName(user) }}
                </UBadge>
                <UBadge v-if="user.type_contrat" variant="outline" color="neutral">
                  {{ user.type_contrat }}
                </UBadge>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Informations personnelles -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Informations personnelles</h3>
          </template>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Prenom</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ user.first_name || '-' }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Nom</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ user.last_name || '-' }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Email</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ user.email }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Role</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ getRoleName(user) }}</p>
            </div>
            <div v-if="getCategoryName(user)">
              <span class="text-gray-500 dark:text-gray-400">Categorie</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ getCategoryName(user) }}</p>
            </div>
            <div v-if="user.type_contrat">
              <span class="text-gray-500 dark:text-gray-400">Type de contrat</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ user.type_contrat }}</p>
            </div>
          </div>
        </UCard>

        <!-- Informations contrat -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Informations contrat</h3>
          </template>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Debut de contrat</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ formatDateFr(user.date_debut_contrat) }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Fin de contrat</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ formatDateFr(user.date_fin_contrat) }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Fin de periode d'essai</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ formatDateFr(user.date_fin_periode_essai) }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Statut</span>
              <UBadge :color="user.actif ? 'green' : 'red'" variant="subtle" size="sm">
                {{ user.actif ? 'Actif' : 'Inactif' }}
              </UBadge>
            </div>
          </div>
        </UCard>

        <USeparator />

        <!-- Deconnexion -->
        <div class="flex justify-end">
          <UButton
            label="Se deconnecter"
            icon="i-lucide-log-out"
            color="red"
            variant="subtle"
            :loading="loggingOut"
            @click="handleLogout"
          />
        </div>
      </div>
    </div>
  </div>
</template>
