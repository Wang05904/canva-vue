/**
 * Service层-画布服务（协调器）
 * 功能：协调各个子服务，提供统一的画布操作接口
 * 职责：
 * 1. 初始化和管理所有子服务（Render、Tool、Event、Viewport）
 * 2. 提供统一的画布生命周期管理
 * 3. 协调服务之间的通信
 */
import { Application, FederatedPointerEvent } from 'pixi.js'
import { RenderService } from './RenderService'
import { ToolService, type ToolType } from './ToolService'
import { EventService, type EventHandlers } from './EventService'
import { ViewportService } from '@/services'
import { useCanvasStore } from '@/stores/canvas'
import type { AnyElement } from '@/cores/types/element'
import type { ViewportConfig } from '@/cores/types/canvas'

export class CanvasService {
  private renderService: RenderService
  private toolService: ToolService
  private eventService: EventService
  private viewportService: ViewportService
  // 是否已初始化，防止重复初始化
  private initialized = false

  constructor(viewportConfig?: Partial<ViewportConfig>) {
    this.renderService = new RenderService()
    this.toolService = new ToolService()
    this.eventService = new EventService()
    this.viewportService = new ViewportService(viewportConfig)
  }

  /**
   * 同步视口状态到 store
   */
  private syncViewportToStore(): void {
    const canvasStore = useCanvasStore()
    canvasStore.updateViewport(this.viewportService.getViewport())
  }

  /**
   * 初始化画布
   */
  async initialize(container: HTMLElement, handlers: EventHandlers): Promise<void> {
    if (this.initialized) return

    // 初始化渲染服务（传入ViewportService）
    const app = await this.renderService.initialize(container, this.viewportService)

    // 设置事件服务的ViewportService和WorldContainer
    this.eventService.setViewportService(this.viewportService)
    const worldContainer = this.renderService.getWorldContainer()
    if (worldContainer) {
      this.eventService.setWorldContainer(worldContainer)
    }

    // 设置工具服务和事件服务的App实例（传入worldContainer）
    this.toolService.setApp(app, worldContainer || undefined)
    this.eventService.setApp(app)    // 设置事件处理器
    this.eventService.setHandlers(handlers)

    // 设置元素ID获取函数
    this.eventService.setElementIdGetter((graphic) =>
      this.renderService.getElementIdByGraphic(graphic)
    )

    // 绑定Stage事件
    this.eventService.bindStageEvents()

    // 绑定工具预览
    this.bindToolPreview(app)

    // 绑定视口事件（滚轮缩放、拖拽平移）
    this.bindViewportEvents(app)

    this.initialized = true
  }

  /**
   * 绑定工具预览
   */
  private bindToolPreview(app: Application): void {
    app.stage.on('pointermove', (event: FederatedPointerEvent) => {
      // 将屏幕坐标转换为世界坐标
      const worldPos = this.viewportService.screenToWorld(event.global.x, event.global.y)
      this.toolService.updatePreview(event, worldPos.x, worldPos.y)
    })
  }

  /**
   * 绑定视口事件（滚轮缩放、中键拖拽）
   */
  private bindViewportEvents(app: Application): void {
    const canvas = app.canvas

    // 滚轮缩放
    canvas.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault()

      // 获取鼠标相对于画布的位置
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      this.viewportService.handleWheel(event.deltaY, mouseX, mouseY)
      this.renderService.updateViewportTransform()

      // 同步视口状态到 store，更新工具栏缩放显示
      this.syncViewportToStore()
    }, { passive: false })

    // 中键拖拽平移画布
    let isPanning = false
    let lastPanPos = { x: 0, y: 0 }

    canvas.addEventListener('pointerdown', (event: PointerEvent) => {
      const currentTool = this.toolService.getTool()
      // 中键或pan工具+左键开始平移
      if (event.button === 1 || (event.button === 0 && currentTool === 'pan')) {
        event.preventDefault()
        event.stopPropagation()
        isPanning = true
        lastPanPos = { x: event.clientX, y: event.clientY }
        canvas.style.cursor = 'grabbing'
      }
    })

    canvas.addEventListener('pointermove', (event: PointerEvent) => {
      if (isPanning) {
        const dx = event.clientX - lastPanPos.x
        const dy = event.clientY - lastPanPos.y

        this.viewportService.pan(dx, dy)
        this.renderService.updateViewportTransform()

        // 同步视口状态到 store
        this.syncViewportToStore()

        lastPanPos = { x: event.clientX, y: event.clientY }
      }
    })

    canvas.addEventListener('pointerup', (event: PointerEvent) => {
      if (event.button === 1 || (event.button === 0 && isPanning)) {
        isPanning = false
        const currentTool = this.toolService.getTool()
        canvas.style.cursor = currentTool === 'pan' ? 'grab' : 'default'
      }
    })
  }

  /**
   * 设置画布光标样式
   */
  setCanvasCursor(cursor: string): void {
    const canvas = this.renderService.getApp()?.canvas
    if (canvas) {
      canvas.style.cursor = cursor
    }
  }

  /**
   * 获取当前工具
   */
  getCurrentTool(): string {
    return this.toolService.getTool()
  }

  /**
   * 渲染元素列表
   */
  renderElements(elements: AnyElement[]): void {
    this.renderService.renderElements(elements)
  }

  /**
   * 切换工具
   */
  setTool(tool: ToolType): void {
    this.toolService.setTool(tool)
  }

  /**
   * 计算元素创建位置
   */
  calculateCreatePosition(mouseX: number, mouseY: number, tool?: ToolType) {
    return this.toolService.calculateCreatePosition(mouseX, mouseY, tool)
  }

  /**
   * 获取渲染服务
   */
  getRenderService(): RenderService {
    return this.renderService
  }

  /**
   * 批量更新元素位置（拖拽优化）
   */
  batchUpdatePositions(updates: Array<{ id: string; x: number; y: number }>): void {
    this.renderService.batchUpdatePositions(updates)
  }

  /**
   * 直接更新图形样式（颜色选择器优化）
   */
  updateGraphicStyle(elementId: string, element: AnyElement): void {
    this.renderService.updateGraphicStyle(elementId, element)
  }

  /**
   * 获取视口服务
   */
  getViewportService(): ViewportService {
    return this.viewportService
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.eventService.destroy()
    this.toolService.destroy()
    this.renderService.destroy()
    this.initialized = false
  }
}
