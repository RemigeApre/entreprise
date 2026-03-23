<script setup lang="ts">
import type { Prospect, ProspectStatut, ContactCanal, ContactResultat, ContactHistory, OffreProspectStatut, ProspectOffre, MotifCloture, OrigineProspection, NiveauSite } from '~/utils/types'
import { PROSPECT_STATUTS, CONTACT_CANAUX, CONTACT_RESULTATS, OFFRE_PROSPECT_STATUTS, MOTIFS_CLOTURE, ORIGINES_PROSPECTION, NIVEAUX_SITE } from '~/utils/constants'

const route = useRoute()
const { user, isProspecteur } = useAuth()
if (!isProspecteur.value) navigateTo('/prospection')

const { getById, update, addContact, remove, addOffre, updateOffre, removeOffre } = useProspects()
const { hasQuota, loadWeekContacts, todayContacts, objectifJour } = useProspectQuota()
const toast = useToast()

const prospectId = route.params.id as string
const { data: prospect, status, refresh } = useAsyncData(`prospect-${prospectId}`, () => getById(prospectId))

// --- All phone numbers (primary + secondaires) ---
const allPhones = computed(() => {
  if (!prospect.value) return []
  const phones: string[] = []
  if (prospect.value.telephone) phones.push(prospect.value.telephone)
  if (prospect.value.telephones_secondaires) {
    prospect.value.telephones_secondaires.split('\n').map(t => t.trim()).filter(Boolean).forEach(t => {
      if (!phones.includes(t)) phones.push(t)
    })
  }
  return phones
})

// --- Edit ---
const editing = ref(false)
const saving = ref(false)

const editForm = reactive({
  nom_entreprise: '',
  ville: '',
  secteur: '',
  adresse: '',
  telephone: '',
  telephones_secondaires: '',
  email: '',
  emails_secondaires: '',
  site_web: '',
  contact_nom: '',
  notes: '',
  statut: 'a_contacter' as ProspectStatut,
  origine: null as OrigineProspection | null,
  niveau_site: null as NiveauSite | null
})

const statutOptions = Object.entries(PROSPECT_STATUTS).map(([value, config]) => ({ label: config.label, value }))
const origineOptions = [{ label: '-', value: '' }, ...Object.entries(ORIGINES_PROSPECTION).map(([value, config]) => ({ label: config.label, value }))]
const niveauSiteOptions = [{ label: '-', value: '' }, ...Object.entries(NIVEAUX_SITE).map(([value, config]) => ({ label: config.label, value }))]

function startEditing() {
  if (!prospect.value) return
  const p = prospect.value
  Object.assign(editForm, {
    nom_entreprise: p.nom_entreprise,
    ville: p.ville,
    secteur: p.secteur || '',
    adresse: p.adresse || '',
    telephone: p.telephone || '',
    telephones_secondaires: p.telephones_secondaires || '',
    email: p.email || '',
    emails_secondaires: p.emails_secondaires || '',
    site_web: p.site_web || '',
    contact_nom: p.contact_nom || '',
    notes: p.notes || '',
    statut: p.statut,
    origine: p.origine || null,
    niveau_site: p.niveau_site || null
  })
  editing.value = true
}

async function saveChanges() {
  if (!editForm.nom_entreprise.trim() || !editForm.ville.trim()) return
  saving.value = true
  try {
    await update(prospectId, {
      nom_entreprise: editForm.nom_entreprise.trim(),
      ville: editForm.ville.trim(),
      secteur: editForm.secteur.trim() || null,
      adresse: editForm.adresse.trim() || null,
      telephone: editForm.telephone.trim() || null,
      telephones_secondaires: editForm.telephones_secondaires.trim() || null,
      email: editForm.email.trim() || null,
      emails_secondaires: editForm.emails_secondaires.trim() || null,
      site_web: editForm.site_web.trim() || null,
      contact_nom: editForm.contact_nom.trim() || null,
      notes: editForm.notes.trim() || null,
      statut: editForm.statut,
      origine: editForm.origine || null,
      niveau_site: editForm.niveau_site || null
    })
    toast.add({ title: 'Prospect mis a jour', color: 'success' })
    editing.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    saving.value = false
  }
}

