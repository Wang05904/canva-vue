<template>
  <!-- 单个形状元素样式编辑工具栏 -->
  <div
    v-if="selectedElement && selectedElement.type === 'shape' && !selectionStore.isMultiSelect && (currentTool === 'select') && !isDragging"
    class="floating-toolbar"
    :style="toolbarStyle"
    @mousedown.stop
  >
    <!-- 背景色 -->
    <div class="tool-btn" title="背景颜色" @click="toggleFillPicker">
      <div class="color-preview" :style="{ backgroundColor: (selectedElement.type === 'shape' ? selectedElement.fillColor : '#4A90E2') }"></div>
    </div>
    <!-- 背景色选择面板 -->
    <div v-if="showFillPicker" class="color-picker-panel" @click.stop>
      <div class="preset-colors">
        <div
          v-for="color in presetColors"
          :key="color"
          class="preset-color-item"
          :style="{ backgroundColor: color }"
          :class="{ active: selectedElement.type === 'shape' && selectedElement.fillColor === color }"
          @click="updateFill(color)"
        ></div>
      </div>
      <div class="custom-color-section">
        <input
          type="color"
          :value="selectedElement.type === 'shape' ? selectedElement.fillColor : '#4A90E2'"
          @input="updateFillCustom"
          class="custom-color-input"
        />
        <span class="custom-label">自定义</span>
      </div>
    </div>

    <div class="divider"></div>

    <!-- 边框宽度 -->
    <div class="tool-btn" title="边框宽度" @click="toggleBorderWidthPicker">
      <span class="icon-label" style="font-size: 16px;">⛶</span>
    </div>

    <!-- 边框宽度选择面板 -->
    <div v-if="showBorderWidthPicker" class="width-picker-panel" @click.stop>
      <div
        class="width-option"
        :class="{ active: (selectedElement.type === 'shape' ? selectedElement.strokeWidth : 0) === 0 }"
        @click="updateBorderWidth(0)"
      >
        <span class="width-label">无</span>
      </div>
      <div
        v-for="opt in borderWidthOptions"
        :key="opt.value"
        class="width-option"
        :class="{ active: selectedElement.type === 'shape' && selectedElement.strokeWidth === opt.value }"
        @click="updateBorderWidth(opt.value)"
      >
        <span class="width-label">{{ opt.label }}</span>
        <div class="width-preview" :style="{ height: opt.value + 'px' }"></div>
      </div>
    </div>

    <!-- 边框颜色 -->
    <template v-if="selectedElement.type === 'shape' && selectedElement.strokeWidth > 0">
      <div class="divider"></div>
      <div class="tool-btn" title="边框颜色" @click="toggleBorderColorPicker">
        <div
          class="color-preview border-mode"
          :style="{ borderColor: selectedElement.type === 'shape' ? selectedElement.strokeColor : '#000000' }"
        ></div>
      </div>

      <!-- 边框色选择面板 -->
      <div v-if="showBorderColorPicker" class="color-picker-panel" @click.stop>
        <div class="preset-colors">
          <div
            v-for="color in presetColors"
            :key="color"
            class="preset-color-item border-preview"
            :style="{ borderColor: color }"
            :class="{ active: selectedElement.type === 'shape' && selectedElement.strokeColor === color }"
            @click="updateBorderColor(color)"
          ></div>
        </div>
        <div class="custom-color-section">
          <input
            type="color"
            :value="selectedElement.type === 'shape' ? selectedElement.strokeColor : '#000000'"
            @input="updateBorderColorCustom"
            class="custom-color-input"
          />
          <span class="custom-label">自定义</span>
        </div>
      </div>
    </template>
  </div>

  <!-- 多选/组合操作浮动工具栏 -->
  <div
    v-else-if="(selectionStore.isMultiSelect || isGroupSelected) && currentTool === 'select' && !isDragging"
    class="floating-toolbar"
    :style="toolbarStyle"
    @mousedown.stop
  >
    <!-- 分组/解组按钮 -->
    <button
      v-if="selectionStore.isMultiSelect"
      class="tool-btn group-btn"
      title="组合所选元素"
      @click="handleGroup"
    >
      组合
    </button>

    <button
      v-else-if="isGroupSelected"
      class="tool-btn group-btn"
      title="解散组合"
      @click="handleUngroup"
    >
      解组
    </button>
  </div>
</template>

<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvas'
import { useElementsStore } from '@/stores/elements'
import { useSelectionStore } from '@/stores/selection'
import { useDragState } from '@/composables/useDragState'
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'
import { CoordinateTransform } from '@/cores/viewport/CoordinateTransform'
import type { CanvasService } from '@/services/canvas/CanvasService'
import { GroupService } from '@/services'
import { Message } from '@arco-design/web-vue'

const selectionStore = useSelectionStore()
const elementsStore = useElementsStore()
const canvasStore = useCanvasStore()
const { getDragState } = useDragState()
const canvasService = inject<CanvasService>('canvasService')
const groupService = new GroupService()

// 监听拖拽状态
const isDragging = computed(() => {
  const dragState = getDragState().value
  return dragState?.isDragging || false
})

