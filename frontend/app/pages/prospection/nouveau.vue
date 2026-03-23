<script setup lang="ts">
import type { OrigineProspection, NiveauSite } from '~/utils/types'
import { ORIGINES_PROSPECTION, NIVEAUX_SITE } from '~/utils/constants'

const { user, isProspecteur } = useAuth()
if (!isProspecteur.value) navigateTo('/prospection')

const { create } = useProspects()
const toast = useToast()

const loading = ref(false)

// --- Form state ---
const form = reactive({
  origine: null as OrigineProspection | null,
  nom_entreprise: '',
  ville: '',
  adresse: '',
  secteur: '',
  contact_nom: '',
  // Phones
  hasTelephone: false,
  telephones: [''] as string[],
  // Site
  hasSite: false,
  niveau_site: null as NiveauSite | null,
  site_web: '',
  // Emails
  hasEmail: false,
  emails: [''] as string[],
  // Notes
  notes: ''
})

// --- Phone management ---
function addPhone() {
  form.telephones.push('')
}

function removePhone(index: number) {
  form.telephones.splice(index, 1)
  if (!form.telephones.length) form.telephones.push('')
}

// --- Email management ---
function addEmail() {
  form.emails.push('')
}

function removeEmail(index: number) {
  form.emails.splice(index, 1)
  if (!form.emails.length) form.emails.push('')
}

// --- Validation ---
const isValid = computed(() => {
  return form.origine !== null && form.nom_entreprise.trim() !== '' && form.ville.trim() !== ''
})

