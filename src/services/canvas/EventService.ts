/**
 * Service层-事件服务
 * 功能：处理画布相关事件（点击、拖拽等）
 * 职责：
 * 1. 绑定和管理PIXI事件监听器
 * 2. 协调工具服务和元素操作
 * 3. 处理用户交互逻辑
 */
import { Application, Graphics, FederatedPointerEvent } from 'pixi.js'
import type { AnyElement } from '@/cores/types/element'
import { useDragState } from '@/composables/useDragState'

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
  private handlers: EventHandlers = {}
  private selectionBox: Graphics | null = null
  private isBoxSelecting = false
  private boxStartPos = { x: 0, y: 0 }
  private isDragging = false
  private dragStartPos = { x: 0, y: 0 }
  private dragTargetId: string | null = null
  private getElementIdByGraphic: ((graphic: Graphics) => string | undefined) | null = null
  private dragState = useDragState()

  constructor() { }

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
   * 设置元素ID获取函数（用于事件委托）
   */
  setElementIdGetter(getter: (graphic: Graphics) => string | undefined): void {
    this.getElementIdByGraphic = getter
  }

  /**
   * 绑定鼠标事件（点击、移动等）
   */
  bindStageEvents(): void {
    if (!this.app) return

    // 使用事件委托：单一事件监听器处理所有元素和画布交互
    this.app.stage.on('pointerdown', this.handlePointerDown.bind(this))
    this.app.stage.on('pointermove', this.handlePointerMove.bind(this))
    this.app.stage.on('pointerup', this.handlePointerUp.bind(this))
    this.app.stage.on('pointerupoutside', this.handlePointerUp.bind(this))
  }

  /**
   * 统一处理鼠标按下事件
   */
  private handlePointerDown(event: FederatedPointerEvent): void {
    // 现在通过 event.target 获取实际点击的对象
    const target = event.target as Graphics
    const elementId = this.getElementIdByGraphic?.(target)

    if (elementId) {
      // 点击到元素：开始拖拽
      this.isDragging = true
      this.dragTargetId = elementId
      this.dragStartPos = { x: event.global.x, y: event.global.y }

      // 触发元素选中事件
      if (this.handlers.onElementSelect) {
        this.handlers.onElementSelect(elementId)
      }

      // 计算并传递初始边界框给全局拖拽状态
      const selectedIds = this.handlers.getSelectedIds?.() || []
      const allElements = this.handlers.getAllElements?.() || []
      const draggedIds = selectedIds.length > 1 && selectedIds.includes(elementId) ? selectedIds : [elementId]

      // 计算初始边界框
      const draggedElements = draggedIds.map(id => allElements.find(el => el.id === id)).filter(el => el != null) as AnyElement[]
      let initialBoundingBox = null
      if (draggedElements.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        draggedElements.forEach(el => {
          minX = Math.min(minX, el.x)
          minY = Math.min(minY, el.y)
          maxX = Math.max(maxX, el.x + el.width)
          maxY = Math.max(maxY, el.y + el.height)
        })
        initialBoundingBox = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        }
      }

      // 启动全局拖拽状态
      this.dragState.startDrag(draggedIds, initialBoundingBox)
    } else {
      // 点击到画布：开始框选
      this.isBoxSelecting = true
      this.boxStartPos = { x: event.global.x, y: event.global.y }

      // 创建框选框
      if (!this.selectionBox && this.app) {
        this.selectionBox = new Graphics()
        this.app.stage.addChild(this.selectionBox)
      }
    }
  }  /**
   * 统一处理鼠标移动事件 
   */
  private handlePointerMove(event: FederatedPointerEvent): void {
    const currentPos = { x: event.global.x, y: event.global.y }

    // 处理拖拽
    if (this.isDragging && this.dragTargetId) {
      const dx = currentPos.x - this.dragStartPos.x
      const dy = currentPos.y - this.dragStartPos.y

      // 更新全局拖拽偏移
      this.dragState.updateDragOffset({ x: dx, y: dy })

      // 只有移动超过2像素才认为是拖拽（避免误触）
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        const selectedIds = this.handlers.getSelectedIds?.()
        const isMultiSelect = selectedIds && selectedIds.length > 1 && selectedIds.includes(this.dragTargetId)

        // 实时更新元素位置（拖拽预览）
        const allElements = this.handlers.getAllElements?.()
        if (allElements) {
          if (isMultiSelect && selectedIds) {
            // 多选拖拽：更新所有选中元素的视觉位置
            selectedIds.forEach(id => {
              const element = allElements.find(el => el.id === id)
              if (element) {
                const graphic = event.currentTarget.children.find(
                  (child) => this.getElementIdByGraphic?.(child as Graphics) === id
                ) as Graphics
                if (graphic) {
                  graphic.x = element.x + dx
                  graphic.y = element.y + dy
                }
              }
            })
          } else {
            // 单选拖拽：更新当前元素的视觉位置
            const element = allElements.find(el => el.id === this.dragTargetId)
            if (element) {
              const graphic = event.currentTarget.children.find(
                (child) => this.getElementIdByGraphic?.(child as Graphics) === this.dragTargetId
              ) as Graphics
              if (graphic) {
                graphic.x = element.x + dx
                graphic.y = element.y + dy
              }
            }
          }
        }
      }
      return
    }

    // 处理框选
    if (this.isBoxSelecting && this.selectionBox) {
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
  }

  /**
   * 统一处理鼠标抬起事件
   */
  private handlePointerUp(event: FederatedPointerEvent): void {
    const currentPos = { x: event.global.x, y: event.global.y }

    // 处理拖拽结束
    if (this.isDragging && this.dragTargetId) {
      const dx = currentPos.x - this.dragStartPos.x
      const dy = currentPos.y - this.dragStartPos.y

      // 只有真正移动了才触发移动事件
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        const selectedIds = this.handlers.getSelectedIds?.()
        const isMultiSelect = selectedIds && selectedIds.length > 1 && selectedIds.includes(this.dragTargetId)

        if (isMultiSelect && this.handlers.onMultiElementMove && selectedIds) {
          // 多选拖拽：移动所有选中的元素
          this.handlers.onMultiElementMove(selectedIds, dx, dy)
          //console.log(`多选拖拽完成: ${selectedIds.length} 个元素移动 (${dx}, ${dy})`)
        } else if (this.handlers.onElementMove) {
          // 单选拖拽：只移动当前元素
          this.handlers.onElementMove(this.dragTargetId, dx, dy)
          //console.log(`拖拽完成: 元素 ${this.dragTargetId} 移动 (${dx}, ${dy})`)
        }
      }

      // 结束全局拖拽状态
      this.dragState.endDrag()

      this.isDragging = false
      this.dragTargetId = null
      return
    }

    // 处理框选或画布点击
    if (this.isBoxSelecting) {
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
        if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'triangle' || currentTool === 'text') {
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
