<script setup lang="ts">
import type { Ticket, TicketType, TicketStatut, TicketPriorite, Project, UserProfile } from '~/utils/types'
import { TICKET_TYPES, TICKET_STATUTS, TICKET_PRIORITES } from '~/utils/constants'

definePageMeta({ middleware: ['auth'] })

const { getAll, create, update, remove } = useTickets()
const { getAll: getAllProjects } = useProjects()
const { getActiveUsers } = useUsers()
const { user, isDirecteur } = useAuth()
const toast = useToast()

// --- Data ---
const tickets = ref<Ticket[]>([])
const projects = ref<Project[]>([])
const users = ref<UserProfile[]>([])
const loading = ref(true)

// --- Filters ---
const search = ref('')
const filterProjet = ref('')
const filterStatut = ref('')
const filterType = ref('')
const filterPriorite = ref('')

const projetOptions = computed(() => [
  { label: 'Tous les projets', value: '' },
  ...projects.value.map(p => ({ label: p.nom, value: p.id }))
])

const statutOptions = [
  { label: 'Tous les statuts', value: '' },
  ...Object.entries(TICKET_STATUTS).map(([k, v]) => ({ label: v.label, value: k }))
]

const typeOptions = [
  { label: 'Tous les types', value: '' },
  ...Object.entries(TICKET_TYPES).map(([k, v]) => ({ label: v.label, value: k }))
]

const prioriteOptions = [
  { label: 'Toutes les priorites', value: '' },
  ...Object.entries(TICKET_PRIORITES).map(([k, v]) => ({ label: v.label, value: k }))
]

const userOptions = computed(() =>
  users.value.map(u => ({
    label: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email,
    value: u.id
  }))
)

const filteredTickets = computed(() => {
  let list = tickets.value
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(t =>
      t.titre.toLowerCase().includes(q)
      || (t.description && t.description.toLowerCase().includes(q))
    )
  }
  if (filterProjet.value) list = list.filter(t => (typeof t.projet === 'object' ? t.projet.id : t.projet) === filterProjet.value)
  if (filterStatut.value) list = list.filter(t => t.statut === filterStatut.value)
  if (filterType.value) list = list.filter(t => t.type === filterType.value)
  if (filterPriorite.value) list = list.filter(t => t.priorite === filterPriorite.value)
  return list
})

const hasFilters = computed(() => !!search.value || !!filterProjet.value || !!filterStatut.value || !!filterType.value || !!filterPriorite.value)

function clearFilters() {
  search.value = ''
  filterProjet.value = ''
  filterStatut.value = ''
  filterType.value = ''
  filterPriorite.value = ''
}

// --- Stats ---
const stats = computed(() => {
  const all = tickets.value
  return {
    total: all.length,
    ouverts: all.filter(t => t.statut === 'ouvert').length,
    en_cours: all.filter(t => t.statut === 'en_cours').length,
    critiques: all.filter(t => t.priorite === 'critique' && t.statut !== 'ferme' && t.statut !== 'resolu').length
  }
})

// --- Modal ---
const showModal = ref(false)
const editingTicket = ref<Ticket | null>(null)
const submitting = ref(false)

const form = ref({
  titre: '',
  description: '',
  type: 'bug' as TicketType,
  statut: 'ouvert' as TicketStatut,
  priorite: 'normale' as TicketPriorite,
  projet: '',
  assigne_a: ''
})

function openCreate() {
  editingTicket.value = null
  form.value = {
    titre: '',
    description: '',
    type: 'bug',
    statut: 'ouvert',
    priorite: 'normale',
    projet: filterProjet.value || '',
    assigne_a: ''
  }
  showModal.value = true
}

function openEdit(ticket: Ticket) {
  editingTicket.value = ticket
  form.value = {
    titre: ticket.titre,
    description: ticket.description || '',
    type: ticket.type,
    statut: ticket.statut,
    priorite: ticket.priorite,
    projet: typeof ticket.projet === 'object' ? ticket.projet.id : ticket.projet,
    assigne_a: ticket.assigne_a ? (typeof ticket.assigne_a === 'object' ? ticket.assigne_a.id : ticket.assigne_a) : ''
  }
  showModal.value = true
}

