<template>
  <div class="top-toolbar">
    <div class="divider"></div>

    <div class="toolbar-group">
      <button
        class="tool-btn"
        :class="{ active: currentTool === 'select' }"
        @click="setTool('select')"
        title="选择工具 (V)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
          <path d="M13 13l6 6"></path>
        </svg>
      </button>
    </div>

    <div class="toolbar-group">
      <button
        class="tool-btn"
        :class="{ active: currentTool === 'pan' }"
        @click="setTool('pan')"
        title="平移工具 (H) - 或按住空格键拖拽"
      >
        <svg t="1764642909767" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3875" width="30" height="30"><path d="M869.9904 204.8c-18.7392 0-36.0448 5.4272-51.2 14.2336V153.6c0-56.4224-45.8752-102.4-102.4-102.4-21.2992 0-41.0624 6.5536-57.344 17.6128-14.0288-39.936-51.712-68.8128-96.256-68.8128-44.6464 0-82.2272 28.8768-96.256 68.7104-16.384-10.9568-36.1472-17.5104-57.344-17.5104-56.5248 0-102.4 45.9776-102.4 102.4v319.488l-69.9392-120.6272c-17.7152-30.6176-50.7904-49.664-86.3232-49.664-17.408 0-34.6112 4.5056-49.5616 13.312-47.5136 27.4432-63.8976 88.3712-36.352 135.8848l214.528 371.6096v-0.512l27.648 47.9232 15.4624 26.7264c17.6128 30.72 102.912 126.2592 172.3392 126.2592h196.1984c147.2512 0 281.6-202.6496 281.6-335.872V307.2c0-56.4224-45.9776-102.4-102.4-102.4z m51.2 483.328c0 114.9952-121.344 284.672-230.4 284.672H494.592c-38.912 0-111.616-72.2944-128-100.6592l-59.6992-103.5264-198.0416-342.2208c-13.312-23.04-5.3248-52.6336 17.6128-65.9456 7.3728-4.1984 15.5648-6.3488 23.9616-6.3488 17.3056 0 33.3824 9.216 41.984 24.064l114.2784 196.608 3.9936 6.9632c4.5056 7.3728 12.288 12.5952 21.6064 12.5952 14.2336 0 25.6-11.4688 25.6-25.6 0-0.3072-0.1024-0.4096-0.1024-0.6144h0.1024V153.8048c0-28.16 22.9376-51.2 51.2-51.2 28.16 0 51.2 23.04 51.2 51.2v281.6c0 14.1312 11.4688 25.6 25.6 25.6s25.6-11.4688 25.6-25.6V102.4c0-28.16 22.9376-51.2 51.2-51.2 28.16 0 51.2 23.04 51.2 51.2v383.5904c0 0.1024-0.1024 0.2048-0.1024 0.3072 0 14.1312 11.4688 25.6 25.6 25.6s25.6-11.4688 25.6-25.6h0.1024V153.6c0-28.16 22.9376-51.2 51.2-51.2 28.16 0 51.2 23.04 51.2 51.2v384h0.1024c0 14.1312 11.5712 25.6 25.6 25.6 14.1312 0 25.6-11.4688 25.6-25.6 0-0.3072-0.1024-0.6144-0.1024-0.9216V307.2c0-28.16 22.9376-51.2 51.2-51.2 28.16 0 51.2 23.04 51.2 51.2v380.928z" p-id="3876" fill="#2c2c2c"></path></svg>
      </button>
    </div>

    <div class="divider"></div>

    <div class="toolbar-group">
      <button
        class="tool-btn"
        :class="{ active: currentTool === 'rectangle' }"
        @click="setTool('rectangle')"
        title="矩形工具 (R)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        </svg>
      </button>

      <button
        class="tool-btn"
        :class="{ active: currentTool === 'circle' }"
        @click="setTool('circle')"
        title="圆形工具 (O)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
        </svg>
      </button>

      <button
        class="tool-btn"
        :class="{ active: currentTool === 'triangle' }"
        @click="setTool('triangle')"
        title="三角形工具 (T)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12,2 22,22 2,22"></polygon>
        </svg>
      </button>
      <button
        class="tool-btn"
        :class="{ active: currentTool === 'text' }"
        @click="setTool('text')"
        title="文本工具 (T)"
      >
        <svg t="1764240140475" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5065" width="32" height="32"><path d="M429.056 919.552h166.4l-0.512-1.024c-32.768-40.96-50.688-92.16-50.688-144.384V228.352h154.112c44.032 0 87.04 14.848 121.856 42.496l11.776 9.216V154.112s-128 20.48-319.488 20.48-321.024-20.48-321.024-20.48v125.44l8.192-6.656c35.328-28.672 79.36-44.544 124.928-44.544h155.648v545.28c0 52.736-17.92 103.424-50.688 144.384l-0.512 1.536z" fill="#2c2c2c" p-id="5066"></path></svg>
      </button>

      <button
        class="tool-btn"
        @click="handleImageUpload"
        title="上传图片 (I)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="handleFileChange"
      />


    <div class="divider"></div>

    <!-- Undo/Redo group (单击功能，不影响选中状态) -->
    <div class="toolbar-group">
      <button
        class="tool-btn"
        @click="onUndo"
        :disabled="!canUndo"
        :style="{ color: canUndo ? '#2c2c2c' : '#dbdbdb' }"
        title="撤销 (Ctrl/Cmd+Z)"
      >
        <!-- undo SVG -->
        <svg t="1764418665274" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9427" width="32" height="32"><path d="M933.5 670.8c-9.5 0-18.3-5.9-21.7-15.3-56.7-158.9-208.2-265.6-377-265.6-153.2 0-290.7 85.4-358.8 222.8-5.6 11.4-19.4 16.1-30.9 10.4-11.4-5.6-16.1-19.5-10.4-30.9C210.6 439 363.9 343.8 534.8 343.8c188.2 0 357.1 119 420.4 296.2 4.3 12-2 25.2-14 29.4-2.6 0.9-5.2 1.4-7.7 1.4z" fill="currentColor" p-id="9428"></path><path d="M130.8 463.5l148.7 131.7c0.3 0.3 0.2 0.7-0.2 0.8L90.8 659c-0.4 0.1-0.7-0.2-0.6-0.6L130 463.8c0-0.4 0.5-0.5 0.8-0.3z" fill="currentColor" p-id="9429"></path><path d="M94.4 680.7c-6.3 0-12.6-2.3-17.5-6.6-7-6.2-10.2-15.8-8.3-25L106.4 464c1.9-9.2 8.6-16.7 17.4-19.7 8.9-3 18.8-1 25.8 5.3L291 574.9c7 6.2 10.2 15.8 8.3 25-1.9 9.2-8.6 16.7-17.5 19.7l-179.3 59.8c-2.5 0.8-5.3 1.3-8.1 1.3z m50.3-174.1l-24.1 118.1L235 586.6l-90.3-80zM119.1 484z" fill="currentColor" p-id="9430"></path></svg>
      </button>
      <button
        class="tool-btn"
        @click="onRedo"
        :disabled="!canRedo"
        :style="{ color: canRedo ? '#2c2c2c' : '#dbdbdb' }"
        title="重做 (Ctrl/Cmd+Y)"
      >
        <!-- redo SVG -->
        <svg t="1764418710309" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="11262" width="32" height="32"><path d="M86.6 673.1c-2.6 0-5.2-0.4-7.8-1.4-12.1-4.3-18.4-17.6-14.1-29.7 63.8-178.7 234.1-298.7 423.9-298.7 172.3 0 326.9 96 403.5 250.5 5.7 11.5 1 25.4-10.5 31.1-11.5 5.7-25.4 1-31.1-10.5-68.6-138.6-207.3-224.7-361.8-224.7-170.2 0-323 107.7-380.2 267.9-3.4 9.6-12.4 15.5-21.9 15.5z" fill="currentColor" p-id="11263"></path><path d="M896.1 464.1L746.1 597c-0.3 0.3-0.2 0.7 0.2 0.8l190 63.4c0.4 0.1 0.7-0.2 0.6-0.6l-40.1-196.3c0-0.3-0.4-0.5-0.7-0.2z" fill="currentColor" p-id="11264"></path><path d="M932.8 683.1c-2.8 0-5.6-0.4-8.4-1.4l-180.8-60.3c-9-3-15.7-10.6-17.6-19.9-1.9-9.3 1.3-18.9 8.4-25.2L877 449.9c7.1-6.3 17-8.3 26-5.3 9 3 15.7 10.6 17.6 19.9l38.1 186.7c1.9 9.3-1.3 18.9-8.4 25.2-4.8 4.4-11.1 6.7-17.5 6.7zM791 588.3l115.4 38.5L882 507.6l-91 80.7z m116.8-103.6c0 0.1 0 0 0 0z" fill="currentColor" p-id="11265"></path></svg>
      </button>
    </div>

    <div class="divider"></div>

    <!-- 缩放控件 -->
    <div class="toolbar-group zoom-controls">
      <button
        class="tool-btn"
        @click="handleZoomOut"
        title="缩小 (Ctrl/Cmd + -)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="M21 21l-4.35-4.35"></path>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </button>
      
      <button
        class="tool-btn zoom-display"
        @click="handleResetZoom"
        :title="'当前缩放: ' + zoomPercent + '% - 点击重置为100%'"
      >
        <span class="zoom-text">{{ zoomPercent }}%</span>
      </button>
      
      <button
        class="tool-btn"
        @click="handleZoomIn"
        title="放大 (Ctrl/Cmd + +)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="M21 21l-4.35-4.35"></path>
          <line x1="11" y1="8" x2="11" y2="14"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </button>
      
      <button
        class="tool-btn"
        @click="handleFitToView"
        title="适应画布 (Ctrl/Cmd + 0)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"></rect>
          <path d="M9 9h6v6H9z"></path>
        </svg>
      </button>
    </div>

    <div class="divider"></div>

    <!-- 对齐吸附开关 -->
    <div class="toolbar-group">
      <button
        class="tool-btn"
        :class="{ active: isSnapEnabled }"
        @click="toggleSnap"
        :title="isSnapEnabled ? '关闭对齐吸附' : '开启对齐吸附'"
      >
        <svg t="1764687993974" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1618" width="32" height="32"><path d="M537.6512 1024h-51.2v-307.2h-179.2V307.2h409.6v409.6h-179.2v307.2z m-168.96-368.64h286.72V368.64h-286.72z m655.36-117.76h-307.2v-51.2h307.2v51.2z m-716.8 0h-307.2v-51.2h307.2v51.2z m230.4-230.4h-51.2V0h51.2v307.2z" p-id="1619"></path></svg>
      </button>
    </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useCanvasStore, type ToolType } from '@/stores/canvas'
