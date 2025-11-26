<!--
View层 - 画布容器组件
职责：提供PIXI渲染引擎的容器，负责图形、图片、文本的实际绘制
解决的问题：
1. 为PIXI渲染引擎提供挂载点
2. 管理画布的基础渲染循环
3. 协调子组件的渲染顺序
4. 实现工具预览和元素创建
-->
<template>
  <div ref="container" class="pixi-canvas"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Application, Graphics, FederatedPointerEvent } from 'pixi.js'
import { TransformService } from '@/services/elements/TransformService'
import { useCanvasStore } from '@/stores/canvas'
import { useElementsStore } from '@/stores/elements'
import { useSelectionStore } from '@/stores/selection'
import type { AnyElement } from '@/cores/types/element'

const container = ref<HTMLDivElement | null>(null)
const transformService = new TransformService()
const canvasStore = useCanvasStore()
const elementsStore = useElementsStore()
const selectionStore = useSelectionStore()

// 存储元素ID到graphic的映射
const graphicMap = new Map<string, Graphics>()

// 初始化加载已有元素
elementsStore.loadFromLocal()

onMounted(async () => {
  if (!container.value) return

  // 创建Pixi应用
  const app = new Application()
  await app.init({
    background: '#ffffff',
    resizeTo: container.value,
    antialias: true
  })

  // 将canvas添加到容器
  container.value.appendChild(app.canvas)

  // 启用stage交互
  app.stage.eventMode = 'static'
  app.stage.hitArea = app.screen

  // 预览图形对象
  let previewShape: Graphics | null = null

  // 鼠标移动事件
  app.stage.on('pointermove', (event: FederatedPointerEvent) => {
    const currentTool = canvasStore.currentTool

    // 只在矩形或圆形工具时显示预览
    if (currentTool === 'rectangle' || currentTool === 'circle') {
      // 创建或更新预览图形
      if (!previewShape) {
        previewShape = new Graphics()
        previewShape.alpha = 0.5 // 半透明显示预览
        app.stage.addChild(previewShape)
      }

      // 清除之前的绘制
      previewShape.clear()

      // 获取鼠标位置
      const mouseX = event.global.x
      const mouseY = event.global.y

      // 根据工具类型绘制预览
      if (currentTool === 'rectangle') {
        // 绘制矩形预览（鼠标位置为中心）
        previewShape.rect(-100, -75, 200, 150)
        previewShape.fill('#4A90E2')
        previewShape.x = mouseX
        previewShape.y = mouseY
      } else if (currentTool === 'circle') {
        // 绘制圆形预览（鼠标位置为中心）
        previewShape.circle(0, 0, 75)
        previewShape.fill('#E94B3C')
        previewShape.x = mouseX
        previewShape.y = mouseY
      }
    } else {
      // 非绘制工具时，移除预览
      if (previewShape) {
        app.stage.removeChild(previewShape)
        previewShape.destroy()
        previewShape = null
      }
    }
  })

  // 点击事件 - 创建元素或取消选中
  app.stage.on('pointerdown', (event: FederatedPointerEvent) => {
    const currentTool = canvasStore.currentTool
    const mouseX = event.global.x
    const mouseY = event.global.y

    // 根据当前工具创建元素
    if (currentTool === 'rectangle') {
      createRectangle(app, mouseX, mouseY)
    } else if (currentTool === 'circle') {
      createCircle(app, mouseX, mouseY)
    } else if (currentTool === 'select') {
      // 点击空白区域取消选中
      selectionStore.clearSelection()
    }
  })

  // 渲染已有的元素 （store和view层的渲染接口？？是这个？？）
  renderExistingElements(app)

  // 监听元素变化，重新渲染（深度监听以捕获属性变化）
  watch(() => elementsStore.elements, () => {
    renderExistingElements(app)
  }, { deep: true })

  // 监听选中状态变化，重新渲染
  watch(() => selectionStore.selectedIds, () => {
    renderExistingElements(app)
  })
})

