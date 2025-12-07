<template>
  <div
    class="image-element"
    :style="containerStyle"
    :data-element-id="element.id"
    @mousedown="onMouseDown"
  >
    <img
      :src="element.src"
      :style="imageStyle"
      :data-element-id="element.id"
      draggable="false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject } from 'vue'
import type { ImageElement, GroupElement } from '@/cores/types/element'
import { useElementDrag } from '@/composables/useElementDrag'
import { useDragState } from '@/composables/useDragState'
import { useAlignment } from '@/composables/useAlignment'
import { createBBoxGeometry } from '@/composables/useAlignmentHelpers'
import { useElementsStore } from '@/stores/elements'
import { useSelectionStore } from '@/stores/selection'
import type { CanvasService } from '@/services/canvas/CanvasService'
import { CoordinateTransform } from '@/cores/viewport/CoordinateTransform'

const props = defineProps<{
  element: ImageElement
}>()

// 使用拖拽 composable
const { handleMouseDown } = useElementDrag(props.element.id)
const { getDragState, startDrag, updateDragOffset, endDrag } = useDragState()
const { checkAlignment, clearAlignment } = useAlignment()
const elementsStore = useElementsStore()
const selectionStore = useSelectionStore()
const canvasService = inject<CanvasService>('canvasService')

const isDragging = ref(false)
const hasMoved = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
let animationFrameId: number | null = null
let initialBoundingBox: { x: number; y: number; width: number; height: number; rotation: number } | null = null
let draggedIds: string[] = []

// 处理组合拖拽移动
const handleGroupDragMove = (e: MouseEvent) => {
  const screenDx = e.clientX - dragStartPos.value.x
  const screenDy = e.clientY - dragStartPos.value.y
  
  // Convert to world coordinates
  const viewport = canvasService!.getViewportService().getViewport()
  const { dx: worldDx, dy: worldDy } = CoordinateTransform.screenDeltaToWorldDelta(screenDx,screenDy,viewport)

  // 移动超过 3px 才认为是拖拽
  if (!hasMoved.value && (Math.abs(screenDx) > 3 || Math.abs(screenDy) > 3)) {
    hasMoved.value = true
    isDragging.value = true
  }
  
  if (!hasMoved.value) return
  
  // 应用对齐吸附
  let finalDx = worldDx
  let finalDy = worldDy
  
  if (initialBoundingBox) {
    const targetGeometry = createBBoxGeometry({
      x: initialBoundingBox.x + worldDx,
      y: initialBoundingBox.y + worldDy,
      width: initialBoundingBox.width,
      height: initialBoundingBox.height
    }, initialBoundingBox.rotation)
    
    const { dx: snapDx, dy: snapDy } = checkAlignment(targetGeometry, draggedIds)
    finalDx += snapDx
    finalDy += snapDy
  }
  
  // 更新全局拖拽偏移
  updateDragOffset({ x: finalDx, y: finalDy })
  
  // 使用 RAF 节流更新 DOM 元素位置
  if (animationFrameId !== null) return
  
  animationFrameId = requestAnimationFrame(() => {
    // 更新所有组合子元素的 DOM 位置
    draggedIds.forEach(id => {
      const el = elementsStore.getElementById(id)
      if (!el) return
      
      if (el.type === 'image') {
        const imgEl = document.querySelector(`[data-element-id="${id}"]`) as HTMLElement
        if (imgEl) {
          const elWorldX = el.x + finalDx
          const elWorldY = el.y + finalDy
          const rotation = el.rotation || 0
          imgEl.style.transform = `translate3d(${elWorldX}px, ${elWorldY}px, 0) rotate(${rotation}rad)`
        }
      } else if (el.type === 'text') {
        const textEl = document.querySelector(`[data-element-id="${id}"]`) as HTMLElement
        if (textEl) {
          const elWorldX = el.x + finalDx
          const elWorldY = el.y + finalDy
          const rotation = el.rotation || 0
          textEl.style.transform = `translate3d(${elWorldX}px, ${elWorldY}px, 0) rotate(${rotation}rad)`
        }
      }
    })
    
    // 同步更新 Canvas 元素位置（PIXI Graphics）
    if (canvasService && draggedIds.length > 0) {
      const updates = draggedIds.map(id => {
        const el = elementsStore.getElementById(id)
        if (!el) return null
        return {
          id,
          x: el.x + finalDx,
          y: el.y + finalDy
        }
      }).filter(Boolean) as Array<{ id: string; x: number; y: number }>
      
      canvasService.batchUpdatePositions(updates)
    }
    
    animationFrameId = null
  })
}

