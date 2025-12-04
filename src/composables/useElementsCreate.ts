/**
 * Composables层-元素创建Composable
 * 功能：封装元素创建操作，提供简化的元素创建接口
 * 服务对象：为View层和其他Composable提供元素创建业务编排
 */
import { useElementsStore } from '@/stores/elements'
import { SHAPE_DEFAULTS, TEXT_DEFAULTS, COMMON_DEFAULTS } from '@/cores/config/elementDefaults'
import type { ToolType } from '@/services/canvas/ToolService'

export function useElementCreate() {
  const elementsStore = useElementsStore()

  /**
   * 创建元素
   * @param x 世界坐标 x
   * @param y 世界坐标 y
   * @param width 元素宽度
   * @param height 元素高度
   * @param tool 工具类型
   * @returns 创建的元素ID
   */
  const createElement = (
    x: number,
    y: number,
    width: number,
    height: number,
    tool: ToolType
  ): string | undefined => {
    // 只处理创建工具，忽略选择和平移工具
    if (tool === 'select' || tool === 'pan') return

    const zIndex = elementsStore.elements.length

    if (tool === 'text') {
      // 创建文本元素
      return elementsStore.addText({
        x,
        y,
        width,
        height,
        ...COMMON_DEFAULTS,
        ...TEXT_DEFAULTS,
        zIndex
      })
    } else if (tool === 'rectangle' || tool === 'circle' || tool === 'triangle') {
      // 创建图形元素
      const shapeDefaults = SHAPE_DEFAULTS[tool]
      return elementsStore.addShape({
        shapeType: tool,
        x,
        y,
        width,
        height,
        ...COMMON_DEFAULTS,
        ...shapeDefaults,
        zIndex
      })
    }

    console.warn(`Unknown tool type: ${tool}`)
    return
  }

  return {
    createElement
  }
}
