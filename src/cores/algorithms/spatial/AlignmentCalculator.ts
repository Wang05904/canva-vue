import type { CanvasElement } from '@/cores/types/element'

export interface AlignmentResult {
  dx: number // X轴吸附修正值
  dy: number // Y轴吸附修正值
  verticalLines: number[] // 需要绘制的垂直辅助线X坐标
  horizontalLines: number[] // 需要绘制的水平辅助线Y坐标
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export class AlignmentCalculator {
  static readonly THRESHOLD = 5 // 吸附阈值 (像素)

  /**
   * 计算对齐吸附
   * @param target 当前拖拽的元素（或选区）的位置信息
   * @param others 其他所有元素
   * @param scale 当前画布缩放比例（用于调整阈值体验，可选）
   */
  static calculate(
    target: Rect,
    others: CanvasElement[],
    scale: number = 1
  ): AlignmentResult {
    const result: AlignmentResult = {
      dx: 0,
      dy: 0,
      verticalLines: [],
      horizontalLines: []
    }

    // 调整阈值，缩放越小，吸附范围在视觉上应该保持一致，但在逻辑坐标上需要放大
    const threshold = this.THRESHOLD / scale

    // 目标元素的关键点
    const targetX = [
      target.x, // 左
      target.x + target.width / 2, // 中
      target.x + target.width // 右
    ]
    
    const targetY = [
      target.y, // 上
      target.y + target.height / 2, // 中
      target.y + target.height // 下
    ]

    // 寻找最近的吸附点
    let minDiffX = Infinity
    let minDiffY = Infinity
    
    // 遍历其他元素寻找对齐点
    for (const other of others) {
      // 忽略不可见元素
      if (!other.visible) continue

      // 其他元素的关键点
      const otherX = [
        other.x,
        other.x + other.width / 2,
        other.x + other.width
      ]

      const otherY = [
        other.y,
        other.y + other.height / 2,
        other.y + other.height
      ]

      // 检查垂直辅助线 (X轴对齐)
      for (const tx of targetX) {
        for (const ox of otherX) {
          const diff = ox - tx
          if (Math.abs(diff) < threshold && Math.abs(diff) < Math.abs(minDiffX)) {
            minDiffX = diff
          }
        }
      }

      // 检查水平辅助线 (Y轴对齐)
      for (const ty of targetY) {
        for (const oy of otherY) {
          const diff = oy - ty
          if (Math.abs(diff) < threshold && Math.abs(diff) < Math.abs(minDiffY)) {
            minDiffY = diff
          }
        }
      }
    }

    // 如果找到了有效的吸附点，生成结果
    if (minDiffX !== Infinity) {
      result.dx = minDiffX
      // 重新计算吸附后的X坐标，用于确定辅助线位置
      const snappedX = targetX.map(x => x + minDiffX)
      
      // 再次遍历找出所有重合的线（可能有多个元素对齐到同一条线）
      for (const other of others) {
        if (!other.visible) continue
        const otherX = [other.x, other.x + other.width / 2, other.x + other.width]
        
        // 检查是否与吸附后的位置重合
        for (const sx of snappedX) {
          for (const ox of otherX) {
            if (Math.abs(sx - ox) < 0.01) { // 浮点数比较
              if (!result.verticalLines.includes(ox)) {
                result.verticalLines.push(ox)
              }
            }
          }
        }
      }
    }

    if (minDiffY !== Infinity) {
      result.dy = minDiffY
      const snappedY = targetY.map(y => y + minDiffY)
      
      for (const other of others) {
        if (!other.visible) continue
        const otherY = [other.y, other.y + other.height / 2, other.y + other.height]
        
        for (const sy of snappedY) {
          for (const oy of otherY) {
            if (Math.abs(sy - oy) < 0.01) {
              if (!result.horizontalLines.includes(oy)) {
                result.horizontalLines.push(oy)
              }
            }
          }
        }
      }
    }

    return result
  }
}