async function handleSubmit() {
  if (!form.value.titre.trim() || !form.value.projet) return
  submitting.value = true
  try {
    const payload: Record<string, any> = {
      titre: form.value.titre.trim(),
      description: form.value.description.trim() || null,
      type: form.value.type,
      statut: form.value.statut,
      priorite: form.value.priorite,
      projet: form.value.projet,
      assigne_a: form.value.assigne_a || null
    }

    if (editingTicket.value) {
      await update(editingTicket.value.id, payload)
      toast.add({ title: 'Ticket mis a jour', color: 'success' })
    } else {
      payload.rapporte_par = user.value?.id
      await create(payload)
      toast.add({ title: 'Ticket cree', color: 'success' })
    }
    showModal.value = false
    await loadTickets()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    submitting.value = false
  }
}

const showDeleteModal = ref(false)
const deleting = ref(false)

async function handleDelete() {
  if (!editingTicket.value) return
  deleting.value = true
  try {
    await remove(editingTicket.value.id)
    toast.add({ title: 'Ticket supprime', color: 'success' })
    showModal.value = false
    showDeleteModal.value = false
    await loadTickets()
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  } finally {
    deleting.value = false
  }
}

// --- Quick status change ---
async function cycleStatut(ticket: Ticket) {
  const order: TicketStatut[] = ['ouvert', 'en_cours', 'resolu', 'ferme']
  const idx = order.indexOf(ticket.statut)
  const next = order[(idx + 1) % order.length]
  try {
    await update(ticket.id, { statut: next })
    ticket.statut = next
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

// --- Load ---
async function loadTickets() {
  tickets.value = await getAll()
}

async function loadData() {
  loading.value = true
  try {
    const [t, p, u] = await Promise.all([getAll(), getAllProjects(), getActiveUsers()])
    tickets.value = t
    projects.value = p
    users.value = u
  } catch {
    toast.add({ title: 'Erreur de chargement', color: 'error' })
  } finally {
    loading.value = false
  }
}

// --- Helpers ---
function getProjetNom(ticket: Ticket): string {
  if (typeof ticket.projet === 'object' && ticket.projet) return ticket.projet.nom
  return ''
}

function getAssigneNom(ticket: Ticket): string {
  if (!ticket.assigne_a || typeof ticket.assigne_a === 'string') return ''
  return [ticket.assigne_a.first_name, ticket.assigne_a.last_name].filter(Boolean).join(' ')
}

function getRapporteurNom(ticket: Ticket): string {
  if (!ticket.rapporte_par || typeof ticket.rapporte_par === 'string') return ''
  return [ticket.rapporte_par.first_name, ticket.rapporte_par.last_name].filter(Boolean).join(' ')
}

function formatDateFr(date: string | null) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function timeAgo(date: string) {
  const now = Date.now()
  const d = new Date(date).getTime()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}j`
}

const formTypeOptions = Object.entries(TICKET_TYPES).map(([k, v]) => ({ label: v.label, value: k, icon: v.icon }))
const formStatutOptions = Object.entries(TICKET_STATUTS).map(([k, v]) => ({ label: v.label, value: k }))
const formPrioriteOptions = Object.entries(TICKET_PRIORITES).map(([k, v]) => ({ label: v.label, value: k }))

onMounted(loadData)
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Tickets">
      <template #right>
        <UButton
          label="Nouveau ticket"
          icon="i-lucide-plus"
          size="sm"
          @click="openCreate"
        />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <template v-else>
        <!-- Stats -->
        <div class="flex flex-wrap items-center gap-4 text-xs">
          <span class="text-[#2c2419]/60 dark:text-stone-400">
            <strong class="text-[#2c2419] dark:text-stone-200">{{ stats.total }}</strong> ticket{{ stats.total > 1 ? 's' : '' }}
          </span>
          <span class="flex items-center gap-1 text-orange-600 dark:text-orange-400">
            <span class="size-1.5 rounded-full bg-orange-500" />
            {{ stats.ouverts }} ouvert{{ stats.ouverts > 1 ? 's' : '' }}
          </span>
          <span class="flex items-center gap-1 text-blue-600 dark:text-blue-400">
            <span class="size-1.5 rounded-full bg-blue-500" />
            {{ stats.en_cours }} en cours
          </span>
          <span v-if="stats.critiques" class="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
            <UIcon name="i-lucide-alert-triangle" class="size-3" />
            {{ stats.critiques }} critique{{ stats.critiques > 1 ? 's' : '' }}
          </span>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap items-center gap-2">
          <UInput
            v-model="search"
            placeholder="Rechercher..."
            icon="i-lucide-search"
            size="sm"
            class="w-full sm:w-48"
          />
          <USelect v-model="filterProjet" :items="projetOptions" value-key="value" size="sm" class="w-[calc(50%-4px)] sm:w-44" />
          <USelect v-model="filterStatut" :items="statutOptions" value-key="value" size="sm" class="w-[calc(50%-4px)] sm:w-36" />
          <USelect v-model="filterType" :items="typeOptions" value-key="value" size="sm" class="w-[calc(50%-4px)] sm:w-40" />
          <USelect v-model="filterPriorite" :items="prioriteOptions" value-key="value" size="sm" class="w-[calc(50%-4px)] sm:w-40" />
          <UButton
            v-if="hasFilters"
            label="Effacer"
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="clearFilters"
          />
          <span v-if="hasFilters" class="text-xs text-stone-400 dark:text-stone-500 ml-1">
            {{ filteredTickets.length }} resultat{{ filteredTickets.length > 1 ? 's' : '' }}
          </span>
        </div>

        <!-- Empty -->
        <div v-if="!filteredTickets.length" class="text-center py-12">
          <UIcon name="i-lucide-ticket" class="size-10 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
          <p class="text-stone-500 dark:text-stone-400">
            {{ hasFilters ? 'Aucun ticket pour ces filtres' : 'Aucun ticket' }}
          </p>
          <UButton
            v-if="hasFilters"
            label="Effacer les filtres"
            icon="i-lucide-x"
            variant="subtle"
            class="mt-3"
            @click="clearFilters"
          />
          <UButton
            v-else
            label="Creer un ticket"
            icon="i-lucide-plus"
            class="mt-4"
            @click="openCreate"
          />
        </div>

        <!-- Ticket list -->
        <div v-else class="space-y-2">
          <button
            v-for="ticket in filteredTickets"
            :key="ticket.id"
            class="w-full text-left rounded-xl border p-3.5 transition-all hover:bg-[#af8f3c]/[0.03] dark:hover:bg-stone-800/30 group"
            :class="ticket.statut === 'ferme' || ticket.statut === 'resolu'
              ? 'border-stone-200/60 dark:border-stone-700/40 opacity-60'
              : ticket.priorite === 'critique'
                ? 'border-red-200 dark:border-red-900/40'
                : ticket.priorite === 'haute'
                  ? 'border-orange-200/60 dark:border-orange-900/30'
                  : 'border-stone-200 dark:border-stone-700/60'"
            @click="openEdit(ticket)"
          >
            <div class="flex items-start gap-3">
              <!-- Priority icon -->
              <div class="shrink-0 mt-0.5">
                <UIcon
                  :name="TICKET_PRIORITES[ticket.priorite]?.icon || 'i-lucide-minus'"
                  class="size-4"
                  :class="{
                    'text-red-500': ticket.priorite === 'critique',
                    'text-orange-500': ticket.priorite === 'haute',
                    'text-blue-500': ticket.priorite === 'normale',
                    'text-stone-400': ticket.priorite === 'basse'
                  }"
                />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3
                    class="text-sm font-semibold truncate"
                    :class="ticket.statut === 'ferme' || ticket.statut === 'resolu'
                      ? 'text-stone-400 dark:text-stone-500 line-through'
                      : 'text-[#2c2419] dark:text-stone-100'"
                  >
                    {{ ticket.titre }}
                  </h3>
                </div>
                <div class="flex flex-wrap items-center gap-1.5">
                  <UBadge :color="(TICKET_TYPES[ticket.type]?.color as any) || 'neutral'" variant="subtle" size="xs">
                    <UIcon :name="TICKET_TYPES[ticket.type]?.icon || 'i-lucide-ticket'" class="size-3 mr-0.5" />
                    {{ TICKET_TYPES[ticket.type]?.label || ticket.type }}
                  </UBadge>
                  <UBadge :color="(TICKET_STATUTS[ticket.statut]?.color as any) || 'neutral'" variant="subtle" size="xs" class="cursor-pointer" @click.stop="cycleStatut(ticket)">
                    {{ TICKET_STATUTS[ticket.statut]?.label || ticket.statut }}
                  </UBadge>
                  <span class="text-[11px] text-stone-400 dark:text-stone-500">
                    {{ getProjetNom(ticket) }}
                  </span>
                </div>
              </div>

              <!-- Right side -->
              <div class="flex items-center gap-3 shrink-0 text-[11px] text-stone-400 dark:text-stone-500">
                <span v-if="getAssigneNom(ticket)" class="hidden sm:flex items-center gap-1">
                  <UIcon name="i-lucide-user" class="size-3" />
                  {{ getAssigneNom(ticket) }}
                </span>
                <span class="tabular-nums">{{ timeAgo(ticket.date_created) }}</span>
              </div>
            </div>
          </button>
        </div>
      </template>
    </div>

    <!-- Create / Edit modal -->
    <UModal :open="showModal" @update:open="showModal = $event">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
            {{ editingTicket ? 'Modifier le ticket' : 'Nouveau ticket' }}
          </h3>
          <form class="space-y-4" @submit.prevent="handleSubmit">
            <UFormField label="Titre" required>
              <UInput v-model="form.titre" placeholder="Resume du probleme..." class="w-full" />
            </UFormField>

            <UFormField label="Description">
              <UTextarea v-model="form.description" placeholder="Details, etapes de reproduction, impact..." :rows="4" class="w-full" />
            </UFormField>

            <UFormField label="Projet" required>
              <USelect v-model="form.projet" :items="projetOptions.slice(1)" value-key="value" placeholder="Selectionner un projet" class="w-full" />
            </UFormField>

            <div class="grid grid-cols-3 gap-3">
              <UFormField label="Type">
                <USelect v-model="form.type" :items="formTypeOptions" value-key="value" class="w-full" />
              </UFormField>
              <UFormField label="Priorite">
                <USelect v-model="form.priorite" :items="formPrioriteOptions" value-key="value" class="w-full" />
              </UFormField>
              <UFormField v-if="editingTicket" label="Statut">
                <USelect v-model="form.statut" :items="formStatutOptions" value-key="value" class="w-full" />
              </UFormField>
            </div>

            <UFormField label="Assigner a">
              <USelect v-model="form.assigne_a" :items="[{ label: 'Non assigne', value: '' }, ...userOptions]" value-key="value" class="w-full" />
            </UFormField>

            <div class="flex items-center justify-between pt-2">
              <div class="flex gap-2">
                <UButton
                  v-if="editingTicket"
                  label="Supprimer"
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  @click="showDeleteModal = true"
                />
              </div>
              <div class="flex gap-2">
                <UButton label="Annuler" color="neutral" variant="ghost" @click="showModal = false" />
                <UButton
                  type="submit"
                  :label="editingTicket ? 'Enregistrer' : 'Creer'"
                  :loading="submitting"
                  :disabled="!form.titre.trim() || !form.projet"
                />
              </div>
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <!-- Delete confirmation -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-red-100 dark:bg-red-900/30 p-2">
              <UIcon name="i-lucide-alert-triangle" class="size-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 class="text-lg font-semibold text-stone-900 dark:text-white">Supprimer ce ticket</h3>
          </div>
          <p class="text-sm text-stone-500 dark:text-stone-400">
            Supprimer <strong>{{ editingTicket?.titre }}</strong> ? Cette action est irreversible.
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
