/**
 * Composables层-画布Composable
 * 功能：封装画布相关操作，简化View层对CanvasService的调用
 * 服务对象：为View层提供简化的画布操作接口
 */
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { CanvasService } from '@/services/canvas/CanvasService'
import { useCanvasStore } from '@/stores/canvas'
import { useElementsStore } from '@/stores/elements'
import { useSelectionStore } from '@/stores/selection'
import { CoordinateTransform } from '@/cores/viewport/CoordinateTransform'
import { GroupService } from '@/services'
import type { ToolType } from '@/services/canvas/ToolService'

export function useCanvas() {
  const container = ref<HTMLDivElement | null>(null)
  const canvasService = new CanvasService()
  const canvasStore = useCanvasStore()
  const elementsStore = useElementsStore()
  const selectionStore = useSelectionStore()

  // 鼠标位置跟踪
  const mousePosition = ref({ x: 0, y: 0 })

  /**
   * 初始化画布
   */
  const initialize = async () => {
    if (!container.value) return

    // 从本地加载已有元素
    elementsStore.loadFromLocal()

    // 初始化画布服务（注册鼠标在画布点击、元素选中、元素移动等事件）
    await canvasService.initialize(container.value, {
      // 画布点击事件 - 取消选中
      onCanvasClick: () => {
        selectionStore.clearSelection()
        console.log('清空选择')
      },
      // 元素选中事件（如果是组合内子元素，则选中其父组合）
      onElementSelect: (elementId: string) => {
        const el = elementsStore.getElementById(elementId)
        const logicalId = el?.parentGroup ?? elementId
        selectionStore.selectElement(logicalId)
        console.log('选中元素:', logicalId)
      },
      // 单个元素移动事件（如果是组合，则同时移动其子元素）
      onElementMove: (elementId: string, dx: number, dy: number) => {
        const el = elementsStore.getElementById(elementId)
        if (el && el.type === 'group') {
          const childIds = el.children || []
          const idsToMove = [elementId, ...childIds]
          elementsStore.moveElements(idsToMove, dx, dy)
        } else {
          elementsStore.moveElement(elementId, dx, dy)
        }
      },
      // 多个元素移动事件（多选拖拽：展开其中的组合，并同时移动其子元素）
      onMultiElementMove: (elementIds: string[], dx: number, dy: number) => {
        const idSet = new Set<string>()
        elementIds.forEach(id => {
          const el = elementsStore.getElementById(id)
          if (!el) return
          idSet.add(id)
          if (el.type === 'group' && el.children) {
            el.children.forEach(childId => idSet.add(childId))
          }
        })
        elementsStore.moveElements(Array.from(idSet), dx, dy)
      },
      // 框选事件 - 检测框选区域内的元素
      onBoxSelection: (x: number, y: number, width: number, height: number) => {
        const selectedIds = elementsStore.getElementsInBox(x, y, width, height)
        console.log(`框选区域: (${x}, ${y}) ${width}x${height}, 选中 ${selectedIds.length} 个元素`)
        return selectedIds
      },
      // 选择变更事件 - 更新选中状态
      onSelectionChange: (elementIds: string[]) => {
        if (elementIds.length > 0) {
          selectionStore.selectedIds = elementIds
          console.log('更新选中:', elementIds)
        } else {
          selectionStore.clearSelection()
        }
      },
      // 工具创建事件 - 使用绘图工具点击画布创建元素
      onToolCreate: (x: number, y: number, tool: string) => {
        return createElement(x, y, tool as ToolType)
      },
      // 文本编辑事件
      onTextEdit: (elementId: string) => {
        console.log('触发文本编辑:', elementId)
      },
      // 获取当前工具
      getCurrentTool: () => canvasStore.currentTool,
      // 获取当前选中的元素ID列表
      getSelectedIds: () => selectionStore.selectedIds,
      // 获取所有元素
      getAllElements: () => elementsStore.elements,
      // 将实际点击到的元素ID映射为逻辑交互ID（例如：子元素 -> 组合）
      resolveInteractiveElementId: (rawId: string) => {
        const el = elementsStore.getElementById(rawId)
        return el?.parentGroup ?? rawId
      }
    })

    // 更新 canvasStore 的尺寸
    const app = canvasService.getRenderService().getApp()
    if (app) {
      canvasStore.width = app.screen.width
      canvasStore.height = app.screen.height
    }

    // 应用初始视口变换
    canvasService.getRenderService().updateViewportTransform()

    // 首次渲染元素
    canvasService.renderElements(elementsStore.elements)

    // 监听元素数组引用变化（添加/删除/修改元素时 store 会创建新数组）
    watch(() => elementsStore.elements, () => {
      canvasService.renderElements(elementsStore.elements)
    })

    // 监听工具切换
    watch(() => canvasStore.currentTool, (newTool) => {
      canvasService.setTool(newTool)
    })
  }

  /**
   * 创建元素
   */
  const createElement = (mouseX: number, mouseY: number, tool?: ToolType) => {
    const currentTool = tool || canvasStore.currentTool

    if (currentTool === 'rectangle') {
      const pos = canvasService.calculateCreatePosition(mouseX, mouseY, 'rectangle')
      const id = elementsStore.addShape({
        shapeType: 'rectangle',
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 0,
        strokeColor: '#000000',
        strokeWidth: 1,
        fillColor: '#4A90E2',
        rotation: 0
      })
      console.log('创建矩形元素:', id)
      canvasStore.setTool('select')
    } else if (currentTool === 'circle') {
      const pos = canvasService.calculateCreatePosition(mouseX, mouseY, 'circle')
      const id = elementsStore.addShape({
        shapeType: 'circle',
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 0,
        strokeColor: '#000000',
        strokeWidth: 1,
        fillColor: '#E94B3C',
        rotation: 0
      })
      console.log('创建圆形元素:', id)
      canvasStore.setTool('select')
    } else if (currentTool === 'triangle') {
      const pos = canvasService.calculateCreatePosition(mouseX, mouseY, 'triangle')
      const id = elementsStore.addShape({
        shapeType: 'triangle',
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 0,
        strokeColor: '#000000',
        strokeWidth: 1,
        fillColor: '#34C759',
        rotation: 0
      })
      console.log('创建三角形元素:', id)
      canvasStore.setTool('select')
    } else if (currentTool === 'text') {
      // 创建文本元素 - 使用 calculateCreatePosition 居中
      const pos = canvasService.calculateCreatePosition(mouseX, mouseY, 'text')
      const id = elementsStore.addText({
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
        content: '双击编辑文本',
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#000000',
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: elementsStore.elements.length
      })
      console.log('创建文本元素:', id)
      canvasStore.setTool('select')

      // 返回文本元素 ID，以便立即进入编辑模式
      return id
    }
  }

  /** 鼠标移动事件处理 */
  const handleMouseMove = (event: MouseEvent) => {
    if (!container.value) return

    // 获取容器的位置
    const rect = container.value.getBoundingClientRect()

    // 计算鼠标在画布内的相对位置
    mousePosition.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }

  // 分组服务（用于处理组合元素删除等操作）
  const groupService = new GroupService()

  /** 键盘事件处理 */
  const handleKeyDown = (event: KeyboardEvent) => {
    // 处理 Ctrl+C 复制
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      event.preventDefault()
      elementsStore.copySelectedElements()
      console.log('复制选中元素')
    }
    
    // 处理 Ctrl+V 粘贴
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      event.preventDefault()
      // 将屏幕坐标转换为世界坐标
      const worldPosition = CoordinateTransform.screenToWorld(
        mousePosition.value.x,
        mousePosition.value.y,
        canvasStore.viewport,
        canvasStore.width || 800,
        canvasStore.height || 600
      )
      // 传递世界坐标给粘贴方法
      elementsStore.pasteElements(worldPosition)
      console.log('粘贴元素到位置:', worldPosition)
    }

    // 处理 Delete/Backspace 删除
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      const selectedIds = selectionStore.selectedIds
      if (selectedIds.length > 0) {
        // 如果选中的是组合元素，则删除组合及其子元素
        groupService.deleteGroups(selectedIds)

        // 其余非组合元素正常删除
        const remainingIds = selectedIds.filter(id => {
          const el = elementsStore.getElementById(id)
          return !el || el.type !== 'group'
        })
        if (remainingIds.length) {
          elementsStore.removeElements(remainingIds)
        }

        console.log('删除选中元素:', selectedIds)
      }
    }
  }

  onMounted(() => {
    initialize()
    // 添加键盘事件监听
    window.addEventListener('keydown', handleKeyDown)
    // 添加鼠标移动事件监听
    window.addEventListener('mousemove', handleMouseMove)
  })

  onUnmounted(() => {
    canvasService.destroy()
    // 移除键盘事件监听
    window.removeEventListener('keydown', handleKeyDown)
    // 移除鼠标移动事件监听
    window.removeEventListener('mousemove', handleMouseMove)
  })

  return {
    container,
    canvasService,
    createElement
  }
}
