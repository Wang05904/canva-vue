<template>
  <svg class="grid-background" :viewBox="`0 0 ${canvasSize.width} ${canvasSize.height}`" shape-rendering="crispEdges">
    <defs>
      <pattern 
        id="small-grid" 
        :width="gridSizes.small" 
        :height="gridSizes.small" 
        patternUnits="userSpaceOnUse"
        :patternTransform="transform"
      >
        <path 
          :d="`M ${gridSizes.small} 0 L 0 0 0 ${gridSizes.small}`" 
          fill="none" 
          :stroke="GRID_CONFIG.colors.small" 
          :stroke-width="GRID_CONFIG.strokeWidth"
        />
      </pattern>
      
      <pattern 
        id="large-grid" 
        :width="gridSizes.large" 
        :height="gridSizes.large" 
        patternUnits="userSpaceOnUse"
        :patternTransform="transform"
      >
        <rect 
          v-if="showSmallGrid"
          :width="gridSizes.large" 
          :height="gridSizes.large" 
          fill="url(#small-grid)" 
        />
        <path 
          :d="`M ${gridSizes.large} 0 L 0 0 0 ${gridSizes.large}`" 
          fill="none" 
          :stroke="GRID_CONFIG.colors.large" 
          :stroke-width="GRID_CONFIG.strokeWidth"
        />
      </pattern>
    </defs>
    
    <rect width="100%" height="100%" fill="url(#large-grid)" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { GRID_CONFIG, CANVAS_CONFIG } from '@/cores/config/appConfig'

const canvasStore = useCanvasStore()
const viewport = computed(() => canvasStore.viewport)

// 画布尺寸
const canvasSize = computed(() => ({
  width: canvasStore.width || CANVAS_CONFIG.size.default,
  height: canvasStore.height || CANVAS_CONFIG.size.default
}))

// 根据缩放级别自适应网格基础大小
const getAdaptiveSize = (zoom: number) => {
  if (zoom < GRID_CONFIG.zoomThresholds.verySmall) return GRID_CONFIG.sizes.verySmall
  if (zoom < GRID_CONFIG.zoomThresholds.small) return GRID_CONFIG.sizes.small
  return GRID_CONFIG.sizes.normal
}

// 计算网格大小（屏幕坐标）
const gridSizes = computed(() => {
  const zoom = viewport.value.zoom
  const base = getAdaptiveSize(zoom)
  return {
    small: base.small * zoom,
    large: base.large * zoom
  }
})

// 计算pattern的transform
const transform = computed(() => {
  const { zoom, x, y } = viewport.value
  const centerX = canvasSize.value.width / CANVAS_CONFIG.transform.divisionFactor
  const centerY = canvasSize.value.height / CANVAS_CONFIG.transform.divisionFactor
  const gridSize = getAdaptiveSize(zoom).large * zoom
  
  const offsetX = (centerX - x * zoom) % gridSize
  const offsetY = (centerY - y * zoom) % gridSize
  
  return `translate(${offsetX}, ${offsetY})`
})

// 是否显示小网格
const showSmallGrid = computed(() => viewport.value.zoom >= GRID_CONFIG.zoomThresholds.showSmallGrid)
</script>

<style scoped>
.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  background-color: #ffffff;
}
</style>
