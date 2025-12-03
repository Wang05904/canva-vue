<!--
View层 - 对齐辅助线组件
职责：在拖拽元素时显示对齐参考线
-->
<template>
  <div class="guidelines-overlay">
    <!-- 垂直辅助线 (X轴对齐) -->
    <div
      v-for="(x, index) in verticalLines"
      :key="`v-${index}`"
      class="vertical-guideline"
      :style="{ left: `${x}px` }"
    />
    
    <!-- 水平辅助线 (Y轴对齐) -->
    <div
      v-for="(y, index) in horizontalLines"
      :key="`h-${index}`"
      class="horizontal-guideline"
      :style="{ top: `${y}px` }"
    />
  </div>
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

.horizontal-guideline {
  position: absolute;
  left: -100000px; /* 向左延伸 */
  width: 200000px; /* 足够长 */
  height: 1px;
  background: #ff4081;
  box-shadow: 0 0 2px rgba(255, 64, 129, 0.5);
}

.vertical-guideline {
  position: absolute;
  top: -100000px; /* 向上延伸 */
  width: 1px;
  height: 200000px; /* 足够长 */
  background: #ff4081;
  box-shadow: 0 0 2px rgba(255, 64, 129, 0.5);
}
</style>
