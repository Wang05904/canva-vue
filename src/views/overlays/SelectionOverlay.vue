<!--
  选中框组件 - 支持拖拽移动
  优化策略：
  1. 拖拽时直接操作 DOM transform，不触发 Vue 响应式
  2. 使用 RAF 节流，避免过度渲染
  3. 拖拽结束时才更新 Store
-->
<template>
  <div class="selection-overlay">
    <!-- 选中元素的边框 -->
    <div
      v-if="selectedIds.length >= 1 && boundingBox"
      class="selection-box single"
      :style="{
        transform: `translate3d(${boundingBox.x}px, ${boundingBox.y}px, 0)`,
        width: boundingBox.width + 'px',
        height: boundingBox.height + 'px'
      }"
      @mousedown="startDrag"
    >
      <!-- 四个角的控制点 -->
      <div
        class="resize-handle top-left"
        @mousedown="(e) => startResize(e, 'top-left')"
      ></div>
      <div
        class="resize-handle top-right"
        @mousedown="(e) => startResize(e, 'top-right')"
      ></div>
      <div
        class="resize-handle bottom-left"
        @mousedown="(e) => startResize(e, 'bottom-left')"
      ></div>
      <div
        class="resize-handle bottom-right"
        @mousedown="(e) => startResize(e, 'bottom-right')"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, inject, onUnmounted } from 'vue'
import { useSelectionStore } from '@/stores/selection'
import { useElementsStore } from '@/stores/elements'
import { useDragSync } from '@/composables/useDragSync'
import { useDragState } from '@/composables/useDragState'
import type { CanvasService } from '@/services/canvas/CanvasService'
import { SelectionService } from '@/services/selection/SelectionService'

const selectionStore = useSelectionStore()
const elementsStore = useElementsStore()

// 注入 canvasService
const canvasService = inject<CanvasService>('canvasService')
const { syncDragPosition } = canvasService ? useDragSync(canvasService) : { syncDragPosition: () => {} }
const { getDragState, startDrag: startGlobalDrag} = useDragState()
const selectionService = new SelectionService()

const selectedIds = computed(() => selectionStore.selectedIds)
const isDragging = ref(false)
const isResizing = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const totalOffset = ref({ x: 0, y: 0 }) // 累计拖拽偏移量
const singleBoxRef = ref<HTMLElement>()
const multiBoxRef = ref<HTMLElement>()
let animationFrameId: number | null = null

// 使用 ref 缓存边界框，避免频繁计算
const cachedBoundingBox = ref<{ x: number; y: number; width: number; height: number } | null>(null)

// 缩放相关
const resizeHandleType = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-left')
const startElementData = ref<{ x: number; y: number; width: number; height: number } | null>(null)
const startBoundingBox = ref<{ x: number; y: number; width: number; height: number } | null>(null)

// 开始缩放
const startResize = (event: MouseEvent, handleType: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
  if (selectedIds.value.length === 0) return

  isResizing.value = true
  resizeHandleType.value = handleType
  dragStartPos.value = { x: event.clientX, y: event.clientY }

  // 保存初始数据
  if (selectedIds.value.length === 1) {
    // 单个元素
    const elementId = selectionStore.firstSelectedId
    if (elementId) {
      const element = elementsStore.getElementById(elementId)
    if (element) {
      startElementData.value = {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height
      }
    }
    }
  } else {
    // 多个元素
    startBoundingBox.value = selectionService.calculateBoundingBox(selectedIds.value)
  }

  // 添加全局事件监听
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)

  // 阻止默认行为和事件冒泡
  event.preventDefault()
  event.stopPropagation()

  console.log('开始缩放，控制点:', handleType)
}

// 缩放中
const onResize = (event: MouseEvent) => {
  if (!isResizing.value) return

  // 计算移动距离
  const dx = event.clientX - dragStartPos.value.x
  const dy = event.clientY - dragStartPos.value.y

  if (selectedIds.value.length === 1 && startElementData.value) {
    // 单个元素缩放
    const elementId = selectedIds.value[0]
    const { x, y, width, height } = startElementData.value
    if(elementId){
      selectionService.resizeElement(elementId, resizeHandleType.value, dx, dy, x, y, width, height)
    }
  } else if (selectedIds.value.length > 1 && startBoundingBox.value) {
    // 多个元素缩放
    selectionService.resizeElements(selectedIds.value, resizeHandleType.value, dx, dy, startBoundingBox.value)
  }
}

// 停止缩放
const stopResize = () => {
  if (!isResizing.value) return

  isResizing.value = false
  startElementData.value = null
  startBoundingBox.value = null

  // 移除全局事件监听
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)

  console.log('缩放完成')
}

