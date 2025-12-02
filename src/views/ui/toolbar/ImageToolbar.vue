<template>
  <!-- 只在选中图片元素时显示 -->
  <div
    v-if="selectedImage && !selectionStore.isMultiSelect && currentTool === 'select' && !isDragging"
    class="image-toolbar"
    :style="toolbarStyle"
    @mousedown.stop
  >
    <!-- 模糊 -->
    <div class="control-group">
      <div class="group-header">
        <span class="label">模糊</span>
        <label class="toggle-switch">
          <input
            type="checkbox"
            :checked="hasFilter('blur')"
            @change="toggleFilter('blur')"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div v-if="hasFilter('blur')" class="slider-wrapper">
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          :value="getFilterValue('blur')"
          @input="updateFilter('blur', $event)"
          class="filter-slider"
          :style="{ '--progress': (getFilterValue('blur') / 20) * 100 + '%' }"
        />
      </div>
    </div>

    <div class="divider"></div>

    <!-- 亮度 -->
    <div class="control-group">
      <div class="group-header">
        <span class="label">亮度</span>
        <label class="toggle-switch">
          <input
            type="checkbox"
            :checked="hasFilter('brightness')"
            @change="toggleFilter('brightness')"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div v-if="hasFilter('brightness')" class="slider-wrapper">
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          :value="getFilterValue('brightness')"
          @input="updateFilter('brightness', $event)"
          class="filter-slider"
          :style="{ '--progress': (getFilterValue('brightness') / 2) * 100 + '%' }"
        />
      </div>
    </div>

    <div class="divider"></div>

    <!-- 对比度 -->
    <div class="control-group">
      <div class="group-header">
        <span class="label">对比度</span>
        <label class="toggle-switch">
          <input
            type="checkbox"
            :checked="hasFilter('contrast')"
            @change="toggleFilter('contrast')"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div v-if="hasFilter('contrast')" class="slider-wrapper">
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          :value="getFilterValue('contrast')"
          @input="updateFilter('contrast', $event)"
          class="filter-slider"
          :style="{ '--progress': (getFilterValue('contrast') / 2) * 100 + '%' }"
        />
      </div>
    </div>

    <div class="divider"></div>

    <!-- 透明度 -->
    <div class="control-group">
      <div class="group-header">
        <span class="label">透明度</span>
        <span class="value-text">{{ ((selectedImage?.opacity ?? 1) * 100).toFixed(0) }}%</span>
      </div>
      <div class="slider-wrapper">
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          :value="selectedImage?.opacity ?? 1"
          @input="updateOpacity"
          class="filter-slider"
          :style="{ '--progress': ((selectedImage?.opacity ?? 1) * 100) + '%' }"
        />
      </div>
    </div>

    <div class="divider"></div>

    <!-- 重置按钮 -->
    <button class="icon-btn" @click="resetFilters" title="重置所有滤镜">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useElementsStore } from '@/stores/elements'
import { useSelectionStore } from '@/stores/selection'
import { useCanvasStore } from '@/stores/canvas'
import { useDragState } from '@/composables/useDragState'
import type { ImageElement, SimpleFilterType } from '@/cores/types/element'

const elementsStore = useElementsStore()
const selectionStore = useSelectionStore()
const canvasStore = useCanvasStore()
const { getDragState } = useDragState()

// 监听拖拽状态
const isDragging = computed(() => {
  const dragState = getDragState().value
  return dragState?.isDragging || false
})

// 当前工具
const currentTool = computed(() => canvasStore.currentTool)

// 获取选中的图片元素
const selectedImage = computed(() => {
  const id = selectionStore.firstSelectedId
  if (!id) return null
  
  const element = elementsStore.getElementById(id)
  if (element?.type === 'image') {
    return element as ImageElement
  }
  return null
})

// 世界坐标转屏幕坐标
const worldToScreen = (worldX: number, worldY: number) => {
  const viewport = canvasStore.viewport
  const canvasWidth = canvasStore.width
  const canvasHeight = canvasStore.height
  
  const screenX = canvasWidth / 2 + (worldX - viewport.x) * viewport.zoom
  const screenY = canvasHeight / 2 + (worldY - viewport.y) * viewport.zoom
  
  return { x: screenX, y: screenY }
}

