<script setup lang="ts">
import { readItems } from '@directus/sdk'

definePageMeta({
  middleware: ['directeur']
})

const { $directus } = useNuxtApp()
const { createNewUser } = useUsers()
const toast = useToast()

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

const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: '' as string,
  categorie: null as string | null,
  type_contrat: null as string | null,
  date_debut_contrat: '',
  date_fin_contrat: '',
  date_fin_periode_essai: '',
  actif: true
})

const hasTrialPeriod = computed(() => form.type_contrat !== 'Stage' && form.type_contrat !== 'Freelance')
const roleOptions = computed(() => roles.value?.map(r => ({ label: r.name, value: r.id })) || [])
const categoryOptions = computed(() => categories.value?.map(c => ({ label: c.nom, value: c.id })) || [])

async function handleSubmit() {
  if (!form.email || !form.password) {
    toast.add({ title: 'Veuillez remplir les champs obligatoires (email et mot de passe)', color: 'warning' })
    return
  }
  submitting.value = true
  try {
    await createNewUser({
      email: form.email,
      password: form.password,
      first_name: form.first_name || undefined,
      last_name: form.last_name || undefined,
      role: form.role || undefined,
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
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Informations personnelles</h3>
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
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Role">
                <USelectMenu v-model="form.role" :items="roleOptions" value-key="value" placeholder="Selectionner un role" />
              </UFormField>
              <UFormField label="Categorie / Pole">
                <USelectMenu v-model="form.categorie" :items="categoryOptions" value-key="value" placeholder="Selectionner un pole" />
              </UFormField>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Contrat</h3>
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
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Statut</h3>
          </template>
          <div class="flex items-center gap-3">
            <USwitch v-model="form.actif" />
            <span class="text-sm text-stone-700 dark:text-stone-300">
              {{ form.actif ? 'Utilisateur actif' : 'Utilisateur inactif' }}
            </span>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
