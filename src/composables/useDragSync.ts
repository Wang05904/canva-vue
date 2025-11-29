/**
 * 拖拽同步 Composable
 * 功能：在拖拽时同步更新 Canvas 元素位置，避免通过 Store 触发完整渲染流程
 */
import type { CanvasService } from '@/services/canvas/CanvasService'
import { useElementsStore } from '@/stores/elements'

export function useDragSync(canvasService: CanvasService) {
  const elementsStore = useElementsStore()

  /**
   * 拖拽时同步更新 Canvas 元素位置
   * @param elementIds 要移动的元素ID列表
   * @param offsetX X轴偏移量
   * @param offsetY Y轴偏移量
   */
  const syncDragPosition = (elementIds: string[], offsetX: number, offsetY: number) => {
    const updates = elementIds.map(id => {
      const element = elementsStore.getElementById(id)
      if (!element) return null
      
      return {
        id,
        x: element.x + offsetX,
        y: element.y + offsetY
      }
    }).filter(Boolean) as Array<{ id: string; x: number; y: number }>

    // 直接更新 Graphics 位置，跳过完整渲染
    if (updates.length > 0) {
      canvasService.batchUpdatePositions(updates)
    }
  }

  return {
    syncDragPosition
  }
}
