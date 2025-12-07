/**
 * 核心层-几何类型定义
 * 功能：定义旋转包围盒和对齐相关的几何类型
 */

export interface Point {
  x: number
  y: number
}

/**
 * 元素几何信息（统一接口）
 */
export interface ElementGeometry {
  id: string
  type: 'rect' | 'triangle' | 'circle' | 'image' | 'text' | 'group'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  vertices?: Point[] // triangle only
  isGroup?: boolean
}

/**
 * 旋转包围盒 (Rotated Bounding Box)
 */
export interface RBoundingBox {
  id: string
  center: Point
  corners: [Point, Point, Point, Point] // 4个旋转后的顶点（顺时针：左上、右上、右下、左下）
  width: number
  height: number
  rotation: number
}

/**
 * 吸附点类型
 */
export type SnapPointType = 'center' | 'corner' | 'edge-mid' | 'triangle-vertex'

/**
 * 吸附点
 */
export interface SnapPoint {
  x: number
  y: number
  type: SnapPointType
  elementId?: string // 可选：用于调试
}

/**
 * 辅助线（点对点连接线）
 */
export interface Guideline {
  start: Point
  end: Point
  type: 'center' | 'edge' | 'vertex'
  axis: 'horizontal' | 'vertical' // 辅助线方向
}

/**
 * 对齐结果
 */
export interface AlignmentResult {
  dx: number
  dy: number
  verticalLines: Guideline[]
  horizontalLines: Guideline[]
}
