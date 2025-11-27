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
      <!-- <button class="tool-btn"  :class="{active: currentTool === 'editor'}" @click="setTool('editor')" title="编辑工具 (E)">
        <svg t="1764034124762" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4623" width="32" height="32"><path d="M792.149333 289.557333V157.696a8.256 8.256 0 0 0-8.234666-8.256H223.424a8.256 8.256 0 0 0-8.234667 8.256v131.861333c0 4.544 3.690667 8.256 8.234667 8.256h57.706667a8.256 8.256 0 0 0 8.234666-8.256v-65.92h173.098667v576.96h-94.805333a8.256 8.256 0 0 0-8.234667 8.234667v57.706667c0 4.522667 3.712 8.234667 8.234667 8.234666h272a8.256 8.256 0 0 0 8.256-8.234666v-57.706667a8.256 8.256 0 0 0-8.256-8.234667h-94.784V223.637333h173.098666v65.92c0 4.544 3.712 8.256 8.234667 8.256h57.706667a8.256 8.256 0 0 0 8.234666-8.256z" fill="#000000" p-id="4624"></path></svg>
      </button> -->
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
