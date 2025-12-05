<template>
  <!-- 单个形状元素样式编辑工具栏 -->
  <div
    v-if="selectedElement && selectedElement.type === 'shape' && !selectionStore.isMultiSelect && (currentTool === 'select') && !isDragging && !isRotating"
    class="floating-toolbar"
    :style="toolbarStyle"
    @mousedown.stop
  >
    <!-- 背景色 -->
    <div 
      class="tool-btn-wrapper" 
      :class="{ active: showFillPicker }"
      @mouseenter="handleMouseEnter('fill')"
      @mouseleave="handleMouseLeave('fill')"
    >
      <div class="tool-btn" title="背景颜色">
        <div class="color-preview circle" :style="{ backgroundColor: previewFillColor || (selectedElement.type === 'shape' ? selectedElement.fillColor : '#4A90E2') }"></div>
        <svg v-if="showFillPicker" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
        <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      
      <!-- 背景色选择面板 -->
      <div 
        v-if="showFillPicker" 
        class="popover-panel" 
        @click.stop
        @mouseenter="handleMouseEnter('fill')"
        @mouseleave="handleMouseLeave('fill')"
      >
        <div class="color-grid">
          <div
            v-for="item in presetColors"
            :key="item.color"
            class="color-item has-tooltip"
            :data-tooltip="item.name"
            :style="{ backgroundColor: item.color }"
            :class="{ active: selectedElement.type === 'shape' && selectedElement.fillColor === item.color }"
            @mouseenter="handleFillPreview(item.color)"
            @mouseleave="handleFillPreviewEnd"
            @click="updateFill(item.color)"
          ></div>
          
          <!-- 自定义颜色按钮 -->
          <div 
            class="color-item custom-add-btn has-tooltip" 
            data-tooltip="自定义颜色"
          >
            <div class="color-input-wrapper">
              <input
                type="color"
                :value="selectedElement.type === 'shape' ? selectedElement.fillColor : '#4A90E2'"
                @input="previewFillCustom"
                @change="saveFillCustom"
                @focus="preventFillClose = true"
                @blur="preventFillClose = false"
                @click.stop
                class="custom-color-input"
              />
              <span class="plus-icon">+</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 边框设置 -->
    <div 
      class="tool-btn-wrapper" 
      :class="{ active: showBorderSettings }"
      @mouseenter="handleMouseEnter('border')"
      @mouseleave="handleMouseLeave('border')"
    >
      <div class="tool-btn has-tooltip" data-tooltip="边框设置">
        <div
          v-if="selectedElement.type === 'shape' && selectedElement.strokeWidth === 0"
          class="color-preview circle no-border-preview"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="2" y1="2" x2="22" y2="22"/>
          </svg>
        </div>
        <div
          v-else
          class="color-preview circle border-mode"
          :style="{ 
            borderColor: previewStrokeColor || (selectedElement.type === 'shape' ? selectedElement.strokeColor : '#000000'),
            borderWidth: '2px'
          }"
        ></div>
        <svg v-if="showBorderSettings" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
        <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
      </div>

      <!-- 边框设置面板 -->
      <div 
        v-if="showBorderSettings" 
        class="popover-panel" 
        @click.stop
        @mouseenter="handleMouseEnter('border')"
        @mouseleave="handleMouseLeave('border')"
      >
        <!-- 边框宽度选择 -->
        <div class="width-options-row">
          <div
            v-for="opt in borderWidthOptions"
            :key="opt.value"
            class="width-option-item"
            :class="{ active: (selectedElement.type === 'shape' ? selectedElement.strokeWidth : 0) === opt.value }"
            @click="updateBorderWidth(opt.value)"
            :title="opt.label"
          >
            <div v-if="opt.value === 0" class="no-border-icon"></div>
            <div v-else class="border-line" :style="{ height: Math.min(opt.value, 4) + 'px' }"></div>
          </div>
        </div>

        <div class="panel-divider"></div>

        <!-- 边框颜色选择 -->
        <div class="color-grid border-color-grid" :class="{ disabled: selectedElement.type === 'shape' && selectedElement.strokeWidth === 0 }">
          <!-- 自动匹配边框颜色 -->
          <div
            class="color-item auto-match-item has-tooltip"
            data-tooltip="自动匹配边框颜色"
            :class="{ active: selectedElement.type === 'shape' && selectedElement.strokeColor === selectedElement.fillColor }"
            @click="autoMatchBorderColor"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          
          <div
            v-for="item in presetColors"
            :key="item.color"
            class="color-item border-preview has-tooltip"
            :data-tooltip="item.name"
            :style="{ borderColor: item.color }"
            :class="{ active: selectedElement.type === 'shape' && selectedElement.strokeColor === item.color }"
            @mouseenter="handleBorderPreview(item.color)"
            @mouseleave="handleBorderPreviewEnd"
            @click="updateBorderColor(item.color)"
          ></div>

          <!-- 自定义颜色按钮 -->
          <div 
            class="color-item custom-add-btn has-tooltip" 
            data-tooltip="自定义颜色"
          >
            <div class="color-input-wrapper">
              <input
                type="color"
                :value="selectedElement.type === 'shape' ? selectedElement.strokeColor : '#000000'"
                @input="previewBorderCustom"
                @change="saveBorderCustom"
                @focus="preventBorderClose = true"
                @blur="preventBorderClose = false"
                @click.stop
                class="custom-color-input"
              />
              <span class="plus-icon">+</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- 扩展按钮 -->
    <div class="tool-btn-wrapper">
      <div class="tool-btn" title="更多">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </div>
    </div>
  </div>

  <!-- 多选/组合操作浮动工具栏 -->
  <div
    v-else-if="(selectionStore.isMultiSelect || isGroupSelected) && currentTool === 'select' && !isDragging && !isRotating"
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
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { CoordinateTransform } from '@/cores/viewport/CoordinateTransform'
import type { CanvasService } from '@/services/canvas/CanvasService'
import { GroupService } from '@/services'
import { Message } from '@arco-design/web-vue'

