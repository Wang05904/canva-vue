/**
 * Service层-事件服务
 * 功能：处理画布相关事件（点击、拖拽等）
 * 职责：
 * 1. 绑定和管理PIXI事件监听器
 * 2. 协调工具服务和元素操作
 * 3. 处理用户交互逻辑
 */
import { Application, Graphics, FederatedPointerEvent } from 'pixi.js'
import { TransformService } from '@/services/elements/TransformService'
import type { AnyElement } from '@/cores/types/element'

/**
 * 事件处理器接口
 * 职责：定义画布事件的回调函数类型
 */
export interface EventHandlers {
  // 元素创建
  onElementCreate?: (elementData: Partial<AnyElement>) => void
  // 元素选择
  onElementSelect?: (elementId: string) => void
  // 元素移动
  onElementMove?: (elementId: string, dx: number, dy: number) => void
  // 多元素移动
  onMultiElementMove?: (elementIds: string[], dx: number, dy: number) => void
  // 框选元素
  onBoxSelection?: (x: number, y: number, width: number, height: number) => string[]
  // 选择变更
  onSelectionChange?: (elementIds: string[]) => void
  onCanvasClick?: () => void
  onToolCreate?: (x: number, y: number, tool: string) => void
  getCurrentTool?: () => string
  getSelectedIds?: () => string[]
  getAllElements?: () => AnyElement[]
}

export class EventService {
  private app: Application | null = null
  private transformService = new TransformService()
  private handlers: EventHandlers = {}
  private selectionBox: Graphics | null = null
  private isBoxSelecting = false
  private boxStartPos = { x: 0, y: 0 }

  constructor() {}

  /**
   * 设置Application实例
   */
  setApp(app: Application): void {
    this.app = app
  }

