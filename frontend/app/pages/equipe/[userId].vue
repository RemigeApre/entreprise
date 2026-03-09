<script setup lang="ts">
import { readItems, updateMe } from '@directus/sdk'
import type { UserProfile, UserDocument, VisibiliteNiveau, VisibiliteProfil } from '~/utils/types'

const route = useRoute()
const router = useRouter()
const { $directus } = useNuxtApp()
const { user, isDirecteur, fetchCurrentUser } = useAuth()
const { getUserById, updateExistingUser, removeUser } = useUsers()
const { getPresenceStats } = usePlanning()
const { getDocuments, uploadDocument, removeDocument, getFileUrl } = useUserDocuments()
const toast = useToast()

const userId = route.params.userId as string

const { data: member, status, refresh } = useAsyncData(`user-${userId}`, () => getUserById(userId))

const isSelf = computed(() => user.value?.id === userId)
const canEdit = computed(() => isDirecteur.value || isSelf.value)

// ==================== VISIBILITE ====================

const VISIBILITY_FIELDS: { key: keyof VisibiliteProfil; label: string }[] = [
  { key: 'telephone', label: 'Telephone' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'localisation', label: 'Localisation' },
  { key: 'bio', label: 'Presentation' },
  { key: 'date_naissance', label: 'Date de naissance' }
]

const VISIBILITY_OPTIONS: { label: string; value: VisibiliteNiveau }[] = [
  { label: 'Tout le monde', value: 'tous' },
  { label: 'Mon pole', value: 'pole' },
  { label: 'Admin seulement', value: 'admin' }
]

function getVisibility(u: UserProfile, field: keyof VisibiliteProfil): VisibiliteNiveau {
  return u.visibilite_profil?.[field] || 'tous'
}

function canSeeField(targetUser: UserProfile, field: keyof VisibiliteProfil): boolean {
  if (isDirecteur.value) return true
  if (isSelf.value) return true
  const level = getVisibility(targetUser, field)
  if (level === 'tous') return true
  if (level === 'pole') {
    if (!user.value) return false
    const myPole = user.value.categorie
    const theirPole = targetUser.categorie
    if (!myPole || !theirPole) return false
    const myId = typeof myPole === 'string' ? myPole : myPole.id
    const theirId = typeof theirPole === 'string' ? theirPole : theirPole.id
    return myId === theirId
  }
  return false // 'admin'
}

// ==================== MODE LECTURE ====================

const isStagiaire = computed(() => member.value?.type_contrat === 'Stage')

const hasTrialPeriod = computed(() => {
  if (!member.value) return true
  return member.value.type_contrat !== 'Stage' && member.value.type_contrat !== 'Freelance'
})

// --- Stats presence (admin only) ---
const stats = ref<{
  totalHalfDays: number; totalHours: number; totalDays: number
  workHours: number; workDays: number; schoolHours: number; schoolDays: number
} | null>(null)
const statsLoading = ref(false)

const stageLimits = computed(() => {
  if (!isStagiaire.value || !member.value) return null
  const start = member.value.date_debut_contrat
  const end = member.value.date_fin_contrat
  if (!start || !end) return { maxDays: 132, maxHours: 924, gratifDays: 44, gratifHours: 308 }
  const totalWorkingDays = countWorkingDays(new Date(start + 'T00:00:00'), new Date(end + 'T00:00:00'))
  return { maxDays: totalWorkingDays, maxHours: totalWorkingDays * 7, gratifDays: 44, gratifHours: 308 }
})

function countWorkingDays(start: Date, end: Date) {
  let count = 0
  const d = new Date(start)
  while (d <= end) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++
    d.setDate(d.getDate() + 1)
  }
  return count
}

async function loadStats() {
  if (!isDirecteur.value || !member.value) return
  statsLoading.value = true
  try {
    const year = new Date().getFullYear()
    const startDate = member.value.date_debut_contrat || `${year}-01-01`
    const endDate = member.value.date_fin_contrat || `${year}-12-31`
    stats.value = await getPresenceStats(member.value.id, startDate, endDate)
  } catch { /* silent */ } finally {
    statsLoading.value = false
  }
}

watch(member, (val) => {
  if (val && isDirecteur.value) loadStats()
}, { immediate: true })

