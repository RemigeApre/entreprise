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
        <h3 class="text-sm font-semibold">Mes projets actifs</h3>
        <UButton
          label="Tous les projets"
          variant="link"
          size="xs"
          to="/projets"
          trailing-icon="i-lucide-arrow-right"
        />
      </div>
    </template>

    <div v-if="loading" class="flex justify-center py-4">
      <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-primary" />
    </div>

    <div v-else-if="!myProjects.length" class="text-center py-4">
      <p class="text-sm text-stone-500">Aucun projet actif</p>
    </div>

    <div v-else class="space-y-2">
      <NuxtLink
        v-for="project in myProjects.slice(0, 4)"
        :key="project.id"
        :to="`/projets/${project.id}`"
        class="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
      >
        <div class="min-w-0">
          <p class="text-sm font-medium truncate">{{ project.nom }}</p>
          <p v-if="getClientName(project)" class="text-xs text-stone-500 truncate">
            {{ getClientName(project) }}
          </p>
        </div>
        <UBadge
          :color="PROJECT_STATUTS[project.statut]?.color || 'neutral'"
          variant="subtle"
          size="xs"
        >
          {{ PROJECT_STATUTS[project.statut]?.label }}
        </UBadge>
      </NuxtLink>
      <p v-if="myProjects.length > 4" class="text-xs text-stone-400 text-center pt-1">
        +{{ myProjects.length - 4 }} autre(s)
      </p>
    </div>
  </UCard>
</template>
