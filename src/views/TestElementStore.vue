<template>
  <div class="test-container">
    <h2>Element Store 批量操作测试</h2>

    <div class="controls">
      <button @click="add">添加元素</button>
      <button @click="removeLast" :disabled="elements.length === 0">
        删除最后一个
      </button>
      <button @click="selectAll" :disabled="elements.length === 0">
        全选
      </button>
      <button @click="clearSelection">清空选中</button>
      <button @click="deleteSelected" :disabled="!hasSelection">
        删除选中 ({{ selectedIds.length }})
      </button>

      <button @click="undo" :disabled="!canUndo" style="background: #e8f5e9; margin-left: 12px;">↶ 撤销</button>
      <button @click="redo" :disabled="!canRedo" style="background: #e8f5e9;">↷ 重做</button>

      <hr />

      <div v-if="hasSelection" class="batch-controls">
        <h4>批量操作（选中 {{ selectedIds.length }} 个）</h4>
        <button @click="moveSelectedBy(20, 0)">→ 向右移动</button>
        <button @click="moveSelectedBy(-20, 0)">← 向左移动</button>
        <button @click="moveSelectedBy(0, 20)">↓ 向下移动</button>
        <button @click="moveSelectedBy(0, -20)">↑ 向上移动</button>

        <button @click="scaleSelectedBy(1.1, 1.1)">🔍 放大 10%</button>
        <button @click="scaleSelectedBy(0.9, 0.9)">🔍 缩小 10%</button>

        <button @click="rotateSelectedBy(15)">↻ 旋转 +15°</button>
        <button @click="rotateSelectedBy(-15)">↺ 旋转 -15°</button>

        <button @click="updateSelectedFill('#FF6B6B')">
          🎨 红色
        </button>
        <button @click="updateSelectedFill('#4ECDC4')">
          🎨 青色
        </button>
      </div>
    </div>

    <h3>画布（点击选中，Shift+点击多选，可拖拽）</h3>
    <div class="canvas" ref="canvasEl">
      <div
        v-for="el in elements"
        :key="el.id"
        class="preview-el"
        :class="{ selected: isSelected(el.id) }"
        :style="elStyle(el)"
        @mousedown.prevent="onElementMouseDown(el, $event)"
        @click.prevent="onElementClick(el, $event)"
      >
        <span class="label">{{ el.type }} ({{ el.id.slice(-4) }})</span>
      </div>
    </div>

    <h3>当前选中: {{ selectedIds.join(', ') || '无' }}</h3>

    <div style="background: #f5f5f5; padding: 12px; border-radius: 4px; margin: 12px 0;">
      <h4 style="margin-top: 0;">📋 历史栈信息</h4>
      <p style="margin: 4px 0; font-size: 12px;">
        <strong>栈大小:</strong> {{ historyService.stack.length }} | 
        <strong>当前指针:</strong> {{ historyService.index }} | 
        <strong>元素数量:</strong> {{ elements.length }}
      </p>
      <p style="margin: 4px 0; font-size: 12px;">
        <strong>撤销:</strong> {{ canUndo ? '可用' : '不可用' }} | 
        <strong>重做:</strong> {{ canRedo ? '可用' : '不可用' }}
      </p>
    </div>

    <h3>元素列表</h3>
    <pre>{{ elements }}</pre>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useElementsStore } from '@/stores/elements'
import { useSelectionStore } from '@/stores/selection'
import { historyService } from '@/services'
import type { Element } from '@/cores/types/element'

const elementsStore = useElementsStore()
const selectionStore = useSelectionStore()

onMounted(() => {
  elementsStore.loadFromLocal()
})

const { elements } = storeToRefs(elementsStore)
const { selectedIds } = storeToRefs(selectionStore)

const hasSelection = computed(() => selectedIds.value.length > 0)
const canUndo = computed(() => historyService.index > 0)
const canRedo = computed(() => historyService.index < historyService.stack.length - 1)

// ============ 单选操作 ============

const add = () => {
  const id = elementsStore.addShape({
    x: 20 + Math.floor(Math.random() * 200),
    y: 20 + Math.floor(Math.random() * 120),
    width: 120,
    height: 80,
    fillColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
  })
  if (id) selectionStore.selectElement(id)
}

const removeLast = () => {
  const last = elements.value[elements.value.length - 1]
  if (last) {
    elementsStore.removeElement(last.id)
    selectionStore.removeFromSelection(last.id)
  }
}

const selectAll = () => {
  selectionStore.selectedIds = elements.value.map((el) => el.id)
}

const clearSelection = () => {
  selectionStore.clearSelection()
}

const deleteSelected = () => {
  // 使用批量删除接口，一次记录历史快照
  if (!hasSelection.value) return
  elementsStore.removeElements(selectedIds.value)
  selectionStore.clearSelection()
}

const isSelected = (id: string) => selectionStore.isSelected(id)

// ============ 批量操作 ============

const moveSelectedBy = (dx: number, dy: number) => {
  elementsStore.moveElements(selectedIds.value, dx, dy)
}

const scaleSelectedBy = (sx: number, sy: number) => {
  elementsStore.recordSnapshot()
  elementsStore.$patch((state) => {
    state.elements = state.elements.map((el) =>
      selectedIds.value.includes(el.id)
        ? { ...el, width: el.width * sx, height: el.height * sy }
        : el
    )
  })
  elementsStore.saveToLocal()
}

