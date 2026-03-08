<script setup lang="ts">
import type { Prospect, ProspectStatut, ContactCanal, ContactResultat, ContactHistory } from '~/utils/types'
import { PROSPECT_STATUTS, CONTACT_CANAUX, CONTACT_RESULTATS, VILLES_FRANCE } from '~/utils/constants'

const route = useRoute()
const { user } = useAuth()
const { getById, update, addContact, remove } = useProspects()
const toast = useToast()

const prospectId = route.params.id as string

const { data: prospect, status, refresh } = useAsyncData(`prospect-${prospectId}`, () => getById(prospectId))

// --- Editing ---
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
const villeOptions = VILLES_FRANCE.map(v => ({ label: v, value: v }))

function startEditing() {
  if (!prospect.value) return
  const p = prospect.value
  editForm.nom_entreprise = p.nom_entreprise
  editForm.ville = p.ville
  editForm.secteur = p.secteur || ''
  editForm.adresse = p.adresse || ''
  editForm.telephone = p.telephone || ''
  editForm.email = p.email || ''
  editForm.emails_secondaires = p.emails_secondaires || ''
  editForm.site_web = p.site_web || ''
  editForm.contact_nom = p.contact_nom || ''
  editForm.notes = p.notes || ''
  editForm.statut = p.statut
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

// --- Contact history ---
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

    // Update nb_contacts and maybe statut
    const newNb = (prospect.value?.nb_contacts || 0) + 1
    const updates: Partial<Prospect> = { nb_contacts: newNb }

    // Auto-advance statut on first contact
    if (prospect.value?.statut === 'a_contacter') {
      updates.statut = 'premier_contact'
    }
    // Positif → en_discussion
    if (contactForm.resultat === 'positif' && prospect.value?.statut === 'premier_contact') {
      updates.statut = 'en_discussion'
    }

    await update(prospectId, updates)

    toast.add({ title: 'Contact ajoute', color: 'success' })
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

// --- Quick status ---
async function setStatut(statut: ProspectStatut) {
  try {
    await update(prospectId, { statut })
    toast.add({ title: `Statut: ${PROSPECT_STATUTS[statut].label}`, color: 'success' })
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
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <div v-else-if="prospect" class="max-w-3xl space-y-6">
        <!-- ===== READ MODE ===== -->
        <template v-if="!editing">
          <!-- Header card -->
          <UCard>
            <div class="space-y-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <h2 class="text-xl font-bold text-stone-900 dark:text-white">{{ prospect.nom_entreprise }}</h2>
                    <UBadge :color="(PROSPECT_STATUTS[prospect.statut]?.color as any)" variant="subtle">
                      {{ PROSPECT_STATUTS[prospect.statut]?.label }}
                    </UBadge>
                  </div>
                  <p v-if="prospect.contact_nom" class="text-sm text-stone-500 dark:text-stone-400">
                    Contact : {{ prospect.contact_nom }}
                  </p>
                </div>
                <div class="text-right text-xs text-stone-400 dark:text-stone-500 shrink-0">
                  <p>{{ prospect.nb_contacts || 0 }} contact{{ (prospect.nb_contacts || 0) > 1 ? 's' : '' }}</p>
                  <p>Par {{ getProspecteurName(prospect) }}</p>
                </div>
              </div>

              <!-- Quick statut buttons -->
              <div class="flex flex-wrap gap-1.5">
                <UButton
                  v-for="(config, key) in PROSPECT_STATUTS"
                  :key="key"
                  :label="config.label"
                  :icon="config.icon"
                  size="xs"
                  :variant="prospect.statut === key ? 'solid' : 'ghost'"
                  :color="prospect.statut === key ? (config.color as any) : 'neutral'"
                  @click="setStatut(key as ProspectStatut)"
                />
              </div>

              <!-- Info grid -->
              <div class="grid grid-cols-2 gap-3 text-sm pt-3 border-t border-stone-100 dark:border-stone-800">
                <div>
                  <span class="text-xs text-stone-400 dark:text-stone-500">Ville</span>
                  <p class="font-medium text-stone-800 dark:text-stone-200">{{ prospect.ville }}</p>
                </div>
                <div>
                  <span class="text-xs text-stone-400 dark:text-stone-500">Secteur</span>
                  <p class="font-medium text-stone-800 dark:text-stone-200">{{ prospect.secteur || '-' }}</p>
                </div>
                <div>
                  <span class="text-xs text-stone-400 dark:text-stone-500">Telephone</span>
                  <p class="font-medium text-stone-800 dark:text-stone-200">
                    <a v-if="prospect.telephone" :href="`tel:${prospect.telephone}`" class="text-primary hover:underline">{{ prospect.telephone }}</a>
                    <span v-else>-</span>
                  </p>
                </div>
                <div>
                  <span class="text-xs text-stone-400 dark:text-stone-500">Email</span>
                  <p class="font-medium text-stone-800 dark:text-stone-200">
                    <a v-if="prospect.email" :href="`mailto:${prospect.email}`" class="text-primary hover:underline">{{ prospect.email }}</a>
                    <span v-else>-</span>
                  </p>
                </div>
                <div v-if="prospect.emails_secondaires">
                  <span class="text-xs text-stone-400 dark:text-stone-500">Emails secondaires</span>
                  <p class="font-medium text-stone-800 dark:text-stone-200 whitespace-pre-line text-xs">{{ prospect.emails_secondaires }}</p>
                </div>
                <div>
                  <span class="text-xs text-stone-400 dark:text-stone-500">Site web</span>
                  <p class="font-medium text-stone-800 dark:text-stone-200">
                    <a v-if="prospect.site_web" :href="prospect.site_web" target="_blank" class="text-primary hover:underline">{{ prospect.site_web }}</a>
                    <span v-else>-</span>
                  </p>
                </div>
                <div>
                  <span class="text-xs text-stone-400 dark:text-stone-500">Adresse</span>
                  <p class="font-medium text-stone-800 dark:text-stone-200">{{ prospect.adresse || '-' }}</p>
                </div>
                <div>
                  <span class="text-xs text-stone-400 dark:text-stone-500">Cree le</span>
                  <p class="font-medium text-stone-800 dark:text-stone-200">{{ formatDateFr(prospect.date_created) }}</p>
                </div>
              </div>

              <div v-if="prospect.notes" class="pt-3 border-t border-stone-100 dark:border-stone-800">
                <span class="text-xs text-stone-400 dark:text-stone-500">Notes</span>
                <p class="mt-1 text-sm text-stone-700 dark:text-stone-300 whitespace-pre-line">{{ prospect.notes }}</p>
              </div>
            </div>
          </UCard>

          <!-- Contact history -->
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-stone-900 dark:text-white">
                  Historique des contacts
                  <span v-if="sortedContacts.length" class="text-stone-400 font-normal">({{ sortedContacts.length }})</span>
                </h3>
                <UButton
                  label="Ajouter un contact"
                  icon="i-lucide-plus"
                  size="xs"
                  @click="showContactModal = true"
                />
              </div>
            </template>

            <div v-if="!sortedContacts.length" class="text-center py-6">
              <UIcon name="i-lucide-message-circle" class="size-8 text-stone-300 dark:text-stone-700 mx-auto mb-2" />
              <p class="text-sm text-stone-500 dark:text-stone-400">Aucun contact enregistre</p>
              <UButton
                label="Premier contact"
                icon="i-lucide-phone"
                size="xs"
                variant="subtle"
                class="mt-3"
                @click="showContactModal = true"
              />
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="(contact, index) in sortedContacts"
                :key="contact.id"
                class="relative flex gap-3"
              >
                <!-- Timeline -->
                <div class="flex flex-col items-center">
                  <div
                    class="flex items-center justify-center size-8 rounded-full shrink-0"
                    :class="CONTACT_RESULTATS[contact.resultat]?.color === 'green'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : CONTACT_RESULTATS[contact.resultat]?.color === 'red'
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : CONTACT_RESULTATS[contact.resultat]?.color === 'orange'
                          ? 'bg-orange-100 dark:bg-orange-900/30'
                          : 'bg-stone-100 dark:bg-stone-800'"
                  >
                    <UIcon
                      :name="CONTACT_CANAUX[contact.canal]?.icon || 'i-lucide-message-circle'"
                      class="size-4"
                      :class="CONTACT_RESULTATS[contact.resultat]?.color === 'green'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : CONTACT_RESULTATS[contact.resultat]?.color === 'red'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-stone-500 dark:text-stone-400'"
                    />
                  </div>
                  <div
                    v-if="index < sortedContacts.length - 1"
                    class="w-px flex-1 bg-stone-200 dark:bg-stone-700 mt-1"
                  />
                </div>

                <!-- Content -->
                <div class="flex-1 pb-4 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <UBadge :color="(CONTACT_CANAUX[contact.canal]?.icon ? 'neutral' : 'neutral') as any" variant="subtle" size="xs">
                      {{ CONTACT_CANAUX[contact.canal]?.label || contact.canal }}
                    </UBadge>
                    <UBadge :color="(CONTACT_RESULTATS[contact.resultat]?.color as any) || 'neutral'" variant="subtle" size="xs">
                      {{ CONTACT_RESULTATS[contact.resultat]?.label || contact.resultat }}
                    </UBadge>
                    <span class="text-[11px] text-stone-400 dark:text-stone-500">
                      {{ formatDateShort(contact.date_contact) }}
                    </span>
                  </div>
                  <p v-if="contact.notes" class="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-line">
                    {{ contact.notes }}
                  </p>
                  <p class="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
                    Par {{ getContactUserName(contact) }}
                  </p>
                </div>
              </div>
            </div>
          </UCard>
        </template>

        <!-- ===== EDIT MODE ===== -->
        <template v-else>
          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Modifier le prospect</h3>
            </template>
            <form class="space-y-4" @submit.prevent="saveChanges">
              <UFormField label="Nom (entreprise ou personne)" required>
                <UInput v-model="editForm.nom_entreprise" icon="i-lucide-building-2" class="w-full" />
              </UFormField>

              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Ville" required>
                  <UInput v-model="editForm.ville" icon="i-lucide-map-pin" class="w-full" />
                </UFormField>
                <UFormField label="Statut">
                  <USelect v-model="editForm.statut" :items="statutOptions" value-key="value" class="w-full" />
                </UFormField>
              </div>

              <UFormField label="Nom du contact">
                <UInput v-model="editForm.contact_nom" icon="i-lucide-user" class="w-full" />
              </UFormField>

              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Secteur">
                  <UInput v-model="editForm.secteur" icon="i-lucide-briefcase" class="w-full" />
                </UFormField>
                <UFormField label="Site web">
                  <UInput v-model="editForm.site_web" icon="i-lucide-globe" type="url" class="w-full" />
                </UFormField>
              </div>

              <UFormField label="Adresse">
                <UInput v-model="editForm.adresse" icon="i-lucide-map-pin" class="w-full" />
              </UFormField>

              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Telephone">
                  <UInput v-model="editForm.telephone" icon="i-lucide-phone" type="tel" class="w-full" />
                </UFormField>
                <UFormField label="Email">
                  <UInput v-model="editForm.email" icon="i-lucide-mail" type="email" class="w-full" />
                </UFormField>
              </div>

              <UFormField label="Emails secondaires">
                <UTextarea v-model="editForm.emails_secondaires" placeholder="Un par ligne" :rows="2" class="w-full" />
              </UFormField>

              <UFormField label="Notes">
                <UTextarea v-model="editForm.notes" :rows="4" class="w-full" />
              </UFormField>
            </form>
          </UCard>
        </template>
      </div>

      <!-- Not found -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-search-x" class="size-10 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
        <p class="text-stone-500 dark:text-stone-400">Prospect introuvable</p>
        <UButton label="Retour" icon="i-lucide-arrow-left" variant="subtle" class="mt-4" to="/prospection" />
      </div>
    </div>

    <!-- Add contact modal -->
    <UModal :open="showContactModal" @update:open="showContactModal = $event">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-stone-900 dark:text-white mb-4">
            Enregistrer un contact
          </h3>
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

            <div class="flex justify-end gap-2 pt-2">
              <UButton label="Annuler" color="neutral" variant="ghost" @click="showContactModal = false" />
              <UButton type="submit" label="Ajouter" icon="i-lucide-plus" :loading="addingContact" />
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <!-- Delete modal -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-red-100 dark:bg-red-900/30 p-2">
              <UIcon name="i-lucide-alert-triangle" class="size-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 class="text-lg font-semibold text-stone-900 dark:text-white">Supprimer ce prospect</h3>
          </div>
          <p class="text-sm text-stone-500 dark:text-stone-400">
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
