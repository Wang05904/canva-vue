<script setup lang="ts">
import PixiCanvas from './views/canvas/PixiCanvas.vue'
import TopToolbar from './views/ui/TopToolbar.vue'
</script>

<template>
  <div class="app-container">
    <TopToolbar />
    <PixiCanvas />
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