const selectionStore = useSelectionStore()
const elementsStore = useElementsStore()
const canvasStore = useCanvasStore()
const { getDragState, getRotateState } = useDragState()
const canvasService = inject<CanvasService>('canvasService')
const groupService = new GroupService()

// 监听拖拽状态
const isDragging = computed(() => {
  const dragState = getDragState().value
  return dragState?.isDragging || false
})

// 监听旋转状态
const isRotating = computed(() => {
  return getRotateState().value
})

// 预设颜色
const presetColors = [
  { color: '#000000', name: '黑色' },
  { color: '#434343', name: '深灰' },
  { color: '#666666', name: '灰色' },
  { color: '#999999', name: '浅灰' },
  { color: '#CCCCCC', name: '银色' },
  { color: '#FFFFFF', name: '白色' },
  { color: '#E94B3C', name: '红色' },
  { color: '#FF8C00', name: '橙色' },
  { color: '#FFD700', name: '金色' },
  { color: '#F1C40F', name: '黄色' },
  { color: '#2ECC71', name: '绿色' },
  { color: '#1ABC9C', name: '青色' },
  { color: '#4A90E2', name: '蓝色' },
  { color: '#3498DB', name: '天蓝' },
  { color: '#9B59B6', name: '紫色' },
  { color: '#8E44AD', name: '深紫' },
  { color: '#E91E63', name: '粉色' },
  { color: '#C0392B', name: '深红' },
  { color: '#D35400', name: '深橙' }
]

// 控制工具显示状态
const showFillPicker = ref(false)
const showBorderSettings = ref(false)

// 临时预览颜色（用于hover时显示，未点击确认）
const previewFillColor = ref<string | null>(null)
const previewStrokeColor = ref<string | null>(null)

// 自动匹配模式（边框色自动跟随填充色）
const isAutoMatchMode = ref(false)

// 弹窗关闭延迟定时器
let fillPickerTimer: number | null = null
let borderSettingsTimer: number | null = null
const CLOSE_DELAY = 300

// 阻止弹窗关闭的标志（用于颜色选择器打开时）
const preventFillClose = ref(false)
const preventBorderClose = ref(false)

// 处理鼠标移入/移出
const handleMouseEnter = (type: 'fill' | 'border') => {
  if (type === 'fill') {
    if (fillPickerTimer) clearTimeout(fillPickerTimer)
    showFillPicker.value = true
    showBorderSettings.value = false
  } else {
    if (borderSettingsTimer) clearTimeout(borderSettingsTimer)
    showBorderSettings.value = true
    showFillPicker.value = false
  }
}

