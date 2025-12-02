<template>
  <div
    class="shape-element"
    :style="containerStyle"
  >
    <!-- 矩形 -->
    <svg v-if="element.shapeType === 'rectangle' || element.shapeType === 'roundedRect'" 
         :width="element.width" 
         :height="element.height"
         xmlns="http://www.w3.org/2000/svg">
      <rect 
        :width="element.width" 
        :height="element.height"
        :rx="element.shapeType === 'roundedRect' ? (element.borderRadius || 10) : 0"
        :fill="element.fillColor"
        :stroke="element.strokeColor"
        :stroke-width="element.strokeWidth"
      />
    </svg>
    
    <!-- 圆形 -->
    <svg v-else-if="element.shapeType === 'circle'" 
         :width="element.width" 
         :height="element.height"
         xmlns="http://www.w3.org/2000/svg">
      <ellipse 
        :cx="element.width / 2" 
        :cy="element.height / 2"
        :rx="element.width / 2"
        :ry="element.height / 2"
        :fill="element.fillColor"
        :stroke="element.strokeColor"
        :stroke-width="element.strokeWidth"
      />
    </svg>
    
    <!-- 三角形 -->
    <svg v-else-if="element.shapeType === 'triangle'" 
         :width="element.width" 
         :height="element.height"
         xmlns="http://www.w3.org/2000/svg">
      <polygon 
        :points="`${element.width / 2},0 ${element.width},${element.height} 0,${element.height}`"
        :fill="element.fillColor"
        :stroke="element.strokeColor"
        :stroke-width="element.strokeWidth"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ShapeElement } from '@/cores/types/element'

const props = defineProps<{
  element: ShapeElement
}>()

// 容器样式
const containerStyle = computed(() => ({
  position: 'absolute' as const,
  left: '0',
  top: '0',
  width: `${props.element.width}px`,
  height: `${props.element.height}px`,
  transform: `translate3d(${props.element.x}px, ${props.element.y}px, 0) rotate(${props.element.rotation || 0}deg)`,
  opacity: props.element.opacity,
  visibility: (props.element.visible ? 'visible' : 'hidden') as 'visible' | 'hidden',
  pointerEvents: 'auto' as const,
  zIndex: 1,
  cursor: 'move' as const
}))
</script>

<style scoped>
.shape-element {
  transform-origin: top left;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.shape-element svg {
  display: block;
}
</style>
