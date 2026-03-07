<script setup lang="ts">
import type { PlanningEntry, UserProfile, Notification, Project, Prospect, OffreEmploi } from '~/utils/types'
import { PLANNING_TYPES, PLANNING_COLORS } from '~/utils/constants'
import { formatDate, getNextWorkingDay } from '~/utils/dates'

const { user, isDirecteur, roleName } = useAuth()
const { getEntries, getTeamEntries, getPresenceStats } = usePlanning()
const { getActiveUsers } = useUsers()
const notifApi = useNotifications()
const projectApi = useProjects()
const prospectApi = useProspects()
const { userSites, loadUserSites, checkSiteStatus, hasSites, sitesLoaded } = useSiteMonitor()
const jobApi = useJobListings()
const { isVisible, planningMode } = useDashboardPreferences()

// ─── State ──────────────────────────────────────────────
const ready = ref(false)
const today = new Date()
const nextDay = getNextWorkingDay(today)
const todayStr = formatDate(today)
const nextDayStr = formatDate(nextDay)

const myEntries = ref<PlanningEntry[]>([])
const allUsers = ref<UserProfile[]>([])
const teamEntries = ref<PlanningEntry[]>([])
const notifications = ref<Notification[]>([])
const myProjects = ref<Project[]>([])
const myProspects = ref<Prospect[]>([])
const siteStatuses = ref<Map<string, { up: boolean; responseTime: number }>>(new Map())
const offres = ref<OffreEmploi[]>([])
const stagData = ref<{ user: UserProfile; totalDays: number; gratifDays: number }[]>([])

// Live clock
const clock = ref(today.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
let clockTimer: ReturnType<typeof setInterval> | null = null

// ─── Computed ───────────────────────────────────────────
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return 'Bonne nuit'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon apres-midi'
  return 'Bonsoir'
})

const userName = computed(() => {
  if (!user.value) return ''
  return user.value.first_name || user.value.email?.split('@')[0] || ''
})

const dateDisplay = computed(() => {
  const s = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
})

const nextDayLabel = computed(() => {
  const tom = new Date(today)
  tom.setDate(tom.getDate() + 1)
  if (formatDate(nextDay) === formatDate(tom)) return 'Demain'
  const name = nextDay.toLocaleDateString('fr-FR', { weekday: 'long' })
  return name.charAt(0).toUpperCase() + name.slice(1)
})

const showNextDay = computed(() => planningMode.value !== 'today')

// ─── Planning helpers ───────────────────────────────────
function getMySlot(date: string, period: 'matin' | 'apres_midi') {
  return myEntries.value.find(e => e.date === date && e.periode === period)
}

function displayKey(entry: PlanningEntry) {
  if (entry.type === 'travail' && entry.motif === 'Teletravail') return 'teletravail'
  return entry.type
}

function slotLabel(entry: PlanningEntry | undefined) {
  if (!entry) return 'Non renseigne'
  const key = displayKey(entry)
  return PLANNING_TYPES[key as keyof typeof PLANNING_TYPES]?.label || PLANNING_TYPES[entry.type]?.label || entry.type
}

function slotIcon(entry: PlanningEntry | undefined) {
  if (!entry) return ''
  const key = displayKey(entry)
  return PLANNING_TYPES[key as keyof typeof PLANNING_TYPES]?.icon || PLANNING_TYPES[entry.type]?.icon || ''
}

function slotClasses(entry: PlanningEntry | undefined) {
  if (!entry) return 'dash-slot-empty'
  const key = displayKey(entry)
  const c = PLANNING_COLORS[key] || PLANNING_COLORS[entry.type]
  return c ? `${c.bg} ${c.text}` : ''
}

// ─── Team helpers ───────────────────────────────────────
interface TeamMember {
  id: string
  name: string
  key: string
  label: string
}