const handleMouseLeave = (type: 'fill' | 'border') => {
  if (type === 'fill') {
    // 如果颜色选择器打开，不关闭弹窗
    if (preventFillClose.value) return
    
    fillPickerTimer = window.setTimeout(() => {
      showFillPicker.value = false
    }, CLOSE_DELAY)
  } else {
    // 如果颜色选择器打开，不关闭弹窗
    if (preventBorderClose.value) return
    
    borderSettingsTimer = window.setTimeout(() => {
      showBorderSettings.value = false
    }, CLOSE_DELAY)
  }
}

// RAF ID 用于节流和延迟保存
let fillColorRafId: number | null = null
let borderColorRafId: number | null = null
let fillPreviewRafId: number | null = null
let borderPreviewRafId: number | null = null

// 边框宽度选项
const borderWidthOptions = [
  { label: '无', value: 0 },
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

// 监听选中元素变化，更新自动匹配模式状态
watch(selectedElement, (element) => {
  if (element && element.type === 'shape') {
    // 检查是否处于自动匹配模式
    const autoColor = getAutoMatchColor(element.fillColor)
    isAutoMatchMode.value = element.strokeColor === autoColor
  }
}, { immediate: true })

// 根据填充色选择边框色（白色配黑色边框，其他颜色跟随填充色）
const getAutoMatchColor = (fillColor: string): string => {
  // 如果是白色，使用黑色边框
  if (fillColor.toUpperCase() === '#FFFFFF' || fillColor.toUpperCase() === '#FFF') {
    return '#000000'
  }
  // 其他颜色边框跟随填充色
  return fillColor
}

// 当前工具
const currentTool = computed(() => canvasStore.currentTool)

// 计算工具栏位置（使用屏幕坐标）
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
  const rotateHandleOffset = 25 // 旋转按钮在元素底部下方的距离
  const topThreshold = toolbarHeight + padding + 20 // 顶部安全距离

  // 判断元素是否在画布顶部附近
  const isNearTop = topLeft.y < topThreshold

  // 如果元素在顶部，工具栏显示在下方（需要避开旋转按钮）；否则显示在上方
  const topPosition = isNearTop
    ? bottomRight.y + rotateHandleOffset + padding + 8 // 旋转按钮下方额外留8px间距
    : topLeft.y - toolbarHeight - padding

  return {
    left: `${screenCenterX}px`,
    top: `${topPosition}px`,
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

// 预览背景色（hover时实时更新图形 - 使用RAF节流）
const handleFillPreview = (color: string) => {
  previewFillColor.value = color
  
  if (!selectedElement.value || selectedElement.value.type !== 'shape') return
  if (!canvasService) return
  
  // 取消之前的RAF
  if (fillPreviewRafId !== null) {
    cancelAnimationFrame(fillPreviewRafId)
  }
  
  // 使用RAF节流，避免频繁渲染
  fillPreviewRafId = requestAnimationFrame(() => {
    if (!selectedElement.value || selectedElement.value.type !== 'shape') return
    if (!canvasService) return
    
    canvasService.updateGraphicStyle(selectedElement.value.id, {
      ...selectedElement.value,
      fillColor: color
    })
    
    fillPreviewRafId = null
  })
}

// 结束背景色预览（恢复原始颜色）
const handleFillPreviewEnd = () => {
  // 取消待处理的RAF
  if (fillPreviewRafId !== null) {
    cancelAnimationFrame(fillPreviewRafId)
    fillPreviewRafId = null
  }
  
  previewFillColor.value = null
  
  if (!selectedElement.value || selectedElement.value.type !== 'shape') return
  if (!canvasService) return
  
  // 恢复原始颜色
  canvasService.updateGraphicStyle(selectedElement.value.id, {
    ...selectedElement.value,
    fillColor: selectedElement.value.fillColor
  })
}

// 更新背景色（点击确认）
const updateFill = (color: string) => {
  previewFillColor.value = null // 清除预览
  if (selectedElement.value && selectedElement.value.type === 'shape') {
    const updates: { fillColor: string; strokeColor?: string } = { fillColor: color }
    
    // 如果启用自动匹配，智能选择边框色
    if (isAutoMatchMode.value) {
      updates.strokeColor = getAutoMatchColor(color)
    }
    
    elementsStore.updateShapeElementProperties(selectedElement.value.id, updates)
  }
  showFillPicker.value = false
}

// 预览自定义背景色（input事件 - 拖动时实时预览）
const previewFillCustom = (event: Event) => {
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

    // 仅更新渲染，不保存到 store
    if (canvasService) {
      canvasService.updateGraphicStyle(elementId, {
        ...selectedElement.value,
        fillColor: color
      })
    }

    fillColorRafId = null
  })
}

