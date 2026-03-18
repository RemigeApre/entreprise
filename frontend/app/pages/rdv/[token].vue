<script setup lang="ts">
import type { CanalRdv } from '~/utils/types'

definePageMeta({ layout: false })

const route = useRoute()
const token = route.params.token as string

interface SlotEntry {
  date: string
  slots: Array<{ time: string; canaux: string[] }>
}

interface RdvData {
  candidat: { prenom: string; telephone: string }
  slots: SlotEntry[]
  adressePhysique: string | null
}

const { data, error, status } = await useFetch<RdvData>(`/_check/rdv/${token}`)

const CANAL_CONFIG: Record<CanalRdv, { label: string; icon: string; desc: string }> = {
  visio: { label: 'Discord', icon: 'i-lucide-monitor', desc: 'Entretien en visio via Discord' },
  telephone: { label: 'Téléphone', icon: 'i-lucide-phone', desc: 'Entretien par téléphone' },
  physique: { label: 'En personne', icon: 'i-lucide-map-pin', desc: 'Entretien dans nos locaux' }
}

const availableCanaux = computed<CanalRdv[]>(() => {
  if (!data.value?.slots?.length) return []
  const s = new Set<string>()
  for (const day of data.value.slots) {
    for (const slot of day.slots) {
      for (const c of slot.canaux) s.add(c)
    }
  }
  return Array.from(s) as CanalRdv[]
})

const selectedCanal = ref<CanalRdv | null>(null)
const selectedDate = ref<string | null>(null)
const selectedTime = ref<string | null>(null)
const discordId = ref('')
const telephone = ref('')

// Pre-fill phone from candidat
watch(() => data.value, (val) => {
  if (val?.candidat?.telephone) telephone.value = val.candidat.telephone
}, { immediate: true })

// Reset downstream selections when canal/date changes
watch(selectedCanal, () => { selectedDate.value = null; selectedTime.value = null })
watch(selectedDate, () => { selectedTime.value = null })

const availableDates = computed(() => {
  if (!selectedCanal.value || !data.value?.slots) return []
  return data.value.slots.filter(day =>
    day.slots.some(s => s.canaux.includes(selectedCanal.value!))
  )
})

const timeSlotsForDate = computed(() => {
  if (!selectedDate.value || !selectedCanal.value || !data.value?.slots) return []
  const day = data.value.slots.find(d => d.date === selectedDate.value)
  return (day?.slots || []).filter(s => s.canaux.includes(selectedCanal.value!))
})

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const datesByMonth = computed(() => {
  const months = new Map<string, typeof availableDates.value>()
  for (const entry of availableDates.value) {
    const month = getMonthLabel(entry.date)
    if (!months.has(month)) months.set(month, [])
    months.get(month)!.push(entry)
  }
  return months
})

// Booking
const booking = ref(false)
const booked = ref(false)
const bookingError = ref('')

const canBook = computed(() => {
  if (!selectedCanal.value || !selectedDate.value || !selectedTime.value) return false
  if (selectedCanal.value === 'visio' && !discordId.value.trim()) return false
  return true
})

