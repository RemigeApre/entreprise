<script setup lang="ts">
import type { CandidatStatut } from '~/utils/types'
import { CANDIDAT_STATUTS, CANDIDAT_SOURCES } from '~/utils/constants'

definePageMeta({ middleware: ['directeur'] })

const { create } = useCandidats()
const { getAll: getAllOffers } = useJobListings()
const toast = useToast()
const config = useRuntimeConfig()

const submitting = ref(false)

const form = reactive({
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  linkedin: '',
  source: null as string | null,
  statut: 'nouveau' as CandidatStatut,
  offre: null as string | null,
  notes: '',
  cvFile: null as File | null
})

// Load offers for select
const { data: offres } = useAsyncData('candidat-offres', getAllOffers)

const offreOptions = computed(() =>
  (offres.value || []).map(o => ({ label: o.titre, value: o.id }))
)

const statutOptions = Object.entries(CANDIDAT_STATUTS).map(([value, { label }]) => ({ label, value }))
const sourceOptions = CANDIDAT_SOURCES.map(s => ({ label: s, value: s }))

async function handleSubmit() {
  if (!form.prenom || !form.nom) {
    toast.add({ title: 'Prenom et nom sont obligatoires', color: 'warning' })
    return
  }

  submitting.value = true
  try {
    // Upload CV if provided
    let cvFileId: string | null = null
    if (form.cvFile) {
      const formData = new FormData()
      formData.append('file', form.cvFile)
      const baseUrl = config.public.directusUrl as string
      const url = baseUrl.startsWith('http') ? baseUrl : `${window.location.origin}${baseUrl}`
      const res = await fetch(`${url}/files`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
      if (!res.ok) throw new Error('Upload CV failed')
      const { data } = await res.json()
      cvFileId = data.id
    }

    const result = await create({
      prenom: form.prenom,
      nom: form.nom,
      email: form.email || null,
      telephone: form.telephone || null,
      linkedin: form.linkedin || null,
      source: form.source || null,
      statut: form.statut,
      offre: form.offre || null,
      notes: form.notes || null,
      cv: cvFileId
    })

    toast.add({ title: 'Candidat cree', color: 'success' })
    navigateTo(`/candidats/${result.id}`)
  } catch {
    toast.add({ title: 'Erreur lors de la creation', color: 'error' })
  } finally {
    submitting.value = false
  }
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  form.cvFile = input.files?.[0] || null
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Nouveau candidat">
      <template #left>
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" to="/candidats" />
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
            <h3 class="text-sm font-semibold text-stone-900">Identite</h3>
          </template>
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Prenom *">
                <UInput v-model="form.prenom" placeholder="Prenom" class="w-full" />
              </UFormField>
              <UFormField label="Nom *">
                <UInput v-model="form.nom" placeholder="Nom" class="w-full" />
              </UFormField>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Email">
                <UInput v-model="form.email" type="email" placeholder="email@example.com" icon="i-lucide-mail" class="w-full" />
              </UFormField>
              <UFormField label="Telephone">
                <UInput v-model="form.telephone" placeholder="06 12 34 56 78" icon="i-lucide-phone" class="w-full" />
              </UFormField>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="LinkedIn">
                <UInput v-model="form.linkedin" placeholder="URL profil LinkedIn" icon="i-lucide-link" class="w-full" />
              </UFormField>
              <UFormField label="Source">
                <USelect v-model="form.source" :items="sourceOptions" value-key="value" placeholder="Non renseigne" class="w-full" />
              </UFormField>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Candidature</h3>
          </template>
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Offre associee">
                <USelect v-model="form.offre" :items="offreOptions" value-key="value" placeholder="Aucune offre" class="w-full" />
              </UFormField>
              <UFormField label="Statut">
                <USelect v-model="form.statut" :items="statutOptions" value-key="value" class="w-full" />
              </UFormField>
            </div>
            <UFormField label="CV (fichier)">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                class="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer"
                @change="handleFileChange"
              >
            </UFormField>
            <UFormField label="Notes">
              <UTextarea v-model="form.notes" placeholder="Notes sur le candidat..." :rows="4" class="w-full" />
            </UFormField>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
