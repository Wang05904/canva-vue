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
import type { AnyElement } from '@/cores/types/element'

export class RenderService {
  private app: Application | null = null
  private graphicMap = new Map<string, Graphics>()
  private container: HTMLElement | null = null

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
   * 渲染元素列表
   */
  renderElements(elements: AnyElement[]): void {
    if (!this.app) return

    const currentElementIds = new Set(elements.map(el => el.id))
    
    // 删除不再存在的元素
    this.graphicMap.forEach((graphic, id) => {
      if (!currentElementIds.has(id)) {
        this.removeGraphic(id)
      }
    })
    
    // 渲染或更新元素
    elements.forEach(element => {
      this.renderElement(element)
    })
  }

  /**
   * 渲染单个元素
   */
  renderElement(element: AnyElement): Graphics | null {
    if (!this.app) return null

    let graphic = this.graphicMap.get(element.id)
    
    if (graphic) {
      // 更新现有元素
      this.updateGraphic(graphic, element)
    } else {
      // 创建新元素
      graphic = this.createGraphic(element)
    }

    return graphic
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
      if (element.width === element.height) {
        // 圆形
        const radius = element.width / 2
        graphic.circle(radius, radius, radius)
      } else {
        // 矩形
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
   * 删除Graphics对象
   */
  removeGraphic(elementId: string): void {
    const graphic = this.graphicMap.get(elementId)
    if (graphic && this.app) {
      graphic.removeAllListeners()
      this.app.stage.removeChild(graphic)
      graphic.destroy()
      this.graphicMap.delete(elementId)
    }
  }

  /**
   * 获取Graphics对象
   */
  getGraphic(elementId: string): Graphics | undefined {
    return this.graphicMap.get(elementId)
  }

  /**
   * 获取所有Graphics对象
   */
  getAllGraphics(): Map<string, Graphics> {
    return this.graphicMap
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.graphicMap.forEach((graphic) => {
      graphic.removeAllListeners()
      graphic.destroy()
    })
    this.graphicMap.clear()
    
    if (this.app) {
      this.app.destroy(true, { children: true })
      this.app = null
    }
  }
}
