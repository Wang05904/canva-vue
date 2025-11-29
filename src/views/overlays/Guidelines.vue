<template>
  <div class="guidelines">
    <!-- 水平辅助线 -->
    <div class="horizontal-guideline"></div>
    <!-- 垂直辅助线 -->
    <div class="vertical-guideline"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'GuideLines',
  setup() {
    return {}
  }
})
</script>

<style scoped>
.guidelines {
  position: absolute;
  pointer-events: none;
}

.horizontal-guideline {
  position: absolute;
  width: 100%;
  height: 1px;
  background: #4285f4;
}

.vertical-guideline {
  position: absolute;
  width: 1px;
  height: 100%;
  background: #4285f4;
}
</style>
