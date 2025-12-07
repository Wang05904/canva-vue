/**
 * 性能监控类型定义
 */

/**
 * 性能指标类型
 */
export enum MetricType {
    /** 渲染性能 */
    RENDER = 'render',
    /** 交互性能 */
    INTERACTION = 'interaction',
    /** 元素操作 */
    ELEMENT_OPERATION = 'element_operation',
    /** 网络请求 */
    NETWORK = 'network',
    /** 内存使用 */
    MEMORY = 'memory',
    /** 自定义指标 */
    CUSTOM = 'custom'
}

/**
 * 性能指标数据
 */
export interface PerformanceMetric {
    /** 指标名称 */
    name: string
    /** 指标类型 */
    type: MetricType
    /** 持续时间（毫秒） */
    duration?: number
    /** 开始时间戳 */
    startTime: number
    /** 结束时间戳 */
    endTime?: number
    /** 附加数据 */
    metadata?: Record<string, unknown>
    /** 标签 */
    tags?: string[]
}

/**
 * 性能统计数据
 */
export interface PerformanceStats {
    /** 指标名称 */
    name: string
    /** 调用次数 */
    count: number
    /** 总耗时 */
    totalDuration: number
    /** 平均耗时 */
    avgDuration: number
    /** 最小耗时 */
    minDuration: number
    /** 最大耗时 */
    maxDuration: number
    /** 最近一次耗时 */
    lastDuration: number
    /** 最近更新时间 */
    lastUpdate: number
}

/**
 * FPS 统计
 */
export interface FPSStats {
    /** 当前 FPS */
    current: number
    /** 平均 FPS */
    average: number
    /** 最小 FPS */
    min: number
    /** 最大 FPS */
    max: number
    /** 采样数量 */
    samples: number
}

/**
 * 内存统计
 */
export interface MemoryStats {
    /** 已使用堆内存（MB） */
    usedJSHeapSize: number
    /** 总堆内存（MB） */
    totalJSHeapSize: number
    /** 堆内存限制（MB） */
    jsHeapSizeLimit: number
    /** 使用率（%） */
    usagePercent: number
}

/**
 * 监控配置
 */
export interface MonitorConfig {
    /** 是否启用 */
    enabled: boolean
    /** 是否在控制台输出 */
    consoleLog: boolean
    /** 采样率（0-1） */
    sampleRate: number
    /** 慢操作阈值（毫秒） */
    slowThreshold: number
    /** 最大存储指标数量 */
    maxMetrics: number
}