// 计算工具栏位置（显示在元素上方，使用屏幕坐标）
const toolbarStyle = computed(() => {
  if (!selectedImage.value) return {}

  const element = selectedImage.value
  const toolbarHeight = 80 // 工具栏高度
  const padding = 12

  // 转换为屏幕坐标
  const topLeft = worldToScreen(element.x, element.y)
  const topRight = worldToScreen(element.x + element.width, element.y)
  
  // 工具栏居中显示在元素上方
  const centerX = (topLeft.x + topRight.x) / 2

  return {
    position: 'fixed' as const,
    left: `${centerX}px`,
    top: `${topLeft.y - toolbarHeight - padding}px`,
    transform: 'translateX(-50%)',
    zIndex: 10000
  }
})

// 检查是否有指定滤镜
const hasFilter = (type: SimpleFilterType): boolean => {
  if (!selectedImage.value) return false
  return selectedImage.value.filters.some(f => f.type === type)
}

// 获取滤镜值
const getFilterValue = (type: SimpleFilterType): number => {
  if (!selectedImage.value) return 0
  const filter = selectedImage.value.filters.find(f => f.type === type)
  return filter?.value ?? getDefaultFilterValue(type)
}

// 获取默认滤镜值
const getDefaultFilterValue = (type: SimpleFilterType): number => {
  switch (type) {
    case 'blur':
      return 5
    case 'brightness':
      return 1
    case 'contrast':
      return 1
    default:
      return 0
  }
}

// 切换滤镜开关
const toggleFilter = (type: SimpleFilterType) => {
  if (!selectedImage.value) return
  
  const filters = [...selectedImage.value.filters]
  const index = filters.findIndex(f => f.type === type)
  
  if (index >= 0) {
    // 移除滤镜
    filters.splice(index, 1)
  } else {
    // 添加滤镜
    filters.push({
      type,
      value: getDefaultFilterValue(type)
    })
  }
  
  elementsStore.updateImageElement(selectedImage.value.id, { filters })
}

// 更新滤镜值
const updateFilter = (type: SimpleFilterType, event: Event) => {
  if (!selectedImage.value) return
  
  const value = parseFloat((event.target as HTMLInputElement).value)
  const filters = [...selectedImage.value.filters]
  const filter = filters.find(f => f.type === type)
  
  if (filter) {
    filter.value = value
    elementsStore.updateImageElement(selectedImage.value.id, { filters })
  }
}

// 更新透明度
const updateOpacity = (event: Event) => {
  if (!selectedImage.value) return
  
  const opacity = parseFloat((event.target as HTMLInputElement).value)
  elementsStore.updateImageElement(selectedImage.value.id, { opacity })
}

// 重置所有滤镜
const resetFilters = () => {
  if (!selectedImage.value) return
  
  elementsStore.updateImageElement(selectedImage.value.id, {
    filters: [],
    opacity: 1
  })
}
</script>

<style scoped>
.image-toolbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow: 0 6px 16px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.06);
  user-select: none;
  white-space: nowrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 10px;
  background: #f8f9fa;
  border-radius: 6px;
  min-width: 120px;
  transition: background-color 0.2s;
}

.control-group:hover {
  background: #f0f1f3;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 20px;
}

.label {
  font-size: 12px;
  color: #555;
  font-weight: 500;
}

.value-text {
  font-size: 12px;
  color: #888;
  font-family: monospace;
}

.divider {
  width: 1px;
  height: 32px;
  background-color: #e0e0e0;
  margin: 0 4px;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 28px;
  height: 16px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .3s;
  border-radius: 16px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 12px;
  width: 12px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

input:checked + .toggle-slider {
  background-color: #4A90E2;
}

input:checked + .toggle-slider:before {
  transform: translateX(12px);
}

/* Slider */
.slider-wrapper {
  display: flex;
  align-items: center;
  height: 16px;
}

.filter-slider {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: #e0e0e0;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  position: relative;
  width: 100%;
}

/* 进度条效果 (Webkit) */
.filter-slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  background: linear-gradient(to right, #4A90E2 var(--progress, 0%), #e0e0e0 var(--progress, 0%));
  border-radius: 2px;
}

.filter-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #4A90E2;
  cursor: pointer;
  margin-top: -4px; /* (track height - thumb height) / 2 */
  box-shadow: 0 1px 2px rgba(0,0,0,0.15);
  transition: transform 0.1s;
}

.filter-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #666;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.icon-btn:active {
  background: #e0e0e0;
}
</style>
