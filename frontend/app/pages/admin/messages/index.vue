<script setup lang="ts">
import { readItems, updateItem, deleteItem } from '@directus/sdk'
import type { ContactMessage } from '~/utils/types'

definePageMeta({ middleware: ['directeur'] })

const { $directus } = useNuxtApp()
const toast = useToast()

const { data: messages, status, refresh } = useAsyncData('admin-contact-messages', async () => {
  return await $directus.request(readItems('contact_messages', {
    fields: ['id', 'last_name', 'first_name', 'contact_email', 'contact_phone', 'contact_postal', 'subject', 'service_interest', 'message', 'statut', 'date_created'],
    sort: ['-date_created'],
    limit: -1,
  })) as ContactMessage[]
})

const filterStatut = ref<string>('')
const statutFilterOptions = [
  { label: 'Tous', value: '' },
  { label: 'Nouveau', value: 'nouveau' },
  { label: 'Lu', value: 'lu' },
  { label: 'Traité', value: 'traite' },
  { label: 'Archivé', value: 'archive' },
]

const filtered = computed(() => {
  if (!messages.value) return []
  if (!filterStatut.value) return messages.value
  return messages.value.filter(m => m.statut === filterStatut.value)
})

const SERVICE_LABELS: Record<string, string> = {
  'creation-vitrine': 'Création · Vitrine',
  'creation-gestion': 'Création · Gestion',
  'creation-e-commerce': 'Création · E-commerce',
  'creation-logiciel': 'Création · Logiciel sur mesure',
  'maintenance-essentiel': 'Maintenance · Essentiel',
  'maintenance-pro': 'Maintenance · Pro',
  'maintenance-premium': 'Maintenance · Premium',
  'maintenance-legendaire': 'Maintenance · Légendaire',
  'hesite': 'Hésite encore',
}

const statutColor = (s?: string) => s === 'nouveau' ? 'warning' : s === 'traite' ? 'success' : s === 'archive' ? 'neutral' : 'info'

function fullName(m: ContactMessage) {
  return [m.first_name, m.last_name].filter(Boolean).join(' ') || m.last_name
}
function formatDate(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function setStatut(m: ContactMessage, statut: ContactMessage['statut']) {
  try {
    await $directus.request(updateItem('contact_messages', m.id, { statut }))
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

async function handleDelete(m: ContactMessage) {
  if (!confirm(`Supprimer le message de ${fullName(m)} ?`)) return
  try {
    await $directus.request(deleteItem('contact_messages', m.id))
    toast.add({ title: 'Message supprimé', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  }
}

// Marque "lu" a l'ouverture (premier rendu) les messages "nouveau" => non, on laisse l'action manuelle.
const newCount = computed(() => messages.value?.filter(m => m.statut === 'nouveau').length ?? 0)
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Messages de contact">
      <template #left>
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" to="/admin" />
      </template>
      <template #right>
        <UBadge v-if="newCount" color="warning" variant="subtle">{{ newCount }} nouveau(x)</UBadge>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="max-w-3xl mx-auto">
        <div class="mb-4 flex items-center gap-2">
          <USelectMenu v-model="filterStatut" :items="statutFilterOptions" value-key="value" class="w-48" />
        </div>

        <div v-if="status === 'pending'" class="flex items-center justify-center py-12 text-stone-500">
          <UIcon name="i-lucide-loader-2" class="size-6 animate-spin" />
        </div>
        <div v-else-if="!filtered.length" class="text-center py-12">
          <p class="text-sm text-stone-500">Aucun message.</p>
        </div>

        <div v-else class="space-y-3">
          <UCard v-for="m in filtered" :key="m.id">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="text-sm font-semibold text-stone-900">{{ fullName(m) }}</p>
                  <UBadge :color="statutColor(m.statut)" variant="subtle" size="sm">{{ m.statut }}</UBadge>
                  <UBadge v-if="m.subject === 'service'" color="info" variant="soft" size="sm">
                    {{ m.service_interest ? (SERVICE_LABELS[m.service_interest] || m.service_interest) : 'Service' }}
                  </UBadge>
                  <UBadge v-else color="neutral" variant="soft" size="sm">Divers</UBadge>
                </div>
                <p class="text-xs text-stone-400 mt-0.5">{{ formatDate(m.date_created) }}</p>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <UButton v-if="m.statut !== 'traite'" icon="i-lucide-check" title="Marquer traité" color="neutral" variant="ghost" size="sm" @click="setStatut(m, 'traite')" />
                <UButton v-if="m.statut === 'nouveau'" icon="i-lucide-mail-open" title="Marquer lu" color="neutral" variant="ghost" size="sm" @click="setStatut(m, 'lu')" />
                <UButton icon="i-lucide-archive" title="Archiver" color="neutral" variant="ghost" size="sm" @click="setStatut(m, 'archive')" />
                <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" @click="handleDelete(m)" />
              </div>
            </div>

            <div class="mt-3 space-y-1.5 text-sm">
              <p v-if="m.contact_email" class="flex items-center gap-2 text-stone-600">
                <UIcon name="i-lucide-mail" class="size-4 text-stone-400" />
                <a :href="`mailto:${m.contact_email}`" class="hover:text-[#af8f3c]">{{ m.contact_email }}</a>
              </p>
              <p v-if="m.contact_phone" class="flex items-center gap-2 text-stone-600">
                <UIcon name="i-lucide-phone" class="size-4 text-stone-400" />
                <a :href="`tel:${m.contact_phone}`" class="hover:text-[#af8f3c]">{{ m.contact_phone }}</a>
              </p>
              <p v-if="m.contact_postal" class="flex items-start gap-2 text-stone-600">
                <UIcon name="i-lucide-map-pin" class="size-4 text-stone-400 mt-0.5" />
                <span class="whitespace-pre-line">{{ m.contact_postal }}</span>
              </p>
            </div>

            <p v-if="m.message" class="mt-3 text-sm text-stone-700 whitespace-pre-line border-l-2 border-stone-200 pl-3">{{ m.message }}</p>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>