const rotateSelectedBy = (angle: number) => {
  elementsStore.recordSnapshot()
  elementsStore.$patch((state) => {
    state.elements = state.elements.map((el) =>
      selectedIds.value.includes(el.id)
        ? { ...el, rotation: ((el.rotation || 0) + angle) % 360 }
        : el
    )
  })
  elementsStore.saveToLocal()
}

const updateSelectedFill = (fill: string) => {
  elementsStore.recordSnapshot()
  elementsStore.$patch((state) => {
    state.elements = state.elements.map((el) =>
      selectedIds.value.includes(el.id)
        ? { ...el, fill, fillColor: fill }
        : el
    )
  })
  elementsStore.saveToLocal()
}

// ============ 选择与拖拽 ============

const dragging = ref<{ ids: string[]; startX: number; startY: number } | null>(
  null
)
const isDragging = ref(false)
const canvasEl = ref<HTMLElement | null>(null)

function onElementClick(el: Element, event: MouseEvent) {
  event.stopPropagation()
  
  // 如果是拖拽产生的 click，忽略
  if (isDragging.value) {
    return
  }

  if (event.shiftKey) {
    // Shift+点击：多选
    selectionStore.toggleSelection(el.id)
  } else if (event.ctrlKey || event.metaKey) {
    // Ctrl+点击：多选（Mac 用 Cmd）
    selectionStore.toggleSelection(el.id)
  } else {
    // 单击：单选
    selectionStore.selectElement(el.id)
  }
}

function onElementMouseDown(el: Element, event: MouseEvent) {
  event.stopPropagation()

  // 如果点击的元素未被选中，先选中它
  if (!isSelected(el.id)) {
    if (!event.shiftKey && !(event.ctrlKey || event.metaKey)) {
      selectionStore.selectElement(el.id)
    }
  }

  // 拖拽所有选中的元素
  isDragging.value = false
  dragging.value = {
    ids: selectedIds.value.length > 0 ? selectedIds.value : [el.id],
    startX: event.clientX,
    startY: event.clientY,
  }
  // 开始一个批处理，合并拖拽过程中的历史记录
  elementsStore.beginBatch()
}

function onPointerMove(e: MouseEvent) {
  if (!dragging.value) return
  
  const dX = e.clientX - dragging.value.startX
  const dY = e.clientY - dragging.value.startY

  // 当移动距离超过 5px 时，才认为是真正的拖拽
  const moveDistance = Math.sqrt(dX * dX + dY * dY)
  if (moveDistance > 5) {
    isDragging.value = true
  }

  dragging.value.startX = e.clientX
  dragging.value.startY = e.clientY

  if (isDragging.value) {
    elementsStore.moveElements(dragging.value.ids, dX, dY)
  }
}

function onPointerUp() {
  dragging.value = null
  // 结束批处理，提交一次历史快照
  elementsStore.endBatch()
  // 延迟重置 isDragging，避免 mouseup 后的 click 事件被拦截
  setTimeout(() => {
    isDragging.value = false
  }, 0)
}

onMounted(() => {
  window.addEventListener('mousemove', onPointerMove)
  window.addEventListener('mouseup', onPointerUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onPointerMove)
  window.removeEventListener('mouseup', onPointerUp)
})

const elStyle = (el: Element) => ({
  left: `${el.x}px`,
  top: `${el.y}px`,
  width: `${el.width}px`,
  height: `${el.height}px`,
  background: el.fill || el.fillColor || '#fff',
  transform: `rotate(${el.rotation || 0}deg)`,
})

// ============ 撤销/重做 ============
const undo = () => {
  const snapshot = historyService.undo()
  if (snapshot) {
    elementsStore.elements = snapshot
    elementsStore.saveToLocal()
  }
}

const redo = () => {
  const snapshot = historyService.redo()
  if (snapshot) {
    elementsStore.elements = snapshot
    elementsStore.saveToLocal()
  }
}
</script>

<style scoped>
.test-container {
  padding: 20px;
  font-family: sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  max-height: 100vh;
  overflow-y: auto;
}

.controls {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.controls hr {
  width: 100%;
  margin: 4px 0;
}

.batch-controls {
  display: contents;
}

.batch-controls h4 {
  width: 100%;
  margin: 4px 0;
  color: #4285f4;
}

button {
  padding: 6px 12px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

button:hover:not(:disabled) {
  background: #f0f0f0;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.canvas {
  width: 100%;
  height: 400px;
  border: 2px dashed #ccc;
  position: relative;
  background: #fafafa;
  margin-bottom: 12px;
  overflow: auto;
}

.preview-el {
  position: absolute;
  background: #fff;
  border: 2px solid #4285f4;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
  font-size: 12px;
  transition: all 0.1s;
}

.preview-el.selected {
  border: 3px solid #ff6b6b;
  box-shadow: 0 0 8px rgba(255, 107, 107, 0.5);
}

.preview-el:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.preview-el.selected:hover {
  box-shadow: 0 0 12px rgba(255, 107, 107, 0.7);
}

.label {
  pointer-events: none;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow: auto;
  max-height: 300px;
}
</style>
