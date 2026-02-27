<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type {
  Project, ProjectTask, ProjectMember, ProjectFile,
  ProjectStatut, TaskStatut, TaskPriorite, UserProfile, Category, Prospect
} from '~/utils/types'
import { PROJECT_STATUTS, TASK_STATUTS, TASK_PRIORITES, PROJECT_ROLES } from '~/utils/constants'

const route = useRoute()
const { $directus } = useNuxtApp()
const { user, isDirecteur } = useAuth()
const { getById, update, addMember, removeMember, addTask, updateTask, deleteTask } = useProjects()
const { getActiveUsers } = useUsers()
const toast = useToast()

const projectId = route.params.id as string

// ---- Data fetching ----
const { data: project, status, refresh } = useAsyncData(`project-${projectId}`, () => getById(projectId))
const { data: activeUsers } = useAsyncData('active-users', getActiveUsers)

// Fetch categories + prospects for the edit form
const { data: categories } = useAsyncData('categories', async () => {
  return await $directus.request(readItems('categories', {
    fields: ['id', 'nom', 'couleur'],
    sort: ['nom'],
    limit: -1
  })) as Category[]
})

const { data: prospects } = useAsyncData('prospects-list', async () => {
  return await $directus.request(readItems('prospects', {
    fields: ['id', 'nom_entreprise'],
    sort: ['nom_entreprise'],
    limit: -1
  })) as Prospect[]
})

// ---- Tabs ----
const tabs = [
  { label: 'Vue d\'ensemble', value: 'overview', icon: 'i-lucide-layout-dashboard' },
  { label: 'Taches', value: 'tasks', icon: 'i-lucide-list-checks' },
  { label: 'Membres', value: 'members', icon: 'i-lucide-users' },
  { label: 'Fichiers', value: 'files', icon: 'i-lucide-paperclip' }
]

// ---- Helpers ----
function formatDateFr(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatBudget(budget: number | null) {
  if (!budget) return '-'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(budget)
}

function getCategoryName(p: Project) {
  if (!p.categorie || typeof p.categorie === 'string') return '-'
  return p.categorie.nom
}

function getClientName(p: Project) {
  if (!p.client || typeof p.client === 'string') return '-'
  return p.client.nom_entreprise
}

function getMemberUser(member: ProjectMember): UserProfile | null {
  if (typeof member.utilisateur === 'string') return null
  return member.utilisateur
}

function getMemberName(member: ProjectMember) {
  const u = getMemberUser(member)
  if (!u) return 'Utilisateur inconnu'
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Sans nom'
}

function getTaskAssigneeName(task: ProjectTask) {
  if (!task.assigne_a || typeof task.assigne_a === 'string') return null
  return [task.assigne_a.first_name, task.assigne_a.last_name].filter(Boolean).join(' ')
}

function getUserName(u: UserProfile) {
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}

// ---- Overview: Edit mode ----
const isEditing = ref(false)
const editLoading = ref(false)
const editForm = reactive({
  nom: '',
  description: '',
  statut: 'brouillon' as ProjectStatut,
  date_debut: '',
  date_fin: '',
  budget: null as number | null,
  categorie: null as string | null,
  client: null as string | null
})

function startEditing() {
  if (!project.value) return
  editForm.nom = project.value.nom
  editForm.description = project.value.description || ''
  editForm.statut = project.value.statut
  editForm.date_debut = project.value.date_debut || ''
  editForm.date_fin = project.value.date_fin || ''
  editForm.budget = project.value.budget
  editForm.categorie = typeof project.value.categorie === 'string'
    ? project.value.categorie
    : project.value.categorie?.id || null
  editForm.client = typeof project.value.client === 'string'
    ? project.value.client
    : project.value.client?.id || null
  isEditing.value = true
}

const statutOptions = computed(() =>
  Object.entries(PROJECT_STATUTS).map(([key, val]) => ({ label: val.label, value: key }))
)

const categorieOptions = computed(() => {
  if (!categories.value) return []
  return categories.value.map((c: Category) => ({ label: c.nom, value: c.id }))
})

const clientOptions = computed(() => {
  if (!prospects.value) return []
  return [
    { label: 'Aucun client', value: '' },
    ...prospects.value.map((p: Prospect) => ({ label: p.nom_entreprise, value: p.id }))
  ]
})

async function saveProject() {
  if (!editForm.nom.trim()) {
    toast.add({ title: 'Le nom est requis', color: 'error' })
    return
  }
  editLoading.value = true
  try {
    const data: Record<string, any> = {
      nom: editForm.nom.trim(),
      description: editForm.description.trim() || null,
      statut: editForm.statut,
      date_debut: editForm.date_debut || null,
      date_fin: editForm.date_fin || null,
      budget: editForm.budget && editForm.budget > 0 ? editForm.budget : null,
      categorie: editForm.categorie || null,
      client: editForm.client || null
    }
    await update(projectId, data)
    toast.add({ title: 'Projet mis a jour', color: 'success' })
    isEditing.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la mise a jour', color: 'error' })
  } finally {
    editLoading.value = false
  }
}

// ---- Tasks ----
const showAddTask = ref(false)
const taskLoading = ref(false)
const taskForm = reactive({
  titre: '',
  description: '',
  priorite: 'normale' as TaskPriorite,
  assigne_a: null as string | null,
  date_echeance: ''
})

const taskStatutOptions = computed(() =>
  Object.entries(TASK_STATUTS).map(([key, val]) => ({ label: val.label, value: key }))
)

const taskPrioriteOptions = computed(() =>
  Object.entries(TASK_PRIORITES).map(([key, val]) => ({ label: val.label, value: key }))
)

const assigneeOptions = computed(() => {
  if (!activeUsers.value) return []
  return [
    { label: 'Non assigne', value: '' },
    ...activeUsers.value.map((u: UserProfile) => ({
      label: getUserName(u),
      value: u.id
    }))
  ]
})

async function handleAddTask() {
  if (!taskForm.titre.trim()) {
    toast.add({ title: 'Le titre de la tache est requis', color: 'error' })
    return
  }
  taskLoading.value = true
  try {
    const data: Record<string, any> = {
      project: projectId,
      titre: taskForm.titre.trim(),
      statut: 'a_faire' as TaskStatut,
      priorite: taskForm.priorite
    }
    if (taskForm.description.trim()) data.description = taskForm.description.trim()
    if (taskForm.assigne_a) data.assigne_a = taskForm.assigne_a
    if (taskForm.date_echeance) data.date_echeance = taskForm.date_echeance

    await addTask(data)
    toast.add({ title: 'Tache ajoutee', color: 'success' })
    taskForm.titre = ''
    taskForm.description = ''
    taskForm.priorite = 'normale'
    taskForm.assigne_a = null
    taskForm.date_echeance = ''
    showAddTask.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de l\'ajout de la tache', color: 'error' })
  } finally {
    taskLoading.value = false
  }
}

