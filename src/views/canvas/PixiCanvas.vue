<!--
View层 - 画布容器组件
职责：提供 PIXI 渲染引擎的挂载点
-->
<template>
  <div ref="container" class="pixi-canvas"></div>
</template>

<script setup lang="ts">
import { useCanvas } from '@/composables/useCanvas'
const { container } = useCanvas()
</script>

<style scoped>
.pixi-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  overflow: hidden;
}
</style>