async function submitBooking() {
  if (!canBook.value) return
  booking.value = true
  bookingError.value = ''
  try {
    const datetime = `${selectedDate.value}T${selectedTime.value}:00`
    await $fetch(`/_check/rdv/${token}`, {
      method: 'POST',
      body: {
        datetime,
        canal: selectedCanal.value,
        discord_id: selectedCanal.value === 'visio' ? discordId.value.trim() : undefined,
        telephone: selectedCanal.value === 'telephone' ? telephone.value.trim() : undefined
      }
    })
    booked.value = true
  } catch (err: any) {
    bookingError.value = err?.data?.message || 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    booking.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F7F0DE] flex flex-col">
    <!-- Header -->
    <div class="bg-[#ede5d0] border-b border-[rgba(175,143,60,0.15)] px-4 py-3 flex items-center gap-3">
      <span class="font-['UnifrakturCook',cursive] text-xl text-[#AF8F3C]">G</span>
      <span class="font-['IM_Fell_DW_Pica',Georgia,serif] text-stone-700 text-sm tracking-wide">Le Geai — Prise de RDV</span>
    </div>

    <div class="flex-1 flex items-start justify-center p-4 sm:p-8">
      <div class="w-full max-w-xl space-y-5">

        <!-- Loading -->
        <div v-if="status === 'pending'" class="text-center py-16">
          <div class="size-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p class="text-sm text-stone-500 mt-3">Chargement...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="text-center py-16 space-y-3">
          <div class="size-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <UIcon name="i-lucide-link-2-off" class="size-6 text-red-500" />
          </div>
          <h1 class="text-lg font-semibold text-stone-800">Lien invalide</h1>
          <p class="text-sm text-stone-500">{{ error.data?.message || 'Ce lien de prise de RDV est invalide ou a expiré.' }}</p>
        </div>

        <!-- Booked confirmation -->
        <div v-else-if="booked" class="text-center py-10 space-y-4">
          <div class="size-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <UIcon name="i-lucide-check" class="size-8 text-green-600" />
          </div>
          <div>
            <h1 class="text-xl font-semibold text-stone-900 mb-1">RDV confirmé !</h1>
            <p class="text-sm text-stone-600">
              Votre entretien est prévu le
              <strong>{{ formatDate(selectedDate!) }}</strong> à <strong>{{ selectedTime }}</strong>
            </p>
            <p v-if="selectedCanal === 'visio'" class="text-sm text-stone-500 mt-1">
              Via Discord — nous vous contacterons à l'heure prévue.
            </p>
            <p v-else-if="selectedCanal === 'telephone'" class="text-sm text-stone-500 mt-1">
              Nous vous appellerons au {{ telephone }}.
            </p>
            <p v-else-if="selectedCanal === 'physique' && data?.adressePhysique" class="text-sm text-stone-500 mt-1">
              {{ data.adressePhysique }}
            </p>
          </div>
          <p class="text-xs text-stone-400">Un email de confirmation vous sera envoyé prochainement.</p>
        </div>

        <!-- Main booking flow -->
        <template v-else-if="data">
          <div>
            <h1 class="text-xl font-semibold text-stone-900 mb-0.5">
              {{ data.candidat.prenom ? `Bonjour ${data.candidat.prenom} !` : 'Prise de RDV' }}
            </h1>
            <p class="text-sm text-stone-500">Choisissez un créneau pour votre entretien avec l'équipe Le Geai.</p>
          </div>

          <!-- No slots -->
          <div v-if="!data.slots.length" class="rounded-xl bg-amber-50 border border-amber-200 p-5 text-center">
            <UIcon name="i-lucide-calendar-x" class="size-8 text-amber-400 mx-auto mb-2" />
            <p class="text-sm font-medium text-amber-800">Aucun créneau disponible pour le moment.</p>
            <p class="text-xs text-amber-600 mt-1">Veuillez contacter le recruteur directement.</p>
          </div>

          <template v-else>
            <!-- Step 1: Canal -->
            <div class="space-y-2">
              <p class="text-xs font-semibold text-stone-400 uppercase tracking-wide">1 · Format de l'entretien</p>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="canal in availableCanaux"
                  :key="canal"
                  class="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center"
                  :class="selectedCanal === canal
                    ? 'border-amber-400 bg-amber-50 text-amber-800'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'"
                  @click="selectedCanal = canal"
                >
                  <UIcon :name="CANAL_CONFIG[canal].icon" class="size-5" />
                  <span class="text-xs font-medium leading-tight">{{ CANAL_CONFIG[canal].label }}</span>
                </button>
              </div>
              <p v-if="selectedCanal === 'physique' && data.adressePhysique" class="text-xs text-stone-500 bg-stone-50 rounded-lg px-3 py-2 border border-stone-200">
                <UIcon name="i-lucide-map-pin" class="size-3 inline mr-1 text-stone-400" />
                {{ data.adressePhysique }}
              </p>
            </div>

            <!-- Step 2: Date -->
            <Transition name="slide-up">
              <div v-if="selectedCanal" class="space-y-2">
                <p class="text-xs font-semibold text-stone-400 uppercase tracking-wide">2 · Choisissez une date</p>
                <div v-if="!availableDates.length" class="text-xs text-stone-400 bg-stone-50 rounded-lg px-3 py-2 border border-stone-200">
                  Aucun créneau disponible pour ce canal. Essayez un autre format.
                </div>
                <div v-else class="space-y-3">
                  <div v-for="[month, days] in datesByMonth" :key="month">
                    <p class="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1.5 capitalize">{{ month }}</p>
                    <div class="flex flex-wrap gap-1.5">
                      <button
                        v-for="day in days"
                        :key="day.date"
                        class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize"
                        :class="selectedDate === day.date
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-amber-300'"
                        @click="selectedDate = day.date"
                      >
                        {{ formatDateShort(day.date) }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- Step 3: Time -->
            <Transition name="slide-up">
              <div v-if="selectedDate && timeSlotsForDate.length" class="space-y-2">
                <p class="text-xs font-semibold text-stone-400 uppercase tracking-wide">3 · Choisissez une heure</p>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="slot in timeSlotsForDate"
                    :key="slot.time"
                    class="px-4 py-2 rounded-lg text-sm font-medium border transition-all"
                    :class="selectedTime === slot.time
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'bg-white border-stone-200 text-stone-700 hover:border-amber-300'"
                    @click="selectedTime = slot.time"
                  >
                    {{ slot.time }}
                  </button>
                </div>
              </div>
            </Transition>

            <!-- Step 4: Contact info -->
            <Transition name="slide-up">
              <div v-if="selectedTime" class="space-y-2">
                <p class="text-xs font-semibold text-stone-400 uppercase tracking-wide">4 · Vos coordonnées</p>
                <div v-if="selectedCanal === 'visio'" class="space-y-1.5">
                  <label class="text-xs text-stone-600">Votre pseudo Discord *</label>
                  <input
                    v-model="discordId"
                    type="text"
                    placeholder="ex: utilisateur"
                    class="w-full h-9 px-3 text-sm rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-amber-400"
                  />
                  <p class="text-xs text-stone-400">Nous vous enverrons une demande d'ami sur Discord.</p>
                </div>
                <div v-else-if="selectedCanal === 'telephone'" class="space-y-1.5">
                  <label class="text-xs text-stone-600">Votre numéro de téléphone *</label>
                  <input
                    v-model="telephone"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    class="w-full h-9 px-3 text-sm rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div v-else-if="selectedCanal === 'physique'" class="rounded-lg bg-stone-50 border border-stone-200 px-3 py-2.5">
                  <p class="text-xs text-stone-600">
                    <UIcon name="i-lucide-info" class="size-3 inline mr-1 text-stone-400" />
                    Présentez-vous à l'heure convenue. Aucune information supplémentaire requise.
                  </p>
                </div>

                <!-- Récap + Submit -->
                <div class="rounded-xl bg-white border border-stone-200 p-4 space-y-3 mt-1">
                  <div class="text-sm space-y-1">
                    <p class="font-medium text-stone-800">Récapitulatif</p>
                    <p class="text-stone-500">
                      <UIcon name="i-lucide-calendar" class="size-3.5 inline mr-1.5" />
                      {{ formatDate(selectedDate!) }} à {{ selectedTime }}
                    </p>
                    <p class="text-stone-500">
                      <UIcon :name="CANAL_CONFIG[selectedCanal!].icon" class="size-3.5 inline mr-1.5" />
                      {{ CANAL_CONFIG[selectedCanal!].label }}
                    </p>
                  </div>

                  <p v-if="bookingError" class="text-xs text-red-600 bg-red-50 rounded px-2 py-1.5 border border-red-200">
                    {{ bookingError }}
                  </p>

                  <button
                    :disabled="!canBook || booking"
                    class="w-full h-10 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    :class="canBook && !booking
                      ? 'bg-[#AF8F3C] text-white hover:bg-[#9a7e35]'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'"
                    @click="submitBooking"
                  >
                    <div v-if="booking" class="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <UIcon v-else name="i-lucide-check" class="size-4" />
                    {{ booking ? 'Confirmation...' : 'Confirmer ce créneau' }}
                  </button>
                </div>
              </div>
            </Transition>
          </template>
        </template>

      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.2s ease;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.slide-up-leave-to {
  opacity: 0;
}

@import url('https://fonts.googleapis.com/css2?family=IM+Fell+DW+Pica&family=UnifrakturCook:wght@700&display=swap');
</style>
