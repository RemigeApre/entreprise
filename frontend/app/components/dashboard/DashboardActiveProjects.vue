<script setup lang="ts">
import type { Project } from '~/utils/types'
import { PROJECT_STATUTS } from '~/utils/constants'

const { user } = useAuth()
const { getAll } = useProjects()

const loading = ref(true)
const myProjects = ref<Project[]>([])

async function load() {
  if (!user.value) return
  loading.value = true
  try {
    const all = await getAll()
    myProjects.value = all.filter((p: Project) => {
      if (p.statut !== 'en_cours') return false
      if (!p.membres) return false
      return p.membres.some(m => {
        const uid = typeof m.utilisateur === 'string' ? m.utilisateur : m.utilisateur.id
        return uid === user.value!.id
      })
    })
  } finally {
    loading.value = false
  }
}

function getClientName(project: Project) {
  if (!project.client || typeof project.client === 'string') return null
  return project.client.nom_entreprise
}

onMounted(load)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold">Mes projets</h3>
        <UButton label="Tous" variant="link" size="xs" to="/projets" trailing-icon="i-lucide-arrow-right" />
      </div>
    </template>

    <div v-if="loading" class="flex items-center justify-center h-16">
      <UIcon name="i-lucide-loader-2" class="size-4 animate-spin text-primary" />
    </div>

    <p v-else-if="!myProjects.length" class="text-[12px] text-stone-400 text-center py-4">Aucun projet actif</p>

    <div v-else class="space-y-0.5">
      <NuxtLink
        v-for="project in myProjects.slice(0, 5)"
        :key="project.id"
        :to="`/projets/${project.id}`"
        class="flex items-center justify-between py-1.5 px-1 rounded hover:bg-[rgba(175,143,60,0.04)] transition-colors"
      >
        <div class="min-w-0">
          <p class="text-[12px] font-medium truncate">{{ project.nom }}</p>
          <p v-if="getClientName(project)" class="text-[11px] text-stone-400 truncate">{{ getClientName(project) }}</p>
        </div>
        <UBadge :color="PROJECT_STATUTS[project.statut]?.color || 'neutral'" variant="subtle" size="xs" class="shrink-0 ml-2">
          {{ PROJECT_STATUTS[project.statut]?.label }}
        </UBadge>
      </NuxtLink>
      <p v-if="myProjects.length > 5" class="text-[11px] text-stone-400 text-center pt-1">+{{ myProjects.length - 5 }} autre(s)</p>
    </div>
  </UCard>
</template>
