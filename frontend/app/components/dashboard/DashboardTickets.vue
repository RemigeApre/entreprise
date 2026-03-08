<script setup lang="ts">
import type { Ticket } from '~/utils/types'
import { TICKET_TYPES, TICKET_STATUTS, TICKET_PRIORITES } from '~/utils/constants'

const { getAll } = useTickets()
const { user } = useAuth()

const tickets = ref<Ticket[]>([])
const loading = ref(true)

const myTickets = computed(() => {
  if (!user.value) return []
  return tickets.value
    .filter(t => t.statut !== 'ferme' && t.statut !== 'resolu')
    .filter(t => {
      const assigneId = typeof t.assigne_a === 'object' && t.assigne_a ? t.assigne_a.id : t.assigne_a
      const rapporteurId = typeof t.rapporte_par === 'object' && t.rapporte_par ? t.rapporte_par.id : t.rapporte_par
      return assigneId === user.value!.id || rapporteurId === user.value!.id
    })
    .slice(0, 5)
})

const critiques = computed(() => tickets.value.filter(t => t.priorite === 'critique' && t.statut !== 'ferme' && t.statut !== 'resolu').length)

onMounted(async () => {
  try {
    tickets.value = await getAll()
  } catch { /* silent */ } finally {
    loading.value = false
  }
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold">Tickets</h3>
        <div class="flex items-center gap-2">
          <UBadge v-if="critiques" color="red" variant="subtle" size="xs">
            {{ critiques }} critique{{ critiques > 1 ? 's' : '' }}
          </UBadge>
          <NuxtLink to="/projets/tickets" class="text-[11px] text-primary hover:underline">Voir tout</NuxtLink>
        </div>
      </div>
    </template>

    <div v-if="loading" class="flex justify-center py-4">
      <UIcon name="i-lucide-loader-2" class="size-5 text-primary animate-spin" />
    </div>

    <div v-else-if="!myTickets.length" class="text-center py-4">
      <p class="text-[11px] text-stone-400 dark:text-stone-500">Aucun ticket actif</p>
    </div>

    <div v-else class="space-y-2">
      <NuxtLink
        v-for="ticket in myTickets"
        :key="ticket.id"
        to="/projets/tickets"
        class="flex items-center gap-2.5 rounded-lg p-2 -mx-2 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
      >
        <UIcon
          :name="TICKET_PRIORITES[ticket.priorite]?.icon || 'i-lucide-minus'"
          class="size-3.5 shrink-0"
          :class="{
            'text-red-500': ticket.priorite === 'critique',
            'text-orange-500': ticket.priorite === 'haute',
            'text-blue-500': ticket.priorite === 'normale',
            'text-stone-400': ticket.priorite === 'basse'
          }"
        />
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-stone-700 dark:text-stone-300 truncate">{{ ticket.titre }}</p>
          <div class="flex items-center gap-1.5 mt-0.5">
            <UBadge :color="(TICKET_TYPES[ticket.type]?.color as any) || 'neutral'" variant="subtle" size="xs">
              {{ TICKET_TYPES[ticket.type]?.label }}
            </UBadge>
            <UBadge :color="(TICKET_STATUTS[ticket.statut]?.color as any) || 'neutral'" variant="subtle" size="xs">
              {{ TICKET_STATUTS[ticket.statut]?.label }}
            </UBadge>
          </div>
        </div>
      </NuxtLink>
    </div>
  </UCard>
</template>