  /**
   * 设置事件处理器
   */
  setHandlers(handlers: EventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers }
  }

  /**
   * 绑定鼠标事件（点击、移动等）
   */
  bindStageEvents(): void {
    if (!this.app) return

    // 鼠标按下事件 - 开始框选
    this.app.stage.on('pointerdown', this.handleStagePointerDown.bind(this))
    // 鼠标移动事件 - 更新框选区域
    this.app.stage.on('pointermove', this.handleStagePointerMove.bind(this))
    // 鼠标抬起事件 - 完成框选
    this.app.stage.on('pointerup', this.handleStagePointerUp.bind(this))
    this.app.stage.on('pointerupoutside', this.handleStagePointerUp.bind(this))
  }

  /**
   * 处理Stage按下事件 - 开始框选
   */
  private handleStagePointerDown(event: FederatedPointerEvent): void {
    // 开始框选
    this.isBoxSelecting = true
    this.boxStartPos = { x: event.global.x, y: event.global.y }
    
    // 创建框选框
    if (!this.selectionBox && this.app) {
      this.selectionBox = new Graphics()
      this.app.stage.addChild(this.selectionBox)
    }
  }

  /**
   * 处理Stage移动事件 - 更新框选区域
   */
  private handleStagePointerMove(event: FederatedPointerEvent): void {
    if (!this.isBoxSelecting || !this.selectionBox) return

    const currentPos = { x: event.global.x, y: event.global.y }
    const x = Math.min(this.boxStartPos.x, currentPos.x)
    const y = Math.min(this.boxStartPos.y, currentPos.y)
    const width = Math.abs(currentPos.x - this.boxStartPos.x)
    const height = Math.abs(currentPos.y - this.boxStartPos.y)

    // 只有移动超过5像素才显示框选框（避免误触）
    if (width > 5 || height > 5) {
      // 绘制框选框
      this.selectionBox.clear()
      this.selectionBox.rect(x, y, width, height)
      this.selectionBox.stroke({ width: 2, color: 0x4A90E2 })
      this.selectionBox.fill({ color: 0x4A90E2, alpha: 0.1 })
    }
  }

  /**
   * 处理鼠标抬起事件 - 完成框选或创建元素
   */
  private handleStagePointerUp(event: FederatedPointerEvent): void {
    if (!this.isBoxSelecting) return

    const currentPos = { x: event.global.x, y: event.global.y }
    const width = Math.abs(currentPos.x - this.boxStartPos.x)
    const height = Math.abs(currentPos.y - this.boxStartPos.y)
    const currentTool = this.handlers.getCurrentTool?.()

    // 判断是点击还是框选（根据鼠标移动距离）
    if (width > 5 || height > 5) {
      // 拖动：框选元素
      const x = Math.min(this.boxStartPos.x, currentPos.x)
      const y = Math.min(this.boxStartPos.y, currentPos.y)
      
      if (this.handlers.onBoxSelection) {
        const selectedIds = this.handlers.onBoxSelection(x, y, width, height)
        if (this.handlers.onSelectionChange) {
          this.handlers.onSelectionChange(selectedIds)
        }
        console.log('框选完成，选中元素:', selectedIds)
      }
    } else {
      // 点击：根据工具类型处理
      if (currentTool === 'rectangle' || currentTool === 'circle') {
        // 绘图工具：创建元素
        if (this.handlers.onToolCreate) {
          this.handlers.onToolCreate(currentPos.x, currentPos.y, currentTool)
          console.log(`创建${currentTool}元素于 (${currentPos.x}, ${currentPos.y})`)
        }
      } else if (currentTool === 'select') {
        // 选择工具：清空选择
        if (this.handlers.onCanvasClick) {
          this.handlers.onCanvasClick()
        }
      }
    }

    // 清理框选框
    this.clearSelectionBox()
    this.isBoxSelecting = false
  }

  /**
   * 清除框选框
   */
  private clearSelectionBox(): void {
    if (this.selectionBox && this.app) {
      this.app.stage.removeChild(this.selectionBox)
      this.selectionBox.destroy()
      this.selectionBox = null
    }
  }

  /**
   * 绑定元素事件（选中、拖拽）
   */
  bindElementEvents(
    graphic: Graphics,
    element: AnyElement
  ): void {
    // 点击选中元素
    graphic.on('pointerdown', (event: FederatedPointerEvent) => {
      event.stopPropagation()
      // 阻止框选
      this.isBoxSelecting = false
      this.clearSelectionBox()
      
      if (this.handlers.onElementSelect) {
        this.handlers.onElementSelect(element.id)
      }
    })

    // 添加拖拽功能
    this.transformService.makeDraggable(
      graphic,
      () => {
        console.log('开始拖拽:', element.id)
      },
      undefined,
      (x: number, y: number) => {
        // 拖拽结束时触发移动事件
        const dx = x - element.x
        const dy = y - element.y
        
        // 检查是否为多选拖拽
        const selectedIds = this.handlers.getSelectedIds?.()
        const isMultiSelect = selectedIds && selectedIds.length > 1 && selectedIds.includes(element.id)
        
        if (isMultiSelect && this.handlers.onMultiElementMove) {
          // 多选拖拽：移动所有选中的元素
          this.handlers.onMultiElementMove(selectedIds, dx, dy)
          console.log(`多选拖拽完成: ${selectedIds.length} 个元素移动 (${dx}, ${dy})`)
        } else if (this.handlers.onElementMove) {
          // 单选拖拽：只移动当前元素
          this.handlers.onElementMove(element.id, dx, dy)
          console.log(`拖拽完成: 从(${element.x}, ${element.y})移动(${dx}, ${dy})到(${x}, ${y})`)
        }
      }
    )
  }

  /**
   * 解绑元素事件
   */
  unbindElementEvents(graphic: Graphics): void {
    graphic.removeAllListeners()
  }

  /**
   * 解绑所有事件
   */
  unbindAll(): void {
    if (this.app) {
      this.app.stage.removeAllListeners()
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.clearSelectionBox()
    this.unbindAll()
    this.app = null
    this.handlers = {}
  }
}
