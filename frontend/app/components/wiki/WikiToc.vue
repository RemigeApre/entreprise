<script setup lang="ts">
const props = defineProps<{
  html: string
  forceVisible?: boolean
}>()

const emit = defineEmits<{
  navigate: []
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
    emit('navigate')
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
  <nav v-if="items.length > 0" :class="{ 'hidden lg:block': !forceVisible }">
    <p class="toc-title">
      <UIcon name="i-lucide-list" class="size-3.5" />
      Sommaire
    </p>
    <ul class="toc-list">
      <li
        v-for="item in items"
        :key="item.id"
        :class="item.level === 3 ? 'pl-4' : ''"
      >
        <button
          class="toc-item"
          :class="{ 'is-active': activeId === item.id }"
          @click="scrollTo(item.id)"
        >
          <span class="toc-indicator" />
          {{ item.text }}
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.toc-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #AF8F3C;
  opacity: 0.6;
  margin-bottom: 12px;
}

.toc-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-left: 1px solid rgba(175, 143, 60, 0.1);
}

.toc-item {
  display: flex;
  align-items: center;
  gap: 0;
  text-align: left;
  width: 100%;
  padding: 5px 10px;
  font-size: 13px;
  line-height: 1.4;
  border-radius: 0 6px 6px 0;
  color: #78716c;
  transition: all 0.15s;
  cursor: pointer;
  background: none;
  border: none;
  position: relative;
}
:global(.dark) .toc-item {
  color: #a8a29e;
}

.toc-item:hover {
  color: #292524;
  background: rgba(175, 143, 60, 0.04);
}
:global(.dark) .toc-item:hover {
  color: #fafaf9;
  background: rgba(175, 143, 60, 0.06);
}

.toc-item.is-active {
  color: #AF8F3C;
  font-weight: 500;
  background: rgba(175, 143, 60, 0.06);
}

.toc-indicator {
  position: absolute;
  left: -1px;
  top: 4px;
  bottom: 4px;
  width: 2px;
  border-radius: 1px;
  background: transparent;
  transition: background 0.15s;
}

.toc-item.is-active .toc-indicator {
  background: #AF8F3C;
}
</style>
