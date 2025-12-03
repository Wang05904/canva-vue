<template>
  <div
    ref="elementRef"
    class="text-element"
    :style="containerStyle"
    :data-element-id="element.id"
    @mousedown="handleMouseDown"
    @dblclick="handleDoubleClick"
  >
    <div
      v-if="element.htmlContent"
      v-html="element.htmlContent"
      class="text-content"
    ></div>
    <div
      v-else
      class="text-content"
    >{{ element.content }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject } from 'vue'
import type { TextElement } from '@/cores/types/element'
import { useElementsStore } from '@/stores/elements'
import { useSelectionStore } from '@/stores/selection'
import { useDragState } from '@/composables/useDragState'
import { useAlignment } from '@/composables/useAlignment'
import type { CanvasService } from '@/services/canvas/CanvasService'

const props = defineProps<{
  element: TextElement
}>()

const emit = defineEmits<{
  dblclick: [elementId: string]
}>()

const elementsStore = useElementsStore()
const selectionStore = useSelectionStore()
const canvasService = inject<CanvasService>('canvasService')
const { startDrag, updateDragOffset, endDrag, getDragState } = useDragState()
const { checkAlignment, clearAlignment } = useAlignment()

const isDragging = ref(false)
const hasMoved = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const elementStartPos = ref({ x: 0, y: 0 })
const elementRef = ref<HTMLElement | null>(null)
let animationFrameId: number | null = null
let initialBoundingBox: { x: number; y: number; width: number; height: number } | null = null
let draggedIds: string[] = []

// 容器样式 - 使用 transform3d 启用 GPU 加速
const containerStyle = computed(() => {
  // 检查是否在全局拖拽中（多选拖拽）
  const dragState = getDragState().value
  const isInGlobalDrag = dragState?.isDragging && dragState.elementIds.includes(props.element.id)

  let x = props.element.x
  let y = props.element.y

  // 在多选拖拽中，如果不是当前拖拽的元素，应用全局偏移
  if (isInGlobalDrag && !isDragging.value && dragState) {
    x += dragState.offset.x
    y += dragState.offset.y
  }

  return {
    position: 'absolute' as const,
    left: '0',
    top: '0',
    width: `${props.element.width}px`,
    height: `${props.element.height}px`,
    transform: `translate3d(${x}px, ${y}px, 0) rotate(${props.element.rotation || 0}rad)`,
    transformOrigin: 'center center',
    opacity: props.element.opacity,
    visibility: (props.element.visible ? 'visible' : 'hidden') as 'visible' | 'hidden',
    pointerEvents: 'auto' as const,
    zIndex: 9999, // 固定高 z-index 确保在所有层之上，能接收事件
    fontSize: `${props.element.fontSize}px`,
    color: props.element.color,
    fontFamily: props.element.fontFamily,
    fontWeight: props.element.fontWeight || 'normal',
    fontStyle: props.element.fontStyle || 'normal',
    textDecoration: props.element.textDecoration || 'none',
    cursor: 'move' as const
  }
})