async function toggleTaskStatut(task: ProjectTask) {
  const order: TaskStatut[] = ['a_faire', 'en_cours', 'termine']
  const currentIndex = order.indexOf(task.statut)
  const nextStatut = order[(currentIndex + 1) % order.length]
  try {
    await updateTask(task.id, { statut: nextStatut })
    toast.add({ title: `Tache passee en "${TASK_STATUTS[nextStatut].label}"`, color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la mise a jour', color: 'error' })
  }
}

async function handleDeleteTask(taskId: string) {
  try {
    await deleteTask(taskId)
    toast.add({ title: 'Tache supprimee', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  }
}

// ---- Members ----
const showAddMember = ref(false)
const memberLoading = ref(false)
const memberForm = reactive({
  utilisateur: '',
  role_projet: ''
})

const roleProjetOptions = PROJECT_ROLES.map(r => ({ label: r, value: r }))

const availableUsers = computed(() => {
  if (!activeUsers.value || !project.value) return []
  const existingIds = (project.value.membres || []).map((m: ProjectMember) => {
    return typeof m.utilisateur === 'string' ? m.utilisateur : m.utilisateur.id
  })
  return activeUsers.value
    .filter((u: UserProfile) => !existingIds.includes(u.id))
    .map((u: UserProfile) => ({
      label: getUserName(u),
      value: u.id
    }))
})

async function handleAddMember() {
  if (!memberForm.utilisateur) {
    toast.add({ title: 'Veuillez selectionner un utilisateur', color: 'error' })
    return
  }
  memberLoading.value = true
  try {
    await addMember({
      project: projectId,
      utilisateur: memberForm.utilisateur,
      role_projet: memberForm.role_projet.trim() || undefined
    })
    toast.add({ title: 'Membre ajoute', color: 'success' })
    memberForm.utilisateur = ''
    memberForm.role_projet = ''
    showAddMember.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de l\'ajout du membre', color: 'error' })
  } finally {
    memberLoading.value = false
  }
}

async function handleRemoveMember(memberId: number) {
  try {
    await removeMember(memberId)
    toast.add({ title: 'Membre retire', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors du retrait du membre', color: 'error' })
  }
}

// ---- Files ----
function getFileUrl(fileId: string) {
  const config = useRuntimeConfig()
  return `${config.public.directusUrl}/assets/${fileId}`
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader :title="project?.nom || 'Projet'">
      <template #right>
        <UButton
          label="Retour"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          to="/projets"
        />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <!-- Loading -->
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <!-- Error / not found -->
      <div v-else-if="!project" class="text-center py-12">
        <UIcon name="i-lucide-folder-x" class="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p class="text-gray-500 dark:text-gray-400">Projet introuvable</p>
        <UButton label="Retour aux projets" to="/projets" variant="subtle" class="mt-4" />
      </div>

      <!-- Content -->
      <div v-else>
        <!-- Project header -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ project.nom }}
            </h1>
            <UBadge
              :color="PROJECT_STATUTS[project.statut]?.color || 'neutral'"
              variant="subtle"
            >
              {{ PROJECT_STATUTS[project.statut]?.label || project.statut }}
            </UBadge>
          </div>
        </div>

        <!-- Tabs -->
        <UTabs :items="tabs" class="w-full">
          <!-- ==================== VUE D'ENSEMBLE ==================== -->
          <template #overview>
            <div class="mt-6 space-y-6">
              <!-- Read mode -->
              <UCard v-if="!isEditing">
                <template #header>
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                      Informations du projet
                    </h3>
                    <UButton
                      v-if="isDirecteur"
                      label="Modifier"
                      icon="i-lucide-pencil"
                      size="xs"
                      variant="subtle"
                      @click="startEditing"
                    />
                  </div>
                </template>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                  <div>
                    <span class="text-gray-500 dark:text-gray-400">Statut</span>
                    <div class="mt-1">
                      <UBadge
                        :color="PROJECT_STATUTS[project.statut]?.color || 'neutral'"
                        variant="subtle"
                      >
                        {{ PROJECT_STATUTS[project.statut]?.label || project.statut }}
                      </UBadge>
                    </div>
                  </div>
                  <div>
                    <span class="text-gray-500 dark:text-gray-400">Categorie</span>
                    <p class="font-medium text-gray-900 dark:text-white mt-1">{{ getCategoryName(project) }}</p>
                  </div>
                  <div>
                    <span class="text-gray-500 dark:text-gray-400">Date de debut</span>
                    <p class="font-medium text-gray-900 dark:text-white mt-1">{{ formatDateFr(project.date_debut) }}</p>
                  </div>
                  <div>
                    <span class="text-gray-500 dark:text-gray-400">Date de fin</span>
                    <p class="font-medium text-gray-900 dark:text-white mt-1">{{ formatDateFr(project.date_fin) }}</p>
                  </div>
                  <div>
                    <span class="text-gray-500 dark:text-gray-400">Budget</span>
                    <p class="font-medium text-gray-900 dark:text-white mt-1">{{ formatBudget(project.budget) }}</p>
                  </div>
                  <div>
                    <span class="text-gray-500 dark:text-gray-400">Client</span>
                    <p class="font-medium text-gray-900 dark:text-white mt-1">{{ getClientName(project) }}</p>
                  </div>
                </div>

                <div v-if="project.description" class="mt-6">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Description</span>
                  <p class="text-sm text-gray-900 dark:text-white mt-1 whitespace-pre-line">
                    {{ project.description }}
                  </p>
                </div>
              </UCard>

              <!-- Edit mode (directeur only) -->
              <UCard v-else>
                <template #header>
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                    Modifier le projet
                  </h3>
                </template>

                <form class="space-y-4" @submit.prevent="saveProject">
                  <UFormField label="Nom *">
                    <UInput v-model="editForm.nom" class="w-full" required />
                  </UFormField>

                  <UFormField label="Description">
                    <UTextarea v-model="editForm.description" :rows="4" class="w-full" />
                  </UFormField>

                  <UFormField label="Statut">
                    <USelectMenu
                      v-model="editForm.statut"
                      :items="statutOptions"
                      value-key="value"
                      class="w-full"
                    />
                  </UFormField>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <UFormField label="Date de debut">
                      <UInput v-model="editForm.date_debut" type="date" class="w-full" />
                    </UFormField>
                    <UFormField label="Date de fin">
                      <UInput v-model="editForm.date_fin" type="date" class="w-full" />
                    </UFormField>
                  </div>

                  <UFormField label="Budget">
                    <UInput
                      v-model.number="editForm.budget"
                      type="number"
                      icon="i-lucide-euro"
                      :min="0"
                      :step="100"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Categorie">
                    <USelectMenu
                      v-model="editForm.categorie"
                      :items="categorieOptions"
                      value-key="value"
                      placeholder="Selectionner une categorie"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Client">
                    <USelectMenu
                      v-model="editForm.client"
                      :items="clientOptions"
                      value-key="value"
                      placeholder="Selectionner un client"
                      class="w-full"
                    />
                  </UFormField>

                  <USeparator />

                  <div class="flex justify-end gap-3">
                    <UButton
                      label="Annuler"
                      color="neutral"
                      variant="ghost"
                      @click="isEditing = false"
                    />
                    <UButton
                      type="submit"
                      label="Enregistrer"
                      icon="i-lucide-check"
                      :loading="editLoading"
                    />
                  </div>
                </form>
              </UCard>
            </div>
          </template>

          <!-- ==================== TACHES ==================== -->
          <template #tasks>
            <div class="mt-6 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Taches ({{ project.taches?.length || 0 }})
                </h3>
                <UButton
                  label="Ajouter une tache"
                  icon="i-lucide-plus"
                  size="sm"
                  @click="showAddTask = true"
                />
              </div>

              <!-- Add task form -->
              <UCard v-if="showAddTask">
                <template #header>
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Nouvelle tache</h4>
                </template>
                <form class="space-y-4" @submit.prevent="handleAddTask">
                  <UFormField label="Titre *">
                    <UInput v-model="taskForm.titre" placeholder="Titre de la tache" class="w-full" required />
                  </UFormField>

                  <UFormField label="Description">
                    <UTextarea v-model="taskForm.description" placeholder="Description..." :rows="2" class="w-full" />
                  </UFormField>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <UFormField label="Priorite">
                      <USelectMenu
                        v-model="taskForm.priorite"
                        :items="taskPrioriteOptions"
                        value-key="value"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Assigne a">
                      <USelectMenu
                        v-model="taskForm.assigne_a"
                        :items="assigneeOptions"
                        value-key="value"
                        placeholder="Selectionner"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Echeance">
                      <UInput v-model="taskForm.date_echeance" type="date" class="w-full" />
                    </UFormField>
                  </div>

                  <div class="flex justify-end gap-3">
                    <UButton
                      label="Annuler"
                      color="neutral"
                      variant="ghost"
                      @click="showAddTask = false"
                    />
                    <UButton
                      type="submit"
                      label="Ajouter"
                      icon="i-lucide-plus"
                      :loading="taskLoading"
                    />
                  </div>
                </form>
              </UCard>

              <!-- Tasks list -->
              <div v-if="!project.taches?.length && !showAddTask" class="text-center py-8">
                <UIcon name="i-lucide-list-checks" class="size-8 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <p class="text-gray-500 dark:text-gray-400">Aucune tache pour ce projet</p>
              </div>

              <UCard v-for="task in project.taches" :key="task.id">
                <div class="flex items-start gap-3">
                  <!-- Status toggle button -->
                  <button
                    class="mt-0.5 shrink-0"
                    :title="`Passer au statut suivant`"
                    @click="toggleTaskStatut(task)"
                  >
                    <UIcon
                      :name="task.statut === 'termine' ? 'i-lucide-check-circle-2' : task.statut === 'en_cours' ? 'i-lucide-circle-dot' : 'i-lucide-circle'"
                      class="size-5"
                      :class="{
                        'text-green-500': task.statut === 'termine',
                        'text-blue-500': task.statut === 'en_cours',
                        'text-gray-400': task.statut === 'a_faire'
                      }"
                    />
                  </button>

                  <!-- Task content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span
                        class="font-medium text-gray-900 dark:text-white"
                        :class="{ 'line-through text-gray-400 dark:text-gray-500': task.statut === 'termine' }"
                      >
                        {{ task.titre }}
                      </span>
                      <UBadge
                        :color="TASK_STATUTS[task.statut]?.color || 'neutral'"
                        variant="subtle"
                        size="xs"
                      >
                        {{ TASK_STATUTS[task.statut]?.label || task.statut }}
                      </UBadge>
                      <UBadge
                        v-if="task.priorite"
                        :color="TASK_PRIORITES[task.priorite]?.color || 'neutral'"
                        variant="outline"
                        size="xs"
                      >
                        {{ TASK_PRIORITES[task.priorite]?.label || task.priorite }}
                      </UBadge>
                    </div>

                    <p v-if="task.description" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {{ task.description }}
                    </p>

                    <div class="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <!-- Assignee -->
                      <div v-if="getTaskAssigneeName(task)" class="flex items-center gap-1">
                        <UAvatar :alt="getTaskAssigneeName(task)!" size="3xs" />
                        <span>{{ getTaskAssigneeName(task) }}</span>
                      </div>
                      <!-- Due date -->
                      <div v-if="task.date_echeance" class="flex items-center gap-1">
                        <UIcon name="i-lucide-calendar" class="size-3" />
                        <span>{{ formatDateFr(task.date_echeance) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Delete -->
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    @click="handleDeleteTask(task.id)"
                  />
                </div>
              </UCard>
            </div>
          </template>

          <!-- ==================== MEMBRES ==================== -->
          <template #members>
            <div class="mt-6 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Membres ({{ project.membres?.length || 0 }})
                </h3>
                <UButton
                  label="Ajouter un membre"
                  icon="i-lucide-user-plus"
                  size="sm"
                  @click="showAddMember = true"
                />
              </div>

              <!-- Members list -->
              <div v-if="!project.membres?.length" class="text-center py-8">
                <UIcon name="i-lucide-users" class="size-8 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <p class="text-gray-500 dark:text-gray-400">Aucun membre dans ce projet</p>
              </div>

              <UCard v-for="member in project.membres" :key="member.id">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <UAvatar :alt="getMemberName(member)" size="sm" />
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white">
                        {{ getMemberName(member) }}
                      </p>
                      <p v-if="member.role_projet" class="text-sm text-gray-500 dark:text-gray-400">
                        {{ member.role_projet }}
                      </p>
                    </div>
                  </div>
                  <UButton
                    icon="i-lucide-user-minus"
                    color="error"
                    variant="ghost"
                    size="xs"
                    @click="handleRemoveMember(member.id)"
                  />
                </div>
              </UCard>

              <!-- Add member modal -->
              <UModal v-model:open="showAddMember">
                <template #content>
                  <div class="p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Ajouter un membre
                    </h3>
                    <form class="space-y-4" @submit.prevent="handleAddMember">
                      <UFormField label="Utilisateur *">
                        <USelectMenu
                          v-model="memberForm.utilisateur"
                          :items="availableUsers"
                          value-key="value"
                          placeholder="Selectionner un utilisateur"
                          class="w-full"
                        />
                      </UFormField>

                      <UFormField label="Role dans le projet">
                        <USelectMenu
                          v-model="memberForm.role_projet"
                          :items="roleProjetOptions"
                          value-key="value"
                          placeholder="Selectionner un role"
                          class="w-full"
                        />
                      </UFormField>

                      <USeparator />

                      <div class="flex justify-end gap-3">
                        <UButton
                          label="Annuler"
                          color="neutral"
                          variant="ghost"
                          @click="showAddMember = false"
                        />
                        <UButton
                          type="submit"
                          label="Ajouter"
                          icon="i-lucide-user-plus"
                          :loading="memberLoading"
                        />
                      </div>
                    </form>
                  </div>
                </template>
              </UModal>
            </div>
          </template>

          <!-- ==================== FICHIERS ==================== -->
          <template #files>
            <div class="mt-6 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Fichiers ({{ project.fichiers?.length || 0 }})
                </h3>
              </div>

              <div v-if="!project.fichiers?.length" class="text-center py-8">
                <UIcon name="i-lucide-paperclip" class="size-8 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <p class="text-gray-500 dark:text-gray-400">Aucun fichier attache a ce projet</p>
              </div>

              <UCard v-for="file in project.fichiers" :key="file.id">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <UIcon name="i-lucide-file" class="size-5 text-gray-400" />
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white">
                        {{ file.description || 'Fichier sans description' }}
                      </p>
                    </div>
                  </div>
                  <UButton
                    label="Telecharger"
                    icon="i-lucide-download"
                    variant="subtle"
                    size="xs"
                    :href="getFileUrl(file.fichier)"
                    target="_blank"
                  />
                </div>
              </UCard>
            </div>
          </template>
        </UTabs>
      </div>
    </div>
  </div>
</template>
