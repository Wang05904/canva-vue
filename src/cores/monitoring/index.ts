/**
 * 性能监控模块入口
 */
export { PerformanceMonitor, performanceMonitor } from './PerformanceMonitor'
export { MetricsCollector } from './MetricsCollector'
export * from './types'

// 便捷方法
import { performanceMonitor } from './PerformanceMonitor'

export const startTimer = performanceMonitor.startTimer.bind(performanceMonitor)
export const endTimer = performanceMonitor.endTimer.bind(performanceMonitor)
export const measure = performanceMonitor.measure.bind(performanceMonitor)
export const getFPSStats = performanceMonitor.getFPSStats.bind(performanceMonitor)
export const getMemoryStats = performanceMonitor.getMemoryStats.bind(performanceMonitor)
