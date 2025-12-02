<template>
  <div 
    class="mini-map-wrapper"
    :class="{ collapsed: isCollapsed }"
    :style="wrapperStyle"
  >
    <!-- 折叠/展开按钮 -->
    <button 
      class="collapse-button" 
      @click="toggleCollapse"
      :title="isCollapsed ? '展开小地图' : '折叠小地图'"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path v-if="isCollapsed" d="M8 4l-4 4h8z M8 12l4-4H4z" />
        <path v-else d="M4 6l4 4 4-4z" />
      </svg>
    </button>

    <div 
      v-show="!isCollapsed"
      class="mini-map" 
      :class="{ dragging: isDraggingViewport }"
      :style="{ width: currentWidth + 'px', height: currentHeight + 'px' }"
      @mousedown="handleMapMouseDown"
      @dblclick="handleFitToView"
    >
      <svg class="mini-map-content" :viewBox="`0 0 ${currentWidth} ${currentHeight}`">
        <!-- 背景 -->
        <rect :width="currentWidth" :height="currentHeight" fill="#f8f9fa" />
        
        <!-- 网格 -->
        <defs>
          <pattern id="minimap-grid" :width="gridSize" :height="gridSize" patternUnits="userSpaceOnUse">
            <path :d="`M ${gridSize} 0 L 0 0 0 ${gridSize}`" fill="none" stroke="#e0e0e0" stroke-width="0.5" />
          </pattern>
        </defs>
        <rect :width="currentWidth" :height="currentHeight" fill="url(#minimap-grid)" />
      
      <!-- 渲染所有元素的缩略图 -->
      <g v-for="element in visibleElements" :key="element.id" class="minimap-element">
        <!-- 矩形元素 -->
        <rect
          v-if="element.type === 'shape' && element.shapeType === 'rectangle'"
          :x="element.x"
          :y="element.y"
          :width="element.width"
          :height="element.height"
          :fill="element.fillColor || '#4A90E2'"
          :stroke="element.strokeColor || '#000'"
          :stroke-width="0.5"
          opacity="0.7"
        />
        
        <!-- 圆形元素 -->
        <circle
          v-else-if="element.type === 'shape' && element.shapeType === 'circle'"
          :cx="element.x + element.width / 2"
          :cy="element.y + element.height / 2"
          :r="Math.min(element.width, element.height) / 2"
          :fill="element.fillColor || '#E94B3C'"
          :stroke="element.strokeColor || '#000'"
          :stroke-width="0.5"
          opacity="0.7"
        />
        
        <!-- 三角形元素 -->
        <polygon
          v-else-if="element.type === 'shape' && element.shapeType === 'triangle'"
          :points="getTrianglePoints(element)"
          :fill="element.fillColor || '#34C759'"
          :stroke="element.strokeColor || '#000'"
          :stroke-width="0.5"
          opacity="0.7"
        />
        
        <!-- 图片元素 -->
        <rect
          v-else-if="element.type === 'image'"
          :x="element.x"
          :y="element.y"
          :width="element.width"
          :height="element.height"
          fill="#ddd"
          stroke="#999"
          :stroke-width="0.5"
          opacity="0.7"
        />
        
        <!-- 文本元素 -->
        <rect
          v-else-if="element.type === 'text'"
          :x="element.x"
          :y="element.y"
          :width="element.width"
          :height="element.height"
          fill="#fff"
          stroke="#666"
          :stroke-width="0.5"
          opacity="0.7"
        />
      </g>
      
      <!-- 视口指示器 -->
      <rect
        class="viewport-indicator"
        :x="viewportRect.x"
        :y="viewportRect.y"
        :width="viewportRect.width"
        :height="viewportRect.height"
        fill="rgba(66, 133, 244, 0.1)"
        stroke="#4285f4"
        stroke-width="2"
        rx="2"
        @mousedown.stop="handleViewportDragStart"
      />
    </svg>

      <!-- 调整大小手柄 -->
      <div 
        class="resize-handle"
        @mousedown="handleResizeStart"
        title="拖拽调整大小"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M11 11L0 11L11 0z" opacity="0.5" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, onUnmounted } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useElementsStore } from '@/stores/elements'
import { storeToRefs } from 'pinia'
import type { CanvasService } from '@/services/canvas/CanvasService'
import type { AnyElement, ShapeElement } from '@/cores/types/element'

const canvasStore = useCanvasStore()
const elementsStore = useElementsStore()
const canvasService = inject<CanvasService>('canvasService')

// 使用 storeToRefs 让 viewport 具有响应性
const { viewport } = storeToRefs(canvasStore)