// --- Calculateur d'heures (admin only) ---
const calcDateDebut = ref('')
const calcDateFin = ref('')
const calcType = ref<'journee' | 'demi_journee'>('journee')
const calcTypeOptions = [
  { label: 'Journees completes', value: 'journee' },
  { label: 'Demi-journees', value: 'demi_journee' }
]
const calcResult = computed(() => {
  if (!calcDateDebut.value || !calcDateFin.value) return null
  const start = new Date(calcDateDebut.value + 'T00:00:00')
  const end = new Date(calcDateFin.value + 'T00:00:00')
  if (start > end) return null
  const workDays = countWorkingDays(start, end)
  const multiplier = calcType.value === 'demi_journee' ? 0.5 : 1
  const days = workDays * multiplier
  return { workDays: days, hours: days * 7 }
})

// ==================== MODE EDITION ====================

const isEditing = ref(false)
const saving = ref(false)

const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  date_naissance: '',
  role: '' as string,
  categorie: null as string | null,
  type_contrat: null as string | null,
  ecole: '',
  statut_emploi: 'actif' as string,
  date_debut_contrat: '',
  date_fin_contrat: '',
  date_fin_periode_essai: '',
  actif: true,
  telephone: '',
  linkedin: '',
  localisation: '',
  bio: '',
  visibilite: {
    telephone: 'tous' as VisibiliteNiveau,
    linkedin: 'tous' as VisibiliteNiveau,
    localisation: 'tous' as VisibiliteNiveau,
    bio: 'tous' as VisibiliteNiveau,
    date_naissance: 'tous' as VisibiliteNiveau
  }
})

// Password change (self or admin)
const showPasswordModal = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordSaving = ref(false)

const { data: roles } = useAsyncData('directus-roles', async () => {
  if (!isDirecteur.value) return []
  return await $directus.request(readItems('directus_roles', {
    fields: ['id', 'name'], limit: -1
  })) as { id: string; name: string }[]
})

const { data: categories } = useAsyncData('categories-list', async () => {
  if (!isDirecteur.value) return []
  return await $directus.request(readItems('categories', {
    fields: ['id', 'nom'], sort: ['nom'], limit: -1
  })) as { id: string; nom: string }[]
})

const contractTypeOptions = [
  { label: 'CDI', value: 'CDI' },
  { label: 'CDD', value: 'CDD' },
  { label: 'Freelance', value: 'Freelance' },
  { label: 'Alternance', value: 'Alternance' },
  { label: 'Stage', value: 'Stage' }
]

const roleOptions = computed(() => roles.value?.map(r => ({ label: r.name, value: r.id })) || [])
const categoryOptions = computed(() => categories.value?.map(c => ({ label: c.nom, value: c.id })) || [])

const editHasTrialPeriod = computed(() => form.type_contrat !== 'Stage' && form.type_contrat !== 'Freelance')

function startEditing() {
  if (!member.value) return
  const m = member.value
  form.first_name = m.first_name || ''
  form.last_name = m.last_name || ''
  form.email = m.email || ''
  form.date_naissance = m.date_naissance ? m.date_naissance.split('T')[0] : ''
  form.role = typeof m.role === 'string' ? m.role : m.role?.id || ''
  form.categorie = !m.categorie ? null : typeof m.categorie === 'string' ? m.categorie : m.categorie.id
  form.type_contrat = m.type_contrat || null
  form.ecole = m.ecole || ''
  form.statut_emploi = m.statut_emploi || 'actif'
  form.date_debut_contrat = m.date_debut_contrat ? m.date_debut_contrat.split('T')[0] : ''
  form.date_fin_contrat = m.date_fin_contrat ? m.date_fin_contrat.split('T')[0] : ''
  form.date_fin_periode_essai = m.date_fin_periode_essai ? m.date_fin_periode_essai.split('T')[0] : ''
  form.actif = m.actif
  form.telephone = m.telephone || ''
  form.linkedin = m.linkedin || ''
  form.localisation = m.localisation || ''
  form.bio = m.bio || ''
  const vis = m.visibilite_profil || {}
  form.visibilite.telephone = vis.telephone || 'tous'
  form.visibilite.linkedin = vis.linkedin || 'tous'
  form.visibilite.localisation = vis.localisation || 'tous'
  form.visibilite.bio = vis.bio || 'tous'
  form.visibilite.date_naissance = vis.date_naissance || 'tous'
  isEditing.value = true
}

