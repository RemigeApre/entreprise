<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] }
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'text-primary underline' }
    }),
    Placeholder.configure({
      placeholder: 'Commencez a ecrire...'
    })
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-stone dark:prose-invert prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-3'
    }
  },
  onUpdate: ({ editor: e }) => {
    emit('update:modelValue', e.getHTML())
  }
})

watch(() => props.modelValue, (val) => {
  if (editor.value && editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val, false)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

function toggleLink() {
  if (!editor.value) return
  if (editor.value.isActive('link')) {
    editor.value.chain().focus().unsetLink().run()
  } else {
    const url = window.prompt('URL du lien :')
    if (url) {
      editor.value.chain().focus().setLink({ href: url }).run()
    }
  }
}

interface ToolbarButton {
  icon: string
  title: string
  action: () => void
  isActive?: () => boolean
}

const toolbarButtons = computed<ToolbarButton[]>(() => {
  if (!editor.value) return []
  const e = editor.value
  return [
    { icon: 'i-lucide-bold', title: 'Gras', action: () => e.chain().focus().toggleBold().run(), isActive: () => e.isActive('bold') },
    { icon: 'i-lucide-italic', title: 'Italique', action: () => e.chain().focus().toggleItalic().run(), isActive: () => e.isActive('italic') },
    { icon: 'i-lucide-strikethrough', title: 'Barre', action: () => e.chain().focus().toggleStrike().run(), isActive: () => e.isActive('strike') },
    { icon: 'i-lucide-heading-2', title: 'Titre 2', action: () => e.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => e.isActive('heading', { level: 2 }) },
    { icon: 'i-lucide-heading-3', title: 'Titre 3', action: () => e.chain().focus().toggleHeading({ level: 3 }).run(), isActive: () => e.isActive('heading', { level: 3 }) },
    { icon: 'i-lucide-heading-4', title: 'Titre 4', action: () => e.chain().focus().toggleHeading({ level: 4 }).run(), isActive: () => e.isActive('heading', { level: 4 }) },
    { icon: 'i-lucide-list', title: 'Liste', action: () => e.chain().focus().toggleBulletList().run(), isActive: () => e.isActive('bulletList') },
    { icon: 'i-lucide-list-ordered', title: 'Liste numerotee', action: () => e.chain().focus().toggleOrderedList().run(), isActive: () => e.isActive('orderedList') },
    { icon: 'i-lucide-code', title: 'Code', action: () => e.chain().focus().toggleCodeBlock().run(), isActive: () => e.isActive('codeBlock') },
    { icon: 'i-lucide-link', title: 'Lien', action: () => toggleLink(), isActive: () => e.isActive('link') },
    { icon: 'i-lucide-minus', title: 'Separateur', action: () => e.chain().focus().setHorizontalRule().run() }
  ]
})
</script>

<template>
  <div class="border border-[rgba(175,143,60,0.1)] rounded-lg overflow-hidden">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-[rgba(175,143,60,0.1)] bg-[rgba(175,143,60,0.04)] dark:bg-[rgba(175,143,60,0.03)]">
      <button
        v-for="btn in toolbarButtons"
        :key="btn.title"
        type="button"
        :title="btn.title"
        class="flex items-center justify-center size-8 rounded transition-colors"
        :class="btn.isActive?.()
          ? 'bg-primary/10 text-primary'
          : 'text-stone-500 dark:text-stone-400 hover:bg-[rgba(175,143,60,0.08)] dark:hover:bg-[rgba(175,143,60,0.08)] hover:text-stone-900 dark:hover:text-white'"
        @click="btn.action"
      >
        <UIcon :name="btn.icon" class="size-4" />
      </button>
    </div>

    <!-- Editor content -->
    <EditorContent :editor="editor" />
  </div>
</template>
