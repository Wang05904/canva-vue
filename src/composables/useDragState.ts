/**
 * 拖拽状态共享 Composable
 * 功能：在图片元素和选中框之间共享拖拽状态，确保边框实时跟随
 */
import { ref } from 'vue'

// 全局拖拽状态
const globalDragState = ref<{
  isDragging: boolean
  elementIds: string[]
  offset: { x: number; y: number }
  initialBoundingBox: { x: number; y: number; width: number; height: number } | null
} | null>(null)

export function useDragState() {
  /**
   * 开始拖拽
   */
  const startDrag = (elementIds: string[], initialBoundingBox?: { x: number; y: number; width: number; height: number } | null) => {
    globalDragState.value = {
      isDragging: true,
      elementIds,
      offset: { x: 0, y: 0 },
      initialBoundingBox: initialBoundingBox || null
    }
  }

  /**
   * 更新拖拽偏移
   */
  const updateDragOffset = (offset: { x: number; y: number }) => {
    if (globalDragState.value) {
      // 创建新对象以触发响应式更新
      globalDragState.value = {
        ...globalDragState.value,
        offset: { ...offset }
      }
    }
  }

  /**
   * 结束拖拽
   */
  const endDrag = () => {
    globalDragState.value = null
  }

  /**
   * 获取当前拖拽状态
   */
  const getDragState = () => {
    return globalDragState
  }

  return {
    startDrag,
    updateDragOffset,
    endDrag,
    getDragState
  }
}
