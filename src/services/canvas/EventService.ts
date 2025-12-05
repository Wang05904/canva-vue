/**
 * Service层-事件服务
 * 功能：处理画布相关事件（点击、拖拽等）
 * 职责：
 * 1. 绑定和管理PIXI事件监听器
 * 2. 协调工具服务和元素操作
 * 3. 处理用户交互逻辑
 * 4. 支持无限画布的坐标转换
 */
import { Application, Graphics, FederatedPointerEvent, Container } from 'pixi.js'
import type { AnyElement, GroupElement } from '@/cores/types/element'
import { useDragState } from '@/composables/useDragState'
import { useAlignment } from '@/composables/useAlignment'
import type { ViewportService } from '@/services'

/**
 * 事件处理器接口
 * 职责：定义画布事件的回调函数类型
 */
export interface EventHandlers {
  // 元素创建
  onElementCreate?: (x: number, y: number, tool: string) => string | void
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
  onTextEdit?: (elementId: string) => void
  getCurrentTool?: () => string
  getSelectedIds?: () => string[]
  getAllElements?: () => AnyElement[]
  /**
   * 将实际点击到的元素ID映射为「逻辑交互ID」
   * 例如：如果点击的是组合内子元素，返回其父组合ID
   */
  resolveInteractiveElementId?: (elementId: string) => string
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
  private alignment = useAlignment()
  private viewportService: ViewportService | null = null
  private worldContainer: Container | null = null
  private initialBoundingBox: { x: number; y: number; width: number; height: number } | null = null
  private draggedIds: string[] = []
  private initialElementPositions: Map<string, { x: number; y: number }> = new Map()
  private dragAnimationFrameId: number | null = null

  constructor() { }

  /**
   * 设置Application实例
   */
  setApp(app: Application): void {
    this.app = app
  }

  /**
   * 设置视口服务
   */
  setViewportService(viewportService: ViewportService): void {
    this.viewportService = viewportService
  }

  /**
   * 设置世界容器
   */
  setWorldContainer(worldContainer: Container): void {
    this.worldContainer = worldContainer
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
   * 将屏幕坐标转换为世界坐标
   * 如果没有视口服务，直接返回屏幕坐标（向后兼容）
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    if (!this.viewportService) {
      return { x: screenX, y: screenY }
    }
    return this.viewportService.screenToWorld(screenX, screenY)
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
    const currentTool = this.handlers.getCurrentTool?.()

    // 如果是平移工具，不处理元素交互
    if (currentTool === 'pan') {
      return
    }

    // 现在通过 event.target 获取实际点击的对象
    const target = event.target as Graphics
    const rawElementId = this.getElementIdByGraphic?.(target)

    // 将实际点击到的元素ID映射为逻辑交互ID（例如：子元素 -> 组合）
    const elementId = rawElementId
      ? (this.handlers.resolveInteractiveElementId?.(rawElementId) ?? rawElementId)
      : undefined

    // 转换屏幕坐标为世界坐标
    const worldPos = this.screenToWorld(event.global.x, event.global.y)

    if (elementId) {
      // 点击到元素：开始拖拽
      this.isDragging = true
      this.dragTargetId = elementId
      this.dragStartPos = worldPos  // 使用世界坐标

      // 触发元素选中事件
      if (this.handlers.onElementSelect) {
        this.handlers.onElementSelect(elementId)
      }

      // 计算并传递初始边界框给全局拖拽状态
      const selectedIds = this.handlers.getSelectedIds?.() || []
      const allElements = this.handlers.getAllElements?.() || []

      // 确定拖拽的元素列表
      // 如果是多选状态（>1个元素）且当前元素在选中列表中，则拖拽所有选中元素
      // 否则只拖拽当前点击的元素
      let draggedIds: string[]
      if (selectedIds.length > 1 && selectedIds.includes(elementId)) {
        draggedIds = selectedIds
      } else {
        draggedIds = [elementId]
      }

      // 防御性检查：确保 draggedIds 不为空
      if (draggedIds.length === 0) {
        // console.warn('[对齐调试] draggedIds 为空，强制添加当前元素')
        draggedIds = [elementId]
      }

      // 计算初始边界框
      const draggedElements = draggedIds.map(id => allElements.find(el => el.id === id)).filter(el => el != null) as AnyElement[]

      if (draggedElements.length === 0) {
        // console.warn('[对齐调试] 未找到拖拽元素！', { draggedIds, allElementsCount: allElements.length })
      }

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

      // 保存拖拽状态
      this.draggedIds = draggedIds
      this.initialBoundingBox = initialBoundingBox

      // 展开组合元素，获取所有需要更新的元素ID（包括子元素）
      const getExpandedIds = (ids: string[]): string[] => {
        const expanded = new Set<string>()
        ids.forEach(id => {
          const el = allElements.find(e => e.id === id)
          if (!el) return
          expanded.add(id)
          if (el.type === 'group') {
            const groupEl = el as GroupElement
            if (groupEl.children) {
              groupEl.children.forEach(childId => expanded.add(childId))
            }
          }
        })
        return Array.from(expanded)
      }

      // 保存所有元素的初始位置（包括组合的子元素）
      this.initialElementPositions.clear()
      const expandedIds = getExpandedIds(draggedIds)
      expandedIds.forEach(id => {
        const el = allElements.find(e => e.id === id)
        if (el) {
          this.initialElementPositions.set(id, { x: el.x, y: el.y })
        }
      })

      // console.log('[对齐调试] 开始拖拽:', {
      //   elementId,
      //   draggedIds,
      //   initialBoundingBox,
      //   selectedIds,
      //   allElementsCount: allElements.length,
      //   allElementIds: allElements.map(el => el.id),
      //   draggedElementsFound: draggedElements.length,
      //   draggedElementsIds: draggedElements.map(el => el.id)
      // })

      // 启动全局拖拽状态
      this.dragState.startDrag(draggedIds, initialBoundingBox)
    } else {
      // 点击到画布：开始框选
      this.isBoxSelecting = true
      this.boxStartPos = worldPos  // 使用世界坐标

      // 创建框选框并立即添加到worldContainer
      if (!this.selectionBox && this.worldContainer) {
        this.selectionBox = new Graphics()
        this.worldContainer.addChild(this.selectionBox)
      }
    }
  }

