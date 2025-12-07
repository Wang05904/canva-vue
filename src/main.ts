console.time('打开页面到渲染完成用时：')
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
import App from './App.vue'
import router from './router'
import { performanceMonitor, MetricType } from '@/cores/monitoring'

// 初始化性能监控
performanceMonitor.init({
    enabled: import.meta.env.DEV,
    consoleLog: false,
    sampleRate: 1.0,
    slowThreshold: 100,
    maxMetrics: 1000
})

// 监控应用初始化
performanceMonitor.startTimer('app-init')

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ArcoVue)

app.mount('#app')

performanceMonitor.endTimer('app-init', MetricType.RENDER)
