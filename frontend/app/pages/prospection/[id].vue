<script setup lang="ts">
import type { Prospect, ProspectStatut, ContactCanal, ContactResultat, ContactHistory } from '~/utils/types'
import { PROSPECT_STATUTS, CONTACT_CANAUX, CONTACT_RESULTATS } from '~/utils/constants'

const route = useRoute()
const { user, isProspecteur } = useAuth()
if (!isProspecteur.value) navigateTo('/prospection')

const { getById, update, addContact, remove } = useProspects()
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
    toast.add({ title: 'Prospect mis à jour', color: 'success' })
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
    toast.add({ title: 'Prospect supprimé', color: 'success' })
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
    toast.add({ title: `Contact ajouté${quotaMsg}`, color: 'success' })

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

async function setStatut(statut: ProspectStatut) {
  try {
    await update(prospectId, { statut })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
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
              <UFormField label="Téléphone">
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
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
            <!-- Left: infos -->
            <div class="space-y-4">
              <UCard>
                <div class="space-y-4">
                  <!-- Pipeline statuts -->
                  <div class="flex flex-wrap gap-1">
                    <button
                      v-for="(config, key) in PROSPECT_STATUTS"
                      :key="key"
                      class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all"
                      :class="prospect.statut === key
                        ? 'bg-stone-800 text-white font-medium'
                        : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'"
                      @click="setStatut(key as ProspectStatut)"
                    >
                      <UIcon :name="config.icon" class="size-3" />
                      {{ config.label }}
                    </button>
                  </div>

                  <!-- Info grid -->
                  <div class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm border-t border-stone-100 pt-4">
                    <div>
                      <p class="text-xs text-stone-500 mb-0.5">Ville</p>
                      <p class="font-medium text-stone-800">{{ prospect.ville }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-stone-500 mb-0.5">Secteur</p>
                      <p class="font-medium text-stone-800">{{ prospect.secteur || '—' }}</p>
                    </div>
                    <div v-if="prospect.contact_nom" class="col-span-2">
                      <p class="text-xs text-stone-500 mb-0.5">Contact</p>
                      <p class="font-medium text-stone-800">{{ prospect.contact_nom }}</p>
                    </div>
                    <div v-if="prospect.telephone">
                      <p class="text-xs text-stone-500 mb-0.5">Téléphone</p>
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
                      <p class="text-xs text-stone-500 mb-0.5">Créé le</p>
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
                  <p class="text-sm text-stone-500 mb-3">Aucun contact enregistré</p>
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

                    <!-- Contenu -->
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
                        <span class="text-[11px] text-stone-500 ml-auto">{{ formatDateShort(contact.date_contact) }}</span>
                      </div>
                      <p v-if="contact.notes" class="text-sm text-stone-700 whitespace-pre-line">{{ contact.notes }}</p>
                      <p class="text-[11px] text-stone-500 mt-0.5">{{ getContactUserName(contact) }}</p>
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
              <UFormField label="Résultat">
                <USelect v-model="contactForm.resultat" :items="resultatOptions" value-key="value" class="w-full" />
              </UFormField>
            </div>
            <UFormField label="Date">
              <UInput v-model="contactForm.date_contact" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Notes">
              <UTextarea v-model="contactForm.notes" placeholder="Détails de l'échange, résultat..." :rows="3" class="w-full" />
            </UFormField>
            <div class="flex justify-end gap-2 pt-1">
              <UButton label="Annuler" color="neutral" variant="ghost" @click="showContactModal = false" />
              <UButton type="submit" label="Ajouter" icon="i-lucide-plus" :loading="addingContact" />
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
            Supprimer <strong>{{ prospect?.nom_entreprise }}</strong> et tout son historique ? Irréversible.
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
