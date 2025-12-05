/**
 * 核心层-坐标转换工具类
 * 功能：处理屏幕坐标与世界坐标之间的转换
 * 职责：
 * 1. 屏幕坐标 -> 世界坐标
 * 2. 世界坐标 -> 屏幕坐标
 * 3. 计算可见区域边界
 * 4. 支持缩放和平移变换
 */
import type { Point, ViewportState, VisibleBounds } from '../types/canvas'

export class CoordinateTransform {
    /**
     * 屏幕坐标转世界坐标
     * @param screenX 屏幕X坐标
     * @param screenY 屏幕Y坐标
     * @param viewport 视口状态
     * @param viewportWidth 视口宽度
     * @param viewportHeight 视口高度
     * @returns 世界坐标
     */
    static screenToWorld(
        screenX: number,
        screenY: number,
        viewport: ViewportState,
        viewportWidth: number,
        viewportHeight: number
    ): Point {
        // 1. 将屏幕坐标转换为以视口中心为原点的坐标
        const centerX = screenX - viewportWidth / 2
        const centerY = screenY - viewportHeight / 2

        // 2. 应用缩放的逆变换
        const scaledX = centerX / viewport.zoom
        const scaledY = centerY / viewport.zoom

        // 3. 处理旋转（如果有）
        let worldX = scaledX
        let worldY = scaledY

        if (viewport.rotation !== 0) {
            const cos = Math.cos(-viewport.rotation)
            const sin = Math.sin(-viewport.rotation)
            worldX = scaledX * cos - scaledY * sin
            worldY = scaledX * sin + scaledY * cos
        }

        // 4. 加上相机在世界中的位置
        worldX += viewport.x
        worldY += viewport.y

        return { x: worldX, y: worldY }
    }

    /**
     * 世界坐标转屏幕坐标
     * @param worldX 世界X坐标
     * @param worldY 世界Y坐标
     * @param viewport 视口状态
     * @param viewportWidth 视口宽度
     * @param viewportHeight 视口高度
     * @returns 屏幕坐标
     */
    static worldToScreen(
        worldX: number,
        worldY: number,
        viewport: ViewportState,
        viewportWidth: number,
        viewportHeight: number
    ): Point {
        // 1. 转换为相对于相机的坐标
        let relativeX = worldX - viewport.x
        let relativeY = worldY - viewport.y

        // 2. 处理旋转（如果有）
        if (viewport.rotation !== 0) {
            const cos = Math.cos(viewport.rotation)
            const sin = Math.sin(viewport.rotation)
            const rotatedX = relativeX * cos - relativeY * sin
            const rotatedY = relativeX * sin + relativeY * cos
            relativeX = rotatedX
            relativeY = rotatedY
        }

        // 3. 应用缩放
        const scaledX = relativeX * viewport.zoom
        const scaledY = relativeY * viewport.zoom

        // 4. 转换为屏幕坐标（以视口中心为原点 -> 以左上角为原点）
        const screenX = scaledX + viewportWidth / 2
        const screenY = scaledY + viewportHeight / 2

        return { x: screenX, y: screenY }
    }

    /**
     * 批量转换：屏幕坐标转世界坐标
     */
    static screenPointsToWorld(
        points: Point[],
        viewport: ViewportState,
        viewportWidth: number,
        viewportHeight: number
    ): Point[] {
        return points.map(point =>
            this.screenToWorld(point.x, point.y, viewport, viewportWidth, viewportHeight)
        )
    }

    /**
     * 批量转换：世界坐标转屏幕坐标
     */
    static worldPointsToScreen(
        points: Point[],
        viewport: ViewportState,
        viewportWidth: number,
        viewportHeight: number
    ): Point[] {
        return points.map(point =>
            this.worldToScreen(point.x, point.y, viewport, viewportWidth, viewportHeight)
        )
    }

    /**
     * 计算当前视口的可见区域（世界坐标）
     * @param viewport 视口状态
     * @param viewportWidth 视口宽度
     * @param viewportHeight 视口高度
     * @returns 可见区域边界
     */
    static getVisibleBounds(
        viewport: ViewportState,
        viewportWidth: number,
        viewportHeight: number
    ): VisibleBounds {
        // 获取视口四个角的世界坐标
        const topLeft = this.screenToWorld(0, 0, viewport, viewportWidth, viewportHeight)
        const topRight = this.screenToWorld(viewportWidth, 0, viewport, viewportWidth, viewportHeight)
        const bottomLeft = this.screenToWorld(0, viewportHeight, viewport, viewportWidth, viewportHeight)
        const bottomRight = this.screenToWorld(viewportWidth, viewportHeight, viewport, viewportWidth, viewportHeight)

        // 考虑旋转情况，需要找到实际的边界
        const allX = [topLeft.x, topRight.x, bottomLeft.x, bottomRight.x]
        const allY = [topLeft.y, topRight.y, bottomLeft.y, bottomRight.y]

        const left = Math.min(...allX)
        const right = Math.max(...allX)
        const top = Math.min(...allY)
        const bottom = Math.max(...allY)

        return {
            x: left,
            y: top,
            width: right - left,
            height: bottom - top,
            left,
            right,
            top,
            bottom
        }
    }

