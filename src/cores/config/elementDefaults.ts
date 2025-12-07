/**
 * 核心层-元素默认配置
 * 功能：统一管理所有元素类型的默认属性
 * 服务对象：为元素创建提供配置化支持
 */

/**
 * 通用颜色配置
 */
const COLORS = {
    primary: '#4A90E2',
    danger: '#E94B3C',
    success: '#34C759',
    warning: '#FF9500',
    black: '#000000',
    white: '#FFFFFF',
} as const

/**
 * 通用样式配置
 */
const COMMON_STYLES = {
    strokeColor: COLORS.black,
    strokeWidth: 1,
    borderRadius: 10,
} as const

/**
 * 图形元素默认配置
 */
export const SHAPE_DEFAULTS = {
    rectangle: {
        fillColor: COLORS.primary,
        strokeColor: COMMON_STYLES.strokeColor,
        strokeWidth: COMMON_STYLES.strokeWidth,
    },
    circle: {
        fillColor: COLORS.danger,
        strokeColor: COMMON_STYLES.strokeColor,
        strokeWidth: COMMON_STYLES.strokeWidth,
    },
    triangle: {
        fillColor: COLORS.success,
        strokeColor: COMMON_STYLES.strokeColor,
        strokeWidth: COMMON_STYLES.strokeWidth,
    },
    roundedRect: {
        fillColor: COLORS.warning,
        strokeColor: COMMON_STYLES.strokeColor,
        strokeWidth: COMMON_STYLES.strokeWidth,
        borderRadius: COMMON_STYLES.borderRadius,
    },
} as const

/**
 * 文本元素默认配置
 */
export const TEXT_DEFAULTS = {
    fontSize: 16,
    fontFamily: 'Arial',
    color: COLORS.black,
    content: '双击编辑文本',
    fontWeight: 'normal' as const,
    fontStyle: 'normal' as const,
    textDecoration: 'none' as const,
} as const

/**
 * 所有元素的通用默认配置
 */
export const COMMON_DEFAULTS = {
    opacity: 1,
    locked: false,
    visible: true,
    rotation: 0,
    zIndex: 0,
} as const

