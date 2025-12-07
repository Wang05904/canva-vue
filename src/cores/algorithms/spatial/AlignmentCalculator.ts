/**
 * 对齐计算器（支持旋转包围盒）
 * 功能：计算元素吸附对齐，支持旋转、不同形状、组合等
 */

import type { AnyElement } from '@/cores/types/element'
import type { AlignmentResult, Guideline, SnapPoint, ElementGeometry, Point } from '@/cores/types/geometry'
import { elementToGeometry, computeGeometry } from '../geometry/GeometryCalculator'
import { extractSnapPoints } from '../geometry/SnapPointExtractor'
import { getAABB } from '@/cores/utils/rotation'

interface SnapCandidate {
  dx: number
  dy: number
  targetPoint: SnapPoint
  refPoint: SnapPoint
  axis: 'x' | 'y'
}

export class AlignmentCalculator {
  // 基础吸附阈值（像素），会按缩放放大。略大一些以便多元素同时对齐时不必“贴脸”。
  static readonly THRESHOLD_BASE = 8

  /**
   * 计算对齐吸附（支持旋转包围盒）
   * @param targetGeometry 当前拖拽元素的几何信息
   * @param referenceElements 参考元素列表
   * @param scale 当前画布缩放比例
   */
  static calculate(
    targetGeometry: ElementGeometry,
    referenceElements: AnyElement[],
    scale: number = 1
  ): AlignmentResult {
    const result: AlignmentResult = {
      dx: 0,
      dy: 0,
      verticalLines: [],
      horizontalLines: []
    }

    // 调整阈值
    // 缩放越大，逻辑阈值越小（保持视觉一致）
    const threshold = this.THRESHOLD_BASE / Math.max(scale, 0.1)

    // 过滤：组内子元素不参与对齐，组合只看整体包围盒
    const filteredRefs = referenceElements.filter(el => !el.parentGroup)

    // 计算目标元素的旋转包围盒和吸附点
    const targetRBBox = computeGeometry(targetGeometry)
    const targetSnapPoints = extractSnapPoints(targetGeometry, targetRBBox)

    // 性能优化：过滤掉距离太远的参考元素
    const targetAABB = getAABB([...targetRBBox.corners, targetRBBox.center])
    const nearbyElements = this.filterNearbyElements(
      filteredRefs,
      targetAABB,
      threshold * 20 + Math.max(targetAABB.width, targetAABB.height) * 0.75 // 视口缩放 + 尺寸自适应
    )

    // 收集所有参考元素的吸附点
    const refSnapPointsMap = new Map<string, SnapPoint[]>()
    for (const refElement of nearbyElements) {
      if (!refElement.visible) continue

      const refGeometry = elementToGeometry(refElement)
      const refRBBox = computeGeometry(refGeometry)
      const refSnapPoints = extractSnapPoints(refGeometry, refRBBox)
      refSnapPointsMap.set(refElement.id, refSnapPoints)
    }

    // 查找所有吸附候选
    const candidates: SnapCandidate[] = []

    for (const targetPoint of targetSnapPoints) {
      for (const [, refPoints] of refSnapPointsMap) {
        for (const refPoint of refPoints) {
          // X轴对齐检查
          const diffX = refPoint.x - targetPoint.x
          if (Math.abs(diffX) <= threshold) {
            candidates.push({
              dx: diffX,
              dy: 0,
              targetPoint,
              refPoint,
              axis: 'x'
            })
          }

          // Y轴对齐检查
          const diffY = refPoint.y - targetPoint.y
          if (Math.abs(diffY) <= threshold) {
            candidates.push({
              dx: 0,
              dy: diffY,
              targetPoint,
              refPoint,
              axis: 'y'
            })
          }
        }
      }
    }

    // 选择最小的dx和dy
    let minDx = Infinity
    let minDy = Infinity
    const selectedXCandidates: SnapCandidate[] = []
    const selectedYCandidates: SnapCandidate[] = []

    for (const candidate of candidates) {
      if (candidate.axis === 'x' && Math.abs(candidate.dx) < Math.abs(minDx)) {
        minDx = candidate.dx
        selectedXCandidates.length = 0
        selectedXCandidates.push(candidate)
      } else if (candidate.axis === 'x' && Math.abs(candidate.dx) === Math.abs(minDx)) {
        selectedXCandidates.push(candidate)
      }

      if (candidate.axis === 'y' && Math.abs(candidate.dy) < Math.abs(minDy)) {
        minDy = candidate.dy
        selectedYCandidates.length = 0
        selectedYCandidates.push(candidate)
      } else if (candidate.axis === 'y' && Math.abs(candidate.dy) === Math.abs(minDy)) {
        selectedYCandidates.push(candidate)
      }
    }

    // 设置偏移值
    if (minDx !== Infinity) {
      result.dx = minDx
    }
    if (minDy !== Infinity) {
      result.dy = minDy
    }

    // 生成辅助线（连接对齐点）
    result.verticalLines = this.generateGuidelines(selectedXCandidates, 'vertical', result.dx)
    result.horizontalLines = this.generateGuidelines(selectedYCandidates, 'horizontal', result.dy)

    return result
  }

  /**
   * 生成辅助线
   */
  private static generateGuidelines(
    candidates: SnapCandidate[],
    orientation: 'vertical' | 'horizontal',
    offset: number
  ): Guideline[] {
    const guidelines: Guideline[] = []
    const processedPairs = new Set<string>()

    for (const candidate of candidates) {
      const { targetPoint, refPoint } = candidate

      // 调整目标点位置（吸附后）
      const adjustedTarget: Point = {
        x: targetPoint.x + (orientation === 'vertical' ? offset : 0),
        y: targetPoint.y + (orientation === 'horizontal' ? offset : 0)
      }

      // 生成唯一键避免重复
      const key = orientation === 'vertical'
        ? `v-${adjustedTarget.x.toFixed(2)}-${Math.min(adjustedTarget.y, refPoint.y).toFixed(2)}`
        : `h-${adjustedTarget.y.toFixed(2)}-${Math.min(adjustedTarget.x, refPoint.x).toFixed(2)}`

      if (processedPairs.has(key)) continue
      processedPairs.add(key)

      // 创建连接线
      const guideline: Guideline = {
        start: adjustedTarget,
        end: refPoint,
        type: this.getGuidelineType(targetPoint.type, refPoint.type),
        axis: orientation
      }

      guidelines.push(guideline)
    }

    return guidelines
  }

  /**
   * 确定辅助线类型
   */
  private static getGuidelineType(
    targetType: string,
    refType: string
  ): 'center' | 'edge' | 'vertex' {
    if (targetType === 'center' || refType === 'center') return 'center'
    if (targetType === 'triangle-vertex' || refType === 'triangle-vertex') return 'vertex'
    return 'edge'
  }

  /**
   * 性能优化：过滤距离太远的元素
   */
  private static filterNearbyElements(
    elements: AnyElement[],
    targetAABB: { x: number; y: number; width: number; height: number },
    maxDistance: number
  ): AnyElement[] {
    return elements.filter(el => {
      const elAABB = {
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height
      }

      // 简单的AABB距离检查
      const dx = Math.max(
        targetAABB.x - (elAABB.x + elAABB.width),
        elAABB.x - (targetAABB.x + targetAABB.width),
        0
      )
      const dy = Math.max(
        targetAABB.y - (elAABB.y + elAABB.height),
        elAABB.y - (targetAABB.y + targetAABB.height),
        0
      )

      return dx <= maxDistance && dy <= maxDistance
    })
  }
}
