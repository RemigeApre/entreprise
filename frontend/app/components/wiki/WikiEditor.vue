<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Underline } from '@tiptap/extension-underline'
import { Highlight } from '@tiptap/extension-highlight'
import { TextAlign } from '@tiptap/extension-text-align'
import { Image } from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'

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
    }),
    Underline,
    Highlight.configure({ multicolor: false }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Image.configure({ inline: false, allowBase64: true }),
    Table.configure({ resizable: false }),
    TableRow,
    TableCell,
    TableHeader
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-stone prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-3'
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

function insertImage() {
  if (!editor.value) return
  const url = window.prompt('URL de l\'image :')
  if (url) {
    editor.value.chain().focus().setImage({ src: url }).run()
  }
}

function insertTable() {
  if (!editor.value) return
  editor.value.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}

interface ToolbarGroup {
  buttons: ToolbarButton[]
}

interface ToolbarButton {
  icon: string
  title: string
  action: () => void
  isActive?: () => boolean
}

const toolbarGroups = computed<ToolbarGroup[]>(() => {
  if (!editor.value) return []
  const e = editor.value
  return [
    {
      buttons: [
        { icon: 'i-lucide-bold', title: 'Gras', action: () => e.chain().focus().toggleBold().run(), isActive: () => e.isActive('bold') },
        { icon: 'i-lucide-italic', title: 'Italique', action: () => e.chain().focus().toggleItalic().run(), isActive: () => e.isActive('italic') },
        { icon: 'i-lucide-underline', title: 'Souligne', action: () => e.chain().focus().toggleUnderline().run(), isActive: () => e.isActive('underline') },
        { icon: 'i-lucide-strikethrough', title: 'Barre', action: () => e.chain().focus().toggleStrike().run(), isActive: () => e.isActive('strike') },
        { icon: 'i-lucide-highlighter', title: 'Surligner', action: () => e.chain().focus().toggleHighlight().run(), isActive: () => e.isActive('highlight') }
      ]
    },
    {
      buttons: [
        { icon: 'i-lucide-heading-2', title: 'Titre 2', action: () => e.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => e.isActive('heading', { level: 2 }) },
        { icon: 'i-lucide-heading-3', title: 'Titre 3', action: () => e.chain().focus().toggleHeading({ level: 3 }).run(), isActive: () => e.isActive('heading', { level: 3 }) },
        { icon: 'i-lucide-heading-4', title: 'Titre 4', action: () => e.chain().focus().toggleHeading({ level: 4 }).run(), isActive: () => e.isActive('heading', { level: 4 }) }
      ]
    },
    {
      buttons: [
        { icon: 'i-lucide-align-left', title: 'Aligner a gauche', action: () => e.chain().focus().setTextAlign('left').run(), isActive: () => e.isActive({ textAlign: 'left' }) },
        { icon: 'i-lucide-align-center', title: 'Centrer', action: () => e.chain().focus().setTextAlign('center').run(), isActive: () => e.isActive({ textAlign: 'center' }) },
        { icon: 'i-lucide-align-right', title: 'Aligner a droite', action: () => e.chain().focus().setTextAlign('right').run(), isActive: () => e.isActive({ textAlign: 'right' }) }
      ]
    },
    {
      buttons: [
        { icon: 'i-lucide-list', title: 'Liste', action: () => e.chain().focus().toggleBulletList().run(), isActive: () => e.isActive('bulletList') },
        { icon: 'i-lucide-list-ordered', title: 'Liste numerotee', action: () => e.chain().focus().toggleOrderedList().run(), isActive: () => e.isActive('orderedList') },
        { icon: 'i-lucide-text-quote', title: 'Citation', action: () => e.chain().focus().toggleBlockquote().run(), isActive: () => e.isActive('blockquote') },
        { icon: 'i-lucide-code', title: 'Code', action: () => e.chain().focus().toggleCodeBlock().run(), isActive: () => e.isActive('codeBlock') }
      ]
    },
    {
      buttons: [
        { icon: 'i-lucide-link', title: 'Lien', action: () => toggleLink(), isActive: () => e.isActive('link') },
        { icon: 'i-lucide-image', title: 'Image', action: () => insertImage() },
        { icon: 'i-lucide-table', title: 'Tableau', action: () => insertTable() },
        { icon: 'i-lucide-minus', title: 'Separateur', action: () => e.chain().focus().setHorizontalRule().run() }
      ]
    },
    {
      buttons: [
        { icon: 'i-lucide-undo', title: 'Annuler', action: () => e.chain().focus().undo().run() },
        { icon: 'i-lucide-redo', title: 'Refaire', action: () => e.chain().focus().redo().run() }
      ]
    }
  ]
})
</script>

<template>
  <div class="wiki-editor">
    <!-- Toolbar -->
    <div class="wiki-editor-toolbar">
      <template v-for="(group, gi) in toolbarGroups" :key="gi">
        <div class="wiki-editor-group">
          <button
            v-for="btn in group.buttons"
            :key="btn.title"
            type="button"
            :title="btn.title"
            class="wiki-editor-btn"
            :class="{ 'is-active': btn.isActive?.() }"
            @click="btn.action"
          >
            <UIcon :name="btn.icon" class="size-4" />
          </button>
        </div>
        <div v-if="gi < toolbarGroups.length - 1" class="wiki-editor-sep" />
      </template>
    </div>

    <!-- Editor content -->
    <EditorContent :editor="editor" />
  </div>
</template>

<style scoped>
.wiki-editor {
  border: 1px solid rgba(175, 143, 60, 0.12);
  border-radius: 10px;
  overflow: hidden;
  background: white;
}
:global(.dark) .wiki-editor {
  background: rgba(175, 143, 60, 0.02);
}

.wiki-editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(175, 143, 60, 0.1);
  background: rgba(175, 143, 60, 0.03);
}
:global(.dark) .wiki-editor-toolbar {
  background: rgba(175, 143, 60, 0.04);
}

