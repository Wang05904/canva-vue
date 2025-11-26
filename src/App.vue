<script setup lang="ts">
import PixiCanvas from './views/canvas/PixiCanvas.vue'
import TopToolbar from './views/ui/TopToolbar.vue'
import FloatingToolbar from './views/ui/FloatingToolbar.vue'
import SelectionOverlay from './views/overlays/SelectionOverlay.vue'
</script>

<template>
  <div class="app-container">
    <TopToolbar />
    <FloatingToolbar />
    <PixiCanvas />
    <SelectionOverlay />
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