// --- Submit ---
async function handleSubmit() {
  if (!isValid.value || !user.value) return
  loading.value = true
  try {
    const phones = form.hasTelephone
      ? form.telephones.map(t => t.trim()).filter(Boolean)
      : []
    const emails = form.hasEmail
      ? form.emails.map(e => e.trim()).filter(Boolean)
      : []

    const prospect = await create({
      nom_entreprise: form.nom_entreprise.trim(),
      ville: form.ville.trim(),
      adresse: form.adresse.trim() || null,
      secteur: form.secteur.trim() || null,
      contact_nom: form.contact_nom.trim() || null,
      origine: form.origine,
      telephone: phones[0] || null,
      telephones_secondaires: phones.slice(1).join('\n') || null,
      site_web: form.hasSite ? (form.site_web.trim() || null) : null,
      niveau_site: form.hasSite ? form.niveau_site : (form.niveau_site === null ? 'pas_de_site' : form.niveau_site),
      email: emails[0] || null,
      emails_secondaires: emails.slice(1).join('\n') || null,
      notes: form.notes.trim() || null,
      statut: 'a_contacter',
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

// --- Origine options ---
const origineEntries = Object.entries(ORIGINES_PROSPECTION) as [OrigineProspection, typeof ORIGINES_PROSPECTION[keyof typeof ORIGINES_PROSPECTION]][]
const niveauEntries = Object.entries(NIVEAUX_SITE) as [NiveauSite, typeof NIVEAUX_SITE[keyof typeof NIVEAUX_SITE]][]

const niveauColors: Record<string, string> = {
  pas_de_site: 'bg-stone-100 text-stone-600 border-stone-200',
  site_casse: 'bg-red-50 text-red-600 border-red-200',
  site_nul: 'bg-orange-50 text-orange-600 border-orange-200',
  site_passable: 'bg-amber-50 text-amber-600 border-amber-200'
}

const niveauColorsActive: Record<string, string> = {
  pas_de_site: 'bg-stone-600 text-white border-stone-600',
  site_casse: 'bg-red-500 text-white border-red-500',
  site_nul: 'bg-orange-500 text-white border-orange-500',
  site_passable: 'bg-amber-500 text-white border-amber-500'
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
      <form class="max-w-2xl mx-auto space-y-8" @submit.prevent="handleSubmit">

        <!-- ETAPE 1 : Origine -->
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
            <p class="text-sm font-semibold text-stone-800">D'ou vient ce prospect ?</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="([key, config]) in origineEntries"
              :key="key"
              type="button"
              class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border transition-all"
              :class="form.origine === key
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white/70 text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-white'"
              @click="form.origine = form.origine === key ? null : key"
            >
              <UIcon :name="config.icon" class="size-4" />
              {{ config.label }}
            </button>
          </div>
        </div>

        <!-- ETAPE 2 : Identite -->
        <div class="space-y-3" :class="{ 'opacity-40 pointer-events-none': !form.origine }">
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
            <p class="text-sm font-semibold text-stone-800">Identite</p>
          </div>
          <div class="space-y-3 pl-8">
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
            <UFormField label="Adresse">
              <UInput v-model="form.adresse" placeholder="Adresse complete" icon="i-lucide-map" class="w-full" />
            </UFormField>
            <UFormField label="Nom du contact">
              <UInput v-model="form.contact_nom" placeholder="Prenom Nom" icon="i-lucide-user" class="w-full" />
            </UFormField>
          </div>
        </div>

        <!-- ETAPE 3 : Telephone -->
        <div class="space-y-3" :class="{ 'opacity-40 pointer-events-none': !form.origine }">
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
            <button
              type="button"
              class="flex items-center gap-2 text-sm font-semibold transition-colors"
              :class="form.hasTelephone ? 'text-stone-800' : 'text-stone-500'"
              @click="form.hasTelephone = !form.hasTelephone"
            >
              <div
                class="flex items-center justify-center size-5 rounded border-2 transition-all"
                :class="form.hasTelephone ? 'bg-primary border-primary' : 'border-stone-300'"
              >
                <UIcon v-if="form.hasTelephone" name="i-lucide-check" class="size-3 text-white" />
              </div>
              Numero(s) de telephone
            </button>
          </div>
          <div v-if="form.hasTelephone" class="pl-8 space-y-2">
            <div v-for="(_, idx) in form.telephones" :key="idx" class="flex items-center gap-2">
              <UInput
                v-model="form.telephones[idx]"
                :placeholder="idx === 0 ? 'Numero principal' : 'Numero supplementaire'"
                icon="i-lucide-phone"
                type="tel"
                class="flex-1"
              />
              <UButton
                v-if="form.telephones.length > 1"
                icon="i-lucide-x"
                size="xs"
                variant="ghost"
                color="neutral"
                @click="removePhone(idx)"
              />
            </div>
            <button
              type="button"
              class="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
              @click="addPhone"
            >
              <UIcon name="i-lucide-plus" class="size-3.5" />
              Ajouter un numero
            </button>
          </div>
        </div>

        <!-- ETAPE 4 : Site web -->
        <div class="space-y-3" :class="{ 'opacity-40 pointer-events-none': !form.origine }">
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
            <p class="text-sm font-semibold text-stone-800">Site web</p>
          </div>
          <div class="pl-8 space-y-3">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="([key, config]) in niveauEntries"
                :key="key"
                type="button"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                :class="form.niveau_site === key ? niveauColorsActive[key] : niveauColors[key]"
                @click="form.niveau_site = form.niveau_site === key ? null : key; form.hasSite = key !== 'pas_de_site'"
              >
                <UIcon :name="config.icon" class="size-3.5" />
                {{ config.label }}
              </button>
            </div>
            <UFormField v-if="form.hasSite && form.niveau_site && form.niveau_site !== 'pas_de_site'" label="URL du site">
              <UInput v-model="form.site_web" placeholder="https://..." icon="i-lucide-globe" type="url" class="w-full" />
            </UFormField>
          </div>
        </div>

        <!-- ETAPE 5 : Emails -->
        <div class="space-y-3" :class="{ 'opacity-40 pointer-events-none': !form.origine }">
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs font-bold">5</span>
            <button
              type="button"
              class="flex items-center gap-2 text-sm font-semibold transition-colors"
              :class="form.hasEmail ? 'text-stone-800' : 'text-stone-500'"
              @click="form.hasEmail = !form.hasEmail"
            >
              <div
                class="flex items-center justify-center size-5 rounded border-2 transition-all"
                :class="form.hasEmail ? 'bg-primary border-primary' : 'border-stone-300'"
              >
                <UIcon v-if="form.hasEmail" name="i-lucide-check" class="size-3 text-white" />
              </div>
              Adresse(s) email
            </button>
          </div>
          <div v-if="form.hasEmail" class="pl-8 space-y-2">
            <div v-for="(_, idx) in form.emails" :key="idx" class="flex items-center gap-2">
              <UInput
                v-model="form.emails[idx]"
                :placeholder="idx === 0 ? 'Email principal' : 'Email supplementaire'"
                icon="i-lucide-mail"
                type="email"
                class="flex-1"
              />
              <UButton
                v-if="form.emails.length > 1"
                icon="i-lucide-x"
                size="xs"
                variant="ghost"
                color="neutral"
                @click="removeEmail(idx)"
              />
            </div>
            <button
              type="button"
              class="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
              @click="addEmail"
            >
              <UIcon name="i-lucide-plus" class="size-3.5" />
              Ajouter un email
            </button>
          </div>
        </div>

        <!-- ETAPE 6 : Notes -->
        <div class="space-y-3" :class="{ 'opacity-40 pointer-events-none': !form.origine }">
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs font-bold">6</span>
            <p class="text-sm font-semibold text-stone-800">Notes</p>
          </div>
          <div class="pl-8">
            <UTextarea v-model="form.notes" placeholder="Informations complementaires, contexte..." :rows="3" class="w-full" />
          </div>
        </div>

        <!-- Submit bottom -->
        <div class="pl-8 pt-2 pb-8">
          <UButton
            type="submit"
            label="Creer le prospect"
            icon="i-lucide-check"
            size="lg"
            :loading="loading"
            :disabled="!isValid"
            class="w-full sm:w-auto"
          />
        </div>
      </form>
    </div>
  </div>
</template>