// 保存自定义背景色（change事件 - 选择完成时保存）
const saveFillCustom = (event: Event) => {
  const target = event.target as HTMLInputElement
  const color = target.value

  if (selectedElement.value && selectedElement.value.type === 'shape') {
    const updates: { fillColor: string; strokeColor?: string } = { fillColor: color }
    
    // 如果启用自动匹配，智能选择边框色
    if (isAutoMatchMode.value) {
      updates.strokeColor = getAutoMatchColor(color)
    }
    
    elementsStore.updateShapeElementProperties(selectedElement.value.id, updates)
  }
}

// 更新边框宽度
const updateBorderWidth = (width: number) => {
  if (selectedElement.value && selectedElement.value.type === 'shape') {
    elementsStore.updateShapeElementProperties(selectedElement.value.id, {
      strokeWidth: width
    })
  }
}

// 自动匹配边框颜色（白色配黑色边框，其他颜色跟随填充色）
const autoMatchBorderColor = () => {
  if (!selectedElement.value || selectedElement.value.type !== 'shape') return
  
  const fillColor = selectedElement.value.fillColor
  const autoColor = getAutoMatchColor(fillColor)
  
  previewStrokeColor.value = null
  
  // 启用自动匹配模式
  isAutoMatchMode.value = true
  
  elementsStore.updateShapeElementProperties(selectedElement.value.id, {
    strokeColor: autoColor
  })
  
  showBorderSettings.value = false
}

// 预览边框颜色（hover时实时更新图形 - 使用RAF节流）
const handleBorderPreview = (color: string) => {
  previewStrokeColor.value = color
  
  if (!selectedElement.value || selectedElement.value.type !== 'shape') return
  if (!canvasService) return
  
  // 取消之前的RAF
  if (borderPreviewRafId !== null) {
    cancelAnimationFrame(borderPreviewRafId)
  }
  
  // 使用RAF节流，避免频繁渲染
  borderPreviewRafId = requestAnimationFrame(() => {
    if (!selectedElement.value || selectedElement.value.type !== 'shape') return
    if (!canvasService) return
    
    canvasService.updateGraphicStyle(selectedElement.value.id, {
      ...selectedElement.value,
      strokeColor: color
    })
    
    borderPreviewRafId = null
  })
}

// 结束边框颜色预览（恢复原始颜色）
const handleBorderPreviewEnd = () => {
  // 取消待处理的RAF
  if (borderPreviewRafId !== null) {
    cancelAnimationFrame(borderPreviewRafId)
    borderPreviewRafId = null
  }
  
  previewStrokeColor.value = null
  
  if (!selectedElement.value || selectedElement.value.type !== 'shape') return
  if (!canvasService) return
  
  // 恢复原始颜色
  canvasService.updateGraphicStyle(selectedElement.value.id, {
    ...selectedElement.value,
    strokeColor: selectedElement.value.strokeColor
  })
}

// 更新边框颜色（点击确认）
const updateBorderColor = (color: string) => {
  previewStrokeColor.value = null // 清除预览
  
  // 手动选择边框色时退出自动匹配模式
  isAutoMatchMode.value = false
  
  if (selectedElement.value && selectedElement.value.type === 'shape') {
    elementsStore.updateShapeElementProperties(selectedElement.value.id, {
      strokeColor: color
    })
  }
  showBorderSettings.value = false
}

// 预览自定义边框颜色（input事件 - 拖动时实时预览）
const previewBorderCustom = (event: Event) => {
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

    // 仅更新渲染，不保存到 store
    if (canvasService) {
      canvasService.updateGraphicStyle(elementId, {
        ...selectedElement.value,
        strokeColor: color
      })
    }

    borderColorRafId = null
  })
}

