<!--
  文本编辑器组件
  功能：在画布上提供可编辑的文本区域
-->
<template>
  <div
    v-if="isEditing && element"
    class="text-editor-overlay"
    :style="editorStyle"
    @mousedown.stop
    @click.stop
  >
    <EditorContent v-if="editor" :editor="editor as any" class="editor-content" />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { EditorContent } from '@tiptap/vue-3'
import { useTextEditor } from '@/composables/useTextEditor'
import { useElementsStore } from '@/stores/elements'
import type { TextElement } from '@/cores/types/element'

const props = defineProps<{
  elementId: string | null
}>()

const emit = defineEmits<{
  close: []
}>()

const elementsStore = useElementsStore()
const { editor, isEditing, createEditor, destroyEditor, getTextContent } = useTextEditor()

// 暴露编辑器实例给父组件
defineExpose({
  editor,
  isEditing
})

// 获取当前编辑的元素
const element = computed(() => {
  if (!props.elementId) return null
  const el = elementsStore.getElementById(props.elementId)
  return el?.type === 'text' ? (el as TextElement) : null
})

// 编辑器样式 - 使用世界坐标，会被 text-container 的变换影响
const editorStyle = computed(() => {
  if (!element.value) return {}
  
  return {
    position: 'absolute' as const,
    left: `${element.value.x}px`,
    top: `${element.value.y}px`,
    minWidth: `${element.value.width}px`,
    maxWidth: '400px',
    minHeight: `${element.value.height}px`,
    height: 'auto',
    transform: `rotate(${element.value.rotation || 0}deg)`,
    transformOrigin: 'top left',
    zIndex: 10000 // 确保在文本元素上面
  }
})

// 监听元素ID变化，创建或销毁编辑器
watch(
  () => props.elementId,
  (newId) => {
    if (newId && element.value) {
      // 开始编辑
      createEditor(element.value, (html) => {
        // 实时更新元素内容
        if (element.value) {
          const text = getTextContent()

          // 获取编辑器实际尺寸
          const editorElement = editor.value?.view.dom as HTMLElement
          if (editorElement) {
            const actualHeight = editorElement.scrollHeight
            const actualWidth = editorElement.scrollWidth
            const minHeight = 50
            const minWidth = 150
            const maxWidth = 800

            elementsStore.updateTextElement(element.value.id, {
              content: text,
              htmlContent: html,
              // 自动更新高度和宽度以适应内容
              height: Math.max(actualHeight + 16, minHeight),
              width: Math.min(Math.max(actualWidth + 16, minWidth), maxWidth)
            })
          } else {
            elementsStore.updateTextElement(element.value.id, {
              content: text,
              htmlContent: html
            })
          }
        }
      })
    } else {
      // 结束编辑
      destroyEditor()
    }
  },
  { immediate: true }
)

// 点击外部关闭编辑器
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.text-editor-overlay') && !target.closest('.text-toolbar')) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  destroyEditor()
})
</script>

<style scoped>
.text-editor-overlay {
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #4A90E2;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: visible;
  transform-origin: top left;
}

.editor-content {
  width: auto; /* 允许宽度自动调整 */
  min-width: 100%;
  height: 100%;
  padding: 8px;
}

.editor-content :deep(.tiptap-editor) {
  outline: none;
  min-height: 100%;
  line-height: 1.5;
  white-space: pre-wrap; /* 保持空格和换行 */
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.editor-content :deep(.tiptap-editor p) {
  margin: 0;
  padding: 0;
  min-height: 1.5em; /* 确保空行也有高度 */
}

/* 空段落也要显示 */
.editor-content :deep(.tiptap-editor p:empty::before) {
  content: '\200b'; /* 零宽空格，让空行可见 */
}

.editor-content :deep(.tiptap-editor strong) {
  font-weight: bold;
}

.editor-content :deep(.tiptap-editor em) {
  font-style: italic;
}

.editor-content :deep(.tiptap-editor u) {
  text-decoration: underline;
}

.editor-content :deep(.tiptap-editor s) {
  text-decoration: line-through;
}

.editor-content :deep(.tiptap-editor h1) {
  font-size: 2em;
  font-weight: bold;
  margin: 0.5em 0;
}

.editor-content :deep(.tiptap-editor h2) {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0.5em 0;
}

.editor-content :deep(.tiptap-editor h3) {
  font-size: 1.2em;
  font-weight: bold;
  margin: 0.5em 0;
}

.editor-content :deep(.tiptap-editor ul),
.editor-content :deep(.tiptap-editor ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.editor-content :deep(.tiptap-editor li) {
  margin: 0.25em 0;
}
</style>
