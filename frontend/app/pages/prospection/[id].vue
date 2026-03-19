<script setup lang="ts">
import type { Prospect, ProspectStatut, ContactCanal, ContactResultat, ContactHistory, OffreProspectStatut, ProspectOffre } from '~/utils/types'
import { PROSPECT_STATUTS, CONTACT_CANAUX, CONTACT_RESULTATS, OFFRE_PROSPECT_STATUTS } from '~/utils/constants'

const route = useRoute()
const { user, isProspecteur } = useAuth()
if (!isProspecteur.value) navigateTo('/prospection')

const { getById, update, addContact, remove, addOffre, updateOffre, removeOffre } = useProspects()
const { hasQuota, loadWeekContacts, todayContacts, objectifJour } = useProspectQuota()
const toast = useToast()

const prospectId = route.params.id as string
const { data: prospect, status, refresh } = useAsyncData(`prospect-${prospectId}`, () => getById(prospectId))

// --- Edit ---
const editing = ref(false)
const saving = ref(false)

const editForm = reactive({
  nom_entreprise: '',
  ville: '',
  secteur: '',
  adresse: '',
  telephone: '',
  email: '',
  emails_secondaires: '',
  site_web: '',
  contact_nom: '',
  notes: '',
  statut: 'a_contacter' as ProspectStatut
})

const statutOptions = Object.entries(PROSPECT_STATUTS).map(([value, config]) => ({ label: config.label, value }))

