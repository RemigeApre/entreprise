<script setup lang="ts">
const STORAGE_KEY = 'intranet_notepad'
const open = ref(false)
const content = ref('')

onMounted(() => {
  content.value = localStorage.getItem(STORAGE_KEY) || ''
})

function onInput() {
  localStorage.setItem(STORAGE_KEY, content.value)
}

function clear() {
  content.value = ''
  localStorage.removeItem(STORAGE_KEY)
}

const hasContent = computed(() => content.value.trim().length > 0)
</script>

<template>
  <div class="notepad-wrapper">
    <!-- Toggle button -->
    <button
      class="notepad-toggle"
      :class="{ 'is-open': open, 'has-content': hasContent && !open }"
      @click="open = !open"
    >
      <UIcon :name="open ? 'i-lucide-x' : 'i-lucide-sticky-note'" class="size-4" />
    </button>

    <!-- Panel -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      leave-active-class="transition-all duration-150 ease-in"
      enter-from-class="opacity-0 translate-y-2 scale-95"
      leave-to-class="opacity-0 translate-y-2 scale-95"
    >
      <div v-if="open" class="notepad-panel">
        <div class="notepad-header">
          <span class="notepad-title">Notes rapides</span>
          <button v-if="hasContent" class="notepad-clear" @click="clear">
            <UIcon name="i-lucide-trash-2" class="size-3" />
            Effacer
          </button>
        </div>
        <textarea
          v-model="content"
          class="notepad-textarea"
          placeholder="Ecrivez ici... sauvegarde auto dans le navigateur"
          @input="onInput"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.notepad-wrapper {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 50;
  display: none;
}
@media (min-width: 1024px) {
  .notepad-wrapper { display: block; }
}

.notepad-toggle {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(175, 143, 60, 0.15);
  color: #8a7d6b;
  box-shadow: 0 2px 8px rgba(44, 36, 25, 0.08);
  transition: all 0.2s;
  position: absolute;
  bottom: 0;
  right: 0;
}
.notepad-toggle:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #af8f3c;
  box-shadow: 0 2px 12px rgba(44, 36, 25, 0.12);
}
.notepad-toggle.is-open {
  background: #2c2419;
  color: white;
  border-color: transparent;
}
.notepad-toggle.has-content::after {
  content: '';
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #af8f3c;
}

.notepad-panel {
  position: absolute;
  bottom: 48px;
  right: 0;
  width: 300px;
  max-height: 400px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(175, 143, 60, 0.15);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(44, 36, 25, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notepad-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(175, 143, 60, 0.08);
}

.notepad-title {
  font-size: 12px;
  font-weight: 600;
  color: #2c2419;
  letter-spacing: 0.02em;
}

.notepad-clear {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #a09080;
  transition: color 0.15s;
}
.notepad-clear:hover {
  color: #b74d34;
}

.notepad-textarea {
  flex: 1;
  padding: 12px 14px;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 14px;
  line-height: 1.6;
  color: #2c2419;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  min-height: 200px;
  max-height: 340px;
}
.notepad-textarea::placeholder {
  color: #c0b8a8;
}
</style>