.wiki-editor-group {
  display: flex;
  align-items: center;
  gap: 1px;
}

.wiki-editor-sep {
  width: 1px;
  height: 20px;
  background: rgba(175, 143, 60, 0.12);
  margin: 0 4px;
  flex-shrink: 0;
}

.wiki-editor-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition: all 0.15s;
  color: #78716c;
  cursor: pointer;
  background: none;
  border: none;
}
:global(.dark) .wiki-editor-btn {
  color: #a8a29e;
}

.wiki-editor-btn:hover {
  background: rgba(175, 143, 60, 0.08);
  color: #292524;
}
:global(.dark) .wiki-editor-btn:hover {
  background: rgba(175, 143, 60, 0.1);
  color: #fafaf9;
}

.wiki-editor-btn.is-active {
  background: rgba(175, 143, 60, 0.12);
  color: #AF8F3C;
}

/* Table styles inside editor */
:deep(.ProseMirror table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}
:deep(.ProseMirror th),
:deep(.ProseMirror td) {
  border: 1px solid rgba(175, 143, 60, 0.15);
  padding: 6px 10px;
  text-align: left;
  min-width: 80px;
}
:deep(.ProseMirror th) {
  background: rgba(175, 143, 60, 0.06);
  font-weight: 600;
}

/* Image styles */
:deep(.ProseMirror img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 1em 0;
}

/* Blockquote */
:deep(.ProseMirror blockquote) {
  border-left: 3px solid rgba(175, 143, 60, 0.3);
  padding-left: 1em;
  color: #78716c;
  font-style: italic;
}

/* Highlight */
:deep(.ProseMirror mark) {
  background: rgba(175, 143, 60, 0.2);
  border-radius: 2px;
  padding: 0 2px;
}
</style>