// 计算选中元素的组合边界框
const calculateBoundingBox = () => {
  if (selectedIds.value.length === 0) return null

  const selectedElements = selectedIds.value
    .map(id => elementsStore.getElementById(id))
    .filter(el => el != null)

  if (selectedElements.length === 0) return null

  // 计算所有选中元素的组合边界
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  selectedElements.forEach(el => {
    minX = Math.min(minX, el.x)
    minY = Math.min(minY, el.y)
    maxX = Math.max(maxX, el.x + el.width)
    maxY = Math.max(maxY, el.y + el.height)
  })

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

// 只在选中元素变化或元素位置确实改变时更新边界框（使用节流避免频繁计算）
let updateTimer: number | null = null
watch(
  () => selectedIds.value.map(id => {
    const el = elementsStore.getElementById(id)
    return el ? `${el.x},${el.y},${el.width},${el.height}` : ''
  }).join('|'),
  () => {
    if (!isDragging.value) {
      // 使用微任务批量更新，避免同步计算
      if (updateTimer) cancelAnimationFrame(updateTimer)
      updateTimer = requestAnimationFrame(() => {
        cachedBoundingBox.value = calculateBoundingBox()
        updateTimer = null
      })
    }
  },
  { immediate: true }
)

// 实际显示的边界框（拖拽时应用全局偏移）
const boundingBox = computed(() => {
  const dragState = getDragState().value

  // 如果正在拖拽且拖拽的元素包含当前选中的元素，应用偏移
  if (dragState && cachedBoundingBox.value) {
    const isDraggingSelected = dragState.elementIds.some(id => selectedIds.value.includes(id))
    if (isDraggingSelected) {
      return {
        x: cachedBoundingBox.value.x + dragState.offset.x,
        y: cachedBoundingBox.value.y + dragState.offset.y,
        width: cachedBoundingBox.value.width,
        height: cachedBoundingBox.value.height
      }
    }
  }

  return cachedBoundingBox.value
})

// 开始拖拽
const startDrag = (event: MouseEvent) => {
  if (selectedIds.value.length === 0) return

  isDragging.value = true
  dragStartPos.value = { x: event.clientX, y: event.clientY }
  totalOffset.value = { x: 0, y: 0 }

  // 通知全局拖拽状态
  startGlobalDrag(selectedIds.value)

  // 添加拖拽类以启用性能优化
  const boxRef = selectedIds.value.length === 1 ? singleBoxRef.value : multiBoxRef.value
  if (boxRef) {
    boxRef.classList.add('dragging')
  }

  // 添加全局事件监听
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)

  // 阻止默认行为和事件冒泡
  event.preventDefault()
  event.stopPropagation()
}

// 拖拽中 - 使用 RAF 节流 + 直接 DOM 操作
const onDrag = (event: MouseEvent) => {
  if (!isDragging.value) return

  // 计算累计偏移量
  const newOffset = {
    x: event.clientX - dragStartPos.value.x,
    y: event.clientY - dragStartPos.value.y
  }

  dragOffset.value = newOffset

  // 同步更新 Canvas 元素位置（直接操作 Graphics，不触发完整渲染）
  if (canvasService && selectedIds.value.length > 0) {
    syncDragPosition(selectedIds.value, newOffset.x, newOffset.y)
  }

  animationFrameId = requestAnimationFrame(() => {
    // 直接更新选中框 DOM，使用 translate3d 启用 GPU 加速
    const boxRef = selectedIds.value.length === 1 ? singleBoxRef.value : multiBoxRef.value
    if (boxRef && cachedBoundingBox.value) {
      const newX = cachedBoundingBox.value.x + totalOffset.value.x
      const newY = cachedBoundingBox.value.y + totalOffset.value.y
      boxRef.style.transform = `translate3d(${newX}px, ${newY}px, 0)`
    }

    // 同步更新 Canvas 元素位置（直接操作 Graphics，不触发完整渲染）
    if (canvasService && selectedIds.value.length > 0) {
      syncDragPosition(selectedIds.value, totalOffset.value.x, totalOffset.value.y)
    }

    animationFrameId = null
  })
}

// 停止拖拽 - 此时才更新 Store
const stopDrag = () => {
  if (!isDragging.value) return

  // 应用最终偏移到 Store
  if ((Math.abs(totalOffset.value.x) > 1 || Math.abs(totalOffset.value.y) > 1) && selectedIds.value.length > 0) {
    elementsStore.moveElements(selectedIds.value, totalOffset.value.x, totalOffset.value.y)
    elementsStore.saveToLocal()

    // 更新缓存的边界框
    cachedBoundingBox.value = calculateBoundingBox()
  }

  isDragging.value = false
  dragOffset.value = { x: 0, y: 0 }

  // 移除全局事件监听
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 组件卸载时清理
onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  if (updateTimer !== null) {
    cancelAnimationFrame(updateTimer)
    updateTimer = null
  }
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})

</script>

<style scoped>
.selection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
}

.selection-box {
  position: absolute;
  pointer-events: auto;
  transform-origin: top left;
  /* GPU 加速 */
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

/* 拖拽时启用性能优化 */
.selection-box.dragging {
  will-change: transform;
}

.selection-box.single {
  border: 2px solid #4672EF;
  cursor: move;
}

.selection-box.multi {
  border: 2px solid #4672EF;
  background: rgba(70, 114, 239, 0.05);
  cursor: move;
}

.selection-box.draggable:hover {
  background: rgba(70, 114, 239, 0.1);
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: white;
  border: 1px solid #4672EF;
  z-index: 101;
}

.resize-handle.top-left {
  top: -5px;
  left: -5px;
  cursor: nwse-resize;
}

.resize-handle.top-right {
  top: -5px;
  right: -5px;
  cursor: nesw-resize;
}

.resize-handle.bottom-left {
  bottom: -5px;
  left: -5px;
  cursor: nesw-resize;
}

.resize-handle.bottom-right {
  bottom: -5px;
  right: -5px;
  cursor: nwse-resize;
}
</style>