// 小地图默认尺寸
const DEFAULT_WIDTH = 200
const DEFAULT_HEIGHT = 150
const MIN_WIDTH = 150
const MIN_HEIGHT = 100
const MAX_WIDTH = 400
const MAX_HEIGHT = 300

// 当前尺寸（可调节）
const currentWidth = ref(DEFAULT_WIDTH)
const currentHeight = ref(DEFAULT_HEIGHT)

// 网格大小
const gridSize = 20

// 拖拽状态
const isDraggingViewport = ref(false)
const isResizing = ref(false)
const isCollapsed = ref(false)

// 调整大小相关
const resizeStartPos = ref({ x: 0, y: 0 })
const resizeStartSize = ref({ width: 0, height: 0 })

// 获取所有元素
const elements = computed(() => elementsStore.elements)

// 计算元素的边界范围
const contentBounds = computed(() => {
  if (elements.value.length === 0) {
    return { minX: -500, minY: -500, maxX: 500, maxY: 500 }
  }
  
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  
  elements.value.forEach(el => {
    minX = Math.min(minX, el.x)
    minY = Math.min(minY, el.y)
    maxX = Math.max(maxX, el.x + el.width)
    maxY = Math.max(maxY, el.y + el.height)
  })
  
  // 添加一些边距
  const padding = 100
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding
  }
})

// 计算世界坐标范围
const worldWidth = computed(() => contentBounds.value.maxX - contentBounds.value.minX)
const worldHeight = computed(() => contentBounds.value.maxY - contentBounds.value.minY)

// 计算缩放比例（保持宽高比）
const scale = computed(() => {
  const scaleX = currentWidth.value / worldWidth.value
  const scaleY = currentHeight.value / worldHeight.value
  return Math.min(scaleX, scaleY)
})

// wrapper 样式
const wrapperStyle = computed(() => ({
  width: isCollapsed.value ? '40px' : 'auto',
  height: isCollapsed.value ? '40px' : 'auto',
}))

// 计算视口在小地图中的位置
const viewportRect = computed(() => {
  if (!canvasService) {
    return { x: 0, y: 0, width: currentWidth.value, height: currentHeight.value }
  }
  
  // 读取 viewport 触发响应式更新
  // 当 store 中的 viewport 更新时，这个 computed 会重新计算
  void viewport.value
  
  const viewportService = canvasService.getViewportService()
  const visibleBounds = viewportService.getVisibleBounds()
  
  // 转换到小地图坐标系
  const x = (visibleBounds.left - contentBounds.value.minX) * scale.value
  const y = (visibleBounds.top - contentBounds.value.minY) * scale.value
  const width = visibleBounds.width * scale.value
  const height = visibleBounds.height * scale.value
  
  return { x, y, width, height }
})

// 过滤可见元素（转换坐标后在地图范围内的）
const visibleElements = computed(() => {
  return elements.value.map(el => {
    const mapX = (el.x - contentBounds.value.minX) * scale.value
    const mapY = (el.y - contentBounds.value.minY) * scale.value
    const mapWidth = el.width * scale.value
    const mapHeight = el.height * scale.value
    
    return {
      ...el,
      x: mapX,
      y: mapY,
      width: mapWidth,
      height: mapHeight
    }
  })
})

// 获取三角形的点坐标
const getTrianglePoints = (element: AnyElement) => {
  const el = element as ShapeElement
  const x = el.x
  const y = el.y
  const w = el.width
  const h = el.height
  
  return `${x + w/2},${y} ${x + w},${y + h} ${x},${y + h}`
}

// 小地图坐标转世界坐标
const mapToWorld = (mapX: number, mapY: number) => {
  const worldX = mapX / scale.value + contentBounds.value.minX
  const worldY = mapY / scale.value + contentBounds.value.minY
  return { worldX, worldY }
}

// 移动视口到指定位置（世界坐标，居中）
const moveViewportTo = (worldX: number, worldY: number) => {
  if (!canvasService) return
  
  const viewportService = canvasService.getViewportService()
  // 使视口中心对准点击位置
  viewportService.setPosition(worldX, worldY)
  canvasService.getRenderService().updateViewportTransform()
  canvasStore.updateViewport(viewportService.getViewport())
}

// 开始拖拽视口
const handleViewportDragStart = (event: MouseEvent) => {
  event.stopPropagation()
  isDraggingViewport.value = true
  
  // 添加全局事件监听
  document.addEventListener('mousemove', handleViewportDragMove)
  document.addEventListener('mouseup', handleViewportDragEnd)
}

