<script setup lang="ts">
import type { Prospect } from '~/utils/types'

definePageMeta({ middleware: ['auth'] })

const { isProspecteur } = useAuth()
if (!isProspecteur.value) {
  navigateTo('/prospection')
}

const { getAll } = useProspects()

const { data: allProspects, status } = useAsyncData('clients', getAll)

const search = ref('')

const clients = computed(() => {
  if (!allProspects.value) return []
  return allProspects.value.filter((p: Prospect) => p.statut === 'client')
})

const filteredClients = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return clients.value
  return clients.value.filter((p: Prospect) =>
    [p.nom_entreprise, p.contact_nom, p.ville, p.secteur, p.email, p.telephone]
      .some(f => f?.toLowerCase().includes(q))
  )
})

function getProspecteurName(p: Prospect): string {
  if (!p.prospecteur || typeof p.prospecteur === 'string') return ''
  const { first_name, last_name } = p.prospecteur
  return [first_name, last_name].filter(Boolean).join(' ')
}

function formatDateFr(date: string | null) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Clients">
      <template #right>
        <UButton
          label="Nouveau prospect"
          icon="i-lucide-plus"
          size="sm"
          to="/prospection/nouveau"
        />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <template v-else>
        <!-- Stats + Search -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <span class="text-xs text-[#2c2419]/60 dark:text-stone-400">
            <strong class="text-[#2c2419] dark:text-stone-200">{{ clients.length }}</strong> client{{ clients.length > 1 ? 's' : '' }}
          </span>
          <UInput
            v-if="clients.length"
            v-model="search"
            placeholder="Rechercher..."
            icon="i-lucide-search"
            size="sm"
            class="w-52"
          />
        </div>

        <!-- Empty -->
        <div v-if="!clients.length" class="text-center py-12">
          <UIcon name="i-lucide-building" class="size-10 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
          <p class="text-stone-500 dark:text-stone-400">Aucun client pour le moment</p>
          <p class="text-xs text-stone-400 dark:text-stone-500 mt-1">Les prospects avec le statut "Client" apparaitront ici</p>
          <UButton
            label="Voir les prospects"
            icon="i-lucide-target"
            variant="subtle"
            class="mt-4"
            to="/prospection"
          />
        </div>

        <!-- No results -->
        <div v-else-if="search && !filteredClients.length" class="text-center py-12">
          <p class="text-stone-500 dark:text-stone-400">Aucun client pour "{{ search }}"</p>
          <UButton label="Effacer" icon="i-lucide-x" variant="ghost" size="xs" class="mt-2" @click="search = ''" />
        </div>

        <!-- Cards -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          <NuxtLink
            v-for="client in filteredClients"
            :key="client.id"
            :to="`/prospection/${client.id}`"
            class="block group"
          >
            <div class="relative flex flex-col gap-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/30 p-4 transition-all h-full hover:border-emerald-300 dark:hover:border-emerald-700/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10">
              <!-- Header -->
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-semibold text-[#2c2419] dark:text-stone-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {{ client.nom_entreprise }}
                  </h3>
                  <p v-if="client.contact_nom" class="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                    {{ client.contact_nom }}
                  </p>
                </div>
                <UBadge color="success" variant="subtle" size="xs">Client</UBadge>
              </div>

              <!-- Info -->
              <div class="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                <span class="flex items-center gap-1">
                  <UIcon name="i-lucide-map-pin" class="size-3" />
                  {{ client.ville }}
                </span>
                <span v-if="client.secteur" class="flex items-center gap-1">
                  <UIcon name="i-lucide-briefcase" class="size-3" />
                  {{ client.secteur }}
                </span>
                <span v-if="client.telephone" class="flex items-center gap-1">
                  <UIcon name="i-lucide-phone" class="size-3" />
                  {{ client.telephone }}
                </span>
                <span v-if="client.email" class="flex items-center gap-1">
                  <UIcon name="i-lucide-mail" class="size-3" />
                  {{ client.email }}
                </span>
              </div>

              <!-- Footer -->
              <div class="flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500 mt-auto pt-2 border-t border-stone-100 dark:border-stone-800">
                <span v-if="client.nb_contacts" class="flex items-center gap-1">
                  <UIcon name="i-lucide-message-circle" class="size-3" />
                  {{ client.nb_contacts }} contact{{ client.nb_contacts > 1 ? 's' : '' }}
                </span>
                <span v-else />
                <div class="flex items-center gap-2">
                  <span v-if="getProspecteurName(client)">{{ getProspecteurName(client) }}</span>
                  <span>{{ formatDateFr(client.date_created) }}</span>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>
      </template>
    </div>
  </div>
</template>
