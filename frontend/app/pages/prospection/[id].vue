<script setup lang="ts">
import type { Prospect, ProspectStatut, ContactCanal, ContactHistory, UserProfile } from '~/utils/types'

const route = useRoute()
const { user } = useAuth()
const { getById, update, addContact } = useProspects()
const toast = useToast()

const prospectId = route.params.id as string

const { data: prospect, status, refresh } = useAsyncData(`prospect-${prospectId}`, () => getById(prospectId))

// --- Editing ---
const editing = ref(false)
const saving = ref(false)

const editForm = reactive({
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

function startEditing() {
  if (!prospect.value) return
  editForm.nom_entreprise = prospect.value.nom_entreprise
  editForm.secteur = prospect.value.secteur || ''
  editForm.adresse = prospect.value.adresse || ''
  editForm.telephone = prospect.value.telephone || ''
  editForm.email = prospect.value.email || ''
  editForm.site_web = prospect.value.site_web || ''
  editForm.date_premier_contact = prospect.value.date_premier_contact
  editForm.notes = prospect.value.notes || ''
  editForm.statut = prospect.value.statut
  editing.value = true
}

function cancelEditing() {
  editing.value = false
}

const isEditValid = computed(() => {
  return editForm.nom_entreprise.trim() !== '' && editForm.date_premier_contact !== ''
})

async function saveChanges() {
  if (!isEditValid.value) return
  saving.value = true
  try {
    await update(prospectId, {
      nom_entreprise: editForm.nom_entreprise.trim(),
      secteur: editForm.secteur.trim() || null,
      adresse: editForm.adresse.trim() || null,
      telephone: editForm.telephone.trim() || null,
      email: editForm.email.trim() || null,
      site_web: editForm.site_web.trim() || null,
      date_premier_contact: editForm.date_premier_contact,
      notes: editForm.notes.trim() || null,
      statut: editForm.statut
    })
    toast.add({ title: 'Prospect mis a jour', color: 'success' })
    editing.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la mise a jour', color: 'error' })
  } finally {
    saving.value = false
  }
}

// --- Contact history ---
const showContactModal = ref(false)
const addingContact = ref(false)

const contactForm = reactive({
  canal: 'email' as ContactCanal,
  date_contact: new Date().toISOString().split('T')[0],
  notes: ''
})

const canalOptions = Object.entries(CONTACT_CANAUX).map(([value, config]) => ({
  label: config.label,
  value
}))

const sortedContacts = computed(() => {
  if (!prospect.value?.historique_contacts) return []
  return [...prospect.value.historique_contacts].sort(
    (a, b) => new Date(b.date_contact).getTime() - new Date(a.date_contact).getTime()
  )
})

const isContactValid = computed(() => {
  return contactForm.date_contact !== '' && contactForm.notes.trim() !== ''
})

async function handleAddContact() {
  if (!isContactValid.value || !user.value) return
  addingContact.value = true
  try {
    await addContact({
      prospect: prospectId,
      canal: contactForm.canal,
      date_contact: contactForm.date_contact,
      notes: contactForm.notes.trim(),
      contacte_par: user.value.id
    })
    toast.add({ title: 'Contact ajoute', color: 'success' })
    showContactModal.value = false
    contactForm.canal = 'email'
    contactForm.date_contact = new Date().toISOString().split('T')[0]
    contactForm.notes = ''
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de l\'ajout du contact', color: 'error' })
  } finally {
    addingContact.value = false
  }
}

// --- Helpers ---
function getProspecteurName(p: Prospect): string {
  if (!p.prospecteur || typeof p.prospecteur === 'string') return '-'
  const { first_name, last_name } = p.prospecteur
  return [first_name, last_name].filter(Boolean).join(' ') || '-'
}

function getContactUserName(contact: ContactHistory): string {
  if (!contact.contacte_par || typeof contact.contacte_par === 'string') return '-'
  const { first_name, last_name } = contact.contacte_par
  return [first_name, last_name].filter(Boolean).join(' ') || '-'
}

