<!--
View层 - 画布容器组件
职责：提供 PIXI 渲染引擎的挂载点
-->
<template>
  <div>
    <top-toolbar />
    <floating-toolbar />
    <selection-overlay />
    <div ref="container" class="pixi-canvas"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, provide } from 'vue'
import Stats from 'stats.js'
import TopToolbar from '../../views/ui/TopToolbar.vue'
import FloatingToolbar from '../../views/ui/FloatingToolbar.vue'
import SelectionOverlay from '../../views/overlays/SelectionOverlay.vue'
import { useCanvas } from '@/composables/useCanvas'

const { container, canvasService } = useCanvas()

// 提供 canvasService 给子组件使用
provide('canvasService', canvasService)

let stats: any
onMounted(() => {
  stats = new Stats()
  stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3: custom
  document.body.appendChild(stats.dom)

  function animate() {
    stats.begin()
    // ...你的渲染逻辑...
    stats.end()
    requestAnimationFrame(animate)
  }
  animate()
})

onUnmounted(() => {
  if (stats && stats.dom && stats.dom.parentNode) {
    stats.dom.parentNode.removeChild(stats.dom)
  }
})
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
