/**
 * Service层-渲染服务
 * 功能：协调PIXI渲染引擎，管理元素的渲染生命周期
 * 职责：
 * 1. 管理PIXI Application实例
 * 2. 协调元素渲染（创建、更新、删除）
 * 3. 管理Graphics对象池
 * 4. 提供渲染API给上层
 * 5. 支持无限画布视口变换
 */
import { Application, Graphics, Container } from 'pixi.js'
import type { AnyElement, ShapeElement } from '@/cores/types/element'
import type { ViewportService } from './ViewportService'

export class RenderService {
  private app: Application | null = null
  private graphicMap = new Map<string, Graphics>()
  private graphicToElementId = new WeakMap<Graphics, string>()
  private container: HTMLElement | null = null
  private viewportService: ViewportService | null = null

  // 世界容器：所有元素都在这个容器中，容器的变换代表视口变换
  private worldContainer: Container | null = null

  // 性能优化相关
  private elementSnapshots = new Map<string, string>() // 元素快照，用于脏检查
  private renderFrameId: number | null = null // RAF ID

  /**
   * 初始化渲染引擎
   */
  async initialize(container: HTMLElement, viewportService?: ViewportService): Promise<Application> {
    this.container = container
    this.viewportService = viewportService || null

    this.app = new Application()
    await this.app.init({
      backgroundAlpha: 0, // 透明背景
      resizeTo: container,
      antialias: true,
      resolution: window.devicePixelRatio || 1,  // 支持高 DPI 屏幕（Retina）
      autoDensity: true  // 自动调整 CSS 尺寸以匹配分辨率
    })

    container.appendChild(this.app.canvas)

    // 设置 canvas 的 z-index，让 DOM 元素能在上层
    const canvas = this.app.canvas as HTMLCanvasElement
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.zIndex = '1'
    canvas.style.pointerEvents = 'auto'

    // 启用stage交互
    this.app.stage.eventMode = 'static'
    this.app.stage.hitArea = this.app.screen

    // 创建世界容器用于视口变换
    this.worldContainer = new Container()
    this.worldContainer.eventMode = 'static'
    this.app.stage.addChild(this.worldContainer)

    // 如果提供了视口服务，初始化视口尺寸
    if (this.viewportService) {
      this.viewportService.setViewportSize(this.app.screen.width, this.app.screen.height)
    }

    return this.app
  }

  /**
   * 获取Application实例
   */
  getApp(): Application | null {
    return this.app
  }

  /**
   * 获取世界容器
   */
  getWorldContainer(): Container | null {
    return this.worldContainer
  }

  /**
   * 更新视口变换
   * 将视口状态应用到世界容器的变换上
   */
  updateViewportTransform(): void {
    if (!this.worldContainer || !this.viewportService || !this.app) return

    const viewport = this.viewportService.getViewport()
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height

    // 设置容器的缩放
    this.worldContainer.scale.set(viewport.zoom, viewport.zoom)

    // 设置容器的旋转（暂时没用上）
    this.worldContainer.rotation = viewport.rotation

    // 设置容器的位置（将相机位置转换为容器位置）
    // 相机在世界坐标(x,y)，容器需要平移到使相机位置显示在屏幕中心
    this.worldContainer.position.set(
      screenWidth / 2 - viewport.x * viewport.zoom,
      screenHeight / 2 - viewport.y * viewport.zoom
    )
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

    //console.timeEnd('render-100-canvas')
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
    if (!this.worldContainer) throw new Error('World container not initialized')

    const graphic = new Graphics()
    this.drawShape(graphic, element)

    // Set pivot to center for proper rotation but position at top-left
    graphic.pivot.set(element.width / 2, element.height / 2)
    // Position at top-left, pivot handles center rotation
    graphic.x = element.x + element.width / 2
    graphic.y = element.y + element.height / 2
    // Apply rotation
    graphic.rotation = element.rotation || 0
    graphic.eventMode = 'static'
    graphic.cursor = 'pointer'

    // 添加到世界容器而不是stage
    this.worldContainer.addChild(graphic)
    this.graphicMap.set(element.id, graphic)
    this.graphicToElementId.set(graphic, element.id)

    return graphic
  }

  /**
   * 更新Graphics对象
   */
  private updateGraphic(graphic: Graphics, element: AnyElement): void {
    this.drawShape(graphic, element)
    graphic.pivot.set(element.width / 2, element.height / 2)
    graphic.x = element.x + element.width / 2
    graphic.y = element.y + element.height / 2
    graphic.rotation = element.rotation || 0
  }

  /**
   * 绘制形状
   */
  private drawShape(graphic: Graphics, element: AnyElement): void {
    graphic.clear()

    if (element.type === 'shape') {
      const shapeElement = element as ShapeElement

      if (shapeElement.shapeType === 'circle') {
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
    if (graphic && this.worldContainer) {
      graphic.removeAllListeners()
      this.worldContainer.removeChild(graphic)
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
      // Position at top-left + pivot offset for center-based rotation
      graphic.x = x + graphic.pivot.x
      graphic.y = y + graphic.pivot.y
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
        // Position at top-left + pivot offset for center-based rotation
        graphic.x = x + graphic.pivot.x
        graphic.y = y + graphic.pivot.y
      }
    })
  }

  /**
   * 直接更新图形样式（颜色选择器优化：直接操作 Graphics，跳过脏检查）
   * @param elementId 元素ID
   * @param element 完整的元素数据
   */
  updateGraphicStyle(elementId: string, element: AnyElement): void {
    const graphic = this.graphicMap.get(elementId)
    if (!graphic) return

    // 直接重绘图形，不更新快照（避免触发不必要的脏检查）
    this.drawShape(graphic, element)
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
   * 清理资源
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

    // 清理世界容器
    if (this.worldContainer) {
      this.worldContainer.destroy({ children: true })
      this.worldContainer = null
    }

    // 销毁应用
    if (this.app) {
      this.app.destroy(true, { children: true })
      this.app = null
    }

    this.viewportService = null
  }
}
