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
          stroke="#F1F5F9" 
          stroke-width="1"
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
          stroke="#E2E8F0" 
          stroke-width="1"
        />
      </pattern>
    </defs>
    
    <rect width="100%" height="100%" fill="url(#large-grid)" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'

const canvasStore = useCanvasStore()
const viewport = computed(() => canvasStore.viewport)

// 画布尺寸
const canvasSize = computed(() => ({
  width: canvasStore.width || 3000,
  height: canvasStore.height || 3000
}))

// 根据缩放级别自适应网格基础大小
const getAdaptiveSize = (zoom: number) => {
  if (zoom < 0.25) return { small: 80, large: 400 }
  if (zoom < 0.5) return { small: 40, large: 200 }
  return { small: 20, large: 100 }
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
  const centerX = canvasSize.value.width / 2
  const centerY = canvasSize.value.height / 2
  const gridSize = getAdaptiveSize(zoom).large * zoom
  
  const offsetX = (centerX - x * zoom) % gridSize
  const offsetY = (centerY - y * zoom) % gridSize
  
  return `translate(${offsetX}, ${offsetY})`
})

// 是否显示小网格
const showSmallGrid = computed(() => viewport.value.zoom >= 0.3)
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
