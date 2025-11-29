<!--
  选中框组件 - 支持拖拽移动
-->
<template>
  <div class="selection-overlay">
    <!-- 选中元素的边框 -->
    <div
      v-if="selectedIds.length >= 1 && boundingBox"
      class="selection-box single"
      :style="{
        transform: `translate(${boundingBox.x}px, ${boundingBox.y}px)`,
        width: boundingBox.width + 'px',
        height: boundingBox.height + 'px',
        willChange: isDragging ? 'transform' : 'auto'
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
import { computed, ref, watch, inject } from 'vue'
import { useSelectionStore } from '@/stores/selection'
import { useElementsStore } from '@/stores/elements'
import { useDragSync } from '@/composables/useDragSync'
import type { CanvasService } from '@/services/canvas/CanvasService'
import { SelectionService } from '@/services/selection/SelectionService'

const selectionStore = useSelectionStore()
const elementsStore = useElementsStore()

// 注入 canvasService
const canvasService = inject<CanvasService>('canvasService')
const { syncDragPosition } = canvasService ? useDragSync(canvasService) : { syncDragPosition: () => {} }
const selectionService = new SelectionService()

const selectedIds = computed(() => selectionStore.selectedIds)
const isDragging = ref(false)
const isResizing = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const dragOffset = ref({ x: 0, y: 0 }) // 累计拖拽偏移量

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

// 使用 watch 立即更新边界框，但拖拽时使用本地偏移量
watch(
  () => selectedIds.value.map(id => {
    const el = elementsStore.getElementById(id)
    return el ? `${el.x},${el.y},${el.width},${el.height}` : ''
  }).join('|'),
  () => {
    cachedBoundingBox.value = calculateBoundingBox()
  },
  { immediate: true }
)

// 实际显示的边界框（拖拽时加上偏移量）
const boundingBox = computed(() => {
  if (!cachedBoundingBox.value) return null

  if (isDragging.value) {
    return {
      x: cachedBoundingBox.value.x + dragOffset.value.x,
      y: cachedBoundingBox.value.y + dragOffset.value.y,
      width: cachedBoundingBox.value.width,
      height: cachedBoundingBox.value.height
    }
  }

  return cachedBoundingBox.value
})

// 开始拖拽
const startDrag = (event: MouseEvent) => {
  if (selectedIds.value.length === 0) return

  isDragging.value = true
  dragStartPos.value = { x: event.clientX, y: event.clientY }
  dragOffset.value = { x: 0, y: 0 } // 重置偏移量

  // 添加全局事件监听
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)

  // 阻止默认行为和事件冒泡
  event.preventDefault()
  event.stopPropagation()
}

// 拖拽中 - 直接更新偏移量和 Canvas 位置
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
}

// 停止拖拽 - 此时才更新 Store
const stopDrag = () => {
  if (!isDragging.value) return

  // 应用最终偏移到 Store
  if ((Math.abs(dragOffset.value.x) > 1 || Math.abs(dragOffset.value.y) > 1) && selectedIds.value.length > 0) {
    elementsStore.moveElements(selectedIds.value, dragOffset.value.x, dragOffset.value.y)
  }

  isDragging.value = false
  dragOffset.value = { x: 0, y: 0 }

  // 移除全局事件监听
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}
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
  pointer-events: auto; /* 允许交互 */
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
