<script setup lang="ts">
import type { UserProfile } from '~/utils/types'

const route = useRoute()
const { isDirecteur } = useAuth()
const { getUserById } = useUsers()
const { getPresenceStats } = usePlanning()

const userId = route.params.userId as string

const { data: member, status } = useAsyncData(`user-${userId}`, () => getUserById(userId))

// --- Stats (admin only) ---
const stats = ref<{
  totalHalfDays: number
  totalHours: number
  totalDays: number
  workHours: number
  workDays: number
  schoolHours: number
  schoolDays: number
} | null>(null)
const statsLoading = ref(false)

const isStagiaire = computed(() => {
  if (!member.value) return false
  return member.value.type_contrat === 'Stage'
})

// Telephone visible: directeur voit tout, autres ne voient pas le tel des stagiaires
const canSeePhone = computed(() => {
  if (isDirecteur.value) return true
  return !isStagiaire.value
})

const hasTrialPeriod = computed(() => {
  if (!member.value) return true
  return member.value.type_contrat !== 'Stage' && member.value.type_contrat !== 'Freelance'
})

// Limites stagiaires (droit francais)
// Gratification obligatoire au-dela de 2 mois (44 jours ou 308h)
const stageLimits = computed(() => {
  if (!isStagiaire.value || !member.value) return null
  const start = member.value.date_debut_contrat
  const end = member.value.date_fin_contrat
  if (!start || !end) return { maxDays: 132, maxHours: 924, gratifDays: 44, gratifHours: 308 }

  const totalWorkingDays = countWorkingDays(new Date(start + 'T00:00:00'), new Date(end + 'T00:00:00'))
  const totalMaxHours = totalWorkingDays * 7

  return {
    maxDays: totalWorkingDays,
    maxHours: totalMaxHours,
    gratifDays: 44,
    gratifHours: 308
  }
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
  } catch {
    // Silent fail
  } finally {
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

const calcResult = computed(() => {
  if (!calcDateDebut.value || !calcDateFin.value) return null
  const start = new Date(calcDateDebut.value + 'T00:00:00')
  const end = new Date(calcDateFin.value + 'T00:00:00')
  if (start > end) return null

  const workDays = countWorkingDays(start, end)
  const multiplier = calcType.value === 'demi_journee' ? 0.5 : 1
  const days = workDays * multiplier
  const hours = days * 7

  return { workDays: days, hours }
})

const calcTypeOptions = [
  { label: 'Journees completes', value: 'journee' },
  { label: 'Demi-journees', value: 'demi_journee' }
]

// --- Helpers ---
function getUserName(u: UserProfile) {
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}

function getRoleName(u: UserProfile) {
  if (typeof u.role === 'string') return ''
  return u.role.name
}

function getCategoryName(u: UserProfile) {
  if (!u.categorie || typeof u.categorie === 'string') return null
  return u.categorie.nom
}

function formatDateFr(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function pct(value: number, max: number) {
  if (!max) return 0
  return Math.min(Math.round((value / max) * 100), 100)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <UDashboardNavbar :title="member ? getUserName(member) : 'Profil'">
      <template #right>
        <UButton
          label="Retour"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          to="/equipe"
        />
      </template>
    </UDashboardNavbar>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <div v-else-if="member" class="max-w-2xl space-y-6">
        <!-- Profile header -->
        <UCard>
          <div class="flex items-center gap-4">
            <UAvatar :alt="getUserName(member)" size="xl" />
            <div class="min-w-0 flex-1">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ getUserName(member) }}
              </h2>
              <p class="text-gray-500 dark:text-gray-400">{{ member.email }}</p>
              <div class="flex items-center gap-2 mt-2">
                <UBadge variant="subtle">{{ getRoleName(member) }}</UBadge>
                <UBadge v-if="getCategoryName(member)" variant="outline" color="neutral">
                  {{ getCategoryName(member) }}
                </UBadge>
                <UBadge v-if="member.type_contrat" variant="outline" color="neutral">
                  {{ member.type_contrat }}
                </UBadge>
              </div>
              <div v-if="member.bio" class="mt-2 text-sm text-stone-600 dark:text-stone-400 italic">
                {{ member.bio }}
              </div>
            </div>
          </div>
        </UCard>

        <!-- Coordonnees -->
        <UCard v-if="member.telephone || member.linkedin || member.localisation">
          <template #header>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Coordonnees</h3>
          </template>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div v-if="member.telephone && canSeePhone">
              <span class="text-gray-500 dark:text-gray-400">Telephone</span>
              <p class="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                <UIcon name="i-lucide-phone" class="size-3.5 text-stone-400" />
                {{ member.telephone }}
              </p>
            </div>
            <div v-if="member.linkedin">
              <span class="text-gray-500 dark:text-gray-400">LinkedIn</span>
              <p class="font-medium">
                <a :href="member.linkedin" target="_blank" rel="noopener" class="text-primary hover:underline flex items-center gap-1.5">
                  <UIcon name="i-lucide-link" class="size-3.5" />
                  {{ member.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '') || 'Profil' }}
                </a>
              </p>
            </div>
            <div v-if="member.localisation">
              <span class="text-gray-500 dark:text-gray-400">Localisation</span>
              <p class="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                <UIcon name="i-lucide-map-pin" class="size-3.5 text-stone-400" />
                {{ member.localisation }}
              </p>
            </div>
          </div>
        </UCard>

        <!-- Contract info (Directeur only) -->
        <UCard v-if="isDirecteur">
          <template #header>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Informations contrat</h3>
          </template>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Debut de contrat</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ formatDateFr(member.date_debut_contrat) }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Fin de contrat</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ formatDateFr(member.date_fin_contrat) }}</p>
            </div>
            <div v-if="hasTrialPeriod">
              <span class="text-gray-500 dark:text-gray-400">Fin de periode d'essai</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ formatDateFr(member.date_fin_periode_essai) }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Statut</span>
              <UBadge :color="member.actif ? 'green' : 'red'" variant="subtle" size="sm">
                {{ member.actif ? 'Actif' : 'Inactif' }}
              </UBadge>
            </div>
          </div>
        </UCard>

        <!-- Temps de presence (Directeur only) -->
        <UCard v-if="isDirecteur && stats">
          <template #header>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Temps de presence</h3>
          </template>

          <div class="space-y-5">
            <!-- Stats principales -->
            <div class="grid grid-cols-3 gap-4">
              <div class="text-center p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50">
                <p class="text-2xl font-bold text-stone-900 dark:text-white">{{ stats.workDays }}</p>
                <p class="text-xs text-stone-500 dark:text-stone-400">jours travailles</p>
              </div>
              <div class="text-center p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50">
                <p class="text-2xl font-bold text-stone-900 dark:text-white">{{ stats.workHours.toFixed(1) }}h</p>
                <p class="text-xs text-stone-500 dark:text-stone-400">heures travaillees</p>
              </div>
              <div v-if="stats.schoolDays" class="text-center p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20">
                <p class="text-2xl font-bold text-sky-600 dark:text-sky-400">{{ stats.schoolDays }}</p>
                <p class="text-xs text-stone-500 dark:text-stone-400">jours ecole</p>
              </div>
              <div v-else class="text-center p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50">
                <p class="text-2xl font-bold text-stone-900 dark:text-white">{{ stats.totalDays }}</p>
                <p class="text-xs text-stone-500 dark:text-stone-400">jours presents</p>
              </div>
            </div>

            <!-- Limites stagiaire -->
            <div v-if="isStagiaire && stageLimits" class="space-y-4 pt-2">
              <USeparator />

              <p class="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Limites legales (stage)</p>

              <!-- Seuil gratification (44j / 308h) -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-stone-600 dark:text-stone-300">Seuil gratification</span>
                  <span class="font-medium" :class="stats.totalDays >= stageLimits.gratifDays ? 'text-red-500' : 'text-stone-900 dark:text-white'">
                    {{ stats.totalDays }} / {{ stageLimits.gratifDays }} jours
                    <span class="text-xs text-stone-400 ml-1">({{ stats.totalHours.toFixed(0) }} / {{ stageLimits.gratifHours }}h)</span>
                  </span>
                </div>
                <div class="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="pct(stats.totalDays, stageLimits.gratifDays) >= 90 ? 'bg-red-500' : pct(stats.totalDays, stageLimits.gratifDays) >= 70 ? 'bg-amber-500' : 'bg-emerald-500'"
                    :style="{ width: pct(stats.totalDays, stageLimits.gratifDays) + '%' }"
                  />
                </div>
                <p v-if="stats.totalDays >= stageLimits.gratifDays" class="text-xs text-red-500 font-medium">
                  Gratification obligatoire
                </p>
                <p v-else class="text-xs text-stone-400">
                  {{ stageLimits.gratifDays - stats.totalDays }} jours restants avant obligation de gratification
                </p>
              </div>

              <!-- Duree max contrat -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-stone-600 dark:text-stone-300">Duree du contrat</span>
                  <span class="font-medium text-stone-900 dark:text-white">
                    {{ stats.totalDays }} / {{ stageLimits.maxDays }} jours
                    <span class="text-xs text-stone-400 ml-1">({{ stats.totalHours.toFixed(0) }} / {{ stageLimits.maxHours }}h)</span>
                  </span>
                </div>
                <div class="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all bg-primary"
                    :style="{ width: pct(stats.totalDays, stageLimits.maxDays) + '%' }"
                  />
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Calculateur d'heures (Directeur only) -->
        <UCard v-if="isDirecteur">
          <template #header>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Calculateur d'heures</h3>
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
                <USelectMenu
                  v-model="calcType"
                  :items="calcTypeOptions"
                  value-key="value"
                />
              </UFormField>
            </div>

            <div v-if="calcResult" class="flex items-center gap-6 p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50">
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

        <!-- Quick actions -->
        <div class="flex gap-3">
          <UButton
            :to="`/planning/${member.id}`"
            label="Voir le calendrier"
            icon="i-lucide-calendar"
            variant="subtle"
          />
          <UButton
            v-if="isDirecteur"
            :to="`/admin/utilisateurs/${member.id}`"
            label="Modifier"
            icon="i-lucide-pencil"
            variant="subtle"
            color="neutral"
          />
        </div>
      </div>
    </div>
  </div>
</template>