// 创建矩形元素
function createRectangle(app: Application, x: number, y: number) {
  // 保存到store（位置为左上角）
  const id = elementsStore.addShape({
    shapeType:'rectangle',
    x: x - 100, // 调整为左上角坐标
    y: y - 75,
    width: 200,
    height: 150,
    opacity: 1,
    locked: false,
    visible: true,
    zIndex: 0,
    strokeColor: '#000000',
    strokeWidth: 1,
    fillColor: '#4A90E2',
    rotation: 0
  })

  console.log('创建矩形元素:', id)

  // 切换回选择工具
  canvasStore.setTool('select')
}

// 创建圆形元素
function createCircle(app: Application, x: number, y: number) {
  // 保存到store（位置为左上角的外接矩形）
  const id = elementsStore.addShape({
    shapeType:'circle',
    x: x - 75, // 调整为外接矩形左上角
    y: y - 75,
    width: 150,
    height: 150,
    opacity: 1,
    locked: false,
    visible: true,
    zIndex: 0,
    strokeColor: '#000000',
    strokeWidth: 1,
    fillColor: '#E94B3C',
    rotation: 0
  })

  console.log('创建圆形元素:', id)

  // 切换回选择工具
  canvasStore.setTool('select')
}

// 绘制形状到 graphic
function drawShape(graphic: Graphics, element: AnyElement) {
  graphic.clear()
  
  if (element.type === 'shape') {
    if (element.width === element.height) {
      // 圆形
      const radius = element.width / 2
      graphic.circle(radius, radius, radius)
    } else {
      // 矩形
      graphic.rect(0, 0, element.width, element.height)
    }
    graphic.fill(element.fillColor || '#000000')
    
    // 添加边框
    if (element.strokeWidth && element.strokeWidth > 0) {
      graphic.stroke({
        width: element.strokeWidth,
        color: element.strokeColor || '#000000'
      })
    }
  }
}

// 渲染元素
function renderExistingElements(app: Application) {
  // 获取当前所有元素ID
  const currentElementIds = new Set(elementsStore.elements.map(el => el.id))
  
  // 删除不再存在的元素
  graphicMap.forEach((graphic, id) => {
    if (!currentElementIds.has(id)) {
      // 先移除事件监听器，再销毁
      graphic.removeAllListeners()
      app.stage.removeChild(graphic)
      graphic.destroy()
      graphicMap.delete(id)
      console.log('删除元素:', id)
    }
  })
  
  // 渲染或更新元素
  elementsStore.elements.forEach(element => {
    let graphic = graphicMap.get(element.id)
    
    if (graphic) {
      // 已存在，只更新样式和位置
      drawShape(graphic, element)
      graphic.x = element.x
      graphic.y = element.y
      console.log('更新元素:', element.id, 'x:', element.x, 'y:', element.y)
    } else {
      // 不存在，创建新的
      graphic = new Graphics()
      drawShape(graphic, element)
      graphic.x = element.x
      graphic.y = element.y
      
      // 启用交互
      graphic.eventMode = 'static'
      graphic.cursor = 'pointer'
      
      app.stage.addChild(graphic)
      graphicMap.set(element.id, graphic)
      
      console.log('创建新元素:', element.id, 'x:', element.x, 'y:', element.y)
      
      // 点击选中元素
      graphic.on('pointerdown', (event: FederatedPointerEvent) => {
        if (canvasStore.currentTool === 'select') {
          event.stopPropagation()
          selectionStore.selectElement(element.id)
          console.log('选中元素:', element.id)
        }
      })
      
      // 添加拖拽功能（只绑定一次）
      transformService.makeDraggable(
        graphic,
        () => {
          console.log('🎯 开始拖拽:', element.id)
        },
        undefined, // onDragMove
        (x: number, y: number) => {
          // 拖拽结束时更新store
          const oldX = element.x
          const oldY = element.y
          const dx = x - oldX
          const dy = y - oldY
          elementsStore.moveElement(element.id, dx, dy)
          console.log(`✅ 拖拽结束: 从(${oldX}, ${oldY})移动(${dx}, ${dy})到(${x}, ${y})`)
        }
      )
    }
  })
}
</script>

<style scoped>
.pixi-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  overflow: hidden;
}
</style>
