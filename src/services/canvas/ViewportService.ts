/**
 * Service层-视口服务
 * 功能：处理视口相关业务逻辑（状态管理、缩放、平移等）
 * 服务对象：为Composables层的useCanvas提供视口操作支持
 *
 * 职责：
 * 1. 管理视口状态（位置、缩放、旋转）
 * 2. 提供缩放操作（缩放到点、缩放到区域、适应画布）
 * 3. 提供平移操作（拖拽、惯性滚动）
 * 4. 边界限制和约束
 * 5. 动画过渡效果
 */
import type { ViewportState, ViewportConfig, VisibleBounds, Rectangle } from '@/cores/types/canvas'
import { CoordinateTransform } from '@/cores/viewport/CoordinateTransform'
import type { Point } from '@/cores/types/element.ts'
import { VIEWPORT_CONFIG } from '@/cores/config/appConfig'

export class ViewportService {
  private viewport: ViewportState
  private config: ViewportConfig
  private viewportWidth: number = 0
  private viewportHeight: number = 0

  constructor(config?: Partial<ViewportConfig>) {
    // 默认配置
    this.config = {
      minZoom: VIEWPORT_CONFIG.zoom.min,
      maxZoom: VIEWPORT_CONFIG.zoom.max,
      defaultZoom: VIEWPORT_CONFIG.zoom.default,
      zoomStep: VIEWPORT_CONFIG.zoom.step,
      ...config
    }

    // 初始化视口状态（默认在原点）
    this.viewport = {
      x: 0,
      y: 0,
      zoom: this.config.defaultZoom
    }
  }

  /**
   * 设置视口尺寸
   */
  setViewportSize(width: number, height: number): void {
    this.viewportWidth = width
    this.viewportHeight = height
  }

  /**
   * 获取视口状态
   */
  getViewport(): Readonly<ViewportState> {
    return { ...this.viewport }
  }

  /**
   * 获取视口配置
   */
  getConfig(): Readonly<ViewportConfig> {
    return { ...this.config }
  }

  /**
   * 设置视口位置
   */
  setPosition(x: number, y: number): void {
    this.viewport.x = x
    this.viewport.y = y
  }

  /**
   * 平移视口（相对移动）
   */
  pan(dx: number, dy: number): void {
    // 将屏幕空间的移动量转换为世界空间
    const worldDx = dx / this.viewport.zoom
    const worldDy = dy / this.viewport.zoom

    this.setPosition(
      this.viewport.x - worldDx,
      this.viewport.y - worldDy
    )
  }

  /**
   * 设置缩放级别
   */
  setZoom(zoom: number, centerX?: number, centerY?: number): void {
    // 限制缩放范围
    const clampedZoom = Math.max(
      this.config.minZoom,
      Math.min(this.config.maxZoom, zoom)
    )

    if (clampedZoom === this.viewport.zoom) return

    // 如果指定了缩放中心点，以该点为中心缩放
    if (centerX !== undefined && centerY !== undefined) {
      const newPosition = CoordinateTransform.calculateZoomPosition(
        this.viewport,
        clampedZoom,
        centerX,
        centerY,
        this.viewportWidth,
        this.viewportHeight
      )

      this.viewport.x = newPosition.x
      this.viewport.y = newPosition.y
    }

    this.viewport.zoom = clampedZoom
  }

  /**
   * 缩放（相对缩放）
   */
  zoom(delta: number, centerX?: number, centerY?: number): void {
    const newZoom = this.viewport.zoom + delta
    this.setZoom(newZoom, centerX, centerY)
  }

  /**
  * 滚轮缩放（基于鼠标位置）
  */
  handleWheel(deltaY: number, mouseX: number, mouseY: number): void {
    // 计算缩放因子（对数缩放，更平滑）
    const zoomFactor = deltaY > 0 ? VIEWPORT_CONFIG.zoomFactor.out : VIEWPORT_CONFIG.zoomFactor.in
    const newZoom = this.viewport.zoom * zoomFactor

    this.setZoom(newZoom, mouseX, mouseY)
  }

  /**
   * 适应内容到视口（Fit to View）
   */
  fitToView(contentBounds: Rectangle, padding: number = VIEWPORT_CONFIG.fitToView.defaultPadding): void {
    if (!this.viewportWidth || !this.viewportHeight) return

    const availableWidth = this.viewportWidth - padding * 2
    const availableHeight = this.viewportHeight - padding * 2

    // 计算缩放比例
    const scaleX = availableWidth / contentBounds.width
    const scaleY = availableHeight / contentBounds.height
    const zoom = Math.min(scaleX, scaleY, this.config.maxZoom)

    // 计算中心位置
    const centerX = contentBounds.x + contentBounds.width / 2
    const centerY = contentBounds.y + contentBounds.height / 2

    // 设置视口
    this.viewport.zoom = zoom
    this.viewport.x = centerX
    this.viewport.y = centerY
  }

  /**
   * 获取可见区域（世界坐标）
   */
  getVisibleBounds(): VisibleBounds {
    return CoordinateTransform.getVisibleBounds(
      this.viewport,
      this.viewportWidth,
      this.viewportHeight
    )
  }

  /**
   * 屏幕坐标转世界坐标
   */
  screenToWorld(screenX: number, screenY: number): Point {
    return CoordinateTransform.screenToWorld(
      screenX,
      screenY,
      this.viewport,
      this.viewportWidth,
      this.viewportHeight
    )
  }

  /**
   * 世界坐标转屏幕坐标
   */
  worldToScreen(worldX: number, worldY: number): Point {
    return CoordinateTransform.worldToScreen(
      worldX,
      worldY,
      this.viewport,
      this.viewportWidth,
      this.viewportHeight
    )
  }
}
