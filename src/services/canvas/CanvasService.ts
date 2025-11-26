/**
 * Service层-画布服务（协调器）
 * 功能：协调各个子服务，提供统一的画布操作接口
 * 职责：
 * 1. 初始化和管理所有子服务（Render、Tool、Event）
 * 2. 提供统一的画布生命周期管理
 * 3. 协调服务之间的通信
 */
import { Application, FederatedPointerEvent } from 'pixi.js'
import { RenderService } from './RenderService'
import { ToolService, type ToolType } from './ToolService'
import { EventService, type EventHandlers } from './EventService'
import type { AnyElement } from '@/cores/types/element'

export class CanvasService {
  private renderService: RenderService
  private toolService: ToolService
  private eventService: EventService
  // 是否已初始化，防止重复初始化
  private initialized = false

  constructor() {
    this.renderService = new RenderService()
    this.toolService = new ToolService()
    this.eventService = new EventService()
  }

  /**
   * 初始化画布
   */
  async initialize(container: HTMLElement, handlers: EventHandlers): Promise<void> {
    if (this.initialized) return

    // 初始化渲染服务
    const app = await this.renderService.initialize(container)

    // 设置工具服务和事件服务的App实例
    this.toolService.setApp(app)
    this.eventService.setApp(app)

    // 设置事件处理器
    this.eventService.setHandlers(handlers)

    // 绑定Stage事件
    this.eventService.bindStageEvents()

    // 绑定工具预览
    this.bindToolPreview(app)

    this.initialized = true
  }

  /**
   * 绑定工具预览
   */
  private bindToolPreview(app: Application): void {
    app.stage.on('pointermove', (event: FederatedPointerEvent) => {
      this.toolService.updatePreview(event)
    })
  }

  /**
   * 渲染元素列表
   */
  renderElements(elements: AnyElement[]): void {
    this.renderService.renderElements(elements)

    // 为新创建的元素绑定事件
    elements.forEach(element => {
      const graphic = this.renderService.getGraphic(element.id)
      if (graphic && !graphic.listenerCount('pointerdown')) {
        this.eventService.bindElementEvents(graphic, element)
      }
    })
  }

  /**
   * 切换工具
   */
  setTool(tool: ToolType): void {
    this.toolService.setTool(tool)
  }

  /**
   * 获取当前工具
   */
  getTool(): ToolType {
    return this.toolService.getTool()
  }

  /**
   * 获取工具配置
   */
  getToolConfig(tool?: ToolType) {
    return this.toolService.getToolConfig(tool)
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
   * 获取工具服务
   */
  getToolService(): ToolService {
    return this.toolService
  }

  /**
   * 获取事件服务
   */
  getEventService(): EventService {
    return this.eventService
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