// --- Delete ---
const showDeleteModal = ref(false)
const deleting = ref(false)

async function handleDelete() {
  deleting.value = true
  try {
    await remove(prospectId)
    toast.add({ title: 'Prospect supprime', color: 'success' })
    await navigateTo('/prospection')
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    deleting.value = false
  }
}

// --- Quick note ---
const quickNote = ref('')
const savingNote = ref(false)
let noteTimeout: ReturnType<typeof setTimeout> | null = null

watch(prospect, (p) => {
  if (p) quickNote.value = p.notes || ''
}, { immediate: true })

function onNoteInput() {
  if (noteTimeout) clearTimeout(noteTimeout)
  noteTimeout = setTimeout(saveNote, 800)
}

async function saveNote() {
  if (!prospect.value || quickNote.value === (prospect.value.notes || '')) return
  savingNote.value = true
  try {
    await update(prospectId, { notes: quickNote.value.trim() || null })
    prospect.value.notes = quickNote.value.trim() || null
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    savingNote.value = false
  }
}

// --- Contacts (inline) ---
const showContactForm = ref(false)
const addingContact = ref(false)
const addingPhone = ref(false)
const newPhone = ref('')

const contactForm = reactive({
  canal: 'telephone' as ContactCanal,
  resultat: 'attente' as ContactResultat,
  date_contact: new Date().toISOString().split('T')[0],
  notes: '',
  selectedPhone: ''
})

const canalOptions = Object.entries(CONTACT_CANAUX).map(([value, config]) => ({ label: config.label, value }))
const resultatOptions = Object.entries(CONTACT_RESULTATS).map(([value, config]) => ({ label: config.label, value }))

const phoneSelectOptions = computed(() => {
  return allPhones.value.map(p => ({ label: p, value: p }))
})

// Auto-select first phone when opening form
watch(showContactForm, (open) => {
  if (open && allPhones.value.length) {
    contactForm.selectedPhone = allPhones.value[0]
  }
})

const sortedContacts = computed(() => {
  if (!prospect.value?.historique_contacts) return []
  return [...prospect.value.historique_contacts].sort(
    (a, b) => new Date(b.date_contact).getTime() - new Date(a.date_contact).getTime()
  )
})

function resetContactForm() {
  contactForm.canal = 'telephone'
  contactForm.resultat = 'attente'
  contactForm.date_contact = new Date().toISOString().split('T')[0]
  contactForm.notes = ''
  contactForm.selectedPhone = allPhones.value[0] || ''
}

async function handleAddPhone() {
  const phone = newPhone.value.trim()
  if (!phone) return
  addingPhone.value = true
  try {
    const current = prospect.value?.telephones_secondaires || ''
    const updated = current ? current + '\n' + phone : phone
    await update(prospectId, { telephones_secondaires: updated })
    await refresh()
    contactForm.selectedPhone = phone
    newPhone.value = ''
    toast.add({ title: 'Numero ajoute', color: 'success' })
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    addingPhone.value = false
  }
}

async function handleAddContact() {
  if (!user.value) return
  addingContact.value = true
  try {
    const phoneNote = contactForm.selectedPhone ? `[${contactForm.selectedPhone}] ` : ''
    await addContact({
      prospect: prospectId,
      canal: contactForm.canal,
      resultat: contactForm.resultat,
      date_contact: contactForm.date_contact,
      notes: (phoneNote + contactForm.notes).trim(),
      contacte_par: user.value.id
    })

    const newNb = (prospect.value?.nb_contacts || 0) + 1
    const updates: Partial<Prospect> = { nb_contacts: newNb }
    if (prospect.value?.statut === 'a_contacter') {
      updates.statut = 'premier_contact'
    }
    if (contactForm.resultat === 'positif' && prospect.value?.statut === 'premier_contact') {
      updates.statut = 'en_discussion'
    }

    await update(prospectId, updates)
    await loadWeekContacts()

    const quotaMsg = hasQuota.value && objectifJour.value
      ? ` (${todayContacts.value}/${objectifJour.value} aujourd'hui)`
      : ''
    toast.add({ title: `Contact ajoute${quotaMsg}`, color: 'success' })

    showContactForm.value = false
    resetContactForm()
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    addingContact.value = false
  }
}

