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
import { useElementCreate } from './useElementsCreate'
import type { ToolType } from '@/services/canvas/ToolService'

export function useCanvas() {
  const container = ref<HTMLDivElement | null>(null)
  const canvasService = new CanvasService()
  const canvasStore = useCanvasStore()
  const elementsStore = useElementsStore()
  const selectionStore = useSelectionStore()
  const { createElement } = useElementCreate()

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
      // 创建元素事件
      onElementCreate: (x: number, y: number, tool: string) => {
        const pos = canvasService.calculateCreatePosition(x, y, tool as ToolType)
        const id = createElement(pos.x, pos.y, pos.width, pos.height, tool as ToolType)
        // 创建后自动切换回选择工具
        if (id) {
          canvasStore.setTool('select')
        }
        return id
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
    console.timeEnd('打开页面到渲染完成用时：')

    // 监听元素数组引用变化（添加/删除/修改元素时 store 会创建新数组）
    watch(() => elementsStore.elements, () => {
      canvasService.renderElements(elementsStore.elements)
    })

    // 监听工具切换
    watch(() => canvasStore.currentTool, (newTool) => {
      canvasService.setTool(newTool)
    })
  }

  onMounted(() => {
    initialize()
  })

  onUnmounted(() => {
    canvasService.destroy()
  })

  return {
    container,
    canvasService
  }
}