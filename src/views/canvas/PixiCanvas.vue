<!--
View层 - 画布容器组件
职责：提供 PIXI 渲染引擎的挂载点和图片元素渲染
-->
<template>
  <div>
    <top-toolbar />
    <floating-toolbar />
    <image-toolbar />
    <selection-overlay />
    
    <!-- 文本编辑器 -->
    <text-editor 
      ref="textEditorRef"
      v-if="editingTextId"
      :element-id="editingTextId" 
      @close="editingTextId = null"
    />
    
    <!-- 文本编辑工具栏 -->
    <text-editor-toolbar
      v-if="editingTextElement && textEditor && isTextEditing"
      :editor="textEditor"
      :is-editing="true"
      :element-x="editingTextElement.x"
      :element-y="editingTextElement.y"
      :element-width="editingTextElement.width"
    />
    
    <div ref="container" class="pixi-canvas">
      <!-- 渲染图片元素 -->
      <image-element
        v-for="imageEl in imageElements"
        :key="imageEl.id"
        :element="imageEl"
      />
      
      <!-- 渲染文本元素 -->
      <text-element
        v-for="textEl in textElements"
        :key="textEl.id"
        :element="textEl"
        @dblclick="handleTextDoubleClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide, computed } from 'vue'
import Stats from 'stats.js'
import TopToolbar from '../../views/ui/TopToolbar.vue'
import FloatingToolbar from '../../views/ui/FloatingToolbar.vue'
import ImageToolbar from '../../views/ui/toolbar/ImageToolbar.vue'
import SelectionOverlay from '../../views/overlays/SelectionOverlay.vue'
import ImageElement from '../../views/elements/ImageElement.vue'
import TextElement from '../../views/elements/TextElement.vue'
import TextEditor from '../../views/overlays/TextEditor.vue'
import TextEditorToolbar from '../../views/ui/TextEditorToolbar.vue'
import { useCanvas } from '@/composables/useCanvas'
import { useElementsStore } from '@/stores/elements'
import type { ImageElement as ImageElementType, TextElement as TextElementType } from '@/cores/types/element'

const { container, canvasService } = useCanvas()
const elementsStore = useElementsStore()

// 提供 canvasService 给子组件使用
provide('canvasService', canvasService)

// 当前编辑的文本元素ID
const editingTextId = ref<string | null>(null)

// TextEditor 组件引用
const textEditorRef = ref<InstanceType<typeof TextEditor> | null>(null)

// 获取当前编辑的文本元素
const editingTextElement = computed(() => {
  if (!editingTextId.value) return null
  const el = elementsStore.getElementById(editingTextId.value)
  return el?.type === 'text' ? (el as TextElementType) : null
})

// 获取编辑器实例（从 TextEditor 组件暴露的）
const textEditor = computed(() => {
  return textEditorRef.value?.editor || null
})

// 是否正在编辑
const isTextEditing = computed(() => {
  return textEditorRef.value?.isEditing || false
})

// 获取所有图片元素
const imageElements = computed(() => 
  elementsStore.elements.filter(el => el.type === 'image') as ImageElementType[]
)

// 获取所有文本元素（编辑中的文本元素不显示）
const textElements = computed(() => 
  elementsStore.elements.filter(el => 
    el.type === 'text' && el.id !== editingTextId.value
  ) as TextElementType[]
)

// 处理文本双击
const handleTextDoubleClick = (elementId: string) => {
  editingTextId.value = elementId
}

// 监听Escape键退出编辑
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && editingTextId.value) {
    editingTextId.value = null
  }
}

// todo 测试 stats.js 性能监控，正式环境移除
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let stats: any = null
onMounted(() => {
  stats = new Stats()
  stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3: custom
  document.body.appendChild(stats.dom)

  function animate() {
    stats.begin()
    // ...你的渲染逻辑...
    stats.end()
    requestAnimationFrame(animate)
  }
  animate()
  
  // 监听键盘事件
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  if (stats && stats.dom && stats.dom.parentNode) {
    stats.dom.parentNode.removeChild(stats.dom)
  }
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.pixi-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  overflow: hidden;
}
</style>
