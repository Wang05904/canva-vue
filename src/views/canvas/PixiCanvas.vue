<!-- 
View层 - 画布容器组件
职责：提供PIXI渲染引擎的容器，负责图形、图片、文本的实际绘制
解决的问题：
1. 为PIXI渲染引擎提供挂载点
2. 管理画布的基础渲染循环
3. 协调子组件的渲染顺序
-->
<template>
  <div ref="container" class="pixi-canvas"></div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Application, Graphics } from 'pixi.js'
import { TransformService } from '@/services/elements/TransformService'

const container = ref<HTMLDivElement | null>(null)
const transformService = new TransformService()

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
  // 设置画布能的点击区域为整个屏幕大小，确保能够接收交互事件
  app.stage.hitArea = app.screen

  // 创建矩形（写死）
  // todo（这里要调用sevice创建？然后保存到sotre？）
  const rectangle = new Graphics()
  rectangle.rect(0, 0, 200, 150)
  rectangle.fill('#3498db')
  rectangle.x = 100
  rectangle.y = 100
  rectangle.zIndex = 1

  // 创建圆形
  const circle = new Graphics()
  circle.circle(0, 0, 75)
  circle.fill('#ff0000')
  circle.x = 400
  circle.y = 300

  // 添加到画布
  app.stage.addChild(rectangle)
  app.stage.addChild(circle)

  // 使用TransformService添加拖拽功能（在添加到stage之后）
  transformService.makeDraggable(rectangle)
  transformService.makeDraggable(circle)
})
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
