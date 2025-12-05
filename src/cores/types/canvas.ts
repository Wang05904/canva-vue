/**
 * 核心层-画布类型定义
 * 功能：定义画布配置的类型规范
 * 服务对象：为整个项目的画布配置提供统一的类型支持
 */

/**
 * 矩形区域
 */
export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 视口状态
 * 描述无限画布中的相机视图
 */
export interface ViewportState {
  /** 相机在世界坐标中的位置（中心点） */
  x: number
  y: number
  /** 缩放级别 (0.1 ~ 10) */
  zoom: number
}

/**
 * 视口配置
 */
export interface ViewportConfig {
  /** 最小缩放 */
  minZoom: number
  /** 最大缩放 */
  maxZoom: number
  /** 默认缩放 */
  defaultZoom: number
  /** 缩放步长 */
  zoomStep: number
}

/**
 * 可见区域（世界坐标）
 */
export interface VisibleBounds extends Rectangle {
  /** 左边界 */
  left: number
  /** 右边界 */
  right: number
  /** 上边界 */
  top: number
  /** 下边界 */
  bottom: number
}