const team = computed<TeamMember[]>(() => {
  if (!user.value) return []
  const result: TeamMember[] = []
  for (const u of allUsers.value) {
    if (u.id === user.value.id) continue
    const ue = teamEntries.value.filter(e => {
      const uid = typeof e.utilisateur === 'string' ? e.utilisateur : e.utilisateur?.id
      return uid === u.id && e.date === todayStr
    })
    if (!ue.length) continue
    const main = ue.find(e => e.periode === 'matin') || ue[0]
    const key = displayKey(main)
    result.push({
      id: u.id,
      name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email,
      key,
      label: PLANNING_TYPES[key as keyof typeof PLANNING_TYPES]?.label || key
    })
  }
  const pres = ['travail', 'teletravail', 'ecole']
  result.sort((a, b) => {
    const ap = pres.includes(a.key) ? 0 : 1
    const bp = pres.includes(b.key) ? 0 : 1
    return ap - bp || a.name.localeCompare(b.name)
  })
  return result
})

const presentCount = computed(() => team.value.filter(m => ['travail', 'teletravail'].includes(m.key)).length)

function dotColor(key: string) {
  return PLANNING_COLORS[key]?.dot || 'bg-stone-400'
}

// ─── Notification helpers ───────────────────────────────
function relTime(d: string) {
  const ms = Date.now() - new Date(d).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1) return "a l'instant"
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}j`
}

function notifIcon(type: string) {
  const icons: Record<string, string> = {
    planning_modifie: 'i-lucide-calendar-check',
    conge_statut: 'i-lucide-palm-tree',
    info: 'i-lucide-info'
  }
  return icons[type] || 'i-lucide-info'
}

async function markRead(id: string) {
  await notifApi.markRead(id)
  notifications.value = await notifApi.getMyUnread()
}

async function markAllRead() {
  await notifApi.markAllRead()
  notifications.value = await notifApi.getMyUnread()
}

// ─── Site helpers ────────────────────────────────────────
function siteUp(id: string) {
  return siteStatuses.value.get(id)?.up
}

// ─── Admin helpers ──────────────────────────────────────
const offresPubliees = computed(() => offres.value.filter(o => o.publie).length)
const offresBrouillons = computed(() => offres.value.filter(o => !o.publie).length)

function stagPct(s: { totalDays: number; gratifDays: number }) {
  return Math.min(Math.round((s.totalDays / s.gratifDays) * 100), 100)
}

function stagBarColor(pct: number) {
  if (pct >= 90) return 'bg-red-500'
  if (pct >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
}

// ─── Data loading ───────────────────────────────────────
async function loadAll() {
  if (!user.value) return

  const tasks: Promise<void>[] = []

  tasks.push((async () => {
    try { myEntries.value = await getEntries(user.value!.id, todayStr, nextDayStr) } catch {}
  })())

  tasks.push((async () => {
    try {
      const users = await getActiveUsers()
      allUsers.value = users
      teamEntries.value = await getTeamEntries(users.map(u => u.id), todayStr, todayStr)
    } catch {}
  })())

  tasks.push((async () => {
    try { notifications.value = await notifApi.getMyUnread() } catch {}
  })())

  tasks.push((async () => {
    try {
      const all = await projectApi.getAll()
      myProjects.value = all.filter((p: Project) => {
        if (p.statut !== 'en_cours') return false
        return p.membres?.some(m => {
          const uid = typeof m.utilisateur === 'string' ? m.utilisateur : m.utilisateur.id
          return uid === user.value!.id
        })
      })
    } catch {}
  })())

  if (roleName.value !== 'Stagiaire') {
    tasks.push((async () => {
      try {
        const all = await prospectApi.getAll()
        myProspects.value = all.filter((p: Prospect) => {
          const pid = typeof p.prospecteur === 'string' ? p.prospecteur : p.prospecteur.id
          return pid === user.value!.id
        })
      } catch {}
    })())
  }

  if (!sitesLoaded.value) {
    tasks.push((async () => { try { await loadUserSites() } catch {} })())
  }

  if (isDirecteur.value) {
    tasks.push((async () => {
      try { offres.value = await jobApi.getAll() } catch {}
    })())
  }

  await Promise.allSettled(tasks)

  // Sites check
  if (userSites.value.length) {
    const results = new Map<string, { up: boolean; responseTime: number }>()
    await Promise.allSettled(userSites.value.map(async site => {
      try {
        const s = await checkSiteStatus(site.url)
        results.set(site.id, s)
      } catch {}
    }))
    siteStatuses.value = results
  }

  // Stagiaires
  if (isDirecteur.value && allUsers.value.length) {
    const stags = allUsers.value.filter(u => u.type_contrat === 'Stage')
    const data: typeof stagData.value = []
    await Promise.allSettled(stags.map(async s => {
      try {
        const start = s.date_debut_contrat || `${today.getFullYear()}-01-01`
        const end = s.date_fin_contrat || `${today.getFullYear()}-12-31`
        const stats = await getPresenceStats(s.id, start, end)
        data.push({ user: s, totalDays: stats?.totalDays || 0, gratifDays: 44 })
      } catch {}
    }))
    stagData.value = data
  }

  ready.value = true
}

onMounted(() => {
  loadAll()
  clockTimer = setInterval(() => {
    clock.value = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }, 60000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<template>
  <div class="dash">
    <!-- ═══ LOADING ═══ -->
    <div v-if="!ready" class="dash-loading">
      <span class="font-fraktur text-5xl leading-none animate-pulse" style="color: var(--gold); opacity: 0.2">G</span>
    </div>

    <div v-else class="dash-content">
      <!-- ═══ MASTHEAD ═══ -->
      <header class="dash-head">
        <h1 class="dash-greeting">{{ greeting }}, {{ userName }}</h1>
        <div class="dash-head-right">
          <span class="dash-clock">{{ clock }}</span>
          <span class="dash-date">{{ dateDisplay }}</span>
        </div>
      </header>

      <div class="dash-rule" />

      <!-- ═══ MAIN: DAY + TEAM ═══ -->
      <div class="dash-main">
        <!-- Your Day -->
        <section v-if="isVisible('weekSummary')" class="dash-section">
          <h2 class="dash-label">Ma journee</h2>

          <div class="dash-day-row">
            <span class="dash-day-name is-today">Aujourd'hui</span>
            <div class="dash-slots">
              <div class="dash-slot" :class="slotClasses(getMySlot(todayStr, 'matin'))">
                <UIcon v-if="slotIcon(getMySlot(todayStr, 'matin'))" :name="slotIcon(getMySlot(todayStr, 'matin'))" class="size-3.5" />
                <span>{{ slotLabel(getMySlot(todayStr, 'matin')) }}</span>
              </div>
              <div class="dash-slot" :class="slotClasses(getMySlot(todayStr, 'apres_midi'))">
                <UIcon v-if="slotIcon(getMySlot(todayStr, 'apres_midi'))" :name="slotIcon(getMySlot(todayStr, 'apres_midi'))" class="size-3.5" />
                <span>{{ slotLabel(getMySlot(todayStr, 'apres_midi')) }}</span>
              </div>
            </div>
          </div>

          <div v-if="showNextDay" class="dash-day-row">
            <span class="dash-day-name">{{ nextDayLabel }}</span>
            <div class="dash-slots">
              <div class="dash-slot" :class="slotClasses(getMySlot(nextDayStr, 'matin'))">
                <UIcon v-if="slotIcon(getMySlot(nextDayStr, 'matin'))" :name="slotIcon(getMySlot(nextDayStr, 'matin'))" class="size-3.5" />
                <span>{{ slotLabel(getMySlot(nextDayStr, 'matin')) }}</span>
              </div>
              <div class="dash-slot" :class="slotClasses(getMySlot(nextDayStr, 'apres_midi'))">
                <UIcon v-if="slotIcon(getMySlot(nextDayStr, 'apres_midi'))" :name="slotIcon(getMySlot(nextDayStr, 'apres_midi'))" class="size-3.5" />
                <span>{{ slotLabel(getMySlot(nextDayStr, 'apres_midi')) }}</span>
              </div>
            </div>
          </div>

          <NuxtLink to="/planning" class="dash-subtle-link">Calendrier complet</NuxtLink>
        </section>

        <!-- Team -->
        <section v-if="isVisible('presence')" class="dash-section">
          <div class="flex items-center justify-between">
            <h2 class="dash-label">L'equipe</h2>
            <span class="dash-hint">{{ presentCount }} present{{ presentCount > 1 ? 's' : '' }}</span>
          </div>

          <div v-if="!team.length" class="dash-muted">Aucun planning renseigne</div>
          <div v-else class="dash-team-list">
            <NuxtLink
              v-for="m in team"
              :key="m.id"
              :to="`/equipe/${m.id}`"
              class="dash-member"
            >
              <span class="dash-dot" :class="dotColor(m.key)" />
              <span class="dash-member-name">{{ m.name }}</span>
              <span class="dash-member-status">{{ m.label }}</span>
            </NuxtLink>
          </div>
          <NuxtLink to="/equipe" class="dash-subtle-link">Voir l'equipe</NuxtLink>
        </section>
      </div>

      <!-- ═══ NOTIFICATIONS ═══ -->
      <section v-if="notifications.length && isVisible('notifications')" class="dash-section dash-notifs">
        <div class="flex items-center justify-between">
          <h2 class="dash-label">
            Notifications
            <span class="dash-badge">{{ notifications.length }}</span>
          </h2>
          <button class="dash-subtle-link" @click="markAllRead">Tout lire</button>
        </div>
        <div class="dash-notif-list">
          <div v-for="n in notifications.slice(0, 5)" :key="n.id" class="dash-notif">
            <UIcon :name="notifIcon(n.type)" class="dash-notif-icon" />
            <p class="dash-notif-text">{{ n.message }}</p>
            <span class="dash-notif-time">{{ relTime(n.date_created) }}</span>
            <div class="dash-notif-actions">
              <NuxtLink v-if="n.lien" :to="n.lien" class="dash-notif-btn">
                <UIcon name="i-lucide-arrow-right" class="size-3" />
              </NuxtLink>
              <button class="dash-notif-btn" @click="markRead(n.id)">
                <UIcon name="i-lucide-check" class="size-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══ STATS TICKER ═══ -->
      <nav class="dash-ticker">
        <NuxtLink v-if="isVisible('activeProjects')" to="/projets" class="dash-tick">
          <span class="dash-tick-num">{{ myProjects.length }}</span>
          <span class="dash-tick-label">Projet{{ myProjects.length !== 1 ? 's' : '' }} actif{{ myProjects.length !== 1 ? 's' : '' }}</span>
        </NuxtLink>

        <NuxtLink v-if="isVisible('prospectSummary') && roleName !== 'Stagiaire'" to="/prospection" class="dash-tick">
          <span class="dash-tick-num">{{ myProspects.length }}</span>
          <span class="dash-tick-label">Prospect{{ myProspects.length !== 1 ? 's' : '' }}</span>
        </NuxtLink>

        <NuxtLink v-if="hasSites && isVisible('siteStatus')" to="/projets/status" class="dash-tick">
          <span class="dash-tick-sites">
            <span
              v-for="site in userSites"
              :key="site.id"
              class="size-2.5 rounded-full transition-colors"
              :class="siteUp(site.id) === undefined ? 'bg-stone-300 dark:bg-stone-600 animate-pulse' : siteUp(site.id) ? 'bg-emerald-500' : 'bg-red-500'"
              :title="site.nom"
            />
          </span>
          <span class="dash-tick-label">Sites</span>
        </NuxtLink>

        <NuxtLink v-if="isDirecteur && isVisible('jobListings')" to="/offres" class="dash-tick">
          <span class="dash-tick-num">{{ offresPubliees }}</span>
          <span class="dash-tick-label">Offre{{ offresPubliees !== 1 ? 's' : '' }} active{{ offresPubliees !== 1 ? 's' : '' }}</span>
        </NuxtLink>
      </nav>

      <!-- ═══ ADMIN: STAGES ═══ -->
      <section v-if="isDirecteur && isVisible('stageTracker') && stagData.length" class="dash-section dash-admin">
        <div class="dash-rule" />
        <h2 class="dash-label">Suivi stagiaires</h2>
        <div class="dash-stag-list">
          <NuxtLink
            v-for="s in stagData"
            :key="s.user.id"
            :to="`/equipe/${s.user.id}`"
            class="dash-stag"
          >
            <span class="dash-stag-name">{{ [s.user.first_name, s.user.last_name].filter(Boolean).join(' ') }}</span>
            <div class="dash-stag-bar">
              <div
                class="dash-stag-fill"
                :class="stagBarColor(stagPct(s))"
                :style="{ width: stagPct(s) + '%' }"
              />
            </div>
            <span class="dash-stag-pct" :class="stagPct(s) >= 90 ? 'text-red-500' : ''">
              {{ s.totalDays }}j
            </span>
            <span v-if="s.totalDays >= s.gratifDays" class="dash-stag-alert">Gratif.</span>
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* ============================
   ROOT
   ============================ */
.dash {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.dash-content {
  max-width: 880px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 32px 48px;
  animation: dash-enter 0.5s ease both;
}

@keyframes dash-enter {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 640px) {
  .dash-content { padding: 20px 16px 32px; }
}

/* Loading */
.dash-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ============================
   MASTHEAD
   ============================ */
.dash-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.dash-greeting {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.6rem;
  font-weight: 400;
  letter-spacing: 0.03em;
  color: #2c2419;
  opacity: 0.85;
}
:global(.dark) .dash-greeting {
  color: #e8e0d0;
}

.dash-head-right {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.dash-clock {
  font-variant-numeric: tabular-nums;
  font-size: 0.85rem;
  color: #AF8F3C;
  opacity: 0.4;
  letter-spacing: 0.06em;
}

.dash-date {
  font-size: 0.8rem;
  color: #AF8F3C;
  opacity: 0.4;
  letter-spacing: 0.06em;
}

@media (max-width: 480px) {
  .dash-greeting { font-size: 1.3rem; }
  .dash-clock { display: none; }
}

/* ============================
   GOLD RULE
   ============================ */
.dash-rule {
  height: 1px;
  background: linear-gradient(90deg, transparent, #AF8F3C, transparent);
  opacity: 0.2;
  margin: 20px 0;
}

/* ============================
   SECTION / LABELS
   ============================ */
.dash-section {
  margin-bottom: 24px;
}

.dash-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #AF8F3C;
  opacity: 0.55;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dash-badge {
  font-size: 10px;
  background: rgba(175, 143, 60, 0.12);
  color: #AF8F3C;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
}

.dash-hint {
  font-size: 11px;
  color: #2c2419;
  opacity: 0.3;
}
:global(.dark) .dash-hint { color: #e8e0d0; }

.dash-muted {
  font-size: 12px;
  color: #2c2419;
  opacity: 0.25;
  padding: 4px 0;
}
:global(.dark) .dash-muted { color: #e8e0d0; }

.dash-subtle-link {
  display: inline-block;
  font-size: 11px;
  color: #AF8F3C;
  opacity: 0.4;
  text-decoration: none;
  margin-top: 10px;
  transition: opacity 0.2s;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}
.dash-subtle-link:hover { opacity: 0.9; }

/* ============================
   MAIN GRID: DAY + TEAM
   ============================ */
.dash-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .dash-main {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

/* ============================
   YOUR DAY
   ============================ */
.dash-day-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.dash-day-name {
  font-size: 12px;
  width: 80px;
  flex-shrink: 0;
  color: #2c2419;
  opacity: 0.35;
}
:global(.dark) .dash-day-name { color: #e8e0d0; }

.dash-day-name.is-today {
  opacity: 0.85;
  font-weight: 600;
  color: #AF8F3C;
}

.dash-slots {
  display: flex;
  gap: 6px;
  flex: 1;
}

.dash-slot {
  flex: 1;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 500;
  transition: transform 0.15s;
}
.dash-slot:hover { transform: scale(1.03); }

.dash-slot-empty {
  background: rgba(175, 143, 60, 0.03);
  color: #2c2419;
  opacity: 0.2;
  border: 1px dashed rgba(175, 143, 60, 0.12);
}
:global(.dark) .dash-slot-empty {
  background: rgba(175, 143, 60, 0.02);
  color: #e8e0d0;
  border-color: rgba(175, 143, 60, 0.08);
}

/* ============================
   TEAM
   ============================ */
.dash-team-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-height: 220px;
  overflow-y: auto;
}

.dash-member {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 6px;
  text-decoration: none;
  transition: background 0.15s;
}
.dash-member:hover {
  background: rgba(175, 143, 60, 0.06);
}

.dash-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dash-member-name {
  font-size: 13px;
  color: #2c2419;
  opacity: 0.7;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
:global(.dark) .dash-member-name { color: #e8e0d0; }

.dash-member-status {
  font-size: 11px;
  color: #2c2419;
  opacity: 0.25;
  flex-shrink: 0;
}
:global(.dark) .dash-member-status { color: #e8e0d0; }

/* ============================
   NOTIFICATIONS
   ============================ */
.dash-notifs {
  margin-bottom: 20px;
}

.dash-notif-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.dash-notif {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background 0.15s;
}
.dash-notif:hover { background: rgba(175, 143, 60, 0.04); }

.dash-notif-icon {
  width: 14px;
  height: 14px;
  color: #AF8F3C;
  opacity: 0.45;
  flex-shrink: 0;
}

.dash-notif-text {
  flex: 1;
  font-size: 13px;
  color: #2c2419;
  opacity: 0.65;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
:global(.dark) .dash-notif-text { color: #e8e0d0; }

.dash-notif-time {
  font-size: 10px;
  color: #2c2419;
  opacity: 0.2;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
:global(.dark) .dash-notif-time { color: #e8e0d0; }

.dash-notif-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}
.dash-notif:hover .dash-notif-actions { opacity: 1; }

.dash-notif-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  color: #AF8F3C;
  opacity: 0.5;
  transition: all 0.15s;
}
.dash-notif-btn:hover {
  opacity: 1;
  background: rgba(175, 143, 60, 0.1);
}

/* ============================
   STATS TICKER
   ============================ */
.dash-ticker {
  display: flex;
  border-top: 1px solid rgba(175, 143, 60, 0.08);
  border-bottom: 1px solid rgba(175, 143, 60, 0.08);
  margin-bottom: 8px;
}

.dash-tick {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 12px;
  text-decoration: none;
  transition: background 0.2s;
}
.dash-tick:hover {
  background: rgba(175, 143, 60, 0.04);
}
.dash-tick:not(:last-child) {
  border-right: 1px solid rgba(175, 143, 60, 0.08);
}

.dash-tick-num {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.4rem;
  color: #2c2419;
  opacity: 0.75;
  line-height: 1;
}
:global(.dark) .dash-tick-num { color: #e8e0d0; }

.dash-tick-label {
  font-size: 11px;
  color: #2c2419;
  opacity: 0.3;
  letter-spacing: 0.04em;
}
:global(.dark) .dash-tick-label { color: #e8e0d0; }

.dash-tick-sites {
  display: flex;
  gap: 5px;
  align-items: center;
}

@media (max-width: 640px) {
  .dash-ticker {
    flex-wrap: wrap;
  }
  .dash-tick {
    min-width: 50%;
  }
  .dash-tick:not(:last-child) {
    border-right: none;
  }
  .dash-tick:nth-child(odd) {
    border-right: 1px solid rgba(175, 143, 60, 0.08);
  }
}

/* ============================
   ADMIN: STAGES
   ============================ */
.dash-admin {
  margin-bottom: 0;
}

.dash-stag-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dash-stag {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px;
  border-radius: 6px;
  text-decoration: none;
  transition: background 0.15s;
}
.dash-stag:hover { background: rgba(175, 143, 60, 0.04); }

.dash-stag-name {
  font-size: 12px;
  width: 90px;
  flex-shrink: 0;
  color: #2c2419;
  opacity: 0.55;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
:global(.dark) .dash-stag-name { color: #e8e0d0; }

.dash-stag-bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(175, 143, 60, 0.08);
  overflow: hidden;
}

.dash-stag-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.8s ease;
}

.dash-stag-pct {
  font-size: 11px;
  width: 28px;
  text-align: right;
  color: #2c2419;
  opacity: 0.35;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
:global(.dark) .dash-stag-pct { color: #e8e0d0; }

.dash-stag-alert {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #ef4444;
  flex-shrink: 0;
}
</style>
