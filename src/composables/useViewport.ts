/**
 * Composables层-视口Composable
 * 功能：封装视口相关操作，提供响应式的视口状态
 * 服务对象：为View层提供简化的视口操作接口
 */
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import type { ViewportService } from '@/services/canvas/ViewportService'
import type { ViewportState, Rectangle } from '@/cores/types/canvas'

export function useViewport(viewportService: ViewportService) {
    const canvasStore = useCanvasStore()

    // 响应式视口状态
    const viewport = computed<ViewportState>(() => canvasStore.viewport)

    // getter
    const zoom = computed(() => viewport.value.zoom)
    const position = computed(() => ({ x: viewport.value.x, y: viewport.value.y }))

    /**
     * 同步ViewportService的状态到Store
     */
    const syncViewportToStore = () => {
        const currentViewport = viewportService.getViewport()
        canvasStore.setViewport(currentViewport)
    }

    /**
     * 设置缩放级别
     */
    const setZoom = (zoom: number, centerX?: number, centerY?: number) => {
        viewportService.setZoom(zoom, centerX, centerY)
        syncViewportToStore()
    }

    /**
     * 缩放（相对）
     */
    const zoom_delta = (delta: number, centerX?: number, centerY?: number) => {
        viewportService.zoom(delta, centerX, centerY)
        syncViewportToStore()
    }

    /**
     * 缩放到指定级别（带动画）
     */
    const zoomTo = async (zoom: number, duration?: number, centerX?: number, centerY?: number) => {
        await viewportService.zoomTo(zoom, duration, centerX, centerY)
        syncViewportToStore()
    }

    /**
     * 放大
     */
    const zoomIn = () => {
        const config = viewportService.getConfig()
        const newZoom = Math.min(zoom.value + config.zoomStep, config.maxZoom)
        setZoom(newZoom)
    }

    /**
     * 缩小
     */
    const zoomOut = () => {
        const config = viewportService.getConfig()
        const newZoom = Math.max(zoom.value - config.zoomStep, config.minZoom)
        setZoom(newZoom)
    }

    /**
     * 重置缩放到100%
     */
    const resetZoom = () => {
        const config = viewportService.getConfig()
        setZoom(config.defaultZoom)
    }

    /**
     * 平移视口
     */
    const pan = (dx: number, dy: number) => {
        viewportService.pan(dx, dy)
        syncViewportToStore()
    }

    /**
     * 设置视口位置
     */
    const setPosition = (x: number, y: number) => {
        viewportService.setPosition(x, y)
        syncViewportToStore()
    }

    /**
     * 平移到指定位置（带动画）
     */
    const panTo = async (x: number, y: number, duration?: number) => {
        await viewportService.panTo(x, y, duration)
        syncViewportToStore()
    }

    /**
     * 适应内容到视口
     */
    const fitToView = (contentBounds: Rectangle, padding?: number) => {
        viewportService.fitToView(contentBounds, padding)
        syncViewportToStore()
    }

    /**
     * 重置视口
     */
    const reset = () => {
        viewportService.reset()
        syncViewportToStore()
    }

    /**
     * 获取可见区域（世界坐标）
     */
    const getVisibleBounds = () => {
        return viewportService.getVisibleBounds()
    }

    /**
     * 屏幕坐标转世界坐标
     */
    const screenToWorld = (screenX: number, screenY: number) => {
        return viewportService.screenToWorld(screenX, screenY)
    }

    /**
     * 世界坐标转屏幕坐标
     */
    const worldToScreen = (worldX: number, worldY: number) => {
        return viewportService.worldToScreen(worldX, worldY)
    }

    /**
     * 判断元素是否在可见区域内
     */
    const isElementVisible = (x: number, y: number, width: number, height: number) => {
        return viewportService.isElementVisible(x, y, width, height)
    }

    /**
     * 缩放到选中的元素
     */
    const zoomToElements = (elements: Array<{ x: number; y: number; width: number; height: number }>, padding = 50) => {
        if (elements.length === 0) return

        // 计算所有元素的边界框
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity

        elements.forEach(el => {
            minX = Math.min(minX, el.x)
            minY = Math.min(minY, el.y)
            maxX = Math.max(maxX, el.x + el.width)
            maxY = Math.max(maxY, el.y + el.height)
        })

        const bounds = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        }

        fitToView(bounds, padding)
    }

    /**
     * 居中显示指定点
     */
    const centerOn = (x: number, y: number, animated = true) => {
        if (animated) {
            panTo(x, y)
        } else {
            setPosition(x, y)
        }
    }

    return {
        // 状态
        viewport,
        zoom,
        position,

        // 缩放操作
        setZoom,
        zoomDelta: zoom_delta,
        zoomTo,
        zoomIn,
        zoomOut,
        resetZoom,

        // 平移操作
        pan,
        setPosition,
        panTo,
        centerOn,

        // 适应操作
        fitToView,
        zoomToElements,
        reset,

        // 坐标转换
        screenToWorld,
        worldToScreen,
        getVisibleBounds,
        isElementVisible,

        // 同步方法
        syncViewportToStore
    }
}
