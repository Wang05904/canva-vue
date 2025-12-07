/**
 * 性能指标收集器
 */
import type { PerformanceMetric, PerformanceStats } from './types'

export class MetricsCollector {
    private metrics: PerformanceMetric[] = []
    private stats = new Map<string, PerformanceStats>()
    private maxMetrics: number
    private persistKey = '__performance_stats__'
    private enablePersist: boolean

    constructor(maxMetrics = 1000, enablePersist = true) {
        this.maxMetrics = maxMetrics
        this.enablePersist = enablePersist

        // 从 localStorage 恢复数据
        if (this.enablePersist) {
            this.loadFromStorage()
        }
    }

    /**
     * 记录指标
     */
    recordMetric(metric: PerformanceMetric): void {
        // 添加到指标列表
        this.metrics.push(metric)

        // 限制指标数量
        if (this.metrics.length > this.maxMetrics) {
            this.metrics.shift()
        }

        // 更新统计数据
        if (metric.duration !== undefined) {
            this.updateStats(metric.name, metric.duration)
        }

        // 持久化到 localStorage
        if (this.enablePersist) {
            this.saveToStorage()
        }
    }

    /**
     * 更新统计数据
     */
    private updateStats(name: string, duration: number): void {
        const existing = this.stats.get(name)

        if (existing) {
            existing.count++
            existing.totalDuration += duration
            existing.avgDuration = existing.totalDuration / existing.count
            existing.minDuration = Math.min(existing.minDuration, duration)
            existing.maxDuration = Math.max(existing.maxDuration, duration)
            existing.lastDuration = duration
            existing.lastUpdate = Date.now()
        } else {
            this.stats.set(name, {
                name,
                count: 1,
                totalDuration: duration,
                avgDuration: duration,
                minDuration: duration,
                maxDuration: duration,
                lastDuration: duration,
                lastUpdate: Date.now()
            })
        }
    }

    /**
     * 获取所有统计数据
     */
    getAllStats(): PerformanceStats[] {
        return Array.from(this.stats.values())
    }

    /**
     * 获取慢操作
     */
    getSlowMetrics(threshold: number): PerformanceMetric[] {
        return this.metrics.filter(m => m.duration && m.duration > threshold)
    }

    /**
     * 清空数据
     */
    clear(): void {
        this.metrics = []
        this.stats.clear()

        // 清空 localStorage
        if (this.enablePersist) {
            localStorage.removeItem(this.persistKey)
        }
    }

    /**
     * 保存到 localStorage
     */
    private saveToStorage(): void {
        try {
            const data = {
                stats: Array.from(this.stats.entries()),
                timestamp: Date.now()
            }
            localStorage.setItem(this.persistKey, JSON.stringify(data))
        } catch (e) {
            console.warn('保存性能数据失败:', e)
        }
    }

    /**
     * 从 localStorage 加载
     */
    private loadFromStorage(): void {
        try {
            const raw = localStorage.getItem(this.persistKey)
            if (!raw) return

            const data = JSON.parse(raw)

            // 检查数据是否过期（超过 1 小时）
            const now = Date.now()
            if (data.timestamp && now - data.timestamp > 3600000) {
                localStorage.removeItem(this.persistKey)
                return
            }

            // 恢复统计数据
            if (data.stats && Array.isArray(data.stats)) {
                this.stats = new Map(data.stats)
            }
        } catch (e) {
            console.warn('加载性能数据失败:', e)
        }
    }
}