// --- Offres (inline) ---
const showOffreForm = ref(false)
const addingOffre = ref(false)

const offreForm = reactive({
  titre: '',
  montant: null as number | null,
  statut: 'a_proposer' as OffreProspectStatut,
  notes: ''
})

const offreStatutOptions = Object.entries(OFFRE_PROSPECT_STATUTS).map(([value, config]) => ({ label: config.label, value }))

function resetOffreForm() {
  offreForm.titre = ''
  offreForm.montant = null
  offreForm.statut = 'a_proposer'
  offreForm.notes = ''
}

async function handleAddOffre() {
  if (!user.value || !offreForm.titre.trim()) return
  addingOffre.value = true
  try {
    await addOffre({
      prospect: prospectId,
      titre: offreForm.titre.trim(),
      montant: offreForm.montant,
      statut: offreForm.statut,
      notes: offreForm.notes.trim(),
      ajoutee_par: user.value.id
    })
    toast.add({ title: 'Offre ajoutee', color: 'success' })
    showOffreForm.value = false
    resetOffreForm()
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    addingOffre.value = false
  }
}

async function cycleOffreStatut(offre: ProspectOffre) {
  const order: OffreProspectStatut[] = ['a_proposer', 'proposee', 'negociation', 'acceptee', 'refusee']
  const idx = order.indexOf(offre.statut)
  const next = order[(idx + 1) % order.length]
  try {
    await updateOffre(offre.id, { statut: next })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

async function handleRemoveOffre(id: string) {
  try {
    await removeOffre(id)
    toast.add({ title: 'Offre supprimee', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

// --- Pipeline ---
const showClotureChoice = ref(false)

async function setStatut(statut: ProspectStatut) {
  if (statut === 'cloture') {
    showClotureChoice.value = true
    return
  }
  try {
    await update(prospectId, { statut, motif_cloture: null })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

async function clotureAvecMotif(motif: MotifCloture) {
  try {
    await update(prospectId, { statut: 'cloture', motif_cloture: motif })
    showClotureChoice.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

const pipelineSteps = Object.entries(PROSPECT_STATUTS) as [string, typeof PROSPECT_STATUTS[keyof typeof PROSPECT_STATUTS]][]

const pipelineColors: Record<string, string> = {
  a_contacter: 'bg-stone-600 text-white',
  premier_contact: 'bg-blue-600 text-white',
  en_discussion: 'bg-amber-500 text-white',
  client: 'bg-emerald-600 text-white',
  cloture: 'bg-red-500 text-white'
}

function isPipelineReached(key: string): boolean {
  if (!prospect.value) return false
  const order = ['a_contacter', 'premier_contact', 'en_discussion', 'client', 'cloture']
  const currentIdx = order.indexOf(prospect.value.statut)
  const keyIdx = order.indexOf(key)
  if (prospect.value.statut === 'cloture') return key === 'cloture'
  return keyIdx <= currentIdx
}

// --- Helpers ---
function getProspecteurName(p: Prospect): string {
  if (!p.prospecteur || typeof p.prospecteur === 'string') return '-'
  return [p.prospecteur.first_name, p.prospecteur.last_name].filter(Boolean).join(' ') || '-'
}

function getContactUserName(contact: ContactHistory): string {
  if (!contact.contacte_par || typeof contact.contacte_par === 'string') return '-'
  return [contact.contacte_par.first_name, contact.contacte_par.last_name].filter(Boolean).join(' ') || '-'
}

function getOffreUserName(offre: ProspectOffre): string {
  if (!offre.ajoutee_par || typeof offre.ajoutee_par === 'string') return '-'
  return [offre.ajoutee_par.first_name, offre.ajoutee_par.last_name].filter(Boolean).join(' ') || '-'
}

function formatDateFr(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateShort(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function getResultatBg(resultat: ContactResultat): string {
  const color = CONTACT_RESULTATS[resultat]?.color
  if (color === 'green') return 'bg-emerald-100'
  if (color === 'red') return 'bg-red-100'
  if (color === 'orange') return 'bg-orange-100'
  return 'bg-stone-100'
}

function getResultatIcon(resultat: ContactResultat): string {
  const color = CONTACT_RESULTATS[resultat]?.color
  if (color === 'green') return 'text-emerald-600'
  if (color === 'red') return 'text-red-600'
  if (color === 'orange') return 'text-orange-500'
  return 'text-stone-500'
}

function getOffreStatutColor(statut: OffreProspectStatut): string {
  const map: Record<string, string> = {
    a_proposer: 'bg-stone-100 text-stone-600',
    proposee: 'bg-blue-100 text-blue-700',
    negociation: 'bg-amber-100 text-amber-700',
    acceptee: 'bg-emerald-100 text-emerald-700',
    refusee: 'bg-red-100 text-red-600'
  }
  return map[statut] || map.a_proposer
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader :title="prospect?.nom_entreprise || 'Prospect'">
      <template #left>
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" to="/prospection" />
      </template>
      <template #right>
        <template v-if="!editing && prospect">
          <UButton label="Modifier" icon="i-lucide-pencil" size="sm" variant="subtle" @click="startEditing" />
          <UButton icon="i-lucide-trash-2" size="sm" variant="ghost" color="error" @click="showDeleteModal = true" />
        </template>
        <template v-if="editing">
          <UButton label="Annuler" color="neutral" variant="ghost" size="sm" @click="editing = false" />
          <UButton label="Enregistrer" icon="i-lucide-check" size="sm" :loading="saving" @click="saveChanges" />
        </template>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <!-- Loading -->
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-circle" class="size-8 text-primary animate-spin" />
      </div>

      <!-- Not found -->
      <div v-else-if="!prospect" class="text-center py-12">
        <UIcon name="i-lucide-search-x" class="size-10 text-stone-300 mx-auto mb-3" />
        <p class="text-stone-500">Prospect introuvable</p>
        <UButton label="Retour" icon="i-lucide-arrow-left" variant="subtle" class="mt-4" to="/prospection" />
      </div>

      <div v-else>
        <!-- EDIT MODE -->
        <template v-if="editing">
          <div class="max-w-2xl space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Origine">
                <USelect v-model="editForm.origine" :items="origineOptions" value-key="value" class="w-full" />
              </UFormField>
              <UFormField label="Statut">
                <USelect v-model="editForm.statut" :items="statutOptions" value-key="value" class="w-full" />
              </UFormField>
            </div>
            <UFormField label="Nom" required>
              <UInput v-model="editForm.nom_entreprise" icon="i-lucide-building-2" class="w-full" />
            </UFormField>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Ville" required>
                <UInput v-model="editForm.ville" icon="i-lucide-map-pin" class="w-full" />
              </UFormField>
              <UFormField label="Secteur">
                <UInput v-model="editForm.secteur" icon="i-lucide-briefcase" class="w-full" />
              </UFormField>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Contact">
                <UInput v-model="editForm.contact_nom" icon="i-lucide-user" class="w-full" />
              </UFormField>
              <UFormField label="Adresse">
                <UInput v-model="editForm.adresse" icon="i-lucide-map" class="w-full" />
              </UFormField>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Telephone principal">
                <UInput v-model="editForm.telephone" icon="i-lucide-phone" type="tel" class="w-full" />
              </UFormField>
              <UFormField label="Email">
                <UInput v-model="editForm.email" icon="i-lucide-mail" type="email" class="w-full" />
              </UFormField>
            </div>
            <UFormField label="Telephones secondaires">
              <UTextarea v-model="editForm.telephones_secondaires" placeholder="Un numero par ligne" :rows="2" class="w-full" />
            </UFormField>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Site web">
                <UInput v-model="editForm.site_web" icon="i-lucide-globe" type="url" class="w-full" />
              </UFormField>
              <UFormField label="Niveau du site">
                <USelect v-model="editForm.niveau_site" :items="niveauSiteOptions" value-key="value" class="w-full" />
              </UFormField>
            </div>
            <UFormField label="Emails secondaires">
              <UTextarea v-model="editForm.emails_secondaires" placeholder="Un par ligne" :rows="2" class="w-full" />
            </UFormField>
          </div>
        </template>

        <!-- READ MODE -->
        <template v-else>
          <!-- Pipeline -->
          <div class="flex items-center gap-1 mb-4">
            <button
              v-for="([key, config]) in pipelineSteps"
              :key="key"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              :class="prospect.statut === key
                ? pipelineColors[key]
                : isPipelineReached(key)
                  ? 'bg-stone-200 text-stone-700'
                  : 'text-stone-400 hover:bg-stone-100'"
              @click="setStatut(key as ProspectStatut)"
            >
              <UIcon :name="config.icon" class="size-3.5" />
              {{ config.label }}
            </button>
          </div>

          <!-- Cloture motif picker -->
          <div v-if="showClotureChoice" class="flex items-center gap-2 mb-4 p-3 rounded-xl bg-red-50/60 border border-red-100">
            <span class="text-xs text-red-600 font-medium shrink-0">Motif :</span>
            <button
              v-for="(config, key) in MOTIFS_CLOTURE"
              :key="key"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-red-100 text-red-600 hover:bg-red-100 transition-colors"
              @click="clotureAvecMotif(key as MotifCloture)"
            >
              <UIcon :name="config.icon" class="size-3.5" />
              {{ config.label }}
            </button>
            <button class="ml-auto text-xs text-stone-400 hover:text-stone-600" @click="showClotureChoice = false">Annuler</button>
          </div>

          <!-- Motif affiché si cloturé -->
          <div v-if="prospect.statut === 'cloture' && prospect.motif_cloture" class="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-red-50/40 border border-red-100/60 text-xs text-red-500">
            <UIcon :name="MOTIFS_CLOTURE[prospect.motif_cloture]?.icon || 'i-lucide-x-circle'" class="size-3.5" />
            Cloture : {{ MOTIFS_CLOTURE[prospect.motif_cloture]?.label || prospect.motif_cloture }}
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Col 1: Fiche + Offres -->
            <div class="space-y-4">
              <!-- Fiche infos -->
              <div class="rounded-xl bg-white/60 shadow-sm border border-white/80 p-4 space-y-3 text-sm">
                <!-- Origine + Niveau site -->
                <div v-if="prospect.origine || prospect.niveau_site" class="flex flex-wrap gap-1.5 pb-2 border-b border-stone-100">
                  <span v-if="prospect.origine" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/8 text-primary">
                    <UIcon :name="ORIGINES_PROSPECTION[prospect.origine]?.icon || 'i-lucide-help-circle'" class="size-3" />
                    {{ ORIGINES_PROSPECTION[prospect.origine]?.label || prospect.origine }}
                  </span>
                  <span
                    v-if="prospect.niveau_site"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                    :class="{
                      'bg-stone-100 text-stone-600': prospect.niveau_site === 'pas_de_site',
                      'bg-red-100 text-red-600': prospect.niveau_site === 'site_casse',
                      'bg-orange-100 text-orange-600': prospect.niveau_site === 'site_nul',
                      'bg-amber-100 text-amber-600': prospect.niveau_site === 'site_passable'
                    }"
                  >
                    <UIcon :name="NIVEAUX_SITE[prospect.niveau_site]?.icon || 'i-lucide-globe'" class="size-3" />
                    {{ NIVEAUX_SITE[prospect.niveau_site]?.label || prospect.niveau_site }}
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <div>
                    <p class="text-[11px] text-stone-500 uppercase tracking-wide">Ville</p>
                    <p class="font-medium text-stone-800">{{ prospect.ville }}</p>
                  </div>
                  <div>
                    <p class="text-[11px] text-stone-500 uppercase tracking-wide">Secteur</p>
                    <p class="font-medium text-stone-800">{{ prospect.secteur || '-' }}</p>
                  </div>
                  <div v-if="prospect.contact_nom" class="col-span-2">
                    <p class="text-[11px] text-stone-500 uppercase tracking-wide">Contact</p>
                    <p class="font-medium text-stone-800">{{ prospect.contact_nom }}</p>
                  </div>
                </div>

                <!-- Telephones -->
                <div v-if="allPhones.length" class="border-t border-stone-100 pt-2.5">
                  <p class="text-[11px] text-stone-500 uppercase tracking-wide mb-1.5">Telephones</p>
                  <div class="flex flex-wrap gap-1.5">
                    <a
                      v-for="phone in allPhones"
                      :key="phone"
                      :href="`tel:${phone}`"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/8 text-primary hover:bg-primary/15 transition-colors tabular-nums"
                    >
                      <UIcon name="i-lucide-phone" class="size-3" />
                      {{ phone }}
                    </a>
                  </div>
                </div>

                <!-- Email -->
                <div v-if="prospect.email" class="border-t border-stone-100 pt-2.5">
                  <p class="text-[11px] text-stone-500 uppercase tracking-wide mb-0.5">Email</p>
                  <a :href="`mailto:${prospect.email}`" class="font-medium text-primary hover:underline truncate block">{{ prospect.email }}</a>
                </div>

                <div v-if="prospect.site_web" class="border-t border-stone-100 pt-2.5">
                  <p class="text-[11px] text-stone-500 uppercase tracking-wide mb-0.5">Site web</p>
                  <a :href="prospect.site_web" target="_blank" rel="noopener" class="font-medium text-primary hover:underline truncate block">{{ prospect.site_web }}</a>
                </div>

                <div v-if="prospect.adresse" class="border-t border-stone-100 pt-2.5">
                  <p class="text-[11px] text-stone-500 uppercase tracking-wide mb-0.5">Adresse</p>
                  <p class="font-medium text-stone-800">{{ prospect.adresse }}</p>
                </div>

                <div class="border-t border-stone-100 pt-2.5 grid grid-cols-2 gap-x-4">
                  <div>
                    <p class="text-[11px] text-stone-500 uppercase tracking-wide">Prospecteur</p>
                    <p class="font-medium text-stone-800">{{ getProspecteurName(prospect) }}</p>
                  </div>
                  <div>
                    <p class="text-[11px] text-stone-500 uppercase tracking-wide">Cree le</p>
                    <p class="font-medium text-stone-800">{{ formatDateFr(prospect.date_created) }}</p>
                  </div>
                </div>

              </div>

              <!-- Quick notes -->
              <div class="rounded-xl bg-white/60 shadow-sm border border-white/80 overflow-hidden">
                <div class="flex items-center justify-between px-4 py-2 border-b border-stone-100">
                  <span class="text-sm font-semibold text-stone-900">Notes</span>
                  <span v-if="savingNote" class="text-[11px] text-stone-400 flex items-center gap-1">
                    <UIcon name="i-lucide-loader-circle" class="size-3 animate-spin" />
                    Sauvegarde...
                  </span>
                  <span v-else-if="quickNote !== (prospect.notes || '')" class="text-[11px] text-stone-400">Non sauvegarde</span>
                </div>
                <textarea
                  v-model="quickNote"
                  class="w-full p-3 text-sm text-stone-700 bg-transparent resize-none outline-none placeholder:text-stone-300 min-h-[80px]"
                  placeholder="Ajouter des notes..."
                  @input="onNoteInput"
                  @blur="saveNote"
                />
              </div>

              <!-- Offres -->
              <div class="rounded-xl bg-white/60 shadow-sm border border-white/80 overflow-hidden">
                <div class="flex items-center justify-between px-4 py-2.5 border-b border-stone-100">
                  <span class="text-sm font-semibold text-stone-900">Offres</span>
                  <UButton
                    v-if="!showOffreForm"
                    icon="i-lucide-plus"
                    size="xs"
                    variant="ghost"
                    @click="showOffreForm = true"
                  />
                </div>

                <div class="p-3">
                  <!-- Inline add form -->
                  <form v-if="showOffreForm" class="space-y-2 mb-3 pb-3 border-b border-stone-100" @submit.prevent="handleAddOffre">
                    <UInput v-model="offreForm.titre" placeholder="Titre de l'offre..." size="sm" class="w-full" />
                    <div class="flex gap-2">
                      <UInput v-model.number="offreForm.montant" type="number" :min="0" placeholder="Montant" size="sm" class="flex-1" />
                      <USelect v-model="offreForm.statut" :items="offreStatutOptions" value-key="value" size="sm" class="flex-1" />
                    </div>
                    <UInput v-model="offreForm.notes" placeholder="Notes..." size="sm" class="w-full" />
                    <div class="flex justify-end gap-1.5">
                      <UButton label="Annuler" size="xs" variant="ghost" color="neutral" @click="showOffreForm = false; resetOffreForm()" />
                      <UButton type="submit" label="Ajouter" size="xs" icon="i-lucide-plus" :loading="addingOffre" />
                    </div>
                  </form>

                  <div v-if="!prospect.offres?.length && !showOffreForm" class="text-center py-4">
                    <p class="text-xs text-stone-400 mb-2">Aucune offre</p>
                    <UButton label="Ajouter" icon="i-lucide-plus" size="xs" variant="subtle" @click="showOffreForm = true" />
                  </div>

                  <div v-if="prospect.offres?.length" class="space-y-1">
                    <div
                      v-for="offre in prospect.offres"
                      :key="offre.id"
                      class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 group hover:bg-stone-50/80 transition-colors"
                    >
                      <button
                        class="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors"
                        :class="getOffreStatutColor(offre.statut)"
                        title="Cliquer pour changer le statut"
                        @click="cycleOffreStatut(offre)"
                      >
                        <UIcon :name="OFFRE_PROSPECT_STATUTS[offre.statut]?.icon || 'i-lucide-file-text'" class="size-3" />
                        {{ OFFRE_PROSPECT_STATUTS[offre.statut]?.label }}
                      </button>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-stone-800 truncate">{{ offre.titre }}</p>
                        <p class="text-[11px] text-stone-500 truncate">
                          {{ getOffreUserName(offre) }}
                          <span v-if="offre.notes" class="text-stone-400"> - {{ offre.notes }}</span>
                        </p>
                      </div>
                      <span v-if="offre.montant" class="text-sm font-semibold text-stone-700 tabular-nums shrink-0">
                        {{ offre.montant.toLocaleString('fr-FR') }}&nbsp;&euro;
                      </span>
                      <button
                        class="shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
                        @click="handleRemoveOffre(offre.id)"
                      >
                        <UIcon name="i-lucide-x" class="size-3.5 text-stone-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Col 2-3: Contacts -->
            <div class="lg:col-span-2 flex flex-col">
              <div class="rounded-xl bg-white/60 shadow-sm border border-white/80 overflow-hidden flex-1 flex flex-col">
                <div class="flex items-center justify-between px-4 py-2.5 border-b border-stone-100">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-stone-900">Contacts</span>
                    <span v-if="sortedContacts.length" class="text-xs text-stone-500 tabular-nums">{{ sortedContacts.length }}</span>
                  </div>
                  <UButton
                    v-if="!showContactForm"
                    label="Ajouter"
                    icon="i-lucide-plus"
                    size="xs"
                    @click="showContactForm = true"
                  />
                </div>

                <div class="p-4 flex-1 overflow-y-auto">
                  <!-- Inline add form -->
                  <div v-if="showContactForm" class="mb-4 pb-4 border-b border-stone-100">
                    <form class="space-y-2.5" @submit.prevent="handleAddContact">
                      <!-- Row 1: canal + resultat + date -->
                      <div class="grid grid-cols-3 gap-2">
                        <USelect v-model="contactForm.canal" :items="canalOptions" value-key="value" size="sm" />
                        <USelect v-model="contactForm.resultat" :items="resultatOptions" value-key="value" size="sm" />
                        <UInput v-model="contactForm.date_contact" type="date" size="sm" />
                      </div>

                      <!-- Row 2: phone selector (if canal = telephone) -->
                      <div v-if="contactForm.canal === 'telephone'" class="flex items-center gap-2">
                        <UIcon name="i-lucide-phone" class="size-4 text-stone-400 shrink-0" />
                        <USelect
                          v-if="phoneSelectOptions.length"
                          v-model="contactForm.selectedPhone"
                          :items="phoneSelectOptions"
                          value-key="value"
                          size="sm"
                          placeholder="Numero..."
                          class="flex-1"
                        />
                        <span v-else class="text-xs text-stone-400 flex-1">Aucun numero enregistre</span>
                        <!-- Inline add phone -->
                        <div class="flex items-center gap-1">
                          <UInput
                            v-model="newPhone"
                            placeholder="Nouveau numero..."
                            size="sm"
                            type="tel"
                            class="w-36"
                            @keydown.enter.prevent="handleAddPhone"
                          />
                          <UButton
                            icon="i-lucide-plus"
                            size="xs"
                            variant="soft"
                            :loading="addingPhone"
                            :disabled="!newPhone.trim()"
                            @click="handleAddPhone"
                          />
                        </div>
                      </div>

                      <!-- Row 3: notes + actions -->
                      <div class="flex gap-2">
                        <UInput v-model="contactForm.notes" placeholder="Notes sur l'echange..." size="sm" class="flex-1" />
                        <UButton type="submit" label="Ajouter" size="sm" icon="i-lucide-plus" :loading="addingContact" />
                        <UButton icon="i-lucide-x" size="sm" variant="ghost" color="neutral" @click="showContactForm = false; resetContactForm()" />
                      </div>
                    </form>
                  </div>

                  <div v-if="!sortedContacts.length && !showContactForm" class="text-center py-8">
                    <UIcon name="i-lucide-phone-outgoing" class="size-8 text-stone-200 mx-auto mb-2" />
                    <p class="text-sm text-stone-500 mb-3">Aucun contact enregistre</p>
                    <UButton label="Premier contact" icon="i-lucide-phone" size="xs" variant="subtle" @click="showContactForm = true" />
                  </div>

                  <div v-else class="space-y-0">
                    <div
                      v-for="(contact, index) in sortedContacts"
                      :key="contact.id"
                      class="relative flex gap-3"
                    >
                      <!-- Timeline -->
                      <div class="flex flex-col items-center shrink-0">
                        <div
                          class="flex items-center justify-center size-8 rounded-full mt-0.5"
                          :class="getResultatBg(contact.resultat)"
                        >
                          <UIcon
                            :name="CONTACT_CANAUX[contact.canal]?.icon || 'i-lucide-message-circle'"
                            class="size-4"
                            :class="getResultatIcon(contact.resultat)"
                          />
                        </div>
                        <div v-if="index < sortedContacts.length - 1" class="w-px flex-1 bg-stone-100 mt-1" />
                      </div>

                      <!-- Content -->
                      <div class="flex-1 pb-4 min-w-0">
                        <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span class="text-xs font-medium text-stone-700">
                            {{ CONTACT_CANAUX[contact.canal]?.label || contact.canal }}
                          </span>
                          <UBadge
                            :color="(CONTACT_RESULTATS[contact.resultat]?.color as any) || 'neutral'"
                            variant="subtle"
                            size="xs"
                          >
                            {{ CONTACT_RESULTATS[contact.resultat]?.label || contact.resultat }}
                          </UBadge>
                          <span class="text-[11px] text-stone-500 ml-auto shrink-0">{{ formatDateShort(contact.date_contact) }}</span>
                        </div>
                        <p v-if="contact.notes" class="text-sm text-stone-700 whitespace-pre-line">{{ contact.notes }}</p>
                        <p class="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                          <UIcon name="i-lucide-user" class="size-2.5" />
                          {{ getContactUserName(contact) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Modal suppression -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-red-100 p-2 shrink-0">
              <UIcon name="i-lucide-alert-triangle" class="size-5 text-red-600" />
            </div>
            <h3 class="text-base font-semibold text-stone-900">Supprimer ce prospect</h3>
          </div>
          <p class="text-sm text-stone-500">
            Supprimer <strong>{{ prospect?.nom_entreprise }}</strong> et tout son historique ? Irreversible.
          </p>
          <div class="flex justify-end gap-3">
            <UButton label="Annuler" color="neutral" variant="subtle" @click="showDeleteModal = false" />
            <UButton label="Supprimer" icon="i-lucide-trash-2" color="error" :loading="deleting" @click="handleDelete" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
