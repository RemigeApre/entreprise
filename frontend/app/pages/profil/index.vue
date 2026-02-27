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

// Edition des infos perso
const editingInfo = ref(false)
const infoSaving = ref(false)
const editForm = reactive({
  telephone: '',
  linkedin: '',
  localisation: '',
  bio: ''
})

function startEditInfo() {
  if (!user.value) return
  editForm.telephone = user.value.telephone || ''
  editForm.linkedin = user.value.linkedin || ''
  editForm.localisation = user.value.localisation || ''
  editForm.bio = user.value.bio || ''
  editingInfo.value = true
}

async function saveInfo() {
  if (!user.value) return
  infoSaving.value = true
  try {
    await $directus.request(updateMe({
      telephone: editForm.telephone || null,
      linkedin: editForm.linkedin || null,
      localisation: editForm.localisation || null,
      bio: editForm.bio || null
    }))
    user.value = {
      ...user.value,
      telephone: editForm.telephone || null,
      linkedin: editForm.linkedin || null,
      localisation: editForm.localisation || null,
      bio: editForm.bio || null
    }
    editingInfo.value = false
    toast.add({ title: 'Informations mises a jour', color: 'success' })
  } catch {
    toast.add({ title: 'Erreur lors de la mise a jour', color: 'error' })
  } finally {
    infoSaving.value = false
  }
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
    await $directus.login({ email: user.value.email, password: currentPassword.value })
    await $directus.request(updateMe({ password: newPassword.value }))
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
    <PageHeader title="Mon profil" />

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
              <div v-if="user.bio" class="mt-2 text-sm text-stone-600 dark:text-stone-400 italic">
                {{ user.bio }}
              </div>
            </div>
          </div>
        </UCard>

        <!-- Coordonnees & infos perso -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Coordonnees</h3>
              <UButton
                v-if="!editingInfo"
                label="Modifier"
                icon="i-lucide-pencil"
                variant="ghost"
                size="xs"
                @click="startEditInfo"
              />
              <div v-else class="flex gap-2">
                <UButton
                  label="Annuler"
                  variant="ghost"
                  size="xs"
                  color="neutral"
                  @click="editingInfo = false"
                />
                <UButton
                  label="Enregistrer"
                  icon="i-lucide-check"
                  size="xs"
                  :loading="infoSaving"
                  @click="saveInfo"
                />
              </div>
            </div>
          </template>

          <!-- Mode lecture -->
          <div v-if="!editingInfo" class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Telephone</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ user.telephone || '-' }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">LinkedIn</span>
              <p v-if="user.linkedin" class="font-medium">
                <a :href="user.linkedin" target="_blank" rel="noopener" class="text-primary hover:underline">
                  {{ user.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '') || 'Profil' }}
                </a>
              </p>
              <p v-else class="font-medium text-gray-900 dark:text-white">-</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Localisation</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ user.localisation || '-' }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Email</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ user.email }}</p>
            </div>
            <div v-if="user.bio" class="sm:col-span-2">
              <span class="text-gray-500 dark:text-gray-400">Presentation</span>
              <p class="font-medium text-gray-900 dark:text-white whitespace-pre-line">{{ user.bio }}</p>
            </div>
          </div>

          <!-- Mode edition -->
          <div v-else class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Telephone">
                <UInput v-model="editForm.telephone" placeholder="06 12 34 56 78" icon="i-lucide-phone" />
              </UFormField>
              <UFormField label="LinkedIn">
                <UInput v-model="editForm.linkedin" placeholder="https://linkedin.com/in/..." icon="i-lucide-link" />
              </UFormField>
              <UFormField label="Localisation">
                <UInput v-model="editForm.localisation" placeholder="Paris, Lyon..." icon="i-lucide-map-pin" />
              </UFormField>
            </div>
            <UFormField label="Presentation">
              <UTextarea v-model="editForm.bio" placeholder="Quelques mots sur vous..." :rows="3" />
            </UFormField>
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
