/**
 * 核心层-应用配置中心
 * 功能：统一管理所有应用级别的配置项
 * 服务对象：为整个应用提供统一的配置管理
 */

/**
 * 视口配置
 */
export const VIEWPORT_CONFIG = {
    /** 缩放范围 */
    zoom: {
        min: 0.1,
        max: 4,
        default: 1,
        step: 0.1,
    },
    /** 缩放倍率 */
    zoomFactor: {
        in: 1.2,  // 放大倍率
        out: 0.9, // 缩小倍率（滚轮）
    },
    /** 动画配置 */
    animation: {
        defaultDuration: 300, // 默认动画时长(ms)
        easingPower: 3,       // 缓动函数次方
    },
    /** 适应视图配置 */
    fitToView: {
        defaultPadding: 50,   // 默认边距(px)
    },
} as const

/**
 * 画布配置
 */
export const CANVAS_CONFIG = {
    /** 默认尺寸 */
    size: {
        default: 3000,        // 默认宽高
    },
    /** 坐标转换 */
    transform: {
        divisionFactor: 2,    // 视口中心计算除数
    },
} as const

/**
 * 网格配置
 */
export const GRID_CONFIG = {
    /** 网格尺寸配置（根据缩放级别自适应） */
    sizes: {
        // zoom < 0.25
        verySmall: { small: 80, large: 400 },
        // 0.25 <= zoom < 0.5
        small: { small: 40, large: 200 },
        // zoom >= 0.5
        normal: { small: 20, large: 100 },
    },
    /** 缩放级别阈值 */
    zoomThresholds: {
        verySmall: 0.25,
        small: 0.5,
        showSmallGrid: 0.3,   // 显示小网格的最小缩放级别
    },
    /** 网格颜色 */
    colors: {
        small: '#F1F5F9',
        large: '#E2E8F0',
    },
    /** 网格线宽 */
    strokeWidth: 1,
} as const

/**
 * 小地图配置
 */
export const MINIMAP_CONFIG = {
    /** 默认尺寸 */
    size: {
        defaultWidth: 200,
        defaultHeight: 150,
        minWidth: 150,
        minHeight: 100,
        maxWidth: 400,
        maxHeight: 300,
    },
    /** 折叠状态尺寸 */
    collapsed: {
        size: 40,             // 折叠后的宽高
    },
    /** 定位 */
    position: {
        right: 20,
        bottom: 20,
    },
    /** 层级 */
    zIndex: 1000,
    /** 边界配置 */
    bounds: {
        defaultBounds: { minX: -500, minY: -500, maxX: 500, maxY: 500 },
        padding: 100,         // 内容边距
    },
    /** 网格大小 */
    gridSize: 20,
    /** 动画 */
    transition: {
        duration: '0.3s',     // 折叠动画时长
    },
    /** 折叠按钮 */
    collapseButton: {
        offset: -12,          // 按钮偏移量
        size: 32,             // 按钮尺寸
        borderWidth: 2,       // 边框宽度
    },
} as const

/**
 * 文件上传配置
 */
export const UPLOAD_CONFIG = {
    /** 文件大小限制 */
    maxFileSize: 10 * 1024 * 1024, // 10MB
    /** 允许的文件类型 */
    allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
    ],
    /** 最大尺寸限制 */
    maxDimension: 4096,
} as const

/**
 * 历史记录配置
 */
export const HISTORY_CONFIG = {
    /** 最大历史记录数量 */
    maxSize: 200,
    /** 初始索引 */
    initialIndex: -1,
    /** 批量操作初始深度 */
    initialBatchDepth: 0,
    /** 调用栈行号 */
    stackLineNumber: 3,
} as const

/**
 * 选择配置
 */
export const SELECTION_CONFIG = {
    /** 多选最小数量 */
    multiSelectMinCount: 2,
    /** 首选元素索引 */
    firstElementIndex: 0,
} as const

/**
 * UI 样式配置
 */
export const UI_CONFIG = {
    /** 分割线 */
    divider: {
        width: 1,
        height: 24,
        margin: 8,
    },
    /** 工具栏 */
    toolbar: {
        height: 48,
        padding: 12,
        gap: 8,
        iconSize: 20,
    },
    /** 消息提示 */
    message: {
        defaultDuration: 1500, // 默认显示时长(ms)
    },
    /** 阴影 */
    shadow: {
        small: '0 2px 8px rgba(0, 0, 0, 0.15)',
        medium: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    /** 边框 */
    border: {
        radius: {
            small: 4,
            medium: 8,
            large: 12,
            circle: '50%',
        },
        color: {
            light: '#e0e0e0',
            normal: '#d0d0d0',
        },
    },
} as const

/**
 * 文本编辑器配置
 */
export const TEXT_EDITOR_CONFIG = {
    /** 默认内容 */
    defaultContent: '双击编辑文本',
    /** 占位符 */
    placeholder: '输入文本',
} as const

/**
 * 动画配置
 */
export const ANIMATION_CONFIG = {
    /** 标准动画时长 */
    duration: {
        fast: 150,
        normal: 300,
        slow: 500,
    },
    /** 过渡效果 */
    transition: {
        all: 'all 0.3s ease',
        transform: 'transform 0.3s ease',
        opacity: 'opacity 0.2s ease',
    },
} as const

/**
 * 导出所有配置
 */
export const APP_CONFIG = {
    viewport: VIEWPORT_CONFIG,
    canvas: CANVAS_CONFIG,
    grid: GRID_CONFIG,
    minimap: MINIMAP_CONFIG,
    upload: UPLOAD_CONFIG,
    history: HISTORY_CONFIG,
    selection: SELECTION_CONFIG,
    ui: UI_CONFIG,
    textEditor: TEXT_EDITOR_CONFIG,
    animation: ANIMATION_CONFIG,
} as const

export default APP_CONFIG
