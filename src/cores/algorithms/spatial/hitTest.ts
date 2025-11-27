/**
 * 核心层-碰撞检测算法
 * 功能：处理画布点击事件的碰撞检测，支持组合元素和普通元素
 * 服务对象：为Service层的事件处理提供碰撞检测支持
 */
import type { AnyElement, Point, ShapeElement } from '@/cores/types/element'

// 全局元素列表，用于hitTest函数访问
let globalElements: AnyElement[] = []

/**
 * 设置全局元素列表，供hitTest函数使用
 * @param elements 所有元素列表
 */
export function setElementsForHitTest(elements: AnyElement[]): void {
  globalElements = elements
}

/**
 * 点与元素碰撞检测的统一入口
 * @param x 点击位置的x坐标
 * @param y 点击位置的y坐标
 * @returns 命中的元素，如果没有命中返回null
 */
export function hitTest(x: number, y: number): AnyElement | null {
  const point: Point = { x, y }
  // 1. 获取所有顶层元素（parentGroup为null）并按z-index从高到低排序
  const topLevelElements = globalElements
    .filter(element => element.parentGroup === null && element.visible)
    .sort((a, b) => b.zIndex - a.zIndex)

  // 2. 从最高层开始检测
  for (const element of topLevelElements) {
    if (element.type === 'group') {
      // 组合元素：检测点击是否在组合的包围盒内
      if (hitTestRect(point, element)) {
        return element
      }
    } else {
      // 普通元素：检测点击是否在元素形状内
      if (hitTestElement(point, element)) {
        return element
      }
    }
  }

  // 没有命中任何元素
  return null
}

/**
 * 点与普通元素碰撞检测
 * @param point 点击位置
 * @param element 普通元素
 * @returns 是否命中
 */
function hitTestElement(point: Point, element: AnyElement): boolean {
  if (element.type === 'shape') {
    const shapeElement = element as ShapeElement
    switch (shapeElement.shapeType) {
      case 'rectangle':
      case 'roundedRect':
        return hitTestRect(point, element)
      case 'circle':
        return hitTestCircle(point, shapeElement)
      case 'triangle':
        return hitTestTriangle(point, shapeElement)
      default:
        return hitTestRect(point, element)
    }
  } else {
    // 文本和图片元素使用边界框检测
    return hitTestRect(point, element)
  }
}

/**
 * 矩形碰撞检测（包括文本、图片、矩形形状）
 * @param point 点击位置
 * @param rect 矩形元素
 * @returns 是否命中
 */
function hitTestRect(point: Point, rect: AnyElement): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

/**
 * 圆形碰撞检测
 * @param point 点击位置
 * @param circle 圆形元素
 * @returns 是否命中
 */
function hitTestCircle(point: Point, circle: ShapeElement): boolean {
  const centerX = circle.x + circle.width / 2
  const centerY = circle.y + circle.height / 2
  const radius = circle.width / 2
  
  const dx = point.x - centerX
  const dy = point.y - centerY
  
  return dx * dx + dy * dy <= radius * radius
}

/**
 * 三角形碰撞检测（重心坐标法）
 * @param point 点击位置
 * @param triangle 三角形元素
 * @returns 是否命中
 */
function hitTestTriangle(point: Point, triangle: ShapeElement): boolean {
  // 三角形三个顶点坐标
  const v0 = { x: triangle.x + triangle.width / 2, y: triangle.y }
  const v1 = { x: triangle.x, y: triangle.y + triangle.height }
  const v2 = { x: triangle.x + triangle.width, y: triangle.y + triangle.height }

  // 计算向量
  const v0v1 = { x: v1.x - v0.x, y: v1.y - v0.y }
  const v0v2 = { x: v2.x - v0.x, y: v2.y - v0.y }
  const v0p = { x: point.x - v0.x, y: point.y - v0.y }

  // 计算点积
  const dot00 = v0v1.x * v0v1.x + v0v1.y * v0v1.y
  const dot01 = v0v1.x * v0v2.x + v0v1.y * v0v2.y
  const dot02 = v0v1.x * v0p.x + v0v1.y * v0p.y
  const dot11 = v0v2.x * v0v2.x + v0v2.y * v0v2.y
  const dot12 = v0v2.x * v0p.x + v0v2.y * v0p.y

  // 计算重心坐标
  const invDenom = 1 / (dot00 * dot11 - dot01 * dot01)
  const u = (dot11 * dot02 - dot01 * dot12) * invDenom
  const v = (dot00 * dot12 - dot01 * dot02) * invDenom

  // 检查点是否在三角形内
  return u >= 0 && v >= 0 && u + v <= 1
}


