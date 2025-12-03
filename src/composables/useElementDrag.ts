/**
 * 元素拖拽 Composable (用于 DOM 渲染的元素)
 * 功能:处理元素的点击选中和拖拽移动
 * 优化策略：
 * 1. 拖拽时直接操作 DOM transform，避免触发 Vue 响应式更新
 * 2. 使用 RAF 节流，减少渲染频率
 * 3. 拖拽结束时才更新 Store
 * 4. 使用 transform3d 启用 GPU 加速
 */
import { ref, onUnmounted, inject } from 'vue'
import { useElementsStore } from '@/stores/elements'
import { useSelectionStore } from '@/stores/selection'
import { useDragState } from './useDragState'
import { useAlignment } from './useAlignment'
import type { CanvasService } from '@/services/canvas/CanvasService'

export function useElementDrag(elementId: string) {
  const elementsStore = useElementsStore()
  const selectionStore = useSelectionStore()
  const canvasService = inject<CanvasService>('canvasService')
  const { startDrag: startGlobalDrag, updateDragOffset, endDrag: endGlobalDrag } = useDragState()
  const { checkAlignment, clearAlignment } = useAlignment()

  const isDragging = ref(false)
  const dragStartPos = ref({ x: 0, y: 0 })
  const totalOffset = ref({ x: 0, y: 0 }) // 累计偏移量
  let animationFrameId: number | null = null
  let currentElement: HTMLElement | null = null
  let initialTransform = { x: 0, y: 0, rotation: 0 }
  let initialBoundingBox: { x: number; y: number; width: number; height: number } | null = null
  let draggedIds: string[] = []

  /**
   * 鼠标按下 - 开始拖拽
   */
  const handleMouseDown = (e: MouseEvent) => {
    e.stopPropagation() // 作用是防止事件冒泡，避免触发父元素的事件处理器
    e.preventDefault() // 防止默认行为（如文本选中）

    // 获取当前DOM元素
    currentElement = e.currentTarget as HTMLElement

    // 先记录拖拽起始位置和元素初始状态
    const element = elementsStore.getElementById(elementId)
    if (!element) return

    initialTransform = {
      x: element.x,
      y: element.y,
      rotation: element.rotation || 0
    }

    dragStartPos.value = { x: e.clientX, y: e.clientY }
    totalOffset.value = { x: 0, y: 0 }

    // 判断是否是多选拖拽
    const selectedIds = selectionStore.selectedIds
    const isAlreadySelected = selectedIds.includes(elementId)

    // 如果元素未被选中，先选中它
    if (!isAlreadySelected) {
      selectionStore.selectElement(elementId)
    }

    // 确定实际拖拽的元素ID列表
    draggedIds = selectionStore.selectedIds.length > 1 && selectionStore.selectedIds.includes(elementId)
      ? selectionStore.selectedIds
      : [elementId]

    // 计算初始边界框（用于 SelectionOverlay 和对齐）
    const draggedElements = draggedIds.map(id => elementsStore.getElementById(id)).filter(el => el != null)
    initialBoundingBox = null
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
    
    console.log('[对齐调试-DOM] 开始拖拽:', { elementId, draggedIds, initialBoundingBox })

    // 通知全局拖拽状态开始（传入初始边界框）
    isDragging.value = true
    startGlobalDrag(draggedIds, initialBoundingBox)

    // 启用性能优化
    if (currentElement) {
      currentElement.classList.add('dragging')
      currentElement.style.willChange = 'transform'
    }

    // 绑定全局事件
    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseup', handleMouseUp)
  }

  /**
   * 鼠标移动 - 拖拽中（使用 RAF 节流 + 直接 DOM 操作）
   */
  /**
   * 鼠标移动 - 拖拽中（使用 RAF 节流 + 直接 DOM 操作）
   */
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return

    const dx = e.clientX - dragStartPos.value.x
    const dy = e.clientY - dragStartPos.value.y

    // 1. 计算未吸附前的目标位置
    let newX = initialTransform.x + dx
    let newY = initialTransform.y + dy
    
    // 2. 计算吸附修正
    if (initialBoundingBox) {
      const targetRect = {
        x: initialBoundingBox.x + dx,
        y: initialBoundingBox.y + dy,
        width: initialBoundingBox.width,
        height: initialBoundingBox.height
      }
      
      const { dx: snapDx, dy: snapDy } = checkAlignment(targetRect, draggedIds)
      
      if (snapDx !== 0 || snapDy !== 0) {
        console.log('[对齐调试-DOM] 检测到吸附:', { snapDx, snapDy })
      }

      // 应用吸附修正
      newX = initialTransform.x + dx + snapDx
      newY = initialTransform.y + dy + snapDy
      
      // 更新总偏移量（包含吸附）
      totalOffset.value = { 
        x: newX - initialTransform.x, 
        y: newY - initialTransform.y 
      }
    } else {
      totalOffset.value = { x: dx, y: dy }
    }

    // 立即更新全局拖拽偏移（不等待 RAF）
    updateDragOffset(totalOffset.value)

    // 使用 RAF 节流
    if (animationFrameId !== null) {
      return // 已有待处理的帧，跳过
    }

    animationFrameId = requestAnimationFrame(() => {
      // 直接操作 DOM，使用 translate3d 启用 GPU 加速
      if (currentElement) {
        // 注意：这里使用 totalOffset，因为它已经包含了吸附修正
        const finalX = initialTransform.x + totalOffset.value.x
        const finalY = initialTransform.y + totalOffset.value.y
        currentElement.style.transform = `translate3d(${finalX}px, ${finalY}px, 0) rotate(${initialTransform.rotation}deg)`
      }

      // 同步更新 Canvas 元素位置（如果存在）
      if (canvasService) {
        const selectedIds = selectionStore.selectedIds
        const isMultiSelect = selectedIds.length > 1 && selectedIds.includes(elementId)

        if (isMultiSelect) {
          // 多选拖拽：同步所有选中元素
          const updates = selectedIds.map(id => {
            const el = elementsStore.getElementById(id)
            if (!el) return null
            return {
              id,
              x: el.x + totalOffset.value.x,
              y: el.y + totalOffset.value.y
            }
          }).filter(Boolean) as Array<{ id: string; x: number; y: number }>

          canvasService.batchUpdatePositions(updates)
        } else {
          // 单选拖拽
          const finalX = initialTransform.x + totalOffset.value.x
          const finalY = initialTransform.y + totalOffset.value.y
          canvasService.updateElementPosition(elementId, finalX, finalY)
        }
      }

      animationFrameId = null
    })
  }

  /**
   * 鼠标抬起 - 结束拖拽（此时才更新 Store）
   */
  const handleMouseUp = () => {
    if (!isDragging.value) return

    // 清除辅助线
    clearAlignment()

    // 取消待处理的动画帧
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    // 移除性能优化类
    if (currentElement) {
      currentElement.classList.remove('dragging')
      currentElement.style.willChange = 'auto'
    }

    // 应用最终偏移到 Store（只在有实际移动时）
    if (Math.abs(totalOffset.value.x) > 1 || Math.abs(totalOffset.value.y) > 1) {
      const selectedIds = selectionStore.selectedIds
      const isMultiSelect = selectedIds.length > 1 && selectedIds.includes(elementId)

      if (isMultiSelect) {
        // 多选拖拽:移动所有选中的元素
        elementsStore.moveElements(selectedIds, totalOffset.value.x, totalOffset.value.y)
      } else {
        // 单选拖拽
        elementsStore.moveElement(elementId, totalOffset.value.x, totalOffset.value.y)
      }

      elementsStore.saveToLocal()
    } else {
      // 如果没有移动，重置元素位置
      if (currentElement) {
        currentElement.style.transform = `translate3d(${initialTransform.x}px, ${initialTransform.y}px, 0) rotate(${initialTransform.rotation}deg)`
      }
    }

    isDragging.value = false
    totalOffset.value = { x: 0, y: 0 }
    currentElement = null
    initialBoundingBox = null
    draggedIds = []

    // 结束全局拖拽状态
    endGlobalDrag()

    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  // 组件卸载时清理事件
  onUnmounted(() => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    // 清理性能优化
    if (currentElement) {
      currentElement.style.willChange = 'auto'
      currentElement = null
    }
  })

  return {
    handleMouseDown,
    isDragging
  }
}
