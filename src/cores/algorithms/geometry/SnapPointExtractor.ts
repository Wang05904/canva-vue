/**
 * 吸附点提取工具
 * 功能：从几何对象中提取所有吸附点
 */

import type { ElementGeometry, RBoundingBox, SnapPoint } from '../../types/geometry'
import { getMidpoint } from '../../utils/rotation'

/**
 * 从几何信息中提取吸附点
 * @param geometry 元素几何信息
 * @param rbbox 旋转包围盒
 * @returns 吸附点数组
 */
export function extractSnapPoints(geometry: ElementGeometry, rbbox: RBoundingBox): SnapPoint[] {
  const points: SnapPoint[] = []

  // 1. 中心点（所有类型都有）
  points.push({
    x: rbbox.center.x,
    y: rbbox.center.y,
    type: 'center',
    elementId: geometry.id
  })

  // 2. 三角形：使用实际顶点（不使用包围盒角点）
  if (geometry.type === 'triangle' && geometry.vertices && geometry.vertices.length === 3) {
    for (const vertex of geometry.vertices) {
      points.push({
        x: vertex.x,
        y: vertex.y,
        type: 'triangle-vertex',
        elementId: geometry.id
      })
    }
    // 三角形不需要包围盒的角点和边中点，直接返回
    return points
  }

  // 3. 其他形状：包围盒的4个角点
  for (const corner of rbbox.corners) {
    points.push({
      x: corner.x,
      y: corner.y,
      type: 'corner',
      elementId: geometry.id
    })
  }

  // 4. 其他形状：包围盒4条边的中点
  const [topLeft, topRight, bottomRight, bottomLeft] = rbbox.corners

  // 上边中点
  const topMid = getMidpoint(topLeft, topRight)
  points.push({
    x: topMid.x,
    y: topMid.y,
    type: 'edge-mid',
    elementId: geometry.id
  })

  // 右边中点
  const rightMid = getMidpoint(topRight, bottomRight)
  points.push({
    x: rightMid.x,
    y: rightMid.y,
    type: 'edge-mid',
    elementId: geometry.id
  })

  // 下边中点
  const bottomMid = getMidpoint(bottomRight, bottomLeft)
  points.push({
    x: bottomMid.x,
    y: bottomMid.y,
    type: 'edge-mid',
    elementId: geometry.id
  })

  // 左边中点
  const leftMid = getMidpoint(bottomLeft, topLeft)
  points.push({
    x: leftMid.x,
    y: leftMid.y,
    type: 'edge-mid',
    elementId: geometry.id
  })

  return points
}

/**
 * 批量提取多个元素的吸附点
 */
export function extractAllSnapPoints(
  geometries: ElementGeometry[],
  rbboxes: RBoundingBox[]
): Map<string, SnapPoint[]> {
  const result = new Map<string, SnapPoint[]>()

  for (let i = 0; i < geometries.length; i++) {
    const geometry = geometries[i]
    const rbbox = rbboxes[i]
    if (!geometry || !rbbox) continue
    const points = extractSnapPoints(geometry, rbbox)
    result.set(geometry.id, points)
  }

  return result
}