async function handleSave() {
  saving.value = true
  try {
    const visibilite_profil: VisibiliteProfil = { ...form.visibilite }

    if (isDirecteur.value) {
      const payload: Record<string, any> = {
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        email: form.email || undefined,
        date_naissance: form.date_naissance || null,
        role: form.role || null,
        categorie: form.categorie || null,
        type_contrat: form.type_contrat || null,
        ecole: form.ecole || null,
        statut_emploi: form.statut_emploi || 'actif',
        date_debut_contrat: form.date_debut_contrat || null,
        date_fin_contrat: form.date_fin_contrat || null,
        date_fin_periode_essai: editHasTrialPeriod.value ? (form.date_fin_periode_essai || null) : null,
        actif: form.actif,
        telephone: form.telephone || null,
        linkedin: form.linkedin || null,
        localisation: form.localisation || null,
        bio: form.bio || null,
        visibilite_profil
      }
      if (isSelf.value) {
        await $directus.request(updateMe(payload as any))
        await fetchCurrentUser()
      } else {
        await updateExistingUser(userId, payload)
      }
    } else if (isSelf.value) {
      await $directus.request(updateMe({
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        email: form.email || undefined,
        date_naissance: form.date_naissance || null,
        telephone: form.telephone || null,
        linkedin: form.linkedin || null,
        localisation: form.localisation || null,
        bio: form.bio || null,
        visibilite_profil
      } as any))
      await fetchCurrentUser()
    }
    toast.add({ title: 'Profil mis a jour', color: 'success' })
    isEditing.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la sauvegarde', color: 'error' })
  } finally {
    saving.value = false
  }
}

// ==================== MOT DE PASSE ====================

function generatePassword(length = 16) {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*'
  let pwd = ''
  for (let i = 0; i < length; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pwd
}

function openPasswordModal() {
  currentPassword.value = ''
  newPassword.value = isDirecteur.value && !isSelf.value ? generatePassword() : ''
  confirmPassword.value = ''
  showPasswordModal.value = true
}

async function copyPassword() {
  try {
    await navigator.clipboard.writeText(newPassword.value)
    toast.add({ title: 'Mot de passe copie', color: 'success' })
  } catch {
    toast.add({ title: 'Impossible de copier', color: 'warning' })
  }
}

const passwordValid = computed(() => {
  if (!newPassword.value || newPassword.value.length < 8) return false
  if (isDirecteur.value && !isSelf.value) return true
  return newPassword.value === confirmPassword.value
})

async function handlePasswordSubmit() {
  if (!passwordValid.value) return
  passwordSaving.value = true
  try {
    if (isDirecteur.value && !isSelf.value) {
      await updateExistingUser(userId, { password: newPassword.value })
    } else {
      await $directus.request(updateMe({ password: newPassword.value } as any))
    }
    toast.add({ title: 'Mot de passe mis a jour', color: 'success' })
    showPasswordModal.value = false
  } catch {
    toast.add({ title: 'Erreur lors de la mise a jour du mot de passe', color: 'error' })
  } finally {
    passwordSaving.value = false
  }
}

// ==================== SUPPRESSION ====================
const showDeleteModal = ref(false)
const deleting = ref(false)

async function handleDelete() {
  deleting.value = true
  try {
    await removeUser(userId)
    toast.add({ title: 'Utilisateur supprime', color: 'success' })
    await router.push('/equipe')
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  } finally {
    deleting.value = false
    showDeleteModal.value = false
  }
}

// ==================== DOCUMENTS (admin only) ====================
const documents = ref<UserDocument[]>([])
const docsLoading = ref(false)
const showUploadModal = ref(false)
const uploading = ref(false)
const uploadName = ref('')
const uploadFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

async function loadDocuments() {
  if (!isDirecteur.value) return
  docsLoading.value = true
  try {
    documents.value = await getDocuments(userId)
  } catch { /* silent */ } finally {
    docsLoading.value = false
  }
}

function openUploadModal() {
  uploadName.value = ''
  uploadFile.value = null
  showUploadModal.value = true
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.length) {
    uploadFile.value = input.files[0]
    if (!uploadName.value) {
      uploadName.value = input.files[0].name.replace(/\.[^.]+$/, '')
    }
  }
}

async function handleUpload() {
  if (!uploadFile.value || !uploadName.value.trim()) return
  uploading.value = true
  try {
    await uploadDocument(userId, uploadName.value.trim(), uploadFile.value)
    toast.add({ title: 'Document ajoute', color: 'success' })
    showUploadModal.value = false
    await loadDocuments()
  } catch {
    toast.add({ title: 'Erreur lors de l\'upload', color: 'error' })
  } finally {
    uploading.value = false
  }
}

