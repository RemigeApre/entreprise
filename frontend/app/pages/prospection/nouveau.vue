<script setup lang="ts">
import type { ProspectStatut } from '~/utils/types'
import { VILLES_FRANCE } from '~/utils/constants'

const { user, isProspecteur } = useAuth()
if (!isProspecteur.value) navigateTo('/prospection')
const { create } = useProspects()
const toast = useToast()

const loading = ref(false)

const form = reactive({
  nom_entreprise: '',
  ville: '',
  villeCustom: '',
  secteur: '',
  adresse: '',
  telephone: '',
  email: '',
  emails_secondaires: '',
  site_web: '',
  contact_nom: '',
  notes: ''
})

const villeOptions = VILLES_FRANCE.map(v => ({ label: v, value: v }))

const isValid = computed(() => form.nom_entreprise.trim() !== '' && (form.ville !== '' || form.villeCustom.trim() !== ''))

async function handleSubmit() {
  if (!isValid.value || !user.value) return
  loading.value = true
  try {
    const ville = form.ville || form.villeCustom.trim()
    const prospect = await create({
      nom_entreprise: form.nom_entreprise.trim(),
      ville,
      secteur: form.secteur.trim() || null,
      adresse: form.adresse.trim() || null,
      telephone: form.telephone.trim() || null,
      email: form.email.trim() || null,
      emails_secondaires: form.emails_secondaires.trim() || null,
      site_web: form.site_web.trim() || null,
      contact_nom: form.contact_nom.trim() || null,
      notes: form.notes.trim() || null,
      statut: 'a_contacter' as ProspectStatut,
      nb_contacts: 0,
      prospecteur: user.value.id
    })
    toast.add({ title: 'Prospect cree', color: 'success' })
    await navigateTo(`/prospection/${prospect.id}`)
  } catch {
    toast.add({ title: 'Erreur lors de la creation', color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Nouveau prospect">
      <template #left>
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" to="/prospection" />
      </template>
      <template #right>
        <UButton
          label="Creer"
          icon="i-lucide-check"
          size="sm"
          :loading="loading"
          :disabled="!isValid"
          @click="handleSubmit"
        />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="max-w-2xl mx-auto space-y-6">
        <!-- Ville first -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Localisation</h3>
          </template>
          <div class="space-y-3">
            <UFormField label="Ville" required>
              <USelect
                v-model="form.ville"
                :items="[{ label: 'Autre ville...', value: '' }, ...villeOptions]"
                value-key="value"
                placeholder="Selectionner une ville"
                class="w-full"
              />
            </UFormField>
            <UFormField v-if="!form.ville" label="Ville (saisie libre)">
              <UInput v-model="form.villeCustom" placeholder="Nom de la ville" icon="i-lucide-map-pin" class="w-full" />
            </UFormField>
          </div>
        </UCard>

        <!-- Prospect info -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Informations</h3>
          </template>
          <div class="space-y-4">
            <UFormField label="Nom (entreprise ou personne)" required>
              <UInput v-model="form.nom_entreprise" placeholder="Ex: Dupont SARL, Jean Martin..." icon="i-lucide-building-2" class="w-full" />
            </UFormField>

            <UFormField label="Nom du contact">
              <UInput v-model="form.contact_nom" placeholder="Prenom Nom du contact principal" icon="i-lucide-user" class="w-full" />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Secteur">
                <UInput v-model="form.secteur" placeholder="Ex: Informatique, BTP..." icon="i-lucide-briefcase" class="w-full" />
              </UFormField>
              <UFormField label="Site web">
                <UInput v-model="form.site_web" placeholder="https://..." icon="i-lucide-globe" type="url" class="w-full" />
              </UFormField>
            </div>

            <UFormField label="Adresse">
              <UInput v-model="form.adresse" placeholder="Adresse complete" icon="i-lucide-map-pin" class="w-full" />
            </UFormField>
          </div>
        </UCard>

        <!-- Contact -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Coordonnees</h3>
          </template>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Telephone">
                <UInput v-model="form.telephone" placeholder="Numero principal" icon="i-lucide-phone" type="tel" class="w-full" />
              </UFormField>
              <UFormField label="Email principal">
                <UInput v-model="form.email" placeholder="email@example.com" icon="i-lucide-mail" type="email" class="w-full" />
              </UFormField>
            </div>
            <UFormField label="Emails secondaires">
              <UTextarea v-model="form.emails_secondaires" placeholder="Un email par ligne (optionnel)" :rows="2" class="w-full" />
            </UFormField>
          </div>
        </UCard>

        <!-- Notes -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Notes</h3>
          </template>
          <UTextarea v-model="form.notes" placeholder="Informations complementaires, contexte..." :rows="4" class="w-full" />
        </UCard>
      </div>
    </div>
  </div>
</template>