  /**
   * 统一处理鼠标移动事件
   */
  private handlePointerMove(event: FederatedPointerEvent): void {
    const worldPos = this.screenToWorld(event.global.x, event.global.y)

    // 处理拖拽
    if (this.isDragging && this.dragTargetId) {
      let dx = worldPos.x - this.dragStartPos.x
      let dy = worldPos.y - this.dragStartPos.y

      // 应用对齐吸附
      if (this.initialBoundingBox) {
        const targetRect = {
          x: this.initialBoundingBox.x + dx,
          y: this.initialBoundingBox.y + dy,
          width: this.initialBoundingBox.width,
          height: this.initialBoundingBox.height
        }

        const { dx: snapDx, dy: snapDy } = this.alignment.checkAlignment(targetRect, this.draggedIds)

        if (snapDx !== 0 || snapDy !== 0) {
          // console.log('[对齐调试] 检测到吸附:', { snapDx, snapDy, targetRect, draggedIds: this.draggedIds })
        }

        dx += snapDx
        dy += snapDy
      }

      // 更新全局拖拽偏移
      this.dragState.updateDragOffset({ x: dx, y: dy })

      // 只有移动超过2像素才认为是拖拽（避免误触）
      // 注意：这里的阈值检查应该在世界坐标下进行
      const threshold = 2 / (this.viewportService?.getViewport().zoom || 1)
      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        const selectedIds = this.handlers.getSelectedIds?.()
        const isMultiSelect = selectedIds && selectedIds.length > 1 && selectedIds.includes(this.dragTargetId)

        // 实时更新元素位置（拖拽预览）
        const allElements = this.handlers.getAllElements?.()
        if (allElements && this.worldContainer) {
          // 展开组合元素，获取所有需要更新的元素ID（包括子元素）
          const getExpandedIds = (ids: string[]): string[] => {
            const expanded = new Set<string>()
            ids.forEach(id => {
              const el = allElements.find(e => e.id === id)
              if (!el) return
              expanded.add(id)
              if (el.type === 'group') {
                const groupEl = el as GroupElement
                if (groupEl.children) {
                  groupEl.children.forEach(childId => expanded.add(childId))
                }
              }
            })
            return Array.from(expanded)
          }

          // 确定要更新的元素ID列表
          const idsToUpdate = isMultiSelect && selectedIds
            ? getExpandedIds(selectedIds)
            : getExpandedIds([this.dragTargetId])

          // 使用 RAF 节流更新元素位置
          if (this.dragAnimationFrameId !== null) {
            return // 已有待处理的帧，跳过
          }

          this.dragAnimationFrameId = requestAnimationFrame(() => {
            // 更新所有需要移动的元素（包括组合的子元素）
            idsToUpdate.forEach(id => {
              const initialPos = this.initialElementPositions.get(id)
              if (!initialPos) return

              const element = allElements.find(el => el.id === id)
              if (!element) return

              // 计算新位置（使用初始位置 + 偏移量）
              const newX = initialPos.x + dx
              const newY = initialPos.y + dy

              // 更新 PIXI Graphics（shape 元素）
              if (element.type === 'shape') {
                const graphic = this.worldContainer!.children.find(
                  (child) => this.getElementIdByGraphic?.(child as Graphics) === id
                ) as Graphics
                if (graphic) {
                  // Convert top-left position to center position for PIXI graphics
                  graphic.x = newX + graphic.pivot.x
                  graphic.y = newY + graphic.pivot.y
                }
              }
              // 更新 DOM 元素（文本、图片）的位置
              else if (element.type === 'text' || element.type === 'image') {
                const domEl = document.querySelector(`[data-element-id="${id}"]`) as HTMLElement
                if (domEl) {
                  const rotation = element.rotation || 0
                  domEl.style.transform = `translate3d(${newX}px, ${newY}px, 0) rotate(${rotation}rad)`
                }
              }
            })

            this.dragAnimationFrameId = null
          })
        }
      }
      return
    }

