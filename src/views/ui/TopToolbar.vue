<template>
  <div class="top-toolbar">
    <div class="toolbar-group">
      <button 
        class="tool-btn" 
        :class="{ active: currentTool === 'select' }" 
        @click="setTool('select')"
        title="选择工具 (V)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
          <path d="M13 13l6 6"></path>
        </svg>
      </button>
    </div>

    <div class="divider"></div>

    <div class="toolbar-group">
      <button 
        class="tool-btn" 
        :class="{ active: currentTool === 'rectangle' }" 
        @click="setTool('rectangle')"
        title="矩形工具 (R)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        </svg>
      </button>
      
      <button 
        class="tool-btn" 
        :class="{ active: currentTool === 'circle' }" 
        @click="setTool('circle')"
        title="圆形工具 (O)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
        </svg>
      </button>
      
      <button 
        class="tool-btn" 
        :class="{ active: currentTool === 'triangle' }" 
        @click="setTool('triangle')"
        title="三角形工具 (T)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12,2 22,22 2,22"></polygon>
        </svg>
      </button>
      <button
        class="tool-btn"
        :class="{ active: currentTool === 'text' }"
        @click="setTool('text')"
        title="文本工具 (T)"
      >
        <svg t="1764240140475" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5065" width="32" height="32"><path d="M429.056 919.552h166.4l-0.512-1.024c-32.768-40.96-50.688-92.16-50.688-144.384V228.352h154.112c44.032 0 87.04 14.848 121.856 42.496l11.776 9.216V154.112s-128 20.48-319.488 20.48-321.024-20.48-321.024-20.48v125.44l8.192-6.656c35.328-28.672 79.36-44.544 124.928-44.544h155.648v545.28c0 52.736-17.92 103.424-50.688 144.384l-0.512 1.536z" fill="#2c2c2c" p-id="5066"></path></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore, type ToolType } from '@/stores/canvas'

const canvasStore = useCanvasStore()
const currentTool = computed(() => canvasStore.currentTool)

const setTool = (tool: ToolType) => {
  canvasStore.setTool(tool)
  console.log('Tool selected:', tool)
}
</script>

<style scoped>
.top-toolbar {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.toolbar-group {
  display: flex;
  gap: 4px;
}

.divider {
  width: 1px;
  height: 24px;
  background-color: #e0e0e0;
  margin: 0 4px;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #555;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.tool-btn.active {
  background-color: #e6f0ff;
  color: #0066ff;
}

.tool-btn svg {
  display: block;
}
</style>
