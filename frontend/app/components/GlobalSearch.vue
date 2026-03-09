<script setup lang="ts">
const { query, results, loading, open, toggle } = useGlobalSearch()
const inputRef = ref<HTMLInputElement>()
const selectedIndex = ref(0)

// Keyboard shortcut: Cmd+K / Ctrl+K
if (import.meta.client) {
  useEventListener(document, 'keydown', (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      toggle()
    }
    if (e.key === 'Escape' && open.value) {
      toggle()
    }
  })
}

watch(open, (v) => {
  if (v) {
    selectedIndex.value = 0
    nextTick(() => inputRef.value?.focus())
  }
})

watch(results, () => {
  selectedIndex.value = 0
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter' && results.value[selectedIndex.value]) {
    e.preventDefault()
    navigateTo(results.value[selectedIndex.value].to)
    toggle()
  }
}

function useEventListener(target: EventTarget, event: string, handler: (e: any) => void) {
  onMounted(() => target.addEventListener(event, handler))
  onUnmounted(() => target.removeEventListener(event, handler))
}

const typeLabels: Record<string, string> = {
  membre: 'Membre',
  projet: 'Projet',
  prospect: 'Prospect',
  candidat: 'Candidat',
  wiki: 'Wiki'
}

const typeColors: Record<string, string> = {
  membre: 'blue',
  projet: 'violet',
  prospect: 'amber',
  candidat: 'emerald',
  wiki: 'neutral'
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-150"
      leave-active-class="transition-opacity duration-100"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
        @click="toggle"
      />
    </Transition>

    <!-- Modal -->
    <Transition
      enter-active-class="transition-all duration-150"
      leave-active-class="transition-all duration-100"
      enter-from-class="opacity-0 scale-95"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="open"
        class="fixed inset-x-0 top-[15%] z-[101] mx-auto w-full max-w-lg px-4"
      >
        <div class="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-2xl overflow-hidden">
          <!-- Input -->
          <div class="flex items-center gap-3 px-4 border-b border-stone-100 dark:border-stone-800">
            <UIcon name="i-lucide-search" class="size-5 text-stone-400 shrink-0" />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="Rechercher partout..."
              class="flex-1 py-3.5 text-sm bg-transparent outline-none text-stone-900 dark:text-white placeholder:text-stone-400"
              @keydown="onKeydown"
            >
            <UIcon v-if="loading" name="i-lucide-loader-2" class="size-4 text-primary animate-spin shrink-0" />
            <kbd class="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-stone-400 bg-stone-100 dark:bg-stone-800 rounded">
              ESC
            </kbd>
          </div>

          <!-- Results -->
          <div v-if="results.length" class="max-h-80 overflow-y-auto py-2">
            <button
              v-for="(result, i) in results"
              :key="`${result.type}-${result.id}`"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
              :class="i === selectedIndex ? 'bg-stone-50 dark:bg-stone-800' : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'"
              @click="navigateTo(result.to); toggle()"
              @mouseenter="selectedIndex = i"
            >
              <div class="flex items-center justify-center size-8 rounded-lg bg-stone-100 dark:bg-stone-800 shrink-0">
                <UIcon :name="result.icon" class="size-4 text-stone-500 dark:text-stone-400" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-stone-900 dark:text-white truncate">{{ result.title }}</p>
                <p v-if="result.subtitle" class="text-xs text-stone-400 dark:text-stone-500 truncate">{{ result.subtitle }}</p>
              </div>
              <UBadge :color="(typeColors[result.type] as any)" variant="subtle" size="xs">
                {{ typeLabels[result.type] }}
              </UBadge>
            </button>
          </div>

          <!-- Empty state -->
          <div v-else-if="query.length >= 2 && !loading" class="py-8 text-center">
            <UIcon name="i-lucide-search-x" class="size-8 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
            <p class="text-sm text-stone-400 dark:text-stone-500">Aucun resultat pour "{{ query }}"</p>
          </div>

          <!-- Hint -->
          <div v-else-if="!query" class="py-6 text-center">
            <p class="text-xs text-stone-400 dark:text-stone-500">
              Tapez au moins 2 caracteres pour rechercher
            </p>
            <p class="text-[10px] text-stone-300 dark:text-stone-600 mt-1">
              Membres, projets, prospects, candidats, wiki
            </p>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-4 py-2 border-t border-stone-100 dark:border-stone-800 text-[10px] text-stone-400">
            <div class="flex items-center gap-3">
              <span class="flex items-center gap-1">
                <kbd class="px-1 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-[10px]">&uarr;</kbd>
                <kbd class="px-1 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-[10px]">&darr;</kbd>
                naviguer
              </span>
              <span class="flex items-center gap-1">
                <kbd class="px-1 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-[10px]">&crarr;</kbd>
                ouvrir
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
