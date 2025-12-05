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
    <mini-map />

    <!-- 文本编辑工具栏 - 使用屏幕坐标，所以放在外面 -->
    <text-editor-toolbar
      v-if="editingTextElement && textEditor && isTextEditing"
      :editor="textEditor"
      :is-editing="true"
      :element-x="editingTextElement.x"
      :element-y="editingTextElement.y"
      :element-width="editingTextElement.width"
    />

    <div ref="container" class="pixi-canvas">
      <!-- 背景网格 -->
      <grid-background />

      <!-- 世界容器 - 跟随画布变换 -->
      <div class="world-container" :style="worldContainerStyle" :class="{ 'panning': isPanning }">
        <!-- 对齐辅助线 -->
        <guidelines-overlay class="no-pointer-events" />

        <!-- 渲染图片元素 -->
        <image-element
          v-for="imageEl in imageElements"
          :key="imageEl.id"
          :element="imageEl"
        />
      </div>

      <!-- 文本元素独立容器 - 移到外面确保能接收事件 -->
      <div class="text-container" :style="worldContainerStyle" :class="{ 'panning': isPanning }">
        <text-element
          v-for="textEl in textElements"
          :key="textEl.id"
          :element="textEl"
          @dblclick="handleTextDoubleClick"
        />

        <!-- 文本编辑器 - 使用世界坐标，放在 text-container 内跟随变换 -->
        <text-editor
          ref="textEditorRef"
          v-if="editingTextId"
          :element-id="editingTextId"
          @close="editingTextId = null"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide, computed } from 'vue'
import { storeToRefs } from 'pinia'
import TopToolbar from '../../views/ui/TopToolbar.vue'
import FloatingToolbar from '../../views/ui/FloatingToolbar.vue'
import ImageToolbar from '../../views/ui/toolbar/ImageToolbar.vue'
import SelectionOverlay from '../../views/overlays/SelectionOverlay.vue'
import GridBackground from '../../views/canvas/GridBackground.vue'
import MiniMap from '../../views/canvas/MiniMap.vue'
import GuidelinesOverlay from '../overlays/GuidelinesOverlay.vue'
import ImageElement from '../../views/elements/ImageElement.vue'
import TextElement from '../../views/elements/TextElement.vue'
import TextEditor from '../../views/overlays/TextEditor.vue'
import TextEditorToolbar from '../../views/ui/TextEditorToolbar.vue'
import { useCanvas } from '@/composables/useCanvas'
import { useElementsStore } from '@/stores/elements'
import { useCanvasStore } from '@/stores/canvas'
import type { ImageElement as ImageElementType, TextElement as TextElementType } from '@/cores/types/element'

const { container, canvasService } = useCanvas()
const elementsStore = useElementsStore()
const canvasStore = useCanvasStore()
const { viewport } = storeToRefs(canvasStore)

// 平移状态（根据当前工具判断）
const isPanning = computed(() => canvasStore.currentTool === 'pan')

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
const imageElements = computed(() => {
  return elementsStore.elements.filter(el => el.type === 'image') as ImageElementType[]
})

// 获取所有文本元素（编辑中的文本元素不显示）
const textElements = computed(() => {
  return elementsStore.elements.filter(el =>
    el.type === 'text' && el.id !== editingTextId.value
  ) as TextElementType[]
})

// 世界容器样式 - 跟随画布变换（与 PIXI worldContainer 保持一致）
const worldContainerStyle = computed(() => {
  const v = viewport.value
  const canvasWidth = window.innerWidth
  const canvasHeight = window.innerHeight

  // 与 RenderService.updateViewportTransform 保持一致的变换逻辑
  const translateX = canvasWidth / 2 - v.x * v.zoom
  const translateY = canvasHeight / 2 - v.y * v.zoom

  return {
    position: 'absolute' as const,
    left: '0',
    top: '0',
    width: '100%',
    height: '100%',
    transformOrigin: '0 0',
    transform: `translate(${translateX}px, ${translateY}px) scale(${v.zoom})`
  }
})

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

onMounted(() => {
  // 监听键盘事件
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
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

.world-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  pointer-events: none;
}

.world-container > *:not(.no-pointer-events) {
  pointer-events: auto;
}

/* 平移时禁用所有元素交互 */
.world-container.panning > * {
  pointer-events: none !important;
}

.text-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100; /* 比 world-container 更高 */
  pointer-events: none; /* 容器不接收事件 */
}

.text-container > * {
  pointer-events: auto; /* 文本元素接收事件 */
}

/* 平移时禁用所有文本元素交互 */
.text-container.panning > * {
  pointer-events: none !important;
}
</style>
