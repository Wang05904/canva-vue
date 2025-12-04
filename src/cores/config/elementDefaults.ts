/**
 * 核心层-元素默认配置
 * 功能：统一管理所有元素类型的默认属性
 * 服务对象：为元素创建提供配置化支持
 */

/**
 * 图形元素默认配置
 */
export const SHAPE_DEFAULTS = {
    rectangle: {
        fillColor: '#4A90E2',
        strokeColor: '#000000',
        strokeWidth: 1,
    },
    circle: {
        fillColor: '#E94B3C',
        strokeColor: '#000000',
        strokeWidth: 1,
    },
    triangle: {
        fillColor: '#34C759',
        strokeColor: '#000000',
        strokeWidth: 1,
    },
    roundedRect: {
        fillColor: '#FF9500',
        strokeColor: '#000000',
        strokeWidth: 1,
        borderRadius: 10,
    },
} as const

/**
 * 文本元素默认配置
 */
export const TEXT_DEFAULTS = {
    fontSize: 16,
    fontFamily: 'Arial',
    color: '#000000',
    content: '双击编辑文本',
    fontWeight: 'normal' as const,
    fontStyle: 'normal' as const,
    textDecoration: 'none' as const,
} as const

/**
 * 图片元素默认配置
 */
export const IMAGE_DEFAULTS = {
    filters: [],
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

/**
 * 元素创建时的默认尺寸
 */
export const DEFAULT_SIZES = {
    rectangle: { width: 100, height: 100 },
    circle: { width: 100, height: 100 },
    triangle: { width: 100, height: 100 },
    roundedRect: { width: 100, height: 100 },
    text: { width: 200, height: 40 },
    image: { width: 200, height: 200 },
} as const
