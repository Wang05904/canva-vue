<template>
  <div
    class="image-element"
    :style="containerStyle"
    @mousedown="onMouseDown"
  >
    <img
      :src="element.src"
      :style="imageStyle"
      draggable="false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ImageElement } from '@/cores/types/element'
import { useElementDrag } from '@/composables/useElementDrag'
import { useDragState } from '@/composables/useDragState'
import { useElementsStore } from '@/stores/elements'
import { useSelectionStore } from '@/stores/selection'

const props = defineProps<{
  element: ImageElement
}>()

// 使用拖拽 composable
const { handleMouseDown, isDragging } = useElementDrag(props.element.id)
const { getDragState } = useDragState()
const elementsStore = useElementsStore()
const selectionStore = useSelectionStore()

// 包装一层，避免组合内子元素被直接拖拽 / 选中
const onMouseDown = (e: MouseEvent) => {
  const el = elementsStore.getElementById(props.element.id)
  if (el && el.parentGroup) {
    // 点击组合内图片时，选中其父组合，而不是图片本身
    e.stopPropagation()
    e.preventDefault()
    selectionStore.selectElement(el.parentGroup)
    return
  }
  handleMouseDown(e)
}

// 容器样式 - 使用 transform3d 启用 GPU 加速
const containerStyle = computed(() => {
  // 检查是否在全局拖拽中（多选拖拽）
  const dragState = getDragState().value
  const isInGlobalDrag = dragState?.isDragging && dragState.elementIds.includes(props.element.id)
  
  let x = props.element.x
  let y = props.element.y
  
  // 如果在全局拖拽中且不是自己发起的拖拽，应用拖拽偏移
  if (isInGlobalDrag && !isDragging.value && dragState) {
    x += dragState.offset.x
    y += dragState.offset.y
  }
  
  return {
    position: 'absolute' as const,
    left: '0',
    top: '0',
    width: `${props.element.width}px`,
    height: `${props.element.height}px`,
    transform: `translate3d(${x}px, ${y}px, 0) rotate(${props.element.rotation || 0}deg)`,
    opacity: props.element.opacity,
    visibility: (props.element.visible ? 'visible' : 'hidden') as 'visible' | 'hidden',
    pointerEvents: (props.element.locked ? 'none' : 'auto') as 'none' | 'auto',
    zIndex: props.element.zIndex,
    cursor: 'move' as const
  }
})

// 图片样式(包含滤镜)
const imageStyle = computed(() => {
  const filters = props.element.filters.map(f => {
    switch (f.type) {
      case 'blur':
        return `blur(${f.value}px)`
      case 'brightness':
        return `brightness(${f.value})`
      case 'contrast':
        return `contrast(${f.value})`
      default:
        return ''
    }
  }).filter(Boolean).join(' ')

  return {
    width: '100%',
    height: '100%',
    objectFit: 'fill' as const,
    filter: filters || 'none',
    userSelect: 'none' as const
  }
})
</script>

<style scoped>
.image-element {
  transform-origin: top left;
  /* 拖拽时启用 GPU 加速 */
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.image-element.dragging {
  will-change: transform;
}

.image-element img {
  display: block;
  pointer-events: none;
  /* 优化图片渲染 */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
</style>