import { useGuidelinesStore } from '@/stores/guidelines'
import { historyService } from '@/services'
import { useElementsStore } from '@/stores/elements'
import { useSelectionStore } from '@/stores/selection'
import type { CanvasService } from '@/services/canvas/CanvasService'

const canvasStore = useCanvasStore()
const guidelinesStore = useGuidelinesStore()
const currentTool = computed(() => canvasStore.currentTool)
const fileInput = ref<HTMLInputElement | null>(null)
const elementsStore = useElementsStore()
const selectionStore = useSelectionStore()

// 对齐吸附开关
const isSnapEnabled = computed(() => guidelinesStore.isSnapEnabled)
const toggleSnap = () => {
  guidelinesStore.toggleSnap()
  Message.info({
    content: guidelinesStore.isSnapEnabled ? '已启用对齐吸附' : '已关闭对齐吸附',
    duration: 1500
  })
}

// 注入 canvasService
const canvasService = inject<CanvasService>('canvasService')

// 配置常量
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const MAX_DIMENSION = 4096 // 最大宽高限制

// 缩放相关
const zoomPercent = computed(() => {
  return Math.round(canvasStore.viewport.zoom * 100)
})

const handleZoomIn = () => {
  if (!canvasService) return
  const viewportService = canvasService.getViewportService()
  const currentZoom = viewportService.getViewport().zoom
  const config = viewportService.getConfig()
  const newZoom = Math.min(currentZoom * 1.2, config.maxZoom)
  viewportService.setZoom(newZoom)
  canvasService.getRenderService().updateViewportTransform()
  canvasStore.updateViewport(viewportService.getViewport())
}

