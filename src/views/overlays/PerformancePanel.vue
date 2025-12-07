<template>
    <Teleport to="body">
        <div v-if="visible" class="performance-panel" :style="panelStyle" @mousedown="startDrag">
            <div class="panel-header" @mousedown.stop="startDrag">
                <span class="panel-title">性能监控</span>
                <div class="panel-actions">
                    <button class="panel-btn" @click="toggleCollapse" title="折叠/展开">
                        {{ collapsed ? '▼' : '▲' }}
                    </button>
                    <button class="panel-btn" @click="refreshData" title="刷新">
                        🔄
                    </button>
                    <button class="panel-btn" @click="visible = false" title="关闭">
                        ✕
                    </button>
                </div>
            </div>

            <div v-show="!collapsed" class="panel-body">
                <!-- FPS 和内存 -->
                <div class="stats-row">
                    <div class="stat-item">
                        <span class="stat-label">FPS</span>
                        <span class="stat-value" :class="getFPSClass(fpsStats.current)">
                            {{ fpsStats.current }}
                        </span>
                    </div>
                    <div class="stat-item" v-if="memoryStats">
                        <span class="stat-label">内存</span>
                        <span class="stat-value">
                            {{ memoryStats.usedJSHeapSize }}MB
                        </span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">指标</span>
                        <span class="stat-value">{{ allStats.length }}</span>
                    </div>
                </div>

                <!-- 性能统计列表 -->
                <div class="stats-list">
                    <div v-if="allStats.length === 0" class="empty-state">
                        暂无数据
                    </div>
                    <div v-for="stat in allStats.slice(0, 8)" :key="stat.name" class="stat-row">
                        <span class="stat-name" :title="stat.name">{{ stat.name }}</span>
                        <span class="stat-count">×{{ stat.count }}</span>
                        <span class="stat-duration" :class="getDurationClass(stat.avgDuration)">
                            {{ stat.avgDuration.toFixed(1) }}ms
                        </span>
                    </div>
                </div>

                <!-- 慢操作警告 -->
                <div v-if="slowOps.length > 0" class="slow-ops">
                    <div class="slow-ops-header">慢操作 ({{ slowOps.length }})</div>
                    <div v-for="op in slowOps.slice(0, 3)" :key="op.startTime" class="slow-op-item">
                        <span class="slow-op-name">{{ op.name }}</span>
                        <span class="slow-op-duration">{{ op.duration?.toFixed(1) }}ms</span>
                    </div>
                </div>

                <!-- 底部操作 -->
                <div class="panel-footer">
                    <button class="footer-btn" @click="clearData">清空</button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { performanceMonitor } from '@/cores/monitoring'
import type { PerformanceStats, FPSStats, MemoryStats, PerformanceMetric } from '@/cores/monitoring'

// 面板状态
const visible = ref(false)
const collapsed = ref(false)
const position = ref({ x: window.innerWidth - 320, y: 80 })
const dragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

// 数据
const allStats = ref<PerformanceStats[]>([])
const fpsStats = ref<FPSStats>({ current: 0, average: 0, min: 0, max: 0, samples: 0 })
const memoryStats = ref<MemoryStats | null>(null)
const slowOps = ref<PerformanceMetric[]>([])

// 样式
const panelStyle = computed(() => ({
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    cursor: dragging.value ? 'move' : 'default'
}))

// 刷新数据
const refreshData = () => {
    const collector = performanceMonitor.getCollector()
    allStats.value = [...collector.getAllStats()].sort((a, b) => b.avgDuration - a.avgDuration)
    fpsStats.value = { ...performanceMonitor.getFPSStats() }
    const memStats = performanceMonitor.getMemoryStats()
    memoryStats.value = memStats ? { ...memStats } : null
    slowOps.value = [...collector.getSlowMetrics(100)]
}

// 清空数据
const clearData = () => {
    if (confirm('确定清空所有性能数据？')) {
        performanceMonitor.getCollector().clear()
        refreshData()
    }
}

