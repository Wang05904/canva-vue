/**
 * Service层-渲染服务
 * 功能：协调PIXI渲染引擎，管理元素的渲染生命周期
 * 职责：
 * 1. 管理PIXI Application实例
 * 2. 协调元素渲染（创建、更新、删除）
 * 3. 管理Graphics对象池
 * 4. 提供渲染API给上层
 */
import { Application, Graphics } from 'pixi.js'
import type { AnyElement, ShapeElement } from '@/cores/types/element'

export class RenderService {
  private app: Application | null = null
  private graphicMap = new Map<string, Graphics>()
  private graphicToElementId = new WeakMap<Graphics, string>()
  private container: HTMLElement | null = null
  
  // 性能优化相关
  private elementSnapshots = new Map<string, string>() // 元素快照，用于脏检查
  private renderFrameId: number | null = null // RAF ID

  /**
   * 初始化渲染引擎
   */
  async initialize(container: HTMLElement): Promise<Application> {
    this.container = container
    
    this.app = new Application()
    await this.app.init({
      background: '#ffffff',
      resizeTo: container,
      antialias: true
    })

    container.appendChild(this.app.canvas)

    // 启用stage交互
    this.app.stage.eventMode = 'static'
    this.app.stage.hitArea = this.app.screen

    return this.app
  }

  /**
   * 获取Application实例
   */
  getApp(): Application | null {
    return this.app
  }

  /**
   * 渲染元素列表（使用RAF节流 + 脏检查）
   */
  renderElements(elements: AnyElement[]): void {
    if (!this.app) return

    // 如果已经有待处理的渲染，取消之前的
    if (this.renderFrameId !== null) {
      cancelAnimationFrame(this.renderFrameId)
    }

    // 使用 RAF 批量处理渲染
    this.renderFrameId = requestAnimationFrame(() => {
      this.renderElementsImmediate(elements)
      this.renderFrameId = null
    })
  }

  /**
   * 立即渲染元素列表（增量更新 + 脏检查）
   */
  private renderElementsImmediate(elements: AnyElement[]): void {
    if (!this.app) return

    const currentElementIds = new Set(elements.map(el => el.id))
    
    // 删除不再存在的元素
    this.graphicMap.forEach((graphic, id) => {
      if (!currentElementIds.has(id)) {
        this.removeGraphic(id)
        this.elementSnapshots.delete(id)
      }
    })
    
    // 渲染或更新元素
    elements.forEach(element => {
      // 脏检查：只有元素发生变化时才渲染
      const snapshot = this.createElementSnapshot(element)
      const lastSnapshot = this.elementSnapshots.get(element.id)
      
      if (snapshot !== lastSnapshot) {
        this.renderElement(element)
        this.elementSnapshots.set(element.id, snapshot)
      }
    })
  }

  /**
   * 创建元素快照（用于脏检查）
   */
  private createElementSnapshot(element: AnyElement): string {
    // 只序列化影响渲染的关键属性
    let key = `${element.type}|${element.x}|${element.y}|${element.width}|${element.height}|${element.rotation || 0}|${element.opacity}|${element.visible}`
    
    if (element.type === 'shape') {
      const shape = element as ShapeElement
      key += `|${shape.shapeType}|${shape.fillColor}|${shape.strokeColor}|${shape.strokeWidth}|${shape.borderRadius || 0}`
    } else if (element.type === 'text') {
      // 文本元素的关键属性
      key += `|${element.content}|${element.fontSize}|${element.color}|${element.fontFamily}`
    }
    
    return key
  }

  /**
   * 渲染单个元素
   */
  renderElement(element: AnyElement): void {
    if (!this.app) return

    // 图片元素由 DOM 渲染,这里只处理形状
    if (element.type === 'image') return

    let graphic = this.graphicMap.get(element.id)
    
    if (graphic) {
      // 更新现有元素
      this.updateGraphic(graphic, element)
    } else {
      // 创建新元素
      graphic = this.createGraphic(element)
    }
    graphic.visible = element.visible !== false
  }

