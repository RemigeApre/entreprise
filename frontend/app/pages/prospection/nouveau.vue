<script setup lang="ts">
import type { ProspectStatut } from '~/utils/types'

const { user } = useAuth()
const { create } = useProspects()
const toast = useToast()

const loading = ref(false)

const form = reactive({
  nom_entreprise: '',
  secteur: '',
  adresse: '',
  telephone: '',
  email: '',
  site_web: '',
  date_premier_contact: '',
  notes: '',
  statut: 'nouveau' as ProspectStatut
})

const statutOptions = Object.entries(PROSPECT_STATUTS).map(([value, config]) => ({
  label: config.label,
  value
}))

const isValid = computed(() => {
  return form.nom_entreprise.trim() !== '' && form.date_premier_contact !== ''
})

async function handleSubmit() {
  if (!isValid.value || !user.value) return
  loading.value = true
  try {
    const prospect = await create({
      nom_entreprise: form.nom_entreprise.trim(),
      secteur: form.secteur.trim() || null,
      adresse: form.adresse.trim() || null,
      telephone: form.telephone.trim() || null,
      email: form.email.trim() || null,
      site_web: form.site_web.trim() || null,
      date_premier_contact: form.date_premier_contact,
      notes: form.notes.trim() || null,
      statut: form.statut,
      prospecteur: user.value.id
    })
    toast.add({ title: 'Prospect cree avec succes', color: 'success' })
    await navigateTo(`/prospection/${prospect.id}`)
  } catch {
    toast.add({ title: 'Erreur lors de la creation du prospect', color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <UDashboardNavbar title="Nouveau prospect">
      <template #right>
        <UButton
          label="Annuler"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          to="/prospection"
        />
      </template>
    </UDashboardNavbar>

    <div class="p-4 sm:p-6">
      <div class="max-w-2xl">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Informations du prospect
            </h3>
          </template>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <UFormField label="Nom de l'entreprise" required>
              <UInput
                v-model="form.nom_entreprise"
                placeholder="Nom de l'entreprise"
                icon="i-lucide-building-2"
                required
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Secteur d'activite">
                <UInput
                  v-model="form.secteur"
                  placeholder="Ex: Technologie, Finance..."
                  icon="i-lucide-briefcase"
                />
              </UFormField>

              <UFormField label="Statut">
                <USelectMenu
                  v-model="form.statut"
                  :items="statutOptions"
                  value-key="value"
                />
              </UFormField>
            </div>

            <UFormField label="Adresse">
              <UInput
                v-model="form.adresse"
                placeholder="Adresse de l'entreprise"
                icon="i-lucide-map-pin"
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Telephone">
                <UInput
                  v-model="form.telephone"
                  placeholder="Numero de telephone"
                  icon="i-lucide-phone"
                  type="tel"
                />
              </UFormField>

              <UFormField label="Email">
                <UInput
                  v-model="form.email"
                  placeholder="email@entreprise.com"
                  icon="i-lucide-mail"
                  type="email"
                />
              </UFormField>
            </div>

            <UFormField label="Site web">
              <UInput
                v-model="form.site_web"
                placeholder="https://www.exemple.com"
                icon="i-lucide-globe"
                type="url"
              />
            </UFormField>

            <UFormField label="Date du premier contact" required>
              <UInput
                v-model="form.date_premier_contact"
                type="date"
                required
              />
            </UFormField>

            <UFormField label="Notes">
              <UTextarea
                v-model="form.notes"
                placeholder="Notes supplementaires sur ce prospect..."
                :rows="4"
              />
            </UFormField>

            <USeparator />

            <div class="flex justify-end gap-2">
              <UButton
                label="Annuler"
                color="neutral"
                variant="ghost"
                to="/prospection"
              />
              <UButton
                type="submit"
                label="Creer le prospect"
                icon="i-lucide-check"
                :loading="loading"
                :disabled="!isValid"
              />
            </div>
          </form>
        </UCard>
      </div>
    </div>
  </div>
</template>
