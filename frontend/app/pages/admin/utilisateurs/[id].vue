<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type { UserProfile } from '~/utils/types'

definePageMeta({
  middleware: ['directeur']
})

const route = useRoute()
const { $directus } = useNuxtApp()
const { getUserById, updateExistingUser, removeUser } = useUsers()
const toast = useToast()

const userId = route.params.id as string

const { data: user, status } = useAsyncData(`admin-user-${userId}`, () => getUserById(userId))

const { data: roles } = useAsyncData('directus-roles', async () => {
  return await $directus.request(readItems('directus_roles', {
    fields: ['id', 'name'],
    limit: -1
  })) as { id: string; name: string }[]
})

const { data: categories } = useAsyncData('categories-list', async () => {
  return await $directus.request(readItems('categories', {
    fields: ['id', 'nom'],
    sort: ['nom'],
    limit: -1
  })) as { id: string; nom: string }[]
})

const contractTypeOptions = [
  { label: 'CDI', value: 'CDI' },
  { label: 'CDD', value: 'CDD' },
  { label: 'Freelance', value: 'Freelance' },
  { label: 'Alternance', value: 'Alternance' },
  { label: 'Stage', value: 'Stage' }
]

const submitting = ref(false)
const deleting = ref(false)
const showDeleteModal = ref(false)
const showPasswordModal = ref(false)
const newPassword = ref('')
const passwordSaving = ref(false)

const hasTrialPeriod = computed(() => {
  return form.type_contrat !== 'Stage' && form.type_contrat !== 'Freelance'
})

function generatePassword(length = 16) {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*'
  let pwd = ''
  for (let i = 0; i < length; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pwd
}

function openPasswordModal() {
  newPassword.value = generatePassword()
  showPasswordModal.value = true
}

async function handlePasswordSubmit() {
  if (!newPassword.value || newPassword.value.length < 8) {
    toast.add({ title: 'Le mot de passe doit contenir au moins 8 caracteres', color: 'warning' })
    return
  }
  passwordSaving.value = true
  try {
    await updateExistingUser(userId, { password: newPassword.value })
    toast.add({ title: 'Mot de passe mis a jour', color: 'success' })
    showPasswordModal.value = false
  } catch {
    toast.add({ title: 'Erreur lors de la mise a jour du mot de passe', color: 'error' })
  } finally {
    passwordSaving.value = false
  }
}

const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  role: '' as string,
  categorie: null as string | null,
  type_contrat: null as string | null,
  date_debut_contrat: '',
  date_fin_contrat: '',
  date_fin_periode_essai: '',
  actif: true
})

const roleOptions = computed(() => {
  if (!roles.value) return []
  return roles.value.map(r => ({ label: r.name, value: r.id }))
})

const categoryOptions = computed(() => {
  if (!categories.value) return []
  return categories.value.map(c => ({ label: c.nom, value: c.id }))
})

watch(user, (val) => {
  if (val) {
    form.first_name = val.first_name || ''
    form.last_name = val.last_name || ''
    form.email = val.email
    form.role = typeof val.role === 'string' ? val.role : val.role?.id || ''
    form.categorie = !val.categorie ? null : typeof val.categorie === 'string' ? val.categorie : val.categorie.id
    form.type_contrat = val.type_contrat || null
    form.date_debut_contrat = val.date_debut_contrat ? val.date_debut_contrat.split('T')[0] : ''
    form.date_fin_contrat = val.date_fin_contrat ? val.date_fin_contrat.split('T')[0] : ''
    form.date_fin_periode_essai = val.date_fin_periode_essai ? val.date_fin_periode_essai.split('T')[0] : ''
    form.actif = val.actif
  }
}, { immediate: true })

async function handleSubmit() {
  submitting.value = true
  try {
    const payload: Record<string, any> = {
      first_name: form.first_name || null,
      last_name: form.last_name || null,
      role: form.role || null,
      categorie: form.categorie || null,
      type_contrat: form.type_contrat || null,
      date_debut_contrat: form.date_debut_contrat || null,
      date_fin_contrat: form.date_fin_contrat || null,
      date_fin_periode_essai: hasTrialPeriod.value ? (form.date_fin_periode_essai || null) : null,
      actif: form.actif
    }

    await updateExistingUser(userId, payload)
    toast.add({ title: 'Utilisateur mis a jour avec succes', color: 'success' })
  } catch {
    toast.add({ title: 'Erreur lors de la mise a jour', color: 'error' })
  } finally {
    submitting.value = false
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    await removeUser(userId)
    toast.add({ title: 'Utilisateur supprime', color: 'success' })
    navigateTo('/admin/utilisateurs')
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  } finally {
    deleting.value = false
    showDeleteModal.value = false
  }
}

function getUserName(u: UserProfile) {
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}
</script>