  /**
   * 创建Graphics对象
   */
  private createGraphic(element: AnyElement): Graphics {
    if (!this.app) throw new Error('Application not initialized')

    const graphic = new Graphics()
    this.drawShape(graphic, element)
    
    graphic.x = element.x
    graphic.y = element.y
    graphic.eventMode = 'static'
    graphic.cursor = 'pointer'
    
    this.app.stage.addChild(graphic)
    this.graphicMap.set(element.id, graphic)
    this.graphicToElementId.set(graphic, element.id)
    
    return graphic
  }

  /**
   * 更新Graphics对象
   */
  private updateGraphic(graphic: Graphics, element: AnyElement): void {
    this.drawShape(graphic, element)
    graphic.x = element.x
    graphic.y = element.y
  }

  /**
   * 绘制形状
   */
  private drawShape(graphic: Graphics, element: AnyElement): void {
        graphic.clear()
        
        if (element.type === 'shape') {
            const shapeElement = element as ShapeElement
            
            if (shapeElement.shapeType === 'circle' && element.width === element.height) {
                // 圆形
                const radius = element.width / 2
                graphic.circle(radius, radius, radius)
            } else if (shapeElement.shapeType === 'triangle') {
                // 三角形 - 绘制等腰三角形，底边为width，高为height
                graphic.moveTo(element.width / 2, 0)  // 顶点
                graphic.lineTo(0, element.height)     // 左下角
                graphic.lineTo(element.width, element.height)  // 右下角
                graphic.closePath()
            } else {
                // 矩形或其他形状
                graphic.rect(0, 0, element.width, element.height)
            }
            graphic.fill(element.fillColor || '#000000')
            
            // 添加边框
            if (element.strokeWidth && element.strokeWidth > 0) {
                graphic.stroke({
                    width: element.strokeWidth,
                    color: element.strokeColor || '#000000'
                })
            }
        }
    }

  /**
   * 删除Graphics对象（清理快照缓存）
   */
  removeGraphic(elementId: string): void {
    const graphic = this.graphicMap.get(elementId)
    if (graphic && this.app) {
      graphic.removeAllListeners()
      this.app.stage.removeChild(graphic)
      graphic.destroy()
      this.graphicMap.delete(elementId)
      this.elementSnapshots.delete(elementId)
    }
  }

  /**
   * 获取Graphics对象
   */
  getGraphic(elementId: string): Graphics | undefined {
    return this.graphicMap.get(elementId)
  }

  /**
   * 直接更新元素位置（拖拽优化：跳过完整渲染流程）
   * @param elementId 元素ID
   * @param x 新的x坐标
   * @param y 新的y坐标
   */
  updateElementPosition(elementId: string, x: number, y: number): void {
    const graphic = this.graphicMap.get(elementId)
    if (graphic) {
      graphic.x = x
      graphic.y = y
    }
  }

  /**
   * 批量更新元素位置（拖拽优化：跳过完整渲染流程）
   * @param updates 元素位置更新列表 { id, x, y }[]
   */
  batchUpdatePositions(updates: Array<{ id: string; x: number; y: number }>): void {
    updates.forEach(({ id, x, y }) => {
      const graphic = this.graphicMap.get(id)
      if (graphic) {
        graphic.x = x
        graphic.y = y
      }
    })
  }

  /**
   * 获取所有Graphics对象
   */
  getAllGraphics(): Map<string, Graphics> {
    return this.graphicMap
  }

  /**
   * 通过Graphics获取元素ID
   */
  getElementIdByGraphic(graphic: Graphics): string | undefined {
    return this.graphicToElementId.get(graphic)
  }

  /**
   * 清理资源（优化：清理所有缓存）
   */
  destroy(): void {
    // 取消待处理的渲染
    if (this.renderFrameId !== null) {
      cancelAnimationFrame(this.renderFrameId)
      this.renderFrameId = null
    }

    // 清理Graphics对象
    this.graphicMap.forEach((graphic) => {
      graphic.removeAllListeners()
      graphic.destroy()
    })
    this.graphicMap.clear()
    
    // 清理快照缓存
    this.elementSnapshots.clear()
    
    // 销毁应用
    if (this.app) {
      this.app.destroy(true, { children: true })
      this.app = null
    }
  }
}
