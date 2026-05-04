<script setup lang="ts">
import { readItems, readRoles } from '@directus/sdk'

definePageMeta({
  middleware: ['directeur']
})

const { $directus } = useNuxtApp()
const { createNewUser } = useUsers()
const toast = useToast()

// 2 roles seulement : Directeur (admin) et Membre. Le formulaire choisit
// l'un ou l'autre via le toggle "Administrateur".
const { data: roles } = useAsyncData('roles-equipe-nouveau', async () => {
  return await $directus.request(readRoles({
    fields: ['id', 'name'],
    limit: -1
  })) as { id: string; name: string }[]
})

const directeurRoleId = computed(() => roles.value?.find(r => r.name === 'Directeur')?.id || '')
const membreRoleId = computed(() => roles.value?.find(r => r.name === 'Membre')?.id || '')

const { data: categories } = useAsyncData('categories-equipe-nouveau', async () => {
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

const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  isAdmin: false,
  categorie: null as string | null,
  type_contrat: null as string | null,
  date_debut_contrat: '',
  date_fin_contrat: '',
  date_fin_periode_essai: '',
  actif: true
})

const hasTrialPeriod = computed(() => form.type_contrat !== 'Stage' && form.type_contrat !== 'Freelance')
const categoryOptions = computed(() => categories.value?.map(c => ({ label: c.nom, value: c.id })) || [])

async function handleSubmit() {
  if (!form.email || !form.password) {
    toast.add({ title: 'Veuillez remplir les champs obligatoires (email et mot de passe)', color: 'warning' })
    return
  }
  const roleId = form.isAdmin ? directeurRoleId.value : membreRoleId.value
  if (!roleId) {
    toast.add({ title: 'Roles Directus introuvables — relance setup-directus.mjs', color: 'error' })
    return
  }
  submitting.value = true
  try {
    await createNewUser({
      email: form.email,
      password: form.password,
      first_name: form.first_name || undefined,
      last_name: form.last_name || undefined,
      role: roleId,
      categorie: form.categorie || null,
      type_contrat: form.type_contrat || null,
      date_debut_contrat: form.date_debut_contrat || null,
      date_fin_contrat: form.date_fin_contrat || null,
      date_fin_periode_essai: hasTrialPeriod.value ? (form.date_fin_periode_essai || null) : null,
      actif: form.actif
    } as any)
    toast.add({ title: 'Utilisateur cree avec succes', color: 'success' })
    navigateTo('/equipe')
  } catch {
    toast.add({ title: 'Erreur lors de la creation', color: 'error' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Nouveau membre">
      <template #left>
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" to="/equipe" />
      </template>
      <template #right>
        <UButton
          label="Creer"
          icon="i-lucide-check"
          size="sm"
          :loading="submitting"
          @click="handleSubmit"
        />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="max-w-2xl mx-auto space-y-6">
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Informations personnelles</h3>
          </template>
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Prenom">
                <UInput v-model="form.first_name" placeholder="Prenom" />
              </UFormField>
              <UFormField label="Nom">
                <UInput v-model="form.last_name" placeholder="Nom" />
              </UFormField>
            </div>
            <UFormField label="Email *">
              <UInput v-model="form.email" type="email" placeholder="email@exemple.com" />
            </UFormField>
            <UFormField label="Mot de passe *">
              <UInput v-model="form.password" type="password" placeholder="Mot de passe" />
            </UFormField>
            <UFormField label="Categorie / Pole">
              <USelectMenu v-model="form.categorie" :items="categoryOptions" value-key="value" placeholder="Selectionner un pole" />
            </UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Contrat</h3>
          </template>
          <div class="space-y-4">
            <UFormField label="Type de contrat">
              <USelectMenu v-model="form.type_contrat" :items="contractTypeOptions" value-key="value" placeholder="Selectionner un type" />
            </UFormField>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Date de debut">
                <UInput v-model="form.date_debut_contrat" type="date" />
              </UFormField>
              <UFormField label="Date de fin">
                <UInput v-model="form.date_fin_contrat" type="date" />
              </UFormField>
            </div>
            <UFormField v-if="hasTrialPeriod" label="Fin de periode d'essai">
              <UInput v-model="form.date_fin_periode_essai" type="date" />
            </UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Acces</h3>
          </template>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-stone-800">Administrateur</p>
                <p class="text-xs text-stone-500">Acces complet (gestion equipe, candidats, finance, parametres)</p>
              </div>
              <USwitch v-model="form.isAdmin" />
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-stone-100">
              <div>
                <p class="text-sm font-medium text-stone-800">Compte actif</p>
                <p class="text-xs text-stone-500">Permet la connexion</p>
              </div>
              <USwitch v-model="form.actif" />
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