// 处理组合拖拽结束
const handleGroupDragUp = (e: MouseEvent) => {
  document.removeEventListener('mousemove', handleGroupDragMove)
  document.removeEventListener('mouseup', handleGroupDragUp)
  
  // 取消待处理的动画帧
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  
  if (hasMoved.value) {
    const screenDx = e.clientX - dragStartPos.value.x
    const screenDy = e.clientY - dragStartPos.value.y
    
    // Convert to world coordinates
    const viewport = canvasService!.getViewportService().getViewport()
    const { dx: worldDx, dy: worldDy } = CoordinateTransform.screenDeltaToWorldDelta(screenDx,screenDy,viewport)

    // 应用对齐吸附
    let finalDx = worldDx
    let finalDy = worldDy
    
    if (initialBoundingBox) {
      const targetGeometry = createBBoxGeometry({
        x: initialBoundingBox.x + worldDx,
        y: initialBoundingBox.y + worldDy,
        width: initialBoundingBox.width,
        height: initialBoundingBox.height
      }, initialBoundingBox.rotation)
      
      const { dx: snapDx, dy: snapDy } = checkAlignment(targetGeometry, draggedIds)
      finalDx += snapDx
      finalDy += snapDy
    }
    
    // 更新 Store
    elementsStore.moveElements(draggedIds, finalDx, finalDy)
    elementsStore.saveToLocal()
  }
  
  // 清理状态
  endDrag()
  clearAlignment()
  isDragging.value = false
  hasMoved.value = false
  dragStartPos.value = { x: 0, y: 0 }
  initialBoundingBox = null
  draggedIds = []
}

// 包装一层，避免组合内子元素被直接拖拽 / 选中
const onMouseDown = (e: MouseEvent) => {
  const el = elementsStore.getElementById(props.element.id)
  
  // 检查是否已经在多选拖拽中（此时不应该启动元素自己的拖拽）
  const dragState = getDragState().value
  const isInMultiSelectDrag = dragState?.isDragging && 
                               dragState.elementIds.length > 1 &&
                               dragState.elementIds.includes(props.element.id)
  
  if (isInMultiSelectDrag) {
    // 在多选拖拽中，阻止元素自己的拖拽逻辑，由 SelectionOverlay 统一处理
    e.stopPropagation()
    e.preventDefault()
    return
  }
  
  if (el && el.parentGroup) {
    // 点击组合内图片时，选中其父组合，并启动组合拖拽
    e.stopPropagation()
    e.preventDefault()
    
    // 选中父组合
    const parentGroupId = el.parentGroup
    selectionStore.selectElement(parentGroupId)
    
    // 获取父组合元素及其所有子元素
    const groupEl = elementsStore.getElementById(parentGroupId)
    if (groupEl && groupEl.type === 'group') {
      const groupChildren = (groupEl as GroupElement).children || []
      const allGroupIds = [parentGroupId, ...groupChildren]
      
      // 计算组合的初始边界框
      const groupElements = allGroupIds.map(id => elementsStore.getElementById(id)).filter(Boolean)
      if (groupElements.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        groupElements.forEach(el => {
          if(!el) return
          minX = Math.min(minX, el.x)
          minY = Math.min(minY, el.y)
          maxX = Math.max(maxX, el.x + el.width)
          maxY = Math.max(maxY, el.y + el.height)
        })
        initialBoundingBox = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          rotation: 0  // 组合元素rotation为0
        }
      }
      
      // 记录拖拽开始状态
      dragStartPos.value = { x: e.clientX, y: e.clientY }
      draggedIds = allGroupIds
      hasMoved.value = false
      
      // 启动全局拖拽状态
      startDrag(allGroupIds, initialBoundingBox)
      
      // 添加全局事件监听
      document.addEventListener('mousemove', handleGroupDragMove)
      document.addEventListener('mouseup', handleGroupDragUp)
    }
    return
  }
  handleMouseDown(e)
}

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
    pointerEvents: (props.element.locked ? 'none' : 'auto') as 'none' | 'auto',
    zIndex: props.element.zIndex,
    cursor: 'move' as const
  }
})

// 图片样式(包含滤镜)
const imageStyle = computed(() => {
  const filters = props.element.filters.map(f => {
    switch (f.type) {
      case 'blur':
        return `blur(${f.value}px)`
      case 'brightness':
        return `brightness(${f.value})`
      case 'contrast':
        return `contrast(${f.value})`
      default:
        return ''
    }
  }).filter(Boolean).join(' ')

  return {
    width: '100%',
    height: '100%',
    objectFit: 'fill' as const,
    filter: filters || 'none',
    userSelect: 'none' as const
  }
})
</script>

<style scoped>
.image-element {
  /* 拖拽时启用 GPU 加速 */
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.image-element.dragging {
  will-change: transform;
}

.image-element img {
  display: block;
  pointer-events: none;
  /* 优化图片渲染 */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
</style>
