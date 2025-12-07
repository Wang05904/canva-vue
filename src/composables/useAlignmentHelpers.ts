/**
 * 对齐辅助工具
 * 功能：为对齐系统提供便捷的几何转换函数
 */

import type { AnyElement } from '@/cores/types/element'
import type { ElementGeometry } from '@/cores/types/geometry'
import { elementToGeometry } from '@/cores/algorithms/geometry/GeometryCalculator'

/**
 * 从拖拽偏移创建临时几何信息
 * @param element 原始元素
 * @param offsetX X轴偏移
 * @param offsetY Y轴偏移
 * @returns 临时几何信息
 */
export function createDragGeometry(
  element: AnyElement,
  offsetX: number,
  offsetY: number
): ElementGeometry {
  const geometry = elementToGeometry(element)
  
  // 应用拖拽偏移
  geometry.x = element.x + offsetX
  geometry.y = element.y + offsetY
  
  return geometry
}

/**
 * 从多个元素的边界框创建临时几何信息
 * @param boundingBox 边界框（已包含偏移）
 * @param rotation 可选的旋转角度
 * @returns 临时几何信息
 */
export function createBBoxGeometry(
  boundingBox: { x: number; y: number; width: number; height: number },
  rotation: number = 0
): ElementGeometry {
  return {
    id: 'temp-bbox',
    type: 'rect',
    x: boundingBox.x,
    y: boundingBox.y,
    width: boundingBox.width,
    height: boundingBox.height,
    rotation,
    isGroup: false
  }
}

/**
 * 从单个元素创建当前几何信息（用于resize等场景）
 * @param element 元素
 * @param overrides 可选的覆盖属性
 * @returns 几何信息
 */
export function createElementGeometry(
  element: AnyElement,
  overrides?: Partial<Pick<ElementGeometry, 'x' | 'y' | 'width' | 'height' | 'rotation'>>
): ElementGeometry {
  const geometry = elementToGeometry(element)
  
  if (overrides) {
    Object.assign(geometry, overrides)
  }
  
  return geometry
}
