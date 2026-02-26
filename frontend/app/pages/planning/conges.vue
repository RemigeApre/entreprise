<script setup lang="ts">
import type { CongeRequest } from '~/utils/types'

const { user, isDirecteur } = useAuth()
const { getMyRequests, getAllPending, approveRequest, refuseRequest } = useLeaveRequests()
const toast = useToast()

const myRequests = ref<CongeRequest[]>([])
const pendingRequests = ref<CongeRequest[]>([])
const loading = ref(true)
const activeTab = ref('mine')

const responseComment = ref('')
const processingId = ref<string | null>(null)

async function load() {
  if (!user.value) return
  loading.value = true
  try {
    myRequests.value = await getMyRequests(user.value.id)
    if (isDirecteur.value) {
      pendingRequests.value = await getAllPending()
    }
  } finally {
    loading.value = false
  }
}

async function handleApprove(id: string) {
  if (!user.value) return
  processingId.value = id
  try {
    await approveRequest(id, user.value.id, responseComment.value || undefined)
    toast.add({ title: 'Demande approuvee', color: 'success' })
    responseComment.value = ''
    load()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    processingId.value = null
  }
}

async function handleRefuse(id: string) {
  if (!user.value) return
  processingId.value = id
  try {
    await refuseRequest(id, user.value.id, responseComment.value || undefined)
    toast.add({ title: 'Demande refusee', color: 'warning' })
    responseComment.value = ''
    load()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    processingId.value = null
  }
}

function getStatusColor(statut: string) {
  return statut === 'approuve' ? 'green' : statut === 'refuse' ? 'red' : 'yellow'
}

function getStatusLabel(statut: string) {
  return statut === 'approuve' ? 'Approuve' : statut === 'refuse' ? 'Refuse' : 'En attente'
}

function getUserName(req: CongeRequest) {
  if (typeof req.demandeur === 'string') return req.demandeur
  const { first_name, last_name } = req.demandeur
  return [first_name, last_name].filter(Boolean).join(' ')
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col h-full">
    <UDashboardNavbar title="Demandes de conges">
      <template #right>
        <UButton
          label="Mon planning"
          icon="i-lucide-calendar"
          color="neutral"
          variant="ghost"
          to="/planning"
        />
      </template>
    </UDashboardNavbar>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <UTabs
        v-if="isDirecteur"
        :items="[
          { label: 'Mes demandes', value: 'mine' },
          { label: `A valider (${pendingRequests.length})`, value: 'pending' }
        ]"
        v-model="activeTab"
        class="mb-6"
      />

      <!-- My requests -->
      <div v-if="activeTab === 'mine'" class="space-y-3">
        <div v-if="loading" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-primary" />
        </div>

        <div v-else-if="!myRequests.length" class="text-center py-8">
          <UIcon name="i-lucide-inbox" class="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p class="text-gray-500 dark:text-gray-400">Aucune demande de conge</p>
        </div>

        <UCard v-for="req in myRequests" :key="req.id">
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ CONGE_TYPES[req.type_conge] }}
                </span>
                <UBadge :color="getStatusColor(req.statut)" variant="subtle" size="sm">
                  {{ getStatusLabel(req.statut) }}
                </UBadge>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Du {{ new Date(req.date_debut).toLocaleDateString('fr-FR') }}
                au {{ new Date(req.date_fin).toLocaleDateString('fr-FR') }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-300">{{ req.motif }}</p>
              <p v-if="req.reponse_commentaire" class="text-sm text-gray-500 dark:text-gray-400 italic">
                Reponse : {{ req.reponse_commentaire }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Pending requests (Directeur only) -->
      <div v-if="activeTab === 'pending' && isDirecteur" class="space-y-3">
        <div v-if="!pendingRequests.length" class="text-center py-8">
          <UIcon name="i-lucide-check-circle" class="size-10 text-green-500 mx-auto mb-3" />
          <p class="text-gray-500 dark:text-gray-400">Aucune demande en attente</p>
        </div>

        <UCard v-for="req in pendingRequests" :key="req.id">
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900 dark:text-white">
                    {{ getUserName(req) }}
                  </span>
                  <UBadge variant="subtle" size="sm">
                    {{ CONGE_TYPES[req.type_conge] }}
                  </UBadge>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Du {{ new Date(req.date_debut).toLocaleDateString('fr-FR') }}
                  au {{ new Date(req.date_fin).toLocaleDateString('fr-FR') }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-300">{{ req.motif }}</p>
              </div>
            </div>

            <div class="flex items-end gap-3">
              <UFormField label="Commentaire (optionnel)" class="flex-1">
                <UInput v-model="responseComment" placeholder="Ajouter un commentaire..." size="sm" />
              </UFormField>
              <UButton
                label="Approuver"
                icon="i-lucide-check"
                color="green"
                size="sm"
                :loading="processingId === req.id"
                @click="handleApprove(req.id)"
              />
              <UButton
                label="Refuser"
                icon="i-lucide-x"
                color="red"
                variant="subtle"
                size="sm"
                :loading="processingId === req.id"
                @click="handleRefuse(req.id)"
              />
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
