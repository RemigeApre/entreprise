<script setup lang="ts">
import type { UserProfile } from '~/utils/types'

const { getActiveUsers } = useUsers()
const { getPresenceStats } = usePlanning()

interface StagiaireInfo {
  user: UserProfile
  stats: {
    totalDays: number
    totalHours: number
    workDays: number
    workHours: number
    schoolDays: number
  } | null
  limits: {
    maxDays: number
    maxHours: number
    gratifDays: number
    gratifHours: number
  }
  loading: boolean
}

const stagiaires = ref<StagiaireInfo[]>([])
const loading = ref(true)

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

function pct(value: number, max: number) {
  if (!max) return 0
  return Math.min(Math.round((value / max) * 100), 100)
}

function progressColor(value: number, max: number) {
  const p = pct(value, max)
  if (p >= 90) return 'bg-red-500'
  if (p >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function getUserName(u: UserProfile) {
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}

async function load() {
  loading.value = true
  try {
    const users = await getActiveUsers()
    const stags = users.filter(u => u.type_contrat === 'Stage')

    stagiaires.value = stags.map((user) => {
      const start = user.date_debut_contrat
      const end = user.date_fin_contrat
      let maxDays = 132
      let maxHours = 924
      if (start && end) {
        maxDays = countWorkingDays(new Date(start + 'T00:00:00'), new Date(end + 'T00:00:00'))
        maxHours = maxDays * 7
      }
      return {
        user,
        stats: null,
        limits: { maxDays, maxHours, gratifDays: 44, gratifHours: 308 },
        loading: true
      }
    })

    await Promise.all(stagiaires.value.map(async (s) => {
      try {
        const startDate = s.user.date_debut_contrat || `${new Date().getFullYear()}-01-01`
        const endDate = s.user.date_fin_contrat || `${new Date().getFullYear()}-12-31`
        s.stats = await getPresenceStats(s.user.id, startDate, endDate)
      } catch {
        // Silent fail
      } finally {
        s.loading = false
      }
    }))
  } catch {
    // Silent fail
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold">Suivi stages</h3>
        <UBadge v-if="stagiaires.length" variant="subtle" size="xs">
          {{ stagiaires.length }} stagiaire{{ stagiaires.length > 1 ? 's' : '' }}
        </UBadge>
      </div>
    </template>

    <div v-if="loading" class="flex items-center justify-center h-16">
      <UIcon name="i-lucide-loader-2" class="size-4 text-primary animate-spin" />
    </div>

    <p v-else-if="!stagiaires.length" class="text-[12px] text-stone-400 text-center py-4">Aucun stagiaire actif</p>

    <div v-else class="space-y-3">
      <NuxtLink
        v-for="s in stagiaires"
        :key="s.user.id"
        :to="`/equipe/${s.user.id}`"
        class="block p-2 -mx-1 rounded hover:bg-[rgba(175,143,60,0.04)] transition-colors"
      >
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2">
            <UAvatar :alt="getUserName(s.user)" size="xs" />
            <span class="text-[12px] font-medium">{{ getUserName(s.user) }}</span>
          </div>
          <span v-if="s.stats" class="text-[11px] text-stone-400">
            {{ s.stats.totalDays }}j / {{ s.stats.totalHours.toFixed(0) }}h
          </span>
        </div>

        <div v-if="s.loading" class="h-1.5 bg-[rgba(175,143,60,0.06)] rounded-full animate-pulse" />

        <div v-else-if="s.stats" class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-stone-400 w-10 shrink-0">Gratif.</span>
            <div class="flex-1 h-1 bg-[rgba(175,143,60,0.06)] rounded-full overflow-hidden">
              <div class="h-full rounded-full" :class="progressColor(s.stats.totalDays, s.limits.gratifDays)" :style="{ width: pct(s.stats.totalDays, s.limits.gratifDays) + '%' }" />
            </div>
            <span class="text-[10px] font-medium w-7 text-right" :class="s.stats.totalDays >= s.limits.gratifDays ? 'text-red-500' : 'text-stone-400'">
              {{ pct(s.stats.totalDays, s.limits.gratifDays) }}%
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-stone-400 w-10 shrink-0">Contrat</span>
            <div class="flex-1 h-1 bg-[rgba(175,143,60,0.06)] rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-primary" :style="{ width: pct(s.stats.totalDays, s.limits.maxDays) + '%' }" />
            </div>
            <span class="text-[10px] font-medium text-stone-400 w-7 text-right">
              {{ pct(s.stats.totalDays, s.limits.maxDays) }}%
            </span>
          </div>
          <p v-if="s.stats.totalDays >= s.limits.gratifDays" class="text-[10px] text-red-500 font-medium">
            Gratification obligatoire
          </p>
          <p v-else class="text-[10px] text-stone-400">
            {{ s.limits.gratifDays - s.stats.totalDays }}j avant gratification
          </p>
        </div>
      </NuxtLink>
    </div>
  </UCard>
</template>
