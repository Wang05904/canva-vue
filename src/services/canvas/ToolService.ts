/**
 * Service层-工具服务
 * 功能：管理绘图工具状态和工具预览
 * 职责：
 * 1. 管理当前激活的工具
 * 2. 处理工具预览逻辑
 * 3. 提供工具切换API
 */
import { Graphics, FederatedPointerEvent, Application } from 'pixi.js'

export type ToolType = 'select' | 'rectangle' | 'circle' | 'triangle' | 'text'

export interface ToolConfig {
  type: ToolType
  previewSize?: { width: number; height: number }
  fillColor?: string
}

export class ToolService {
  private currentTool: ToolType = 'select'
  private previewShape: Graphics | null = null
  private app: Application | null = null

  constructor() {}

  /**
   * 设置Application实例
   */
  setApp(app: Application): void {
    this.app = app
  }

  /**
   * 设置当前工具
   */
  setTool(tool: ToolType): void {
    this.currentTool = tool
    // 切换工具时清除预览
    this.clearPreview()
  }

  /**
   * 获取当前工具
   */
  getTool(): ToolType {
    return this.currentTool
  }

  /**
   * 是否是绘图工具
   */
    isDrawingTool(tool?: ToolType): boolean {
        const t = tool || this.currentTool
        return t === 'rectangle' || t === 'circle' || t === 'triangle'
    }

  /**
   * 更新工具预览
   */
  updatePreview(event: FederatedPointerEvent): void {
    if (!this.app) return

    if (this.isDrawingTool()) {
      // 创建或更新预览图形
      if (!this.previewShape) {
        this.previewShape = new Graphics()
        this.previewShape.alpha = 0.5
        this.app.stage.addChild(this.previewShape)
      }

      // 清除之前的绘制
      this.previewShape.clear()

      const mouseX = event.global.x
      const mouseY = event.global.y

            // 根据工具类型绘制预览
            if (this.currentTool === 'rectangle') {
                this.previewShape.rect(-100, -75, 200, 150)
                this.previewShape.fill('#4A90E2')
            } else if (this.currentTool === 'circle') {
                this.previewShape.circle(0, 0, 75)
                this.previewShape.fill('#E94B3C')
            } else if (this.currentTool === 'triangle') {
                // 绘制等腰三角形预览，底边为150，高为150
                const width = 150
                const height = 150
                this.previewShape.moveTo(0, -height / 2)  // 顶点
                this.previewShape.lineTo(-width / 2, height / 2)  // 左下角
                this.previewShape.lineTo(width / 2, height / 2)   // 右下角
                this.previewShape.closePath()
                this.previewShape.fill('#34C759')
            }

      this.previewShape.x = mouseX
      this.previewShape.y = mouseY
    } else {
      this.clearPreview()
    }
  }

  /**
   * 清除预览
   */
  clearPreview(): void {
    if (this.previewShape && this.app) {
      this.app.stage.removeChild(this.previewShape)
      this.previewShape.destroy()
      this.previewShape = null
    }
  }

  /**
   * 获取工具配置
   */
    getToolConfig(tool?: ToolType): ToolConfig {
        const t = tool || this.currentTool
        
        const configs: Record<ToolType, ToolConfig> = {
            select: { type: 'select' },
            rectangle: {
                type: 'rectangle',
                previewSize: { width: 200, height: 150 },
                fillColor: '#4A90E2'
            },
            circle: {
                type: 'circle',
                previewSize: { width: 150, height: 150 },
                fillColor: '#E94B3C'
            },
            triangle: {
                type: 'triangle',
                previewSize: { width: 150, height: 150 },
                fillColor: '#34C759'
            },
            text: {
                type: 'text',
                previewSize: { width: 200, height: 50 },
                fillColor: '#000000'
            }
        }

        return configs[t]
    }

  /**
   * 计算元素创建位置（考虑鼠标位置和元素大小）
   */
    calculateCreatePosition(
        mouseX: number,
        mouseY: number,
        tool?: ToolType
    ): { x: number; y: number; width: number; height: number } {
        const config = this.getToolConfig(tool)
        
        if (config.type === 'rectangle') {
            return {
                x: mouseX - 100,
                y: mouseY - 75,
                width: 200,
                height: 150
            }
        } else if (config.type === 'circle') {
            return {
                x: mouseX - 75,
                y: mouseY - 75,
                width: 150,
                height: 150
            }
        } else if (config.type === 'triangle') {
            return {
                x: mouseX - 75,
                y: mouseY - 75,
                width: 150,
                height: 150
            }
        } else if (config.type === 'text') {
            return {
                x: mouseX - 100,
                y: mouseY - 25,
                width: 200,
                height: 50
            }
        }

        return { x: mouseX, y: mouseY, width: 100, height: 100 }
    }

  /**
   * 清理资源
   */
  destroy(): void {
    this.clearPreview()
    this.app = null
  }
}
