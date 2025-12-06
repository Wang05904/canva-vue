/**
 * 旋转相关的数学工具函数
 */

import type { Point } from '../types/geometry'

/**
 * 围绕某个中心点旋转一个点（弧度制）
 * @param point 要旋转的点
 * @param center 旋转中心
 * @param angleRad 旋转角度（弧度，顺时针为正）
 * @returns 旋转后的点
 */
export function rotatePoint(point: Point, center: Point, angleRad: number): Point {
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)

  // 平移到原点
  const dx = point.x - center.x
  const dy = point.y - center.y

  // 旋转
  const rotatedX = dx * cos - dy * sin
  const rotatedY = dx * sin + dy * cos

  // 平移回去
  return {
    x: rotatedX + center.x,
    y: rotatedY + center.y
  }
}

/**
 * 计算矩形的4个旋转后的顶点（顺时针：左上、右上、右下、左下）（弧度制）
 * @param x 矩形左上角X
 * @param y 矩形左上角Y
 * @param width 矩形宽度
 * @param height 矩形高度
 * @param rotationRad 旋转角度（弧度）
 * @returns 4个旋转后的顶点
 */
export function getRotatedRectCorners(
  x: number,
  y: number,
  width: number,
  height: number,
  rotationRad: number
): [Point, Point, Point, Point] {
  const center = {
    x: x + width / 2,
    y: y + height / 2
  }

  // 未旋转的4个顶点
  const topLeft = { x, y }
  const topRight = { x: x + width, y }
  const bottomRight = { x: x + width, y: y + height }
  const bottomLeft = { x, y: y + height }

  // 旋转所有顶点
  return [
    rotatePoint(topLeft, center, rotationRad),
    rotatePoint(topRight, center, rotationRad),
    rotatePoint(bottomRight, center, rotationRad),
    rotatePoint(bottomLeft, center, rotationRad)
  ]
}

/**
 * 计算两点之间的中点
 */
export function getMidpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  }
}

/**
 * 计算两点之间的距离
 */
export function getDistance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * 计算多个点的包围盒中心
 */
export function getCenterOfPoints(points: Point[]): Point {
  if (points.length === 0) {
    return { x: 0, y: 0 }
  }

  let sumX = 0
  let sumY = 0

  for (const p of points) {
    sumX += p.x
    sumY += p.y
  }

  return {
    x: sumX / points.length,
    y: sumY / points.length
  }
}

/**
 * 计算多个点的轴对齐包围盒（AABB）
 */
export function getAABB(points: Point[]): { x: number; y: number; width: number; height: number } {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const p of points) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}
