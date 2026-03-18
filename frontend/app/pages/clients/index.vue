<script setup lang="ts">
import type { Prospect } from '~/utils/types'

const { getClients } = useProspects()
const { data: clients, status } = useAsyncData('clients', getClients)

const search = ref('')

const filteredClients = computed(() => {
  if (!clients.value) return []
  const q = search.value.toLowerCase()
  if (!q) return clients.value
  return clients.value.filter((p: Prospect) =>
    [p.nom_entreprise, p.contact_nom, p.ville, p.secteur, p.email, p.telephone]
      .some(f => f?.toLowerCase().includes(q))
  )
})

function getProspecteurName(p: Prospect): string {
  if (!p.prospecteur || typeof p.prospecteur === 'string') return ''
  return [p.prospecteur.first_name, p.prospecteur.last_name].filter(Boolean).join(' ')
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
        <UInput
          v-if="clients && clients.length"
          v-model="search"
          placeholder="Rechercher..."
          icon="i-lucide-search"
          size="sm"
          class="w-full sm:w-52"
        />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-circle" class="size-8 text-primary animate-spin" />
      </div>

      <template v-else>
        <!-- Compteur -->
        <div v-if="clients && clients.length" class="text-xs text-stone-400">
          <strong class="text-stone-700">{{ filteredClients.length }}</strong>
          <span v-if="search && filteredClients.length !== clients.length"> sur {{ clients.length }}</span>
          client{{ (clients.length > 1 ? 's' : '') }}
        </div>

        <!-- Vide -->
        <div v-if="!clients || !clients.length" class="text-center py-16">
          <UIcon name="i-lucide-building" class="size-10 text-stone-200 mx-auto mb-3" />
          <p class="text-stone-500 font-medium">Aucun client pour le moment</p>
          <p class="text-xs text-stone-400 mt-1">Les prospects passés au statut "Client" apparaissent ici</p>
          <UButton label="Voir les prospects" icon="i-lucide-target" variant="subtle" class="mt-4" to="/prospection" />
        </div>

        <!-- Pas de résultats -->
        <div v-else-if="search && !filteredClients.length" class="text-center py-12">
          <p class="text-stone-500">Aucun résultat pour "{{ search }}"</p>
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
            <div class="flex flex-col gap-2.5 rounded-xl border border-emerald-200/70 p-4 transition-all h-full hover:border-emerald-300 hover:bg-emerald-50/30">
              <!-- Header -->
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-semibold text-stone-900 truncate group-hover:text-emerald-700 transition-colors">
                    {{ client.nom_entreprise }}
                  </h3>
                  <p v-if="client.contact_nom" class="text-[11px] text-stone-500 truncate">
                    {{ client.contact_nom }}
                  </p>
                </div>
                <UBadge color="success" variant="subtle" size="xs">Client</UBadge>
              </div>

              <!-- Infos -->
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500">
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
              <div class="flex items-center justify-between text-[11px] text-stone-400 mt-auto pt-2 border-t border-stone-100">
                <span class="flex items-center gap-1">
                  <UIcon v-if="client.nb_contacts" name="i-lucide-message-circle" class="size-3" />
                  {{ client.nb_contacts ? `${client.nb_contacts} contact${client.nb_contacts > 1 ? 's' : ''}` : '' }}
                </span>
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