// 预设颜色
const presetColors = [
  '#000000', '#FFFFFF', '#E94B3C', '#FF8C00', '#FFD700',
  '#4A90E2', '#7B68EE', '#9B59B6', '#2ECC71', '#1ABC9C'
]

// 控制工具显示状态
const showFillPicker = ref(false)
const showBorderColorPicker = ref(false)
const showBorderWidthPicker = ref(false)

// RAF ID 用于节流和延迟保存
let fillColorRafId: number | null = null
let borderColorRafId: number | null = null
let saveTimeoutId: number | null = null

// 延迟保存到 store（避免频繁更新）
const debouncedSave = () => {
  if (saveTimeoutId !== null) {
    clearTimeout(saveTimeoutId)
  }
  saveTimeoutId = window.setTimeout(() => {
    elementsStore.saveToLocal()
    saveTimeoutId = null
  }, 300)
}

// 边框宽度选项
const borderWidthOptions = [
  { label: '极细', value: 1 },
  { label: '细', value: 2 },
  { label: '中', value: 4 },
  { label: '粗', value: 6 }
]

// 获取选中的元素
const selectedElement = computed(() => {
  if (!selectionStore.firstSelectedId) return null
  return elementsStore.getElementById(selectionStore.firstSelectedId)
})

// 是否选中的是组合元素
const isGroupSelected = computed(() => {
  const el = selectedElement.value
  return !!el && el.type === 'group'
})

// 当前工具
const currentTool = computed(() => canvasStore.currentTool)

// 计算工具栏位置（显示在元素上方，使用屏幕坐标）
const toolbarStyle = computed(() => {
  if (!selectedElement.value) return {}

  const element = selectedElement.value
  const viewport = canvasStore.viewport
  const canvasWidth = canvasStore.width
  const canvasHeight = canvasStore.height

  // 将元素的世界坐标转换为屏幕坐标
  const topLeft = CoordinateTransform.worldToScreen(
    element.x,
    element.y,
    viewport,
    canvasWidth,
    canvasHeight
  )

  const bottomRight = CoordinateTransform.worldToScreen(
    element.x + element.width,
    element.y + element.height,
    viewport,
    canvasWidth,
    canvasHeight
  )

  const screenWidth = bottomRight.x - topLeft.x
  const screenCenterX = topLeft.x + screenWidth / 2

  const toolbarHeight = 44
  const padding = 12

  return {
    left: `${screenCenterX}px`,
    top: `${topLeft.y - toolbarHeight - padding}px`,
    transform: 'translateX(-50%)'
  }
})

// 创建组合
const handleGroup = () => {
  if (!selectionStore.isMultiSelect) return
  const ids = selectionStore.selectedIds

  // 禁止组合元素与其他元素再次组合
  const hasGroup = ids.some(id => {
    const el = elementsStore.getElementById(id)
    return el?.type === 'group'
  })

  if (hasGroup) {
    Message.warning({
      content: '组合元素不能再次与其他元素组合',
      duration: 2000
    })
    return
  }

  groupService.createGroup(ids)
}

// 解组
const handleUngroup = () => {
  if (!isGroupSelected.value || !selectedElement.value) return
  groupService.ungroup(selectedElement.value.id)
}

// 切换填充色选择器
const toggleFillPicker = () => {
  showFillPicker.value = !showFillPicker.value
  showBorderColorPicker.value = false
  showBorderWidthPicker.value = false
}

// 切换边框色选择器
const toggleBorderColorPicker = () => {
  showBorderColorPicker.value = !showBorderColorPicker.value
  showFillPicker.value = false
  showBorderWidthPicker.value = false
}

// 切换边框宽度选择器
const toggleBorderWidthPicker = () => {
  showBorderWidthPicker.value = !showBorderWidthPicker.value
  showFillPicker.value = false
  showBorderColorPicker.value = false
}

// 更新背景色
const updateFill = (color: string) => {
  if (selectedElement.value && selectedElement.value.type === 'shape') {
    elementsStore.updateShapeElementProperties(selectedElement.value.id, {
      fillColor: color
    })
  }
  showFillPicker.value = false
}

// 更新背景色  (自定义颜色 - 使用 RAF 优化 + 直接 PIXI 更新)
const updateFillCustom = (event: Event) => {
  const target = event.target as HTMLInputElement
  const color = target.value

  if (!selectedElement.value || selectedElement.value.type !== 'shape') return

  // 取消之前的 RAF
  if (fillColorRafId !== null) {
    cancelAnimationFrame(fillColorRafId)
  }

  // 使用 RAF 确保流畅更新
  fillColorRafId = requestAnimationFrame(() => {
    if (!selectedElement.value || selectedElement.value.type !== 'shape') return

    const elementId = selectedElement.value.id

    // 1. 立即更新 store 中的元素数据（不触发保存）
    const element = elementsStore.getElementById(elementId)
    if (element && element.type === 'shape') {
      element.fillColor = color
    }

    // 2. 直接更新 PIXI 渲染（跳过脏检查）
    if (canvasService) {
      canvasService.updateGraphicStyle(elementId, {
        ...selectedElement.value,
        fillColor: color
      })
    }

    // 3. 延迟保存到 localStorage
    debouncedSave()

    fillColorRafId = null
  })
}

