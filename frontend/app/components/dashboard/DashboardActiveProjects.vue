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
        <div class="flex items-center gap-2">
          <div class="dash-card-icon">
            <UIcon name="i-lucide-folder-kanban" class="size-3.5" />
          </div>
          <h3 class="text-sm font-semibold">Mes projets</h3>
          <UBadge v-if="!loading && myProjects.length" variant="subtle" size="xs" color="primary">
            {{ myProjects.length }}
          </UBadge>
        </div>
        <UButton
          label="Tous"
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

    <div v-else-if="!myProjects.length" class="text-center py-5">
      <div class="dash-empty-icon">
        <UIcon name="i-lucide-folder-kanban" class="size-5 text-[#AF8F3C]/30" />
      </div>
      <p class="text-sm text-stone-400 dark:text-stone-500">Aucun projet actif</p>
    </div>

    <div v-else class="space-y-1">
      <NuxtLink
        v-for="project in myProjects.slice(0, 5)"
        :key="project.id"
        :to="`/projets/${project.id}`"
        class="flex items-center justify-between p-2 rounded-lg hover:bg-[rgba(175,143,60,0.05)] dark:hover:bg-[rgba(175,143,60,0.04)] transition-colors"
      >
        <div class="min-w-0">
          <p class="text-sm font-medium truncate text-stone-800 dark:text-stone-200">{{ project.nom }}</p>
          <p v-if="getClientName(project)" class="text-xs text-stone-400 dark:text-stone-500 truncate mt-0.5">
            {{ getClientName(project) }}
          </p>
        </div>
        <UBadge
          :color="PROJECT_STATUTS[project.statut]?.color || 'neutral'"
          variant="subtle"
          size="xs"
          class="shrink-0 ml-2"
        >
          {{ PROJECT_STATUTS[project.statut]?.label }}
        </UBadge>
      </NuxtLink>
      <p v-if="myProjects.length > 5" class="text-xs text-stone-400 text-center pt-2">
        +{{ myProjects.length - 5 }} autre(s)
      </p>
    </div>
  </UCard>
</template>

<style scoped>
.dash-card-icon {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: rgba(175, 143, 60, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #AF8F3C;
}
.dash-empty-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(175, 143, 60, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
}
</style>