// 鼠标按下
const handleMouseDown = (e: MouseEvent) => {
  elementRef.value = e.currentTarget as HTMLElement

  const el = elementsStore.getElementById(props.element.id)
  // 如果是组合内子元素，点击时选中其父组合，并禁止单独拖拽
  if (el && el.parentGroup) {
    selectionStore.selectElement(el.parentGroup)
    return
  }

  selectionStore.selectElement(props.element.id)

  isDragging.value = false
  hasMoved.value = false
  dragStartPos.value = { x: e.clientX, y: e.clientY }
  elementStartPos.value = { x: props.element.x, y: props.element.y }

  // 计算初始边界框用于对齐
  draggedIds = [props.element.id]
  initialBoundingBox = {
    x: props.element.x,
    y: props.element.y,
    width: props.element.width,
    height: props.element.height
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 鼠标移动 - 使用 RAF 节流 + 直接操作 DOM
const handleMouseMove = (e: MouseEvent) => {
  const screenDx = e.clientX - dragStartPos.value.x
  const screenDy = e.clientY - dragStartPos.value.y

  // Convert to world coordinates
  const viewport = canvasService?.getViewportService().getViewport()
  const zoom = viewport?.zoom || 1
  const worldDx = screenDx / zoom
  const worldDy = screenDy / zoom

  // 移动超过 3px 才认为是拖拽
  if (!isDragging.value && (Math.abs(screenDx) > 3 || Math.abs(screenDy) > 3)) {
    isDragging.value = true
    hasMoved.value = true
    if (elementRef.value) {
      elementRef.value.style.willChange = 'transform'
    }
    // 通知全局拖拽开始
    startDrag([props.element.id])
  }

  if (!isDragging.value) return

  // 立即更新拖拽偏移（使用世界坐标）
  updateDragOffset({ x: worldDx, y: worldDy })

  // 使用 RAF 节流，避免频繁更新 DOM
  if (animationFrameId !== null) return

  animationFrameId = requestAnimationFrame(() => {
    let finalDx = worldDx
    let finalDy = worldDy

    // 应用对齐吸附
    if (initialBoundingBox) {
      const targetRect = {
        x: initialBoundingBox.x + worldDx,
        y: initialBoundingBox.y + worldDy,
        width: initialBoundingBox.width,
        height: initialBoundingBox.height
      }

      const { dx: snapDx, dy: snapDy } = checkAlignment(targetRect, draggedIds)
      finalDx += snapDx
      finalDy += snapDy
    }

    const newX = elementStartPos.value.x + finalDx
    const newY = elementStartPos.value.y + finalDy

    // 直接操作 DOM，不触发响应式更新
    if (elementRef.value) {
      elementRef.value.style.transform = `translate3d(${newX}px, ${newY}px, 0) rotate(${props.element.rotation || 0}rad)`
    }

    animationFrameId = null
  })
}

// 鼠标抬起 - 只在结束时更新 store
const handleMouseUp = (e: MouseEvent) => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)

  // 取消待处理的动画帧
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  if (hasMoved.value) {
    const screenDx = e.clientX - dragStartPos.value.x
    const screenDy = e.clientY - dragStartPos.value.y
    
    // Convert to world coordinates
    const viewport = canvasService?.getViewportService().getViewport()
    const zoom = viewport?.zoom || 1
    const worldDx = screenDx / zoom
    const worldDy = screenDy / zoom

    // 只在拖拽结束时更新 store
    elementsStore.updateTextElement(props.element.id, {
      x: elementStartPos.value.x + worldDx,
      y: elementStartPos.value.y + worldDy
    })
    elementsStore.saveToLocal()

    // 清理性能优化
    if (elementRef.value) {
      elementRef.value.style.willChange = 'auto'
    }
  }

  // 结束全局拖拽状态
  endDrag()
  clearAlignment()

  isDragging.value = false
  hasMoved.value = false
  elementRef.value = null
  initialBoundingBox = null
  draggedIds = []
}

// 双击进入编辑模式
const handleDoubleClick = () => {
  emit('dblclick', props.element.id)
}
</script>

<style scoped>
.text-element {
  transform-origin: center center;
  /* 拖拽时启用 GPU 加速 */
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.text-element.dragging {
  will-change: transform;
}

.text-content {
  width: 100%;
  height: 100%;
  white-space: pre-wrap; /* 保持所有空格和换行 */
  word-wrap: break-word;
  overflow-wrap: break-word;
  overflow: visible; /* 允许内容溢出，避免文本被裁剪 */
  line-height: 1.5;
  user-select: none;
}

.text-content :deep(p) {
  margin: 0;
  padding: 0;
  min-height: 1.5em; /* 确保空行也有高度 */
}

/* 空段落也要显示 */
.text-content :deep(p:empty::before) {
  content: '\200b'; /* 零宽空格，让空行可见 */
}

.text-content :deep(strong) {
  font-weight: bold;
}

.text-content :deep(em) {
  font-style: italic;
}

.text-content :deep(u) {
  text-decoration: underline;
}

.text-content :deep(s) {
  text-decoration: line-through;
}

.text-content :deep(h1),
.text-content :deep(h2),
.text-content :deep(h3) {
  margin: 0.5em 0;
  font-weight: bold;
}

.text-content :deep(h1) {
  font-size: 2em;
}

.text-content :deep(h2) {
  font-size: 1.5em;
}

.text-content :deep(h3) {
  font-size: 1.2em;
}

.text-content :deep(ul),
.text-content :deep(ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.text-content :deep(li) {
  margin: 0.25em 0;
}
</style>