// 保存自定义边框颜色（change事件 - 选择完成时保存）
const saveBorderCustom = (event: Event) => {
  const target = event.target as HTMLInputElement
  const color = target.value

  // 手动选择边框色时退出自动匹配模式
  isAutoMatchMode.value = false

  if (selectedElement.value && selectedElement.value.type === 'shape') {
    elementsStore.updateShapeElementProperties(selectedElement.value.id, {
      strokeColor: color
    })
  }
}

// 点击外部关闭选择器
const handleClickOutside = (event: MouseEvent) => {
  const toolbar = document.querySelector('.floating-toolbar')
  if (toolbar && !toolbar.contains(event.target as Node)) {
    showFillPicker.value = false
    showBorderSettings.value = false
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
  if (fillPreviewRafId !== null) {
    cancelAnimationFrame(fillPreviewRafId)
  }
  if (borderPreviewRafId !== null) {
    cancelAnimationFrame(borderPreviewRafId)
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
  height: 32px;
}

.group-btn:hover {
  background-color: rgba(0, 0, 0, 0.06);
}

.tool-btn-wrapper {
  position: relative;
  border-radius: 6px;
}

.tool-btn-wrapper.active {
  background-color: rgba(0, 0, 0, 0.06);
}

.tool-btn {
  height: 32px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: #666;
}

.tool-btn:hover {
  background-color: rgba(0, 0, 0, 0.06);
}

.tool-btn-wrapper.active .tool-btn:hover {
  background-color: transparent;
}

.color-preview {
  width: 20px;
  height: 20px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
  box-sizing: border-box;
}

.color-preview.circle {
  border-radius: 50%;
}

.color-preview.border-mode {
  background: transparent;
}

.no-border-preview {
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.no-border-preview svg {
  color: #999;
}

.divider {
  width: 1px;
  height: 16px;
  background-color: #e0e0e0;
  margin: 0 4px;
}

.popover-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 12px;
  box-shadow: 0 6px 16px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
  padding: 12px;
  z-index: 1001;
  min-width: 220px;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 6px;
  margin-bottom: 0;
}

.border-color-grid {
  grid-template-columns: repeat(6, 1fr);
}

.border-color-grid {
  grid-template-columns: repeat(6, 1fr);
}

.color-item {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  position: relative;
}

.color-item:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.color-item.active {
  box-shadow: 0 0 0 2px white, 0 0 0 4px #4A90E2;
  border-color: transparent;
}

.color-item.border-preview {
  background: transparent;
  border-width: 3px;
}

.auto-match-item {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.auto-match-item svg {
  color: white;
  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.2));
}

.auto-match-item:hover svg {
  transform: scale(1.1);
  transition: transform 0.2s;
}

/* Tooltip implementation */
.has-tooltip {
  position: relative;
}

.has-tooltip:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  margin-bottom: 8px;
  pointer-events: none;
  z-index: 1002;
}

.has-tooltip:hover::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 4px;
  border-style: solid;
  border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
  margin-bottom: 0px;
  pointer-events: none;
  z-index: 1002;
}

.custom-color-section {
  display: none; /* 隐藏旧的自定义颜色区域 */
}

.color-input-wrapper {
  position: relative;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red);
}

.color-input-wrapper:hover {
  border-color: #4A90E2;
}

.custom-color-input {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  opacity: 0;
  cursor: pointer;
}

.plus-icon {
  font-size: 14px;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  pointer-events: none;
}

.width-options-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 4px;
}

.width-option-item {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  border: 1px solid transparent;
}

.width-option-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.width-option-item.active {
  background-color: #e6f7ff;
  border-color: #1890ff;
}

.no-border-icon {
  width: 16px;
  height: 16px;
  border: 1px solid #999;
  border-radius: 50%;
  position: relative;
}

.no-border-icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 1px;
  background-color: #999;
  transform: translate(-50%, -50%) rotate(45deg);
}

.border-line {
  width: 20px;
  background-color: #333;
  border-radius: 1px;
}

.panel-divider {
  height: 1px;
  background-color: #f0f0f0;
  margin: 0 0 12px 0;
}

.disabled {
  opacity: 0.4;
  pointer-events: none;
  filter: grayscale(100%);
}
</style>