function formatDateFr(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader :title="prospect?.nom_entreprise || 'Prospect'">
      <template #right>
        <div class="flex items-center gap-2">
          <UButton
            v-if="!editing"
            label="Modifier"
            icon="i-lucide-pencil"
            variant="subtle"
            @click="startEditing"
          />
          <UButton
            label="Retour"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/prospection"
          />
        </div>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <div v-else-if="prospect" class="max-w-3xl space-y-6">
        <!-- Info card: read mode -->
        <UCard v-if="!editing">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ prospect.nom_entreprise }}
                </h2>
                <UBadge
                  :color="PROSPECT_STATUTS[prospect.statut]?.color"
                  variant="subtle"
                >
                  {{ PROSPECT_STATUTS[prospect.statut]?.label }}
                </UBadge>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Secteur</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ prospect.secteur || '-' }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Prospecteur</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ getProspecteurName(prospect) }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Telephone</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ prospect.telephone || '-' }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Email</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ prospect.email || '-' }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Adresse</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ prospect.adresse || '-' }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Site web</span>
              <p class="font-medium text-gray-900 dark:text-white">
                <a
                  v-if="prospect.site_web"
                  :href="prospect.site_web"
                  target="_blank"
                  class="text-primary hover:underline"
                >
                  {{ prospect.site_web }}
                </a>
                <span v-else>-</span>
              </p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Premier contact</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ formatDateFr(prospect.date_premier_contact) }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Date de creation</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ formatDateFr(prospect.date_created) }}</p>
            </div>
          </div>

          <div v-if="prospect.notes" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span class="text-sm text-gray-500 dark:text-gray-400">Notes</span>
            <p class="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{{ prospect.notes }}</p>
          </div>
        </UCard>

        <!-- Info card: edit mode -->
        <UCard v-else>
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Modifier le prospect
            </h3>
          </template>

          <form @submit.prevent="saveChanges" class="space-y-4">
            <UFormField label="Nom de l'entreprise" required>
              <UInput
                v-model="editForm.nom_entreprise"
                placeholder="Nom de l'entreprise"
                icon="i-lucide-building-2"
                required
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Secteur d'activite">
                <UInput
                  v-model="editForm.secteur"
                  placeholder="Secteur"
                  icon="i-lucide-briefcase"
                />
              </UFormField>

              <UFormField label="Statut">
                <USelectMenu
                  v-model="editForm.statut"
                  :items="statutOptions"
                  value-key="value"
                />
              </UFormField>
            </div>

            <UFormField label="Adresse">
              <UInput
                v-model="editForm.adresse"
                placeholder="Adresse"
                icon="i-lucide-map-pin"
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Telephone">
                <UInput
                  v-model="editForm.telephone"
                  placeholder="Telephone"
                  icon="i-lucide-phone"
                  type="tel"
                />
              </UFormField>

              <UFormField label="Email">
                <UInput
                  v-model="editForm.email"
                  placeholder="Email"
                  icon="i-lucide-mail"
                  type="email"
                />
              </UFormField>
            </div>

            <UFormField label="Site web">
              <UInput
                v-model="editForm.site_web"
                placeholder="https://..."
                icon="i-lucide-globe"
                type="url"
              />
            </UFormField>

            <UFormField label="Date du premier contact" required>
              <UInput
                v-model="editForm.date_premier_contact"
                type="date"
                required
              />
            </UFormField>

            <UFormField label="Notes">
              <UTextarea
                v-model="editForm.notes"
                placeholder="Notes..."
                :rows="4"
              />
            </UFormField>

            <USeparator />

            <div class="flex justify-end gap-2">
              <UButton
                label="Annuler"
                color="neutral"
                variant="ghost"
                @click="cancelEditing"
              />
              <UButton
                type="submit"
                label="Enregistrer"
                icon="i-lucide-check"
                :loading="saving"
                :disabled="!isEditValid"
              />
            </div>
          </form>
        </UCard>

        <!-- Contact history -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Historique des contacts
              </h3>
              <UButton
                label="Ajouter un contact"
                icon="i-lucide-plus"
                size="sm"
                @click="showContactModal = true"
              />
            </div>
          </template>

          <div v-if="!sortedContacts.length" class="text-center py-6">
            <UIcon name="i-lucide-message-circle" class="size-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
            <p class="text-sm text-gray-500 dark:text-gray-400">Aucun contact enregistre</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(contact, index) in sortedContacts"
              :key="contact.id"
              class="relative flex gap-4"
            >
              <!-- Timeline line -->
              <div class="flex flex-col items-center">
                <div class="flex items-center justify-center size-8 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0">
                  <UIcon
                    :name="CONTACT_CANAUX[contact.canal]?.icon || 'i-lucide-message-circle'"
                    class="size-4 text-gray-600 dark:text-gray-400"
                  />
                </div>
                <div
                  v-if="index < sortedContacts.length - 1"
                  class="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1"
                />
              </div>

              <!-- Contact content -->
              <div class="flex-1 pb-4">
                <div class="flex items-center gap-2 mb-1">
                  <UBadge variant="subtle" size="xs">
                    {{ CONTACT_CANAUX[contact.canal]?.label || contact.canal }}
                  </UBadge>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDateFr(contact.date_contact) }}
                  </span>
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {{ contact.notes }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Par {{ getContactUserName(contact) }}
                </p>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Not found -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-search-x" class="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p class="text-gray-500 dark:text-gray-400">Prospect introuvable</p>
        <UButton
          label="Retour a la liste"
          icon="i-lucide-arrow-left"
          variant="subtle"
          class="mt-4"
          to="/prospection"
        />
      </div>
    </div>

    <!-- Add contact modal -->
    <UModal :open="showContactModal" @update:open="showContactModal = $event">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ajouter un contact
          </h3>

          <form @submit.prevent="handleAddContact" class="space-y-4">
            <UFormField label="Canal de contact">
              <USelectMenu
                v-model="contactForm.canal"
                :items="canalOptions"
                value-key="value"
              />
            </UFormField>

            <UFormField label="Date du contact">
              <UInput
                v-model="contactForm.date_contact"
                type="date"
                required
              />
            </UFormField>

            <UFormField label="Notes" required>
              <UTextarea
                v-model="contactForm.notes"
                placeholder="Details de l'echange..."
                :rows="4"
                required
              />
            </UFormField>

            <div class="flex justify-end gap-2 pt-2">
              <UButton
                label="Annuler"
                color="neutral"
                variant="ghost"
                @click="showContactModal = false"
              />
              <UButton
                type="submit"
                label="Ajouter"
                icon="i-lucide-plus"
                :loading="addingContact"
                :disabled="!isContactValid"
              />
            </div>
          </form>
        </div>
      </template>
    </UModal>
  </div>
</template>