<template>
  <div class="flex flex-col h-full">
    <UDashboardNavbar title="Modifier l'utilisateur">
      <template #right>
        <UButton
          label="Retour"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          to="/admin/utilisateurs"
        />
      </template>
    </UDashboardNavbar>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <div v-else-if="user" class="max-w-2xl space-y-6">
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Informations personnelles</h3>
          </template>

          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Prenom">
                <UInput
                  v-model="form.first_name"
                  placeholder="Prenom"
                />
              </UFormField>

              <UFormField label="Nom">
                <UInput
                  v-model="form.last_name"
                  placeholder="Nom"
                />
              </UFormField>
            </div>

            <UFormField label="Email">
              <UInput
                v-model="form.email"
                type="email"
                readonly
                disabled
              />
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Role">
                <USelectMenu
                  v-model="form.role"
                  :items="roleOptions"
                  value-key="value"
                  placeholder="Selectionner un role"
                />
              </UFormField>

              <UFormField label="Categorie">
                <USelectMenu
                  v-model="form.categorie"
                  :items="categoryOptions"
                  value-key="value"
                  placeholder="Selectionner une categorie"
                />
              </UFormField>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Mot de passe</h3>
            </div>
          </template>

          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Reinitialiser ou generer un nouveau mot de passe pour cet utilisateur.
            </p>
            <UButton
              label="Reinitialiser"
              icon="i-lucide-key-round"
              color="neutral"
              variant="subtle"
              @click="openPasswordModal"
            />
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Contrat</h3>
          </template>

          <div class="space-y-4">
            <UFormField label="Type de contrat">
              <USelectMenu
                v-model="form.type_contrat"
                :items="contractTypeOptions"
                value-key="value"
                placeholder="Selectionner un type"
              />
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Date de debut de contrat">
                <UInput
                  v-model="form.date_debut_contrat"
                  type="date"
                />
              </UFormField>

              <UFormField label="Date de fin de contrat">
                <UInput
                  v-model="form.date_fin_contrat"
                  type="date"
                />
              </UFormField>
            </div>

            <UFormField v-if="hasTrialPeriod" label="Date de fin de periode d'essai">
              <UInput
                v-model="form.date_fin_periode_essai"
                type="date"
              />
            </UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Statut</h3>
          </template>

          <div class="flex items-center gap-3">
            <USwitch v-model="form.actif" />
            <span class="text-sm text-gray-700 dark:text-gray-300">
              {{ form.actif ? 'Utilisateur actif' : 'Utilisateur inactif' }}
            </span>
          </div>
        </UCard>

        <USeparator />

        <div class="flex items-center justify-between">
          <UButton
            label="Supprimer"
            icon="i-lucide-trash-2"
            color="red"
            variant="subtle"
            @click="showDeleteModal = true"
          />

          <div class="flex gap-3">
            <UButton
              label="Annuler"
              color="neutral"
              variant="subtle"
              to="/admin/utilisateurs"
            />
            <UButton
              label="Enregistrer"
              icon="i-lucide-check"
              :loading="submitting"
              @click="handleSubmit"
            />
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-user-x" class="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p class="text-gray-500 dark:text-gray-400">Utilisateur introuvable</p>
        <UButton
          label="Retour aux utilisateurs"
          icon="i-lucide-arrow-left"
          class="mt-4"
          variant="subtle"
          to="/admin/utilisateurs"
        />
      </div>
    </div>

    <!-- Confirmation de suppression -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-red-100 dark:bg-red-900/30 p-2">
              <UIcon name="i-lucide-alert-triangle" class="size-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Supprimer cet utilisateur</h3>
          </div>

          <p class="text-sm text-gray-500 dark:text-gray-400">
            Etes-vous sur de vouloir supprimer l'utilisateur <strong>{{ getUserName(user!) }}</strong> ?
            Cette action est irreversible.
          </p>

          <div class="flex justify-end gap-3">
            <UButton
              label="Annuler"
              color="neutral"
              variant="subtle"
              @click="showDeleteModal = false"
            />
            <UButton
              label="Supprimer"
              icon="i-lucide-trash-2"
              color="red"
              :loading="deleting"
              @click="handleDelete"
            />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Reinitialisation mot de passe -->
    <UModal v-model:open="showPasswordModal">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2">
              <UIcon name="i-lucide-key-round" class="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Reinitialiser le mot de passe</h3>
          </div>

          <p class="text-sm text-gray-500 dark:text-gray-400">
            Un mot de passe a ete genere automatiquement. Vous pouvez le modifier avant de l'enregistrer.
          </p>

          <UFormField label="Nouveau mot de passe">
            <UInput
              v-model="newPassword"
              type="text"
              placeholder="Mot de passe"
            />
          </UFormField>

          <div class="flex items-center gap-2">
            <UButton
              label="Regenerer"
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="newPassword = generatePassword()"
            />
            <UButton
              label="Copier"
              icon="i-lucide-copy"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="navigator.clipboard.writeText(newPassword)"
            />
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <UButton
              label="Annuler"
              color="neutral"
              variant="subtle"
              @click="showPasswordModal = false"
            />
            <UButton
              label="Enregistrer"
              icon="i-lucide-check"
              :loading="passwordSaving"
              @click="handlePasswordSubmit"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
