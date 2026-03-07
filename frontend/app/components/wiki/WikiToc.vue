<script setup lang="ts">
const props = defineProps<{
  html: string
}>()

interface TocItem {
  id: string
  text: string
  level: number
}

const items = computed<TocItem[]>(() => {
  if (!props.html) return []
  const parser = new DOMParser()
  const doc = parser.parseFromString(props.html, 'text/html')
  const headings = doc.querySelectorAll('h2, h3')
  const result: TocItem[] = []
  headings.forEach((h) => {
    const text = h.textContent?.trim() || ''
    if (!text) return
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    result.push({
      id,
      text,
      level: parseInt(h.tagName[1])
    })
  })
  return result
})

const activeId = ref('')

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeId.value = id
  }
}

let observer: IntersectionObserver | null = null

function setupObserver() {
  observer?.disconnect()
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id
        }
      }
    },
    { rootMargin: '-10% 0px -70% 0px' }
  )
  for (const item of items.value) {
    const el = document.getElementById(item.id)
    if (el) observer.observe(el)
  }
}

onMounted(() => {
  nextTick(() => setupObserver())
})

watch(() => props.html, () => {
  nextTick(() => setupObserver())
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <nav v-if="items.length > 0" class="hidden lg:block">
    <p class="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3">
      Sommaire
    </p>
    <ul class="space-y-1 text-sm">
      <li
        v-for="item in items"
        :key="item.id"
        :class="item.level === 3 ? 'pl-4' : ''"
      >
        <button
          class="text-left w-full py-1 px-2 rounded transition-colors truncate"
          :class="activeId === item.id
            ? 'text-primary bg-primary/5 font-medium'
            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-[rgba(175,143,60,0.06)] dark:hover:bg-[rgba(175,143,60,0.06)]'"
          @click="scrollTo(item.id)"
        >
          {{ item.text }}
        </button>
      </li>
    </ul>
  </nav>
</template>