    /**
     * 判断世界坐标中的矩形是否在可见区域内
     * @param worldX 矩形世界X坐标
     * @param worldY 矩形世界Y坐标
     * @param width 矩形宽度
     * @param height 矩形高度
     * @param visibleBounds 可见区域
     * @returns 是否可见
     */
    static isRectVisible(
        worldX: number,
        worldY: number,
        width: number,
        height: number,
        visibleBounds: VisibleBounds
    ): boolean {
        // AABB 碰撞检测
        return !(
            worldX + width < visibleBounds.left ||
            worldX > visibleBounds.right ||
            worldY + height < visibleBounds.top ||
            worldY > visibleBounds.bottom
        )
    }

    /**
     * 将屏幕空间的偏移量转换为世界空间的偏移量
     * @param screenDx 屏幕X方向偏移
     * @param screenDy 屏幕Y方向偏移
     * @param viewport 视口状态
     * @returns 世界坐标偏移量
     */
    static screenDeltaToWorldDelta(
        screenDx: number,
        screenDy: number,
        viewport: ViewportState
    ): { dx: number; dy: number } {
        // 只考虑缩放,不考虑画布旋转
        return {
            dx: screenDx / viewport.zoom,
            dy: screenDy / viewport.zoom
        }
    }

    /**
     * 判断世界坐标中的点是否在可见区域内
     */
    static isPointVisible(
        worldX: number,
        worldY: number,
        visibleBounds: VisibleBounds
    ): boolean {
        return (
            worldX >= visibleBounds.left &&
            worldX <= visibleBounds.right &&
            worldY >= visibleBounds.top &&
            worldY <= visibleBounds.bottom
        )
    }

    /**
     * 计算缩放后的新视口位置（以指定点为中心缩放）
     * @param viewport 当前视口状态
     * @param newZoom 新的缩放级别
     * @param screenCenterX 缩放中心点的屏幕X坐标
     * @param screenCenterY 缩放中心点的屏幕Y坐标
     * @param viewportWidth 视口宽度
     * @param viewportHeight 视口高度
     * @returns 新的视口位置
     */
    static calculateZoomPosition(
        viewport: ViewportState,
        newZoom: number,
        screenCenterX: number,
        screenCenterY: number,
        viewportWidth: number,
        viewportHeight: number
    ): Point {
        // 获取缩放点在世界坐标中的位置
        const worldPoint = this.screenToWorld(
            screenCenterX,
            screenCenterY,
            viewport,
            viewportWidth,
            viewportHeight
        )

        // 计算新的相机位置，使得世界点在屏幕上的位置保持不变
        const centerOffsetX = (screenCenterX - viewportWidth / 2) / newZoom
        const centerOffsetY = (screenCenterY - viewportHeight / 2) / newZoom

        return {
            x: worldPoint.x - centerOffsetX,
            y: worldPoint.y - centerOffsetY
        }
    }

    /**
     * 限制视口在世界边界内
     */
    static clampToBounds(
        viewport: ViewportState,
        viewportWidth: number,
        viewportHeight: number,
        worldBounds: { x: number; y: number; width: number; height: number }
    ): Point {
        // 计算当前可见区域的尺寸（世界坐标）
        const visibleWidth = viewportWidth / viewport.zoom
        const visibleHeight = viewportHeight / viewport.zoom

        // 限制相机位置
        let clampedX = viewport.x
        let clampedY = viewport.y

        // 如果可见区域大于世界边界，居中显示
        if (visibleWidth >= worldBounds.width) {
            clampedX = worldBounds.x + worldBounds.width / 2
        } else {
            // 限制在边界内
            const minX = worldBounds.x + visibleWidth / 2
            const maxX = worldBounds.x + worldBounds.width - visibleWidth / 2
            clampedX = Math.max(minX, Math.min(maxX, viewport.x))
        }

        if (visibleHeight >= worldBounds.height) {
            clampedY = worldBounds.y + worldBounds.height / 2
        } else {
            const minY = worldBounds.y + visibleHeight / 2
            const maxY = worldBounds.y + worldBounds.height - visibleHeight / 2
            clampedY = Math.max(minY, Math.min(maxY, viewport.y))
        }

        return { x: clampedX, y: clampedY }
    }
}
