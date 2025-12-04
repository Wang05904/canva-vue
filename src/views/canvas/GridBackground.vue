<template>
  <svg class="grid-background" :viewBox="`0 0 ${canvasWidth} ${canvasHeight}`" shape-rendering="crispEdges">
    <!-- 小网格 -->
    <defs>
      <pattern 
        :id="smallGridId" 
        :width="smallGridSize" 
        :height="smallGridSize" 
        patternUnits="userSpaceOnUse"
        :patternTransform="patternTransform"
      >
        <path 
          :d="`M ${smallGridSize} 0 L 0 0 0 ${smallGridSize}`" 
          fill="none" 
          :stroke="smallGridColor" 
          :stroke-width="smallStrokeWidth"
        />
      </pattern>
      
      <!-- 大网格 -->
      <pattern 
        :id="largeGridId" 
        :width="largeGridSize" 
        :height="largeGridSize" 
        patternUnits="userSpaceOnUse"
        :patternTransform="patternTransform"
      >
        <rect 
          v-if="showSmallGrid"
          :width="largeGridSize" 
          :height="largeGridSize" 
          :fill="`url(#${smallGridId})`" 
        />
        <rect 
          v-else
          :width="largeGridSize" 
          :height="largeGridSize" 
          fill="transparent" 
        />
        <path 
          :d="`M ${largeGridSize} 0 L 0 0 0 ${largeGridSize}`" 
          fill="none" 
          :stroke="largeGridColor" 
          :stroke-width="largeStrokeWidth"
        />
      </pattern>
    </defs>
    
    <!-- 应用网格 -->
    <rect width="100%" height="100%" :fill="`url(#${largeGridId})`" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'

const canvasStore = useCanvasStore()

// 唯一ID，防止多个网格组件冲突
const gridId = Math.random().toString(36).substring(7)
const smallGridId = `small-grid-${gridId}`
const largeGridId = `large-grid-${gridId}`

// 画布尺寸
const canvasWidth = computed(() => canvasStore.width || 3000)
const canvasHeight = computed(() => canvasStore.height || 3000)

// 视口状态
const viewport = computed(() => canvasStore.viewport)

// 基础网格大小（世界坐标）
const baseSmallGridSize = 20  // 小网格基础大小 20px
const baseLargeGridSize = 100 // 大网格基础大小 100px（5x5小网格）

// 根据缩放级别自适应网格大小
// 当缩放很小时，使用更大的网格；缩放很大时，使用标准网格
const adaptiveSmallGridSize = computed(() => {
  const zoom = viewport.value.zoom
  if (zoom < 0.25) return 80      // 极小缩放时使用大网格
  if (zoom < 0.5) return 40       // 小缩放时使用中等网格
  return baseSmallGridSize        // 标准网格
})

const adaptiveLargeGridSize = computed(() => {
  const zoom = viewport.value.zoom
  if (zoom < 0.25) return 400     // 极小缩放时
  if (zoom < 0.5) return 200      // 小缩放时
  return baseLargeGridSize        // 标准大网格
})

// 根据缩放级别计算网格大小（屏幕坐标）
const smallGridSize = computed(() => {
  return adaptiveSmallGridSize.value * viewport.value.zoom
})

const largeGridSize = computed(() => {
  return adaptiveLargeGridSize.value * viewport.value.zoom
})

// 计算 pattern 的 transform（处理平移）
const patternTransform = computed(() => {
  const zoom = viewport.value.zoom
  const x = viewport.value.x
  const y = viewport.value.y
  
  // 计算屏幕中心
  const centerX = canvasWidth.value / 2
  const centerY = canvasHeight.value / 2
  
  // 使用大网格尺寸计算偏移，确保大网格线（以及世界原点）对齐
  // 这样可以保证无论缩放如何，(0,0)点总是在网格交点上
  const gridSize = adaptiveLargeGridSize.value * zoom
  const offsetX = (centerX - x * zoom) % gridSize
  const offsetY = (centerY - y * zoom) % gridSize
  
  return `translate(${offsetX}, ${offsetY})`
})

// 网格颜色配置
const smallGridColor = computed(() => {
  return '#F1F5F9'
})

const largeGridColor = computed(() => {
  return '#E2E8F0'
})

const smallStrokeWidth = computed(() => {
  return 1
})

const largeStrokeWidth = computed(() => {
  return 1
})

// 是否显示小网格（在极小缩放时隐藏小网格）
const showSmallGrid = computed(() => {
  return viewport.value.zoom >= 0.3
})
</script>

<style scoped>
.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0; /* 在 PIXI canvas (z-index: 1) 下方 */
  background-color: #ffffff; /* 白色背景 */
}
</style>