async function handleDeleteDoc(doc: UserDocument) {
  try {
    await removeDocument(doc.id)
    documents.value = documents.value.filter(d => d.id !== doc.id)
    toast.add({ title: 'Document supprime', color: 'success' })
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

watch(member, (val) => {
  if (val && isDirecteur.value) loadDocuments()
}, { immediate: true })

// ==================== HELPERS ====================
function getUserName(u: UserProfile) {
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}

function getCategoryName(u: UserProfile) {
  if (!u.categorie || typeof u.categorie === 'string') return null
  return u.categorie.nom
}

function formatDateFr(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatBirthday(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

function pct(value: number, max: number) {
  if (!max) return 0
  return Math.min(Math.round((value / max) * 100), 100)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader :title="member ? getUserName(member) : 'Profil'">
      <template #left>
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" to="/equipe" />
      </template>
      <template #right>
        <template v-if="!isEditing && member">
          <UButton
            v-if="canEdit"
            label="Modifier"
            icon="i-lucide-pencil"
            size="sm"
            variant="subtle"
            @click="startEditing"
          />
          <UButton
            v-if="isDirecteur && !isSelf"
            icon="i-lucide-trash-2"
            size="sm"
            variant="ghost"
            color="error"
            @click="showDeleteModal = true"
          />
        </template>
        <template v-if="isEditing">
          <UButton label="Annuler" color="neutral" variant="ghost" size="sm" @click="isEditing = false" />
          <UButton label="Enregistrer" icon="i-lucide-check" size="sm" :loading="saving" @click="handleSave" />
        </template>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <!-- Loading -->
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <!-- Not found -->
      <div v-else-if="!member" class="text-center py-12">
        <UIcon name="i-lucide-user-x" class="size-10 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
        <p class="text-stone-500 dark:text-stone-400">Utilisateur introuvable</p>
        <UButton label="Retour a l'equipe" to="/equipe" variant="subtle" class="mt-4" />
      </div>

      <!-- ==================== MODE LECTURE ==================== -->
      <div v-else-if="!isEditing" class="max-w-2xl mx-auto space-y-6">
        <!-- En-tete profil -->
        <UCard>
          <div class="flex items-center gap-4">
            <UAvatar :alt="getUserName(member)" size="xl" />
            <div class="min-w-0 flex-1">
              <h2 class="text-xl font-bold text-stone-900 dark:text-white">{{ getUserName(member) }}</h2>
              <div class="flex flex-wrap items-center gap-2 mt-2">
                <UBadge v-if="member.type_contrat" color="neutral" variant="subtle">{{ member.type_contrat }}</UBadge>
                <UBadge v-if="getCategoryName(member)" variant="outline" color="neutral">{{ getCategoryName(member) }}</UBadge>
                <UBadge v-if="member.statut_emploi === 'a_venir'" color="blue" variant="subtle">A venir</UBadge>
                <UBadge v-if="member.statut_emploi === 'termine'" color="neutral" variant="subtle">Termine</UBadge>
                <UBadge v-if="!member.actif && member.statut_emploi !== 'a_venir' && member.statut_emploi !== 'termine'" color="error" variant="subtle">Inactif</UBadge>
              </div>
              <p v-if="member.bio && canSeeField(member, 'bio')" class="mt-2 text-sm text-stone-600 dark:text-stone-400 italic">{{ member.bio }}</p>
            </div>
          </div>
        </UCard>

        <!-- Coordonnees -->
        <UCard v-if="(member.telephone && canSeeField(member, 'telephone')) || (member.linkedin && canSeeField(member, 'linkedin')) || (member.localisation && canSeeField(member, 'localisation')) || (member.date_naissance && canSeeField(member, 'date_naissance'))">
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Coordonnees</h3>
          </template>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div v-if="member.telephone && canSeeField(member, 'telephone')">
              <span class="text-stone-500 dark:text-stone-400">Telephone</span>
              <p class="font-medium text-stone-900 dark:text-white flex items-center gap-1.5">
                <UIcon name="i-lucide-phone" class="size-3.5 text-stone-400" />
                {{ member.telephone }}
              </p>
            </div>
            <div v-if="member.linkedin && canSeeField(member, 'linkedin')">
              <span class="text-stone-500 dark:text-stone-400">LinkedIn</span>
              <p class="font-medium">
                <a :href="member.linkedin" target="_blank" rel="noopener" class="text-primary hover:underline flex items-center gap-1.5">
                  <UIcon name="i-lucide-link" class="size-3.5" />
                  {{ member.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '') || 'Profil' }}
                </a>
              </p>
            </div>
            <div v-if="member.localisation && canSeeField(member, 'localisation')">
              <span class="text-stone-500 dark:text-stone-400">Localisation</span>
              <p class="font-medium text-stone-900 dark:text-white flex items-center gap-1.5">
                <UIcon name="i-lucide-map-pin" class="size-3.5 text-stone-400" />
                {{ member.localisation }}
              </p>
            </div>
            <div v-if="member.date_naissance && canSeeField(member, 'date_naissance')">
              <span class="text-stone-500 dark:text-stone-400">Anniversaire</span>
              <p class="font-medium text-stone-900 dark:text-white flex items-center gap-1.5">
                <UIcon name="i-lucide-cake" class="size-3.5 text-stone-400" />
                {{ formatBirthday(member.date_naissance) }}
              </p>
            </div>
          </div>
        </UCard>

        <!-- Infos contrat (directeur only) -->
        <UCard v-if="isDirecteur">
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Informations contrat</h3>
          </template>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-stone-500 dark:text-stone-400">Debut de contrat</span>
              <p class="font-medium text-stone-900 dark:text-white">{{ formatDateFr(member.date_debut_contrat) }}</p>
            </div>
            <div>
              <span class="text-stone-500 dark:text-stone-400">Fin de contrat</span>
              <p class="font-medium text-stone-900 dark:text-white">{{ formatDateFr(member.date_fin_contrat) }}</p>
            </div>
            <div v-if="member.ecole">
              <span class="text-stone-500 dark:text-stone-400">Ecole</span>
              <p class="font-medium text-stone-900 dark:text-white">{{ member.ecole }}</p>
            </div>
            <div v-if="hasTrialPeriod">
              <span class="text-stone-500 dark:text-stone-400">Fin de periode d'essai</span>
              <p class="font-medium text-stone-900 dark:text-white">{{ formatDateFr(member.date_fin_periode_essai) }}</p>
            </div>
            <div>
              <span class="text-stone-500 dark:text-stone-400">Statut</span>
              <UBadge :color="member.actif ? 'green' : 'red'" variant="subtle" size="sm">
                {{ member.actif ? 'Actif' : 'Inactif' }}
              </UBadge>
            </div>
          </div>
        </UCard>

        <!-- Presence stats (directeur only) -->
        <UCard v-if="isDirecteur && stats">
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Temps de presence</h3>
          </template>
          <div class="space-y-5">
            <div class="grid grid-cols-3 gap-4">
              <div class="text-center p-3 rounded-lg bg-[rgba(175,143,60,0.04)] dark:bg-[rgba(175,143,60,0.03)]">
                <p class="text-2xl font-bold text-stone-900 dark:text-white">{{ stats.workDays }}</p>
                <p class="text-xs text-stone-500 dark:text-stone-400">jours travailles</p>
              </div>
              <div class="text-center p-3 rounded-lg bg-[rgba(175,143,60,0.04)] dark:bg-[rgba(175,143,60,0.03)]">
                <p class="text-2xl font-bold text-stone-900 dark:text-white">{{ stats.workHours.toFixed(1) }}h</p>
                <p class="text-xs text-stone-500 dark:text-stone-400">heures travaillees</p>
              </div>
              <div v-if="stats.schoolDays" class="text-center p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20">
                <p class="text-2xl font-bold text-sky-600 dark:text-sky-400">{{ stats.schoolDays }}</p>
                <p class="text-xs text-stone-500 dark:text-stone-400">jours ecole</p>
              </div>
              <div v-else class="text-center p-3 rounded-lg bg-[rgba(175,143,60,0.04)] dark:bg-[rgba(175,143,60,0.03)]">
                <p class="text-2xl font-bold text-stone-900 dark:text-white">{{ stats.totalDays }}</p>
                <p class="text-xs text-stone-500 dark:text-stone-400">jours presents</p>
              </div>
            </div>

            <!-- Limites stagiaire -->
            <div v-if="isStagiaire && stageLimits" class="space-y-4 pt-2">
              <USeparator />
              <p class="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Limites legales (stage)</p>
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-stone-600 dark:text-stone-300">Seuil gratification</span>
                  <span class="font-medium" :class="stats.totalDays >= stageLimits.gratifDays ? 'text-red-500' : 'text-stone-900 dark:text-white'">
                    {{ stats.totalDays }} / {{ stageLimits.gratifDays }} jours
                    <span class="text-xs text-stone-400 ml-1">({{ stats.totalHours.toFixed(0) }} / {{ stageLimits.gratifHours }}h)</span>
                  </span>
                </div>
                <div class="h-2 bg-[rgba(175,143,60,0.06)] dark:bg-[rgba(175,143,60,0.06)] rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="pct(stats.totalDays, stageLimits.gratifDays) >= 90 ? 'bg-red-500' : pct(stats.totalDays, stageLimits.gratifDays) >= 70 ? 'bg-amber-500' : 'bg-emerald-500'"
                    :style="{ width: pct(stats.totalDays, stageLimits.gratifDays) + '%' }"
                  />
                </div>
                <p v-if="stats.totalDays >= stageLimits.gratifDays" class="text-xs text-red-500 font-medium">Gratification obligatoire</p>
                <p v-else class="text-xs text-stone-400">{{ stageLimits.gratifDays - stats.totalDays }} jours restants avant obligation de gratification</p>
              </div>
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-stone-600 dark:text-stone-300">Duree du contrat</span>
                  <span class="font-medium text-stone-900 dark:text-white">
                    {{ stats.totalDays }} / {{ stageLimits.maxDays }} jours
                    <span class="text-xs text-stone-400 ml-1">({{ stats.totalHours.toFixed(0) }} / {{ stageLimits.maxHours }}h)</span>
                  </span>
                </div>
                <div class="h-2 bg-[rgba(175,143,60,0.06)] dark:bg-[rgba(175,143,60,0.06)] rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all bg-primary" :style="{ width: pct(stats.totalDays, stageLimits.maxDays) + '%' }" />
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Calculateur d'heures (directeur only) -->
        <UCard v-if="isDirecteur">
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Calculateur d'heures</h3>
          </template>
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <UFormField label="Date de debut">
                <UInput v-model="calcDateDebut" type="date" />
              </UFormField>
              <UFormField label="Date de fin">
                <UInput v-model="calcDateFin" type="date" />
              </UFormField>
              <UFormField label="Type">
                <USelectMenu v-model="calcType" :items="calcTypeOptions" value-key="value" />
              </UFormField>
            </div>
            <div v-if="calcResult" class="flex items-center gap-6 p-3 rounded-lg bg-[rgba(175,143,60,0.04)] dark:bg-[rgba(175,143,60,0.03)]">
              <div class="text-center">
                <p class="text-xl font-bold text-stone-900 dark:text-white">{{ calcResult.workDays }}</p>
                <p class="text-xs text-stone-500 dark:text-stone-400">{{ calcType === 'demi_journee' ? 'demi-journees' : 'jours' }}</p>
              </div>
              <div class="text-stone-300 dark:text-stone-600">=</div>
              <div class="text-center">
                <p class="text-xl font-bold text-primary">{{ calcResult.hours.toFixed(1) }}h</p>
                <p class="text-xs text-stone-500 dark:text-stone-400">heures (base 7h/j)</p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Documents (admin only) -->
        <UCard v-if="isDirecteur">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Documents</h3>
              <UButton
                label="Ajouter"
                icon="i-lucide-upload"
                size="xs"
                @click="openUploadModal"
              />
            </div>
          </template>

          <div v-if="docsLoading" class="flex justify-center py-4">
            <UIcon name="i-lucide-loader-2" class="size-4 animate-spin text-primary" />
          </div>

          <div v-else-if="!documents.length" class="text-center py-4">
            <UIcon name="i-lucide-file-x" class="size-6 text-stone-300 dark:text-stone-700 mx-auto mb-1" />
            <p class="text-xs text-stone-400">Aucun document</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="doc in documents"
              :key="doc.id"
              class="flex items-center justify-between p-2.5 rounded-lg bg-[rgba(175,143,60,0.03)] dark:bg-[rgba(175,143,60,0.02)] border border-stone-100 dark:border-stone-800"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <UIcon name="i-lucide-file-text" class="size-4 text-stone-400 shrink-0" />
                <div class="min-w-0">
                  <p class="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{{ doc.nom }}</p>
                  <p class="text-[11px] text-stone-400">{{ formatDateFr(doc.date_created) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <UButton
                  icon="i-lucide-download"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  :href="getFileUrl(doc.fichier)"
                  target="_blank"
                />
                <UButton
                  icon="i-lucide-trash-2"
                  size="xs"
                  variant="ghost"
                  color="error"
                  @click="handleDeleteDoc(doc)"
                />
              </div>
            </div>
          </div>
        </UCard>

        <!-- Quick actions -->
        <div class="flex gap-3">
          <UButton
            :to="`/planning/${member.id}`"
            label="Voir le calendrier"
            icon="i-lucide-calendar"
            variant="subtle"
          />
          <UButton
            v-if="isSelf"
            label="Changer le mot de passe"
            icon="i-lucide-key-round"
            color="neutral"
            variant="subtle"
            @click="openPasswordModal"
          />
        </div>
      </div>

      <!-- ==================== MODE EDITION ==================== -->
      <div v-else class="max-w-2xl mx-auto space-y-6">
        <!-- Identite (tout le monde peut modifier son nom/prenom/email/naissance) -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Identite</h3>
          </template>
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Prenom">
                <UInput v-model="form.first_name" placeholder="Prenom" icon="i-lucide-user" />
              </UFormField>
              <UFormField label="Nom">
                <UInput v-model="form.last_name" placeholder="Nom" icon="i-lucide-user" />
              </UFormField>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Email">
                <UInput v-model="form.email" type="email" placeholder="email@example.com" icon="i-lucide-mail" />
              </UFormField>
              <UFormField label="Date de naissance">
                <UInput v-model="form.date_naissance" type="date" icon="i-lucide-cake" />
              </UFormField>
            </div>
          </div>
        </UCard>

        <!-- Coordonnees (tout le monde) -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Coordonnees</h3>
          </template>
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Telephone">
                <UInput v-model="form.telephone" placeholder="06 12 34 56 78" icon="i-lucide-phone" />
              </UFormField>
              <UFormField label="LinkedIn">
                <UInput v-model="form.linkedin" placeholder="https://linkedin.com/in/..." icon="i-lucide-link" />
              </UFormField>
              <UFormField label="Localisation">
                <UInput v-model="form.localisation" placeholder="Paris, Lyon..." icon="i-lucide-map-pin" />
              </UFormField>
            </div>
            <UFormField label="Presentation">
              <UTextarea v-model="form.bio" placeholder="Quelques mots..." :rows="3" />
            </UFormField>
          </div>
        </UCard>

        <!-- Visibilite -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Visibilite du profil</h3>
            <p class="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Choisissez qui peut voir chaque information</p>
          </template>
          <div class="space-y-3">
            <div
              v-for="field in VISIBILITY_FIELDS"
              :key="field.key"
              class="flex items-center justify-between py-1.5"
            >
              <span class="text-sm text-stone-700 dark:text-stone-300">{{ field.label }}</span>
              <USelect
                v-model="form.visibilite[field.key]"
                :items="VISIBILITY_OPTIONS"
                value-key="value"
                size="xs"
                class="w-40"
              />
            </div>
          </div>
        </UCard>

        <!-- Mot de passe -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Securite</h3>
          </template>
          <div class="flex items-center justify-between">
            <p class="text-sm text-stone-500 dark:text-stone-400">Modifier le mot de passe</p>
            <UButton
              label="Changer"
              icon="i-lucide-key-round"
              color="neutral"
              variant="subtle"
              size="sm"
              @click="openPasswordModal"
            />
          </div>
        </UCard>

        <!-- Champs admin uniquement -->
        <template v-if="isDirecteur">
          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Administration</h3>
            </template>
            <div class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="Role">
                  <USelectMenu v-model="form.role" :items="roleOptions" value-key="value" placeholder="Selectionner un role" />
                </UFormField>
                <UFormField label="Categorie / Pole">
                  <USelectMenu v-model="form.categorie" :items="categoryOptions" value-key="value" placeholder="Selectionner un pole" />
                </UFormField>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Contrat</h3>
            </template>
            <div class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="Type de contrat">
                  <USelectMenu v-model="form.type_contrat" :items="contractTypeOptions" value-key="value" placeholder="Selectionner un type" />
                </UFormField>
                <UFormField label="Statut">
                  <USelect v-model="form.statut_emploi" :items="[{ label: 'A venir', value: 'a_venir' }, { label: 'Actif', value: 'actif' }, { label: 'Termine', value: 'termine' }]" value-key="value" />
                </UFormField>
              </div>
              <UFormField label="Ecole / Universite">
                <UInput v-model="form.ecole" placeholder="Ex: Universite Lyon 1, INSA..." class="w-full" />
              </UFormField>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="Date de debut">
                  <UInput v-model="form.date_debut_contrat" type="date" />
                </UFormField>
                <UFormField label="Date de fin">
                  <UInput v-model="form.date_fin_contrat" type="date" />
                </UFormField>
              </div>
              <UFormField v-if="editHasTrialPeriod" label="Fin de periode d'essai">
                <UInput v-model="form.date_fin_periode_essai" type="date" />
              </UFormField>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Statut</h3>
            </template>
            <div class="flex items-center gap-3">
              <USwitch v-model="form.actif" />
              <span class="text-sm text-stone-700 dark:text-stone-300">
                {{ form.actif ? 'Utilisateur actif' : 'Utilisateur inactif' }}
              </span>
            </div>
          </UCard>
        </template>
      </div>
    </div>

    <!-- Modal suppression -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-red-100 dark:bg-red-900/30 p-2">
              <UIcon name="i-lucide-alert-triangle" class="size-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 class="text-lg font-semibold text-stone-900 dark:text-white">Supprimer cet utilisateur</h3>
          </div>
          <p class="text-sm text-stone-500 dark:text-stone-400">
            Etes-vous sur de vouloir supprimer <strong>{{ member ? getUserName(member) : '' }}</strong> ?
            Cette action est irreversible.
          </p>
          <div class="flex justify-end gap-3">
            <UButton label="Annuler" color="neutral" variant="subtle" @click="showDeleteModal = false" />
            <UButton label="Supprimer" icon="i-lucide-trash-2" color="error" :loading="deleting" @click="handleDelete" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Modal mot de passe -->
    <UModal v-model:open="showPasswordModal">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2">
              <UIcon name="i-lucide-key-round" class="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 class="text-lg font-semibold text-stone-900 dark:text-white">
              {{ isDirecteur && !isSelf ? 'Reinitialiser le mot de passe' : 'Changer le mot de passe' }}
            </h3>
          </div>

          <!-- Admin resetting someone else's password -->
          <template v-if="isDirecteur && !isSelf">
            <p class="text-sm text-stone-500 dark:text-stone-400">
              Un mot de passe a ete genere. Vous pouvez le modifier avant de l'enregistrer.
            </p>
            <UFormField label="Nouveau mot de passe">
              <UInput v-model="newPassword" type="text" />
            </UFormField>
            <div class="flex items-center gap-2">
              <UButton label="Regenerer" icon="i-lucide-refresh-cw" color="neutral" variant="ghost" size="sm" @click="newPassword = generatePassword()" />
              <UButton label="Copier" icon="i-lucide-copy" color="neutral" variant="ghost" size="sm" @click="copyPassword" />
            </div>
          </template>

          <!-- Self password change -->
          <template v-else>
            <UFormField label="Nouveau mot de passe">
              <UInput v-model="newPassword" type="password" placeholder="8 caracteres minimum" />
            </UFormField>
            <UFormField label="Confirmer le mot de passe">
              <UInput v-model="confirmPassword" type="password" placeholder="Ressaisir le mot de passe" />
            </UFormField>
            <p v-if="newPassword && confirmPassword && newPassword !== confirmPassword" class="text-xs text-red-500">
              Les mots de passe ne correspondent pas
            </p>
          </template>

          <div class="flex justify-end gap-3 pt-2">
            <UButton label="Annuler" color="neutral" variant="subtle" @click="showPasswordModal = false" />
            <UButton label="Enregistrer" icon="i-lucide-check" :loading="passwordSaving" :disabled="!passwordValid" @click="handlePasswordSubmit" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Modal upload document -->
    <UModal :open="showUploadModal" @update:open="showUploadModal = $event">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
              <UIcon name="i-lucide-upload" class="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 class="text-lg font-semibold text-stone-900 dark:text-white">Ajouter un document</h3>
          </div>

          <UFormField label="Nom du document" required>
            <UInput v-model="uploadName" placeholder="Ex: Convention de stage" icon="i-lucide-file-text" />
          </UFormField>

          <UFormField label="Fichier" required>
            <div
              class="relative flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-stone-200 dark:border-stone-700 hover:border-primary/40 transition-colors cursor-pointer"
              @click="fileInputRef?.click()"
            >
              <UIcon
                :name="uploadFile ? 'i-lucide-file-check' : 'i-lucide-upload'"
                class="size-5"
                :class="uploadFile ? 'text-emerald-500' : 'text-stone-400'"
              />
              <span class="text-sm" :class="uploadFile ? 'text-stone-800 dark:text-stone-200' : 'text-stone-400'">
                {{ uploadFile ? uploadFile.name : 'Cliquez pour selectionner un fichier' }}
              </span>
              <input
                ref="fileInputRef"
                type="file"
                class="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.odt,.ods,.png,.jpg,.jpeg,.txt,.csv"
                @change="onFileSelect"
              >
            </div>
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton label="Annuler" color="neutral" variant="ghost" @click="showUploadModal = false" />
            <UButton
              label="Envoyer"
              icon="i-lucide-upload"
              :loading="uploading"
              :disabled="!uploadFile || !uploadName.trim()"
              @click="handleUpload"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
