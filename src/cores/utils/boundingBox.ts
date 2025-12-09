/**
 * 边界框计算工具函数
 * 用于计算元素的轴对齐边界框（AABB）
 */
import type { AnyElement } from '@/cores/types/element'

/**
 * 根据一组元素计算包围盒
 * @param elements 元素数组
 * @returns 包围盒 { x, y, width, height } 或 null（如果没有有效元素）
 */
export function calculateBoundingBox(
  elements: AnyElement[]
): { x: number; y: number; width: number; height: number } | null {
  if (!elements.length) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  elements.forEach(el => {
    const rotation = el.rotation || 0

    if (rotation === 0) {
      // 未旋转，直接使用轴对齐边界框
      minX = Math.min(minX, el.x)
      minY = Math.min(minY, el.y)
      maxX = Math.max(maxX, el.x + el.width)
      maxY = Math.max(maxY, el.y + el.height)
    } else {
      // 已旋转，计算旋转后的四个角点，然后求其外包围盒
      const centerX = el.x + el.width / 2
      const centerY = el.y + el.height / 2
      const cos = Math.cos(rotation)
      const sin = Math.sin(rotation)

      // 四个角点相对于中心的坐标
      const corners = [
        { x: -el.width / 2, y: -el.height / 2 },
        { x: el.width / 2, y: -el.height / 2 },
        { x: el.width / 2, y: el.height / 2 },
        { x: -el.width / 2, y: el.height / 2 }
      ]

      // 旋转并转换到世界坐标，求 AABB
      corners.forEach(corner => {
        const worldX = centerX + corner.x * cos - corner.y * sin
        const worldY = centerY + corner.x * sin + corner.y * cos
        minX = Math.min(minX, worldX)
        minY = Math.min(minY, worldY)
        maxX = Math.max(maxX, worldX)
        maxY = Math.max(maxY, worldY)
      })
    }
  })

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}
