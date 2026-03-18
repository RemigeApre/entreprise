<script setup lang="ts">
const { user, isProspecteur } = useAuth()
if (!isProspecteur.value) navigateTo('/prospection')

const { create } = useProspects()
const toast = useToast()

const loading = ref(false)

const form = reactive({
  nom_entreprise: '',
  ville: '',
  secteur: '',
  contact_nom: '',
  telephone: '',
  email: '',
  site_web: '',
  adresse: '',
  emails_secondaires: '',
  notes: ''
})

const isValid = computed(() => form.nom_entreprise.trim() !== '' && form.ville.trim() !== '')

async function handleSubmit() {
  if (!isValid.value || !user.value) return
  loading.value = true
  try {
    const prospect = await create({
      nom_entreprise: form.nom_entreprise.trim(),
      ville: form.ville.trim(),
      secteur: form.secteur.trim() || null,
      contact_nom: form.contact_nom.trim() || null,
      telephone: form.telephone.trim() || null,
      email: form.email.trim() || null,
      site_web: form.site_web.trim() || null,
      adresse: form.adresse.trim() || null,
      emails_secondaires: form.emails_secondaires.trim() || null,
      notes: form.notes.trim() || null,
      statut: 'a_contacter',
      prospecteur: user.value.id
    })
    toast.add({ title: 'Prospect créé', color: 'success' })
    await navigateTo(`/prospection/${prospect.id}`)
  } catch {
    toast.add({ title: 'Erreur lors de la création', color: 'error' })
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
          label="Créer"
          icon="i-lucide-check"
          size="sm"
          :loading="loading"
          :disabled="!isValid"
          @click="handleSubmit"
        />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <form class="max-w-2xl mx-auto space-y-6" @submit.prevent="handleSubmit">
        <!-- Identité -->
        <div class="space-y-3">
          <UFormField label="Nom (entreprise ou personne)" required>
            <UInput
              v-model="form.nom_entreprise"
              placeholder="Ex : Dupont SARL, Jean Martin..."
              icon="i-lucide-building-2"
              autofocus
              class="w-full"
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Ville" required>
              <UInput v-model="form.ville" placeholder="Paris, Lyon..." icon="i-lucide-map-pin" class="w-full" />
            </UFormField>
            <UFormField label="Secteur">
              <UInput v-model="form.secteur" placeholder="Informatique, BTP..." icon="i-lucide-briefcase" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Nom du contact">
            <UInput v-model="form.contact_nom" placeholder="Prénom Nom" icon="i-lucide-user" class="w-full" />
          </UFormField>
        </div>

        <!-- Coordonnées -->
        <div class="border-t border-stone-100 pt-5 space-y-3">
          <p class="text-xs font-medium text-stone-400 uppercase tracking-wide">Coordonnées</p>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Téléphone">
              <UInput v-model="form.telephone" placeholder="Numéro principal" icon="i-lucide-phone" type="tel" class="w-full" />
            </UFormField>
            <UFormField label="Email">
              <UInput v-model="form.email" placeholder="email@exemple.com" icon="i-lucide-mail" type="email" class="w-full" />
            </UFormField>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Site web">
              <UInput v-model="form.site_web" placeholder="https://..." icon="i-lucide-globe" type="url" class="w-full" />
            </UFormField>
            <UFormField label="Adresse">
              <UInput v-model="form.adresse" placeholder="Adresse complète" icon="i-lucide-map" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Emails secondaires">
            <UTextarea v-model="form.emails_secondaires" placeholder="Un email par ligne (optionnel)" :rows="2" class="w-full" />
          </UFormField>
        </div>

        <!-- Notes -->
        <div class="border-t border-stone-100 pt-5">
          <UFormField label="Notes">
            <UTextarea v-model="form.notes" placeholder="Informations complémentaires, contexte..." :rows="3" class="w-full" />
          </UFormField>
        </div>
      </form>
    </div>
  </div>
</template>
