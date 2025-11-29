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


    <div class="divider"></div>

    <!-- Undo/Redo group (单击功能，不影响选中状态) -->
    <div class="toolbar-group">
      <button class="tool-btn" @click="onUndo" title="撤销 (Ctrl/Cmd+Z)">
        <!-- undo SVG -->
        <svg t="1764418665274" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9427" width="32" height="32"><path d="M933.5 670.8c-9.5 0-18.3-5.9-21.7-15.3-56.7-158.9-208.2-265.6-377-265.6-153.2 0-290.7 85.4-358.8 222.8-5.6 11.4-19.4 16.1-30.9 10.4-11.4-5.6-16.1-19.5-10.4-30.9C210.6 439 363.9 343.8 534.8 343.8c188.2 0 357.1 119 420.4 296.2 4.3 12-2 25.2-14 29.4-2.6 0.9-5.2 1.4-7.7 1.4z" fill="#2c2c2c" p-id="9428"></path><path d="M130.8 463.5l148.7 131.7c0.3 0.3 0.2 0.7-0.2 0.8L90.8 659c-0.4 0.1-0.7-0.2-0.6-0.6L130 463.8c0-0.4 0.5-0.5 0.8-0.3z" fill="#2c2c2c" p-id="9429"></path><path d="M94.4 680.7c-6.3 0-12.6-2.3-17.5-6.6-7-6.2-10.2-15.8-8.3-25L106.4 464c1.9-9.2 8.6-16.7 17.4-19.7 8.9-3 18.8-1 25.8 5.3L291 574.9c7 6.2 10.2 15.8 8.3 25-1.9 9.2-8.6 16.7-17.5 19.7l-179.3 59.8c-2.5 0.8-5.3 1.3-8.1 1.3z m50.3-174.1l-24.1 118.1L235 586.6l-90.3-80zM119.1 484z" fill="#2c2c2c" p-id="9430"></path></svg>
      </button>
      <button class="tool-btn" @click="onRedo" title="重做 (Ctrl/Cmd+Y)">
        <!-- redo SVG -->
        <svg t="1764418710309" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="11262" width="32" height="32"><path d="M86.6 673.1c-2.6 0-5.2-0.4-7.8-1.4-12.1-4.3-18.4-17.6-14.1-29.7 63.8-178.7 234.1-298.7 423.9-298.7 172.3 0 326.9 96 403.5 250.5 5.7 11.5 1 25.4-10.5 31.1-11.5 5.7-25.4 1-31.1-10.5-68.6-138.6-207.3-224.7-361.8-224.7-170.2 0-323 107.7-380.2 267.9-3.4 9.6-12.4 15.5-21.9 15.5z" fill="#2c2c2c" p-id="11263"></path><path d="M896.1 464.1L746.1 597c-0.3 0.3-0.2 0.7 0.2 0.8l190 63.4c0.4 0.1 0.7-0.2 0.6-0.6l-40.1-196.3c0-0.3-0.4-0.5-0.7-0.2z" fill="#2c2c2c" p-id="11264"></path><path d="M932.8 683.1c-2.8 0-5.6-0.4-8.4-1.4l-180.8-60.3c-9-3-15.7-10.6-17.6-19.9-1.9-9.3 1.3-18.9 8.4-25.2L877 449.9c7.1-6.3 17-8.3 26-5.3 9 3 15.7 10.6 17.6 19.9l38.1 186.7c1.9 9.3-1.3 18.9-8.4 25.2-4.8 4.4-11.1 6.7-17.5 6.7zM791 588.3l115.4 38.5L882 507.6l-91 80.7z m116.8-103.6c0 0.1 0 0 0 0z" fill="#2c2c2c" p-id="11265"></path></svg>
      </button>
    </div>
    
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore, type ToolType } from '@/stores/canvas'
import { HistoryService } from '@/services'
import { useElementsStore } from '@/stores/elements'

const canvasStore = useCanvasStore()
const currentTool = computed(() => canvasStore.currentTool)

const historyService = new HistoryService()
const elementsStore = useElementsStore()

const setTool = (tool: ToolType) => {
  canvasStore.setTool(tool)
  console.log('Tool selected:', tool)
}

const onUndo = () => {
  const snapshot = historyService.undo()
  if (snapshot) {
    elementsStore.elements = snapshot
    elementsStore.saveToLocal()
  }
}

const onRedo = () => {
  const snapshot = historyService.redo()
  if (snapshot) {
    elementsStore.elements = snapshot
    elementsStore.saveToLocal()
  }
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