const handleZoomOut = () => {
  if (!canvasService) return
  const viewportService = canvasService.getViewportService()
  const currentZoom = viewportService.getViewport().zoom
  const config = viewportService.getConfig()
  const newZoom = Math.max(currentZoom / 1.2, config.minZoom)
  viewportService.setZoom(newZoom)
  canvasService.getRenderService().updateViewportTransform()
  canvasStore.updateViewport(viewportService.getViewport())
}

const handleResetZoom = () => {
  if (!canvasService) return
  const viewportService = canvasService.getViewportService()
  const config = viewportService.getConfig()
  viewportService.setZoom(config.defaultZoom)
  canvasService.getRenderService().updateViewportTransform()
  canvasStore.updateViewport(viewportService.getViewport())
}

const handleFitToView = () => {
  if (!canvasService) return
  const elements = elementsStore.elements
  if (elements.length === 0) return
  
  // 计算所有元素的边界
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  elements.forEach(el => {
    minX = Math.min(minX, el.x)
    minY = Math.min(minY, el.y)
    maxX = Math.max(maxX, el.x + el.width)
    maxY = Math.max(maxY, el.y + el.height)
  })
  
  const viewportService = canvasService.getViewportService()
  viewportService.fitToView({
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }, 50)
  canvasService.getRenderService().updateViewportTransform()
  canvasStore.updateViewport(viewportService.getViewport())
}

const canUndo = computed(() => historyService.canUndo())
const canRedo = computed(() => historyService.canRedo())

const setTool = (tool: ToolType) => {
  canvasStore.setTool(tool)
  console.log('Tool selected:', tool)
}