    // 处理框选
    if (this.isBoxSelecting && this.selectionBox) {
      const x = Math.min(this.boxStartPos.x, worldPos.x)
      const y = Math.min(this.boxStartPos.y, worldPos.y)
      const width = Math.abs(worldPos.x - this.boxStartPos.x)
      const height = Math.abs(worldPos.y - this.boxStartPos.y)

      // 绘制框选框（在世界坐标系中）
      this.selectionBox.clear()
      this.selectionBox.rect(x, y, width, height)
      this.selectionBox.stroke({ width: 2 / (this.viewportService?.getViewport().zoom || 1), color: 0x4A90E2 })
      this.selectionBox.fill({ color: 0x4A90E2, alpha: 0.1 })
    }
  }

  /**
   * 统一处理鼠标抬起事件
   */
  private handlePointerUp(event: FederatedPointerEvent): void {
    const worldPos = this.screenToWorld(event.global.x, event.global.y)

    // 处理拖拽结束
    if (this.isDragging && this.dragTargetId) {
      const dx = worldPos.x - this.dragStartPos.x
      const dy = worldPos.y - this.dragStartPos.y

      // 只有真正移动了才触发移动事件
      const threshold = 2 / (this.viewportService?.getViewport().zoom || 1)
      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        const selectedIds = this.handlers.getSelectedIds?.()
        const isMultiSelect = selectedIds && selectedIds.length > 1 && selectedIds.includes(this.dragTargetId)

        if (isMultiSelect && this.handlers.onMultiElementMove && selectedIds) {
          // 多选拖拽：移动所有选中的元素
          this.handlers.onMultiElementMove(selectedIds, dx, dy)
        } else if (this.handlers.onElementMove) {
          // 单选拖拽：只移动当前元素
          this.handlers.onElementMove(this.dragTargetId, dx, dy)
        }
      }

      // 取消待处理的动画帧
      if (this.dragAnimationFrameId !== null) {
        cancelAnimationFrame(this.dragAnimationFrameId)
        this.dragAnimationFrameId = null
      }

      // 结束全局拖拽状态
      this.dragState.endDrag()
      this.alignment.clearAlignment()

      this.isDragging = false
      this.dragTargetId = null
      this.initialBoundingBox = null
      this.draggedIds = []
      this.initialElementPositions.clear()
      return
    }

    // 处理框选或画布点击
    if (this.isBoxSelecting) {
      const width = Math.abs(worldPos.x - this.boxStartPos.x)
      const height = Math.abs(worldPos.y - this.boxStartPos.y)
      const currentTool = this.handlers.getCurrentTool?.()

      // 判断是点击还是框选（根据鼠标移动距离）
      const threshold = 5 / (this.viewportService?.getViewport().zoom || 1)
      if (width > threshold || height > threshold) {
        // 拖动：框选元素
        const x = Math.min(this.boxStartPos.x, worldPos.x)
        const y = Math.min(this.boxStartPos.y, worldPos.y)

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
          // 绘图工具：创建元素（使用世界坐标）
          if (this.handlers.onElementCreate) {
            const elementId = this.handlers.onElementCreate(worldPos.x, worldPos.y, currentTool)
            console.log(`创建${currentTool}元素于 (${worldPos.x}, ${worldPos.y})`)

            // 如果是文本工具且返回了元素ID，触发文本编辑
            if (currentTool === 'text' && elementId && this.handlers.onTextEdit) {
              this.handlers.onTextEdit(elementId)
            }
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
    if (this.selectionBox && this.worldContainer) {
      this.worldContainer.removeChild(this.selectionBox)
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