// 拖拽视口移动
const handleViewportDragMove = (event: MouseEvent) => {
  if (!isDraggingViewport.value || !canvasService) return
  
  const container = document.querySelector('.mini-map')
  if (!container) return
  
  const rect = container.getBoundingClientRect()
  const mapX = event.clientX - rect.left
  const mapY = event.clientY - rect.top
  
  // 限制在小地图范围内
  const clampedX = Math.max(0, Math.min(currentWidth.value, mapX))
  const clampedY = Math.max(0, Math.min(currentHeight.value, mapY))
  
  const { worldX, worldY } = mapToWorld(clampedX, clampedY)
  moveViewportTo(worldX, worldY)
}

// 结束拖拽视口
const handleViewportDragEnd = () => {
  isDraggingViewport.value = false
  document.removeEventListener('mousemove', handleViewportDragMove)
  document.removeEventListener('mouseup', handleViewportDragEnd)
}

// 点击小地图背景跳转（居中）
const handleMapMouseDown = (event: MouseEvent) => {
  // 如果点击的是视口指示器，不处理（由 handleViewportDragStart 处理）
  if ((event.target as SVGElement).classList.contains('viewport-indicator')) {
    return
  }
  
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const mapX = event.clientX - rect.left
  const mapY = event.clientY - rect.top
  
  const { worldX, worldY } = mapToWorld(mapX, mapY)
  moveViewportTo(worldX, worldY)
}

// 双击适应全部内容
const handleFitToView = () => {
  if (!canvasService || elements.value.length === 0) return
  
  const viewportService = canvasService.getViewportService()
  
  // 计算内容边界
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  
  elements.value.forEach(el => {
    minX = Math.min(minX, el.x)
    minY = Math.min(minY, el.y)
    maxX = Math.max(maxX, el.x + el.width)
    maxY = Math.max(maxY, el.y + el.height)
  })
  
  const bounds = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
  
  // 适应到视口
  viewportService.fitToView(bounds, 50)
  canvasService.getRenderService().updateViewportTransform()
  canvasStore.updateViewport(viewportService.getViewport())
}

// 折叠/展开
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// 开始调整大小
const handleResizeStart = (event: MouseEvent) => {
  event.stopPropagation()
  event.preventDefault()
  
  isResizing.value = true
  resizeStartPos.value = { x: event.clientX, y: event.clientY }
  resizeStartSize.value = { width: currentWidth.value, height: currentHeight.value }
  
  document.addEventListener('mousemove', handleResizeMove)
  document.addEventListener('mouseup', handleResizeEnd)
}

// 调整大小移动
const handleResizeMove = (event: MouseEvent) => {
  if (!isResizing.value) return
  
  const dx = event.clientX - resizeStartPos.value.x
  const dy = event.clientY - resizeStartPos.value.y
  
  // 计算新尺寸
  const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStartSize.value.width + dx))
  const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, resizeStartSize.value.height + dy))
  
  currentWidth.value = newWidth
  currentHeight.value = newHeight
}

// 结束调整大小
const handleResizeEnd = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)
}

// 清理事件监听
onUnmounted(() => {
  document.removeEventListener('mousemove', handleViewportDragMove)
  document.removeEventListener('mouseup', handleViewportDragEnd)
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)
})
</script>

<style scoped>
.mini-map-wrapper {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
  transition: width 0.3s, height 0.3s;
}

.mini-map-wrapper.collapsed {
  width: 40px !important;
  height: 40px !important;
}

.collapse-button {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
  border: 2px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: all 0.2s;
  color: #666;
}

.collapse-button:hover {
  background: #f5f5f5;
  border-color: #ccc;
  transform: scale(1.1);
}

.collapse-button:active {
  transform: scale(0.95);
}

.mini-map {
  position: relative;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s;
  user-select: none;
}

.mini-map:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.mini-map.dragging {
  cursor: grabbing;
}

.mini-map-content {
  width: 100%;
  height: 100%;
  display: block;
}

.minimap-element {
  pointer-events: none;
}

.viewport-indicator {
  cursor: grab;
  transition: fill 0.2s, stroke 0.2s;
}

.viewport-indicator:hover {
  fill: rgba(66, 133, 244, 0.15);
  stroke: #2a75f3;
}

.dragging .viewport-indicator {
  cursor: grabbing;
}

.resize-handle {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 24px;
  height: 24px;
  cursor: nwse-resize;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 4px;
  color: #999;
  opacity: 0.6;
  transition: opacity 0.2s;
  z-index: 5;
}

.resize-handle:hover {
  opacity: 1;
  color: #666;
}

.resize-handle:active {
  opacity: 1;
  color: #333;
}

.resize-handle svg {
  pointer-events: none;
}
</style>