// 更新边框宽度
const updateBorderWidth = (width: number) => {
  if (selectedElement.value && selectedElement.value.type === 'shape') {
    elementsStore.updateShapeElementProperties(selectedElement.value.id, {
      strokeWidth: width
    })
  }
  showBorderWidthPicker.value = false
}

// 更新边框颜色
const updateBorderColor = (color: string) => {
  if (selectedElement.value && selectedElement.value.type === 'shape') {
    elementsStore.updateShapeElementProperties(selectedElement.value.id, {
      strokeColor: color
    })
  }
  showBorderColorPicker.value = false
}

// 更新边框颜色（自定义颜色 - 使用 RAF 优化 + 直接 PIXI 更新）
const updateBorderColorCustom = (event: Event) => {
  const target = event.target as HTMLInputElement
  const color = target.value

  if (!selectedElement.value || selectedElement.value.type !== 'shape') return

  // 取消之前的 RAF
  if (borderColorRafId !== null) {
    cancelAnimationFrame(borderColorRafId)
  }

  // 使用 RAF 确保流畅更新
  borderColorRafId = requestAnimationFrame(() => {
    if (!selectedElement.value || selectedElement.value.type !== 'shape') return

    const elementId = selectedElement.value.id

    // 1. 立即更新 store 中的元素数据（不触发保存）
    const element = elementsStore.getElementById(elementId)
    if (element && element.type === 'shape') {
      element.strokeColor = color
    }

    // 2. 直接更新 PIXI 渲染（跳过脏检查）
    if (canvasService) {
      canvasService.updateGraphicStyle(elementId, {
        ...selectedElement.value,
        strokeColor: color
      })
    }

    // 3. 延迟保存到 localStorage
    debouncedSave()

    borderColorRafId = null
  })
}

// 点击外部关闭选择器
const handleClickOutside = (event: MouseEvent) => {
  const toolbar = document.querySelector('.floating-toolbar')
  if (toolbar && !toolbar.contains(event.target as Node)) {
    showFillPicker.value = false
    showBorderColorPicker.value = false
    showBorderWidthPicker.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)

  // 清理待处理的 RAF
  if (fillColorRafId !== null) {
    cancelAnimationFrame(fillColorRafId)
  }
  if (borderColorRafId !== null) {
    cancelAnimationFrame(borderColorRafId)
  }

  // 清理延迟保存定时器
  if (saveTimeoutId !== null) {
    clearTimeout(saveTimeoutId)
  }
})
</script>

<style scoped>
.floating-toolbar {
  position: absolute;
  z-index: 1000;
  background: white;
  border-radius: 8px;
  box-shadow: 0 6px 16px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
  padding: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  pointer-events: auto;
  user-select: none;
  transition: top 0.1s ease, left 0.1s ease;
}

.group-btn {
  padding: 0 12px;
  font-size: 13px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #333;
  white-space: nowrap;
}

.group-btn:hover {
  background-color: rgba(0, 0, 0, 0.06);
}

.tool-btn {
  position: relative;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.tool-btn:hover {
  background-color: rgba(0, 0, 0, 0.06);
}

.tool-group {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.tool-group:hover {
  background-color: rgba(0, 0, 0, 0.06);
}

.color-preview {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
}

.color-preview.border-mode {
  background: transparent;
  border-width: 2px;
}

.hidden-color-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.minimal-input {
  width: 40px;
  border: none;
  background: transparent;
  font-size: 14px;
  text-align: center;
  color: #333;
  font-family: inherit;
  outline: none;
}

.minimal-input:focus {
  background: rgba(255, 255, 255, 0.5);
}

.icon-label {
  font-size: 14px;
  color: #666;
  margin-right: 4px;
}

.divider {
  width: 1px;
  height: 16px;
  background-color: #e0e0e0;
  margin: 0 4px;
}

.color-picker-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 6px 16px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
  padding: 12px;
  z-index: 1001;
  min-width: 200px;
}

.preset-colors {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.preset-color-item {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.preset-color-item:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.preset-color-item.active {
  border-color: #4A90E2;
  box-shadow: 0 0 0 2px white, 0 0 0 4px #4A90E2;
}

.preset-color-item.border-preview {
  background: transparent;
  border-width: 3px;
}

.preset-color-item.border-preview.active {
  box-shadow: 0 0 0 2px white, 0 0 0 4px #4A90E2;
}

.custom-color-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.custom-color-input {
  width: 32px;
  height: 32px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
}

.custom-color-input:hover {
  border-color: #4A90E2;
}

.custom-label {
  font-size: 13px;
  color: #666;
}

.width-picker-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 6px 16px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
  padding: 4px;
  z-index: 1001;
  min-width: 120px;
}

.width-option {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.width-option:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.width-option.active {
  background-color: #e6f7ff;
  color: #1890ff;
}

.width-label {
  font-size: 13px;
  margin-right: 12px;
  min-width: 28px;
}

.width-preview {
  flex: 1;
  background-color: currentColor;
  border-radius: 1px;
}
</style>
