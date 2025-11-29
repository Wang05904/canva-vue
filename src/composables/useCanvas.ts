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
      // 元素选中事件
      onElementSelect: (elementId: string) => {
        selectionStore.selectElement(elementId)
        console.log('选中元素:', elementId)
      },
      // 单个元素移动事件
      onElementMove: (elementId: string, dx: number, dy: number) => {
        elementsStore.moveElement(elementId, dx, dy)
      },
      // 多个元素移动事件（多选拖拽）
      onMultiElementMove: (elementIds: string[], dx: number, dy: number) => {
        elementsStore.moveElements(elementIds, dx, dy)
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
        createElement(x, y, tool as ToolType)
      },
      // 获取当前工具
      getCurrentTool: () => canvasStore.currentTool,
      // 获取当前选中的元素ID列表
      getSelectedIds: () => selectionStore.selectedIds,
      // 获取所有元素
      getAllElements: () => elementsStore.elements
    })

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
      // 传递鼠标位置给粘贴方法
      elementsStore.pasteElements(mousePosition.value)
      console.log('粘贴元素到位置:', mousePosition.value)
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
    canvasService
  }
}
