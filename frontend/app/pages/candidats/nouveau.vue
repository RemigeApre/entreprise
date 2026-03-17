<script setup lang="ts">
import type { CandidatStatut, ContactOrigin } from '~/utils/types'

definePageMeta({ middleware: ['directeur'] })

const { create } = useCandidats()
const { getAll: getAllOffers } = useJobListings()
const toast = useToast()

const submitting = ref(false)

const form = reactive({
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  date_contact: new Date().toISOString().split('T')[0],
  contact_origin: 'sortant' as ContactOrigin,
  offre: null as string | null,
  notes: ''
})

// Load offers for select
const { data: offres } = useAsyncData('candidat-offres', getAllOffers)

const offreOptions = computed(() =>
  [{ label: 'Aucune offre', value: '' }, ...(offres.value || []).map(o => ({ label: o.titre, value: o.id }))]
)

async function handleSubmit() {
  if (!form.prenom.trim() || !form.nom.trim()) {
    toast.add({ title: 'Prenom et nom sont obligatoires', color: 'warning' })
    return
  }
  if (!form.email.trim() && !form.telephone.trim()) {
    toast.add({ title: 'Au moins un email ou un telephone est requis', color: 'warning' })
    return
  }

  submitting.value = true
  try {
    const result = await create({
      prenom: form.prenom.trim(),
      nom: form.nom.trim(),
      email: form.email.trim() || null,
      telephone: form.telephone.trim() || null,
      date_contact: form.date_contact || null,
      contact_origin: form.contact_origin,
      statut: 'premier_contact' as CandidatStatut,
      offre: form.offre || null,
      notes: form.notes.trim() || null
    })

    toast.add({ title: 'Candidat cree', color: 'success' })
    navigateTo(`/candidats/${result.id}`)
  } catch {
    toast.add({ title: 'Erreur lors de la creation', color: 'error' })
  } finally {
    submitting.value = false
  }
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
            <p class="text-xs text-stone-400">Au moins un email ou un telephone est requis.</p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Contact</h3>
          </template>
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Date du contact">
                <UInput v-model="form.date_contact" type="date" class="w-full" />
              </UFormField>
              <UFormField label="Origine">
                <div class="flex items-center gap-2 pt-1">
                  <button
                    class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors"
                    :class="form.contact_origin === 'sortant'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-stone-200 text-stone-500 hover:bg-stone-50'"
                    @click="form.contact_origin = 'sortant'"
                  >
                    <UIcon name="i-lucide-phone-outgoing" class="size-4" />
                    Je l'ai contacte
                  </button>
                  <button
                    class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors"
                    :class="form.contact_origin === 'entrant'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-stone-200 text-stone-500 hover:bg-stone-50'"
                    @click="form.contact_origin = 'entrant'"
                  >
                    <UIcon name="i-lucide-phone-incoming" class="size-4" />
                    Il m'a contacte
                  </button>
                </div>
              </UFormField>
            </div>

            <UFormField label="Offre associee (optionnel)">
              <USelect v-model="form.offre" :items="offreOptions" value-key="value" placeholder="Aucune offre" class="w-full" />
            </UFormField>

            <UFormField label="Notes">
              <UTextarea v-model="form.notes" placeholder="Notes sur le candidat..." :rows="3" class="w-full" />
            </UFormField>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
