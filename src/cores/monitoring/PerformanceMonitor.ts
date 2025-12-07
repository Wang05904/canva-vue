/**
 * 性能监控器
 * 提供性能指标收集、FPS监控、内存监控等功能
 */
import { MetricsCollector } from './MetricsCollector'
import type {
    MonitorConfig,
    PerformanceMetric,
    MetricType,
    FPSStats,
    MemoryStats
} from './types'

export class PerformanceMonitor {
    private static instance: PerformanceMonitor
    private config: MonitorConfig
    private collector: MetricsCollector
    private timers = new Map<string, number>()
    private fpsData: number[] = []
    private lastFrameTime = 0
    private rafId?: number

    private constructor() {
        this.config = {
            enabled: import.meta.env.DEV, // 默认仅在开发环境启用
            consoleLog: false,
            sampleRate: 1.0,
            slowThreshold: 100,
            maxMetrics: 1000
        }
        this.collector = new MetricsCollector(this.config.maxMetrics, false)
    }

    /**
     * 获取单例实例
     */
    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor()
        }
        return PerformanceMonitor.instance
    }

    /**
     * 初始化监控器
     */
    init(config?: Partial<MonitorConfig>): void {
        if (config) {
            this.config = { ...this.config, ...config }
        }

        if (!this.config.enabled) {
            return
        }

        // 开始 FPS 监控
        this.startFPSMonitoring()

        console.log('性能监控已启用', this.config)
    }

    /**
     * 开始 FPS 监控
     */
    private startFPSMonitoring(): void {
        const measureFPS = (timestamp: number) => {
            if (this.lastFrameTime) {
                const delta = timestamp - this.lastFrameTime
                const fps = 1000 / delta
                this.fpsData.push(fps)

                // 保持最近 60 帧的数据
                if (this.fpsData.length > 60) {
                    this.fpsData.shift()
                }
            }

            this.lastFrameTime = timestamp
            this.rafId = requestAnimationFrame(measureFPS)
        }

        this.rafId = requestAnimationFrame(measureFPS)
    }

    /**
     * 开始计时
     */
    startTimer(name: string): void {
        if (!this.config.enabled || !this.shouldSample()) {
            return
        }

        const startTime = performance.now()
        this.timers.set(name, startTime)

        if (this.config.consoleLog) {
            console.time(name)
        }
    }

    /**
     * 结束计时并记录
     */
    endTimer(name: string, type: MetricType = 'custom' as MetricType, metadata?: Record<string, unknown>): number | undefined {
        if (!this.config.enabled || !this.timers.has(name)) {
            return
        }

        const startTime = this.timers.get(name)!
        const endTime = performance.now()
        const duration = endTime - startTime

        this.timers.delete(name)

        if (this.config.consoleLog) {
            console.timeEnd(name)
        }

        // 记录指标
        const metric: PerformanceMetric = {
            name,
            type,
            startTime,
            endTime,
            duration,
            metadata
        }

        this.collector.recordMetric(metric)

        // 如果是慢操作，输出警告
        if (duration > this.config.slowThreshold) {
            console.warn(`⚠️ 慢操作检测: ${name} 耗时 ${duration.toFixed(2)}ms`, metadata)
        }

        return duration
    }

    /**
     * 记录一次性指标
     */
    mark(name: string, type: MetricType = 'custom' as MetricType, duration?: number, metadata?: Record<string, unknown>): void {
        if (!this.config.enabled || !this.shouldSample()) {
            return
        }

        const metric: PerformanceMetric = {
            name,
            type,
            startTime: performance.now(),
            duration,
            metadata
        }

        this.collector.recordMetric(metric)
    }

    /**
     * 测量函数执行时间
     */
    async measure<T>(
        name: string,
        fn: () => T | Promise<T>,
        type: MetricType = 'custom' as MetricType,
        metadata?: Record<string, unknown>
    ): Promise<T> {
        if (!this.config.enabled) {
            return fn()
        }

        this.startTimer(name)
        try {
            const result = await fn()
            this.endTimer(name, type, metadata)
            return result
        } catch (error) {
            this.endTimer(name, type, { ...metadata, error: true })
            throw error
        }
    }

    /**
     * 获取 FPS 统计
     */
    getFPSStats(): FPSStats {
        if (this.fpsData.length === 0) {
            return {
                current: 0,
                average: 0,
                min: 0,
                max: 0,
                samples: 0
            }
        }

        const current = this.fpsData[this.fpsData.length - 1] || 0
        const sum = this.fpsData.reduce((a, b) => a + b, 0)
        const average = sum / this.fpsData.length

        return {
            current: Math.round(current),
            average: Math.round(average),
            min: Math.round(Math.min(...this.fpsData)),
            max: Math.round(Math.max(...this.fpsData)),
            samples: this.fpsData.length
        }
    }

    /**
     * 获取内存统计
     */
    getMemoryStats(): MemoryStats | null {
        // @ts-expect-error - performance.memory 是非标准 API
        const memory = performance.memory
        if (!memory) {
            return null
        }

        const usedJSHeapSize = memory.usedJSHeapSize / 1048576 // 转换为 MB
        const totalJSHeapSize = memory.totalJSHeapSize / 1048576
        const jsHeapSizeLimit = memory.jsHeapSizeLimit / 1048576

        return {
            usedJSHeapSize: Number(usedJSHeapSize.toFixed(2)),
            totalJSHeapSize: Number(totalJSHeapSize.toFixed(2)),
            jsHeapSizeLimit: Number(jsHeapSizeLimit.toFixed(2)),
            usagePercent: Number(((usedJSHeapSize / jsHeapSizeLimit) * 100).toFixed(2))
        }
    }

    /**
     * 获取收集器
     */
    getCollector(): MetricsCollector {
        return this.collector
    }

    /**
     * 是否采样
     */
    private shouldSample(): boolean {
        return Math.random() < this.config.sampleRate
    }
}

// 导出单例
export const performanceMonitor = PerformanceMonitor.getInstance()
