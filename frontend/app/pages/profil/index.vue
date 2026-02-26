<script setup lang="ts">
import { updateMe } from '@directus/sdk'
import type { UserProfile } from '~/utils/types'

const { $directus } = useNuxtApp()
const { user, logout, roleName } = useAuth()
const toast = useToast()

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

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordSaving = ref(false)

async function handlePasswordChange() {
  if (!user.value) return
  if (!currentPassword.value) {
    toast.add({ title: 'Veuillez saisir votre mot de passe actuel', color: 'warning' })
    return
  }
  if (!newPassword.value || newPassword.value.length < 8) {
    toast.add({ title: 'Le nouveau mot de passe doit contenir au moins 8 caracteres', color: 'warning' })
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    toast.add({ title: 'Les mots de passe ne correspondent pas', color: 'warning' })
    return
  }
  passwordSaving.value = true
  try {
    // Verifier le mot de passe actuel en tentant une connexion
    await $directus.login({ email: user.value.email, password: currentPassword.value })
    // Mettre a jour le mot de passe
    await $directus.request(updateMe({ password: newPassword.value }))
    // Re-authentifier avec le nouveau mot de passe
    await $directus.login({ email: user.value.email, password: newPassword.value })
    toast.add({ title: 'Mot de passe mis a jour avec succes', color: 'success' })
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch {
    toast.add({ title: 'Mot de passe actuel incorrect ou erreur lors de la mise a jour', color: 'error' })
  } finally {
    passwordSaving.value = false
  }
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
  <div class="flex flex-col h-full">
    <UDashboardNavbar title="Mon profil" />

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
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
            <div v-if="user.type_contrat !== 'Stage' && user.type_contrat !== 'Freelance'">
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

        <!-- Securite -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Securite</h3>
          </template>

          <div class="space-y-4">
            <UFormField label="Mot de passe actuel">
              <UInput
                v-model="currentPassword"
                type="password"
                placeholder="Mot de passe actuel"
              />
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Nouveau mot de passe">
                <UInput
                  v-model="newPassword"
                  type="password"
                  placeholder="Minimum 8 caracteres"
                />
              </UFormField>

              <UFormField label="Confirmer le mot de passe">
                <UInput
                  v-model="confirmPassword"
                  type="password"
                  placeholder="Confirmer"
                />
              </UFormField>
            </div>

            <div class="flex justify-end">
              <UButton
                label="Modifier le mot de passe"
                icon="i-lucide-key-round"
                :loading="passwordSaving"
                :disabled="!currentPassword || !newPassword || !confirmPassword"
                @click="handlePasswordChange"
              />
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