const onUndo = () => {
  const result = historyService.undo()
  if (!result) return

  const { changedIds } = result

  // 保存到本地
  elementsStore.saveToLocal()

  // 自动重新选中被变更的元素
  selectionStore.clearSelection()
  if (changedIds?.length) {
    changedIds.forEach(id => selectionStore.addToSelection(id))
  }
}

const onRedo = () => {
  const result = historyService.redo()
  if (!result) return

  const { changedIds } = result

  // 保存到本地
  elementsStore.saveToLocal()

  // 自动重新选中被变更的元素
  selectionStore.clearSelection()
  if (changedIds?.length) {
    changedIds.forEach(id => selectionStore.addToSelection(id))
  }
}

const handleImageUpload = () => {
  fileInput.value?.click()
}

// 压缩图片
const compressImage = (img: HTMLImageElement, maxSize: number = 2000): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    let width = img.width
    let height = img.height

    // 如果图片过大，进行压缩
    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height)
      width = Math.floor(width * ratio)
      height = Math.floor(height * ratio)
    }

    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height)
      // 使用较高质量的JPEG压缩
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    } else {
      resolve(img.src)
    }
  })
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  // 清空input，允许重复上传同一文件
  target.value = ''

  if (!file) return

  // 1. 验证文件类型
  if (!ALLOWED_TYPES.includes(file.type)) {
    Message.error({
      content: '不支持的图片格式！支持的格式：JPEG, PNG, GIF, WebP, SVG',
      duration: 3000
    })
    return
  }

  // 2. 验证文件大小
  if (file.size > MAX_FILE_SIZE) {
    Message.error({
      content: `图片文件过大！当前大小：${(file.size / 1024 / 1024).toFixed(2)}MB，最大限制：${MAX_FILE_SIZE / 1024 / 1024}MB`,
      duration: 3000
    })
    return
  }

  try {
    const reader = new FileReader()

    reader.onload = async (e) => {
      const src = e.target?.result as string

      // 加载图片获取尺寸
      const img = new Image()

      img.onload = async () => {
        // 3. 验证图片尺寸
        if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
          Message.error({
            content: `图片尺寸过大！当前尺寸：${img.width}x${img.height}，最大限制：${MAX_DIMENSION}x${MAX_DIMENSION}`,
            duration: 3000
          })
          return
        }

        // 4. 压缩大图片（超过2000px）
        let finalSrc = src
        if (img.width > 2000 || img.height > 2000) {
          console.log('压缩图片中...')
          finalSrc = await compressImage(img, 2000)
        }

        // 5. 计算画布上的显示尺寸
        const maxWidth = 400
        const maxHeight = 400
        let width = img.width
        let height = img.height

        // 等比缩放到合适的显示尺寸
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }

        // 6. 添加图片元素到画布中心
        elementsStore.addImage({
          src: finalSrc,
          x: 100,
          y: 100,
          width,
          height,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          zIndex: elementsStore.elements.length,
          filters: [],
          naturalWidth: img.width,
          naturalHeight: img.height
        })

        console.log(`图片上传成功：${file.name} (${(file.size / 1024).toFixed(2)}KB)`)
      }

      img.onerror = () => {
        Message.error('图片加载失败，请确认文件是否损坏')
      }

      img.src = src
    }

    reader.onerror = () => {
      Message.error('文件读取失败，请重试')
    }

    reader.readAsDataURL(file)

  } catch (error) {
    console.error('图片上传错误:', error)
    Message.error('图片上传失败，请重试')
  }
}
</script>

<style scoped>
.top-toolbar {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1), 
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  z-index: 100;
  transition: all 0.3s ease;
}

.top-toolbar:hover {
  box-shadow: 
    0 10px 15px -3px rgba(0, 0, 0, 0.1), 
    0 4px 6px -2px rgba(0, 0, 0, 0.05),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  transform: translateX(-50%) translateY(-2px);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.divider {
  width: 1px;
  height: 20px;
  background-color: #e5e7eb;
  margin: 0 4px;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.tool-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
  color: #1f2937;
}

.tool-btn:active:not(:disabled) {
  transform: scale(0.95);
  background-color: #e5e7eb;
}

.tool-btn.active {
  background-color: #eff6ff;
  color: #3b82f6;
}

.tool-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tool-btn svg {
  display: block;
  width: 20px;
  height: 20px;
}

/* 针对不同图标的微调 */
.tool-btn .icon {
  width: 20px;
  height: 20px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 2px;
}

.zoom-display {
  min-width: 64px;
  padding: 0 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.zoom-text {
  font-size: 13px;
  font-weight: 600;
  color: #4b5563;
  font-variant-numeric: tabular-nums;
}

.zoom-display:hover .zoom-text {
  color: #3b82f6;
}

/* 添加工具提示样式 */
.tool-btn[title] {
  position: relative;
}
</style>
