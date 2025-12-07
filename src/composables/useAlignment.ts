import { storeToRefs } from 'pinia'
import { useElementsStore } from '@/stores/elements'
import { useGuidelinesStore } from '@/stores/guidelines'
import { useCanvasStore } from '@/stores/canvas'
import { AlignmentCalculator } from '@/cores/algorithms/spatial/AlignmentCalculator'
import type { ElementGeometry } from '@/cores/types/geometry'

export function useAlignment() {
  const elementsStore = useElementsStore()
  const guidelinesStore = useGuidelinesStore()
  const canvasStore = useCanvasStore()
  const { viewport } = storeToRefs(canvasStore)

  /**
   * 计算对齐并更新辅助线（新版：支持旋转包围盒）
   * @param targetGeometry 当前拖拽元素的几何信息（包含旋转）
   * @param excludeIds 需要排除的元素ID（通常是正在拖拽的元素）
   * @returns 吸附修正值 { dx, dy }
   */
  const checkAlignment = (
    targetGeometry: ElementGeometry,
    excludeIds: string[]
  ) => {
    // 如果关闭了吸附功能，直接返回0偏移并清空辅助线
    if (!guidelinesStore.isSnapEnabled) {
      guidelinesStore.clearLines()
      return { dx: 0, dy: 0 }
    }

    // 获取所有其他元素作为对齐参考
    const otherElements = elementsStore.elements.filter(
      el => !excludeIds.includes(el.id)
    )

    // 计算对齐
    const result = AlignmentCalculator.calculate(
      targetGeometry,
      otherElements,
      viewport.value.zoom
    )

    // 更新辅助线显示
    guidelinesStore.setLines(result.verticalLines, result.horizontalLines)

    return {
      dx: result.dx,
      dy: result.dy
    }
  }

  /**
   * 清除辅助线
   */
  const clearAlignment = () => {
    guidelinesStore.clearLines()
  }

  return {
    checkAlignment,
    clearAlignment
  }
}
