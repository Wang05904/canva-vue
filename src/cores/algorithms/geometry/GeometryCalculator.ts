/**
 * 几何计算工具
 * 功能：计算元素的旋转包围盒和几何信息
 */

import type { AnyElement, ShapeElement } from '../../types/element'
import type { ElementGeometry, RBoundingBox, Point } from '../../types/geometry'
import { getRotatedRectCorners } from '../../utils/rotation'

/**
 * 从CanvasElement提取几何信息
 */
export function elementToGeometry(element: AnyElement): ElementGeometry {
  const geo: ElementGeometry = {
    id: element.id,
    type: getGeometryType(element),
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    isGroup: element.type === 'group'
  }

  // 三角形需要特殊处理，提取顶点
  if (element.type === 'shape' && (element as ShapeElement).shapeType === 'triangle') {
    geo.vertices = getTriangleVertices(element.x, element.y, element.width, element.height, element.rotation)
  }

  return geo
}

/**
 * 获取几何类型
 */
function getGeometryType(element: AnyElement): ElementGeometry['type'] {
  if (element.type === 'group') return 'group'
  if (element.type === 'image') return 'image'
  if (element.type === 'text') return 'text'
  if (element.type === 'shape') {
    const shape = element as ShapeElement
    if (shape.shapeType === 'triangle') return 'triangle'
    if (shape.shapeType === 'circle') return 'circle'
    return 'rect' // rectangle 和 roundedRect 都当作 rect
  }
  return 'rect'
}

/**
 * 计算三角形的3个顶点（考虑旋转）
 * 假设三角形是等边三角形，顶点在顶部中心
 */
function getTriangleVertices(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number
): Point[] {
  const center = {
    x: x + width / 2,
    y: y + height / 2
  }

  // 未旋转的三角形顶点（相对于包围盒）
  // 顶点：顶部中心
  // 左下、右下
  const top = { x: x + width / 2, y }
  const bottomLeft = { x, y: y + height }
  const bottomRight = { x: x + width, y: y + height }

  // 旋转所有顶点
  const rotated = [top, bottomLeft, bottomRight].map(p => {
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)

    const dx = p.x - center.x
    const dy = p.y - center.y

    return {
      x: dx * cos - dy * sin + center.x,
      y: dx * sin + dy * cos + center.y
    }
  })

  return rotated
}

/**
 * 计算完整的旋转包围盒（R-BBox）
 */
export function computeGeometry(geometry: ElementGeometry): RBoundingBox {
  const center = {
    x: geometry.x + geometry.width / 2,
    y: geometry.y + geometry.height / 2
  }

  // 计算旋转后的4个角点
  const corners = getRotatedRectCorners(
    geometry.x,
    geometry.y,
    geometry.width,
    geometry.height,
    geometry.rotation
  )

  return {
    id: geometry.id,
    center,
    corners,
    width: geometry.width,
    height: geometry.height,
    rotation: geometry.rotation
  }
}

/**
 * 批量计算多个元素的几何信息
 */
export function computeGeometries(elements: AnyElement[]): ElementGeometry[] {
  return elements.map(elementToGeometry)
}

/**
 * 批量计算旋转包围盒
 */
export function computeRBBoxes(geometries: ElementGeometry[]): RBoundingBox[] {
  return geometries.map(computeGeometry)
}
