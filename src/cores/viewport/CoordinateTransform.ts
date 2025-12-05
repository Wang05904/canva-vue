/**
 * 核心层-坐标转换工具类
 * 功能：处理屏幕坐标与世界坐标之间的转换
 * 职责：
 * 1. 屏幕坐标 -> 世界坐标
 * 2. 世界坐标 -> 屏幕坐标
 * 3. 计算可见区域边界
 * 4. 支持缩放和平移变换
 */
import type { ViewportState, VisibleBounds } from '../types/canvas'
import type { Point } from '../types/element'

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

        // 3. 加上相机在世界中的位置
        const worldX = scaledX + viewport.x
        const worldY = scaledY + viewport.y

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
        const relativeX = worldX - viewport.x
        const relativeY = worldY - viewport.y

        // 2. 应用缩放
        const scaledX = relativeX * viewport.zoom
        const scaledY = relativeY * viewport.zoom

        // 3. 转换为屏幕坐标（以视口中心为原点 -> 以左上角为原点）
        const screenX = scaledX + viewportWidth / 2
        const screenY = scaledY + viewportHeight / 2

        return { x: screenX, y: screenY }
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
}
