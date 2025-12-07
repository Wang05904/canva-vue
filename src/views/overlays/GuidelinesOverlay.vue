<!--
View层 - 对齐辅助线组件
职责：在拖拽元素时显示对齐参考线（支持点对点线段）
-->
<template>
  <svg class="guidelines-overlay">
    <!-- 垂直辅助线（线段式） -->
    <line
      v-for="(line, index) in verticalLines"
      :key="`v-${index}`"
      :x1="line.start.x"
      :y1="line.start.y"
      :x2="line.end.x"
      :y2="line.end.y"
      class="guideline"
      :class="`guideline-${line.type}`"
    />
    
    <!-- 水平辅助线（线段式） -->
    <line
      v-for="(line, index) in horizontalLines"
      :key="`h-${index}`"
      :x1="line.start.x"
      :y1="line.start.y"
      :x2="line.end.x"
      :y2="line.end.y"
      class="guideline"
      :class="`guideline-${line.type}`"
    />
  </svg>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useGuidelinesStore } from '@/stores/guidelines'

const guidelinesStore = useGuidelinesStore()
const { verticalLines, horizontalLines } = storeToRefs(guidelinesStore)
</script>

<style scoped>
.guidelines-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 关键：不响应鼠标事件，允许点击穿透 */
  z-index: 900; /* 确保在 SelectionOverlay (100) 之上，但在某些工具之下 */
  overflow: visible; /* 允许辅助线溢出容器 */
}

.guideline {
  stroke-width: 1;
  stroke: #ff4081;
  filter: drop-shadow(0 0 2px rgba(255, 64, 129, 0.5));
}

.guideline-center {
  stroke: #00bcd4;
  stroke-width: 1.5;
}

.guideline-vertex {
  stroke: #ffeb3b;
  stroke-width: 1;
}

.guideline-edge {
  stroke: #ff4081;
  stroke-width: 1;
}
</style>