function startEditing() {
  if (!prospect.value) return
  const p = prospect.value
  Object.assign(editForm, {
    nom_entreprise: p.nom_entreprise,
    ville: p.ville,
    secteur: p.secteur || '',
    adresse: p.adresse || '',
    telephone: p.telephone || '',
    email: p.email || '',
    emails_secondaires: p.emails_secondaires || '',
    site_web: p.site_web || '',
    contact_nom: p.contact_nom || '',
    notes: p.notes || '',
    statut: p.statut
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
      email: editForm.email.trim() || null,
      emails_secondaires: editForm.emails_secondaires.trim() || null,
      site_web: editForm.site_web.trim() || null,
      contact_nom: editForm.contact_nom.trim() || null,
      notes: editForm.notes.trim() || null,
      statut: editForm.statut
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

// --- Contacts ---
const showContactModal = ref(false)
const addingContact = ref(false)

const contactForm = reactive({
  canal: 'telephone' as ContactCanal,
  resultat: 'attente' as ContactResultat,
  date_contact: new Date().toISOString().split('T')[0],
  notes: ''
})

const canalOptions = Object.entries(CONTACT_CANAUX).map(([value, config]) => ({ label: config.label, value }))
const resultatOptions = Object.entries(CONTACT_RESULTATS).map(([value, config]) => ({ label: config.label, value }))

const sortedContacts = computed(() => {
  if (!prospect.value?.historique_contacts) return []
  return [...prospect.value.historique_contacts].sort(
    (a, b) => new Date(b.date_contact).getTime() - new Date(a.date_contact).getTime()
  )
})

async function handleAddContact() {
  if (!user.value) return
  addingContact.value = true
  try {
    await addContact({
      prospect: prospectId,
      canal: contactForm.canal,
      resultat: contactForm.resultat,
      date_contact: contactForm.date_contact,
      notes: contactForm.notes.trim(),
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

    showContactModal.value = false
    contactForm.canal = 'telephone'
    contactForm.resultat = 'attente'
    contactForm.date_contact = new Date().toISOString().split('T')[0]
    contactForm.notes = ''
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    addingContact.value = false
  }
}

// --- Offres ---
const showOffreModal = ref(false)
const addingOffre = ref(false)

const offreForm = reactive({
  titre: '',
  montant: null as number | null,
  statut: 'a_proposer' as OffreProspectStatut,
  notes: ''
})

const offreStatutOptions = Object.entries(OFFRE_PROSPECT_STATUTS).map(([value, config]) => ({ label: config.label, value }))

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
    showOffreModal.value = false
    offreForm.titre = ''
    offreForm.montant = null
    offreForm.statut = 'a_proposer'
    offreForm.notes = ''
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
async function setStatut(statut: ProspectStatut) {
  try {
    await update(prospectId, { statut })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

const pipelineSteps = Object.entries(PROSPECT_STATUTS) as [string, typeof PROSPECT_STATUTS[keyof typeof PROSPECT_STATUTS]][]

const pipelineColors: Record<string, { active: string, dot: string }> = {
  a_contacter: { active: 'bg-stone-600 text-white', dot: 'bg-stone-400' },
  premier_contact: { active: 'bg-blue-600 text-white', dot: 'bg-blue-400' },
  en_discussion: { active: 'bg-amber-500 text-white', dot: 'bg-amber-400' },
  client: { active: 'bg-emerald-600 text-white', dot: 'bg-emerald-400' },
  cloture: { active: 'bg-red-500 text-white', dot: 'bg-red-400' }
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
            <UFormField label="Nom" required>
              <UInput v-model="editForm.nom_entreprise" icon="i-lucide-building-2" class="w-full" />
            </UFormField>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Ville" required>
                <UInput v-model="editForm.ville" icon="i-lucide-map-pin" class="w-full" />
              </UFormField>
              <UFormField label="Statut">
                <USelect v-model="editForm.statut" :items="statutOptions" value-key="value" class="w-full" />
              </UFormField>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Contact">
                <UInput v-model="editForm.contact_nom" icon="i-lucide-user" class="w-full" />
              </UFormField>
              <UFormField label="Secteur">
                <UInput v-model="editForm.secteur" icon="i-lucide-briefcase" class="w-full" />
              </UFormField>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Telephone">
                <UInput v-model="editForm.telephone" icon="i-lucide-phone" type="tel" class="w-full" />
              </UFormField>
              <UFormField label="Email">
                <UInput v-model="editForm.email" icon="i-lucide-mail" type="email" class="w-full" />
              </UFormField>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Site web">
                <UInput v-model="editForm.site_web" icon="i-lucide-globe" type="url" class="w-full" />
              </UFormField>
              <UFormField label="Adresse">
                <UInput v-model="editForm.adresse" icon="i-lucide-map" class="w-full" />
              </UFormField>
            </div>
            <UFormField label="Emails secondaires">
              <UTextarea v-model="editForm.emails_secondaires" placeholder="Un par ligne" :rows="2" class="w-full" />
            </UFormField>
            <UFormField label="Notes">
              <UTextarea v-model="editForm.notes" :rows="4" class="w-full" />
            </UFormField>
          </div>
        </template>

        <!-- READ MODE -->
        <template v-else>
          <!-- Pipeline - full width -->
          <div class="flex items-center gap-1 mb-5 max-w-5xl">
            <button
              v-for="([key, config], index) in pipelineSteps"
              :key="key"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all relative"
              :class="prospect.statut === key
                ? pipelineColors[key].active
                : isPipelineReached(key)
                  ? 'bg-stone-200 text-stone-700'
                  : 'text-stone-400 hover:bg-stone-100'"
              @click="setStatut(key as ProspectStatut)"
            >
              <UIcon :name="config.icon" class="size-3.5" />
              {{ config.label }}
            </button>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
            <!-- Left: infos + offres -->
            <div class="space-y-4">
              <!-- Infos -->
              <UCard>
                <div class="space-y-4">
                  <!-- Info grid -->
                  <div class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <p class="text-xs text-stone-500 mb-0.5">Ville</p>
                      <p class="font-medium text-stone-800">{{ prospect.ville }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-stone-500 mb-0.5">Secteur</p>
                      <p class="font-medium text-stone-800">{{ prospect.secteur || '-' }}</p>
                    </div>
                    <div v-if="prospect.contact_nom" class="col-span-2">
                      <p class="text-xs text-stone-500 mb-0.5">Contact</p>
                      <p class="font-medium text-stone-800">{{ prospect.contact_nom }}</p>
                    </div>
                    <div v-if="prospect.telephone">
                      <p class="text-xs text-stone-500 mb-0.5">Telephone</p>
                      <a :href="`tel:${prospect.telephone}`" class="font-medium text-primary hover:underline text-sm">{{ prospect.telephone }}</a>
                    </div>
                    <div v-if="prospect.email">
                      <p class="text-xs text-stone-500 mb-0.5">Email</p>
                      <a :href="`mailto:${prospect.email}`" class="font-medium text-primary hover:underline truncate block text-sm">{{ prospect.email }}</a>
                    </div>
                    <div v-if="prospect.site_web" class="col-span-2">
                      <p class="text-xs text-stone-500 mb-0.5">Site web</p>
                      <a :href="prospect.site_web" target="_blank" rel="noopener" class="font-medium text-primary hover:underline truncate block text-sm">{{ prospect.site_web }}</a>
                    </div>
                    <div v-if="prospect.adresse" class="col-span-2">
                      <p class="text-xs text-stone-500 mb-0.5">Adresse</p>
                      <p class="font-medium text-stone-800 text-sm">{{ prospect.adresse }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-stone-500 mb-0.5">Prospecteur</p>
                      <p class="font-medium text-stone-800 text-sm">{{ getProspecteurName(prospect) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-stone-500 mb-0.5">Cree le</p>
                      <p class="font-medium text-stone-800 text-sm">{{ formatDateFr(prospect.date_created) }}</p>
                    </div>
                  </div>

                  <!-- Notes -->
                  <div v-if="prospect.notes" class="border-t border-stone-100 pt-3">
                    <p class="text-xs text-stone-500 mb-1.5">Notes</p>
                    <p class="text-sm text-stone-700 whitespace-pre-line">{{ prospect.notes }}</p>
                  </div>

                  <!-- Emails secondaires -->
                  <div v-if="prospect.emails_secondaires" class="border-t border-stone-100 pt-3">
                    <p class="text-xs text-stone-500 mb-1.5">Emails secondaires</p>
                    <p class="text-xs text-stone-600 whitespace-pre-line">{{ prospect.emails_secondaires }}</p>
                  </div>
                </div>
              </UCard>

              <!-- Offres -->
              <UCard>
                <template #header>
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-semibold text-stone-900">Offres</span>
                    <UButton label="Ajouter" icon="i-lucide-plus" size="xs" @click="showOffreModal = true" />
                  </div>
                </template>

                <div v-if="!prospect.offres?.length" class="text-center py-6">
                  <UIcon name="i-lucide-file-text" class="size-7 text-stone-200 mx-auto mb-2" />
                  <p class="text-sm text-stone-500 mb-3">Aucune offre</p>
                  <UButton label="Ajouter une offre" icon="i-lucide-plus" size="xs" variant="subtle" @click="showOffreModal = true" />
                </div>

                <div v-else class="space-y-2">
                  <div
                    v-for="offre in prospect.offres"
                    :key="offre.id"
                    class="flex items-center gap-3 rounded-lg border border-stone-100 px-3 py-2.5 group"
                  >
                    <!-- Status pill (cliquable pour cycler) -->
                    <button
                      class="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors"
                      :class="getOffreStatutColor(offre.statut)"
                      :title="`Cliquer pour changer le statut (actuel : ${OFFRE_PROSPECT_STATUTS[offre.statut]?.label})`"
                      @click="cycleOffreStatut(offre)"
                    >
                      <UIcon :name="OFFRE_PROSPECT_STATUTS[offre.statut]?.icon || 'i-lucide-file-text'" class="size-3" />
                      {{ OFFRE_PROSPECT_STATUTS[offre.statut]?.label }}
                    </button>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-stone-800 truncate">{{ offre.titre }}</p>
                      <p class="text-[11px] text-stone-500">
                        {{ getOffreUserName(offre) }}
                        <span v-if="offre.notes" class="ml-1 text-stone-400">- {{ offre.notes }}</span>
                      </p>
                    </div>

                    <!-- Amount -->
                    <span v-if="offre.montant" class="text-sm font-semibold text-stone-700 tabular-nums shrink-0">
                      {{ offre.montant.toLocaleString('fr-FR') }} &euro;
                    </span>

                    <!-- Delete -->
                    <button
                      class="shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                      @click="handleRemoveOffre(offre.id)"
                    >
                      <UIcon name="i-lucide-x" class="size-3.5 text-stone-400" />
                    </button>
                  </div>
                </div>
              </UCard>
            </div>

            <!-- Right: historique contacts -->
            <div>
              <UCard>
                <template #header>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-semibold text-stone-900">Contacts</span>
                      <span v-if="sortedContacts.length" class="text-xs text-stone-500 tabular-nums">{{ sortedContacts.length }}</span>
                    </div>
                    <UButton label="Ajouter" icon="i-lucide-plus" size="xs" @click="showContactModal = true" />
                  </div>
                </template>

                <div v-if="!sortedContacts.length" class="text-center py-8">
                  <UIcon name="i-lucide-phone-outgoing" class="size-8 text-stone-200 mx-auto mb-2" />
                  <p class="text-sm text-stone-500 mb-3">Aucun contact enregistre</p>
                  <UButton label="Premier contact" icon="i-lucide-phone" size="xs" variant="subtle" @click="showContactModal = true" />
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
              </UCard>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Modal ajout contact -->
    <UModal :open="showContactModal" @update:open="showContactModal = $event">
      <template #content>
        <div class="p-6">
          <h3 class="text-base font-semibold text-stone-900 mb-4">Enregistrer un contact</h3>
          <form class="space-y-4" @submit.prevent="handleAddContact">
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Canal">
                <USelect v-model="contactForm.canal" :items="canalOptions" value-key="value" class="w-full" />
              </UFormField>
              <UFormField label="Resultat">
                <USelect v-model="contactForm.resultat" :items="resultatOptions" value-key="value" class="w-full" />
              </UFormField>
            </div>
            <UFormField label="Date">
              <UInput v-model="contactForm.date_contact" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Notes">
              <UTextarea v-model="contactForm.notes" placeholder="Details de l'echange, resultat..." :rows="3" class="w-full" />
            </UFormField>
            <div class="flex justify-end gap-2 pt-1">
              <UButton label="Annuler" color="neutral" variant="ghost" @click="showContactModal = false" />
              <UButton type="submit" label="Ajouter" icon="i-lucide-plus" :loading="addingContact" />
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <!-- Modal ajout offre -->
    <UModal :open="showOffreModal" @update:open="showOffreModal = $event">
      <template #content>
        <div class="p-6">
          <h3 class="text-base font-semibold text-stone-900 mb-4">Ajouter une offre</h3>
          <form class="space-y-4" @submit.prevent="handleAddOffre">
            <UFormField label="Titre" required>
              <UInput v-model="offreForm.titre" placeholder="Ex: Site vitrine, Maintenance, ..." icon="i-lucide-file-text" class="w-full" />
            </UFormField>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Montant (EUR)">
                <UInput v-model.number="offreForm.montant" type="number" :min="0" placeholder="Ex: 2500" icon="i-lucide-euro" class="w-full" />
              </UFormField>
              <UFormField label="Statut">
                <USelect v-model="offreForm.statut" :items="offreStatutOptions" value-key="value" class="w-full" />
              </UFormField>
            </div>
            <UFormField label="Notes">
              <UTextarea v-model="offreForm.notes" placeholder="Details, conditions..." :rows="2" class="w-full" />
            </UFormField>
            <div class="flex justify-end gap-2 pt-1">
              <UButton label="Annuler" color="neutral" variant="ghost" @click="showOffreModal = false" />
              <UButton type="submit" label="Ajouter" icon="i-lucide-plus" :loading="addingOffre" />
            </div>
          </form>
        </div>
      </template>
    </UModal>

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
