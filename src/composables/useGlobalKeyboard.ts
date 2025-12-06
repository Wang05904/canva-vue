/**
 * Composables层-全局键盘快捷键管理
 * 功能：集中管理所有应用级别的键盘快捷键
 * 职责：统一注册所有快捷键，避免分散定义
 */
import { type Ref } from 'vue'
import { KeyboardManager } from '@/cores/keyboard/KeyboardManager'
import { useElementsStore } from '@/stores/elements'
import { useSelectionStore } from '@/stores/selection'
import { useCanvasStore } from '@/stores/canvas'
import { GroupService } from '@/services'
import { CoordinateTransform } from '@/cores/viewport/CoordinateTransform'
import type { CanvasService } from '@/services/canvas/CanvasService'

interface GlobalKeyboardOptions {
    canvasService: CanvasService
    mousePosition: Ref<{ x: number; y: number }>
    editingTextId: Ref<string | null>
    performancePanelToggle?: () => void
}

/**
 * 全局键盘快捷键管理
 * 集中定义所有快捷键
 */
export function useGlobalKeyboard(options: GlobalKeyboardOptions) {
    const keyboard = new KeyboardManager()
    const elementsStore = useElementsStore()
    const selectionStore = useSelectionStore()
    const canvasStore = useCanvasStore()
    const groupService = new GroupService()

    const { canvasService, mousePosition, editingTextId, performancePanelToggle } = options

    /**
     * 注册所有全局快捷键
     */
    const registerAllShortcuts = () => {
        // 开始监听键盘事件
        keyboard.startListening()

        // ==================== UI 控制类 ====================

        // Escape - 退出文本编辑
        keyboard.register({
            key: 'Escape',
            description: '退出文本编辑模式',
            priority: 100, // 最高优先级
            handler: () => {
                if (editingTextId.value) {
                    editingTextId.value = null
                    return false // 阻止事件传播
                }
            }
        })

        // Ctrl+M - 切换性能面板
        if (performancePanelToggle) {
            keyboard.register({
                key: 'm',
                ctrl: true,
                description: '切换性能监控面板',
                handler: (event) => {
                    event.preventDefault()
                    performancePanelToggle()
                }
            })
        }

        // ==================== 编辑操作类 ====================

        // Ctrl+C - 复制
        keyboard.register({
            key: 'c',
            ctrl: true,
            description: '复制选中元素',
            handler: (event) => {
                event.preventDefault()
                elementsStore.copySelectedElements()
                console.log('复制选中元素')
            }
        })

        // Ctrl+V - 粘贴
        keyboard.register({
            key: 'v',
            ctrl: true,
            description: '粘贴元素',
            handler: (event) => {
                event.preventDefault()
                const worldPosition = CoordinateTransform.screenToWorld(
                    mousePosition.value.x,
                    mousePosition.value.y,
                    canvasStore.viewport,
                    canvasStore.width || 800,
                    canvasStore.height || 600
                )
                elementsStore.pasteElements(worldPosition)
                console.log('粘贴元素到位置:', worldPosition)
            }
        })

        // Delete - 删除元素
        keyboard.register({
            key: 'Delete',
            description: '删除选中的元素',
            handler: (event) => {
                event.preventDefault()
                deleteSelectedElements()
            }
        })

        // Backspace - 删除元素
        keyboard.register({
            key: 'Backspace',
            description: '删除选中的元素',
            handler: (event) => {
                event.preventDefault()
                deleteSelectedElements()
            }
        })

        // ==================== 视口控制类 ====================

        // Space - 临时平移模式
        let spacePressed = false
        keyboard.register({
            key: 'Space',
            description: '按住空格键临时切换到平移模式',
            priority: 10,
            handler: (event) => {
                if (!event.repeat && !spacePressed) {
                    spacePressed = true
                    const currentTool = canvasService.getCurrentTool()
                    if (currentTool !== 'pan') {
                        canvasService.setCanvasCursor('grab')
                    }
                }
            }
        })

        // 监听空格键释放
        window.addEventListener('keyup', (e: KeyboardEvent) => {
            if (e.code === 'Space' && spacePressed) {
                spacePressed = false
                const currentTool = canvasService.getCurrentTool()
                canvasService.setCanvasCursor(currentTool === 'pan' ? 'grab' : 'default')
            }
        })
    }

    /**
     * 删除选中元素（包括组合元素）
     */
    const deleteSelectedElements = () => {
        const selectedIds = selectionStore.selectedIds
        if (selectedIds.length === 0) return

        // 删除组合及其子元素
        groupService.deleteGroups(selectedIds)

        // 删除其余非组合元素
        const remainingIds = selectedIds.filter(id => {
            const el = elementsStore.getElementById(id)
            return !el || el.type !== 'group'
        })

        if (remainingIds.length) {
            elementsStore.removeElements(remainingIds)
        }

        console.log('删除选中元素:', selectedIds)
    }

    return {
        registerAllShortcuts,
        keyboard
    }
}