// 折叠/展开
const toggleCollapse = () => {
    collapsed.value = !collapsed.value
}

// 拖拽
const startDrag = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('.panel-btn')) return
    
    dragging.value = true
    dragOffset.value = {
        x: e.clientX - position.value.x,
        y: e.clientY - position.value.y
    }

    const handleMove = (e: MouseEvent) => {
        if (!dragging.value) return
        
        const newX = e.clientX - dragOffset.value.x
        const newY = e.clientY - dragOffset.value.y
        
        // 限制在窗口内
        position.value = {
            x: Math.max(0, Math.min(newX, window.innerWidth - 300)),
            y: Math.max(0, Math.min(newY, window.innerHeight - 100))
        }
    }

    const handleUp = () => {
        dragging.value = false
        document.removeEventListener('mousemove', handleMove)
        document.removeEventListener('mouseup', handleUp)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
}

// 样式类
const getFPSClass = (fps: number) => {
    if (fps >= 55) return 'good'
    if (fps >= 30) return 'warning'
    return 'bad'
}

const getDurationClass = (duration: number) => {
    if (duration < 16) return 'good'
    if (duration < 50) return 'warning'
    return 'bad'
}

// 自动刷新
let refreshTimer: number
onMounted(() => {
    refreshData()
    refreshTimer = window.setInterval(refreshData, 1000)
})

onUnmounted(() => {
    if (refreshTimer) {
        clearInterval(refreshTimer)
    }
})

// 暴露给父组件
defineExpose({
    show: () => { visible.value = true },
    hide: () => { visible.value = false },
    toggle: () => { visible.value = !visible.value }
})
</script>

<style scoped>
.performance-panel {
    position: fixed;
    width: 300px;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    z-index: 10000;
    font-size: 12px;
    color: #fff;
    user-select: none;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    cursor: move;
}

.panel-title {
    font-weight: 600;
    font-size: 13px;
}

.panel-actions {
    display: flex;
    gap: 4px;
}

.panel-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #fff;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
}

.panel-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.panel-body {
    padding: 12px;
    max-height: 400px;
    overflow-y: auto;
}

.stats-row {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}

.stat-item {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    padding: 8px;
    border-radius: 6px;
    text-align: center;
}

.stat-label {
    display: block;
    font-size: 10px;
    opacity: 0.6;
    margin-bottom: 4px;
}

.stat-value {
    display: block;
    font-size: 16px;
    font-weight: 600;
}

.stat-value.good {
    color: #52c41a;
}

.stat-value.warning {
    color: #faad14;
}

.stat-value.bad {
    color: #f5222d;
}

.stats-list {
    margin-bottom: 12px;
}

.empty-state {
    text-align: center;
    padding: 20px;
    opacity: 0.5;
}

.stat-row {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    margin-bottom: 4px;
    gap: 8px;
}

.stat-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11px;
}

.stat-count {
    font-size: 10px;
    opacity: 0.6;
}

.stat-duration {
    font-weight: 600;
    font-size: 11px;
    min-width: 45px;
    text-align: right;
}

.stat-duration.good {
    color: #52c41a;
}

.stat-duration.warning {
    color: #faad14;
}

.stat-duration.bad {
    color: #f5222d;
}

.slow-ops {
    background: rgba(245, 34, 45, 0.1);
    border: 1px solid rgba(245, 34, 45, 0.3);
    border-radius: 6px;
    padding: 8px;
    margin-bottom: 12px;
}

.slow-ops-header {
    font-weight: 600;
    margin-bottom: 6px;
    font-size: 11px;
}

.slow-op-item {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 11px;
}

.slow-op-name {
    opacity: 0.8;
}

.slow-op-duration {
    color: #f5222d;
    font-weight: 600;
}

.panel-footer {
    display: flex;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-btn {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #fff;
    padding: 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.2s;
}

.footer-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

/* 滚动条样式 */
.panel-body::-webkit-scrollbar {
    width: 6px;
}

.panel-body::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
}

.panel-body::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
}

.panel-body::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
}
</style>
