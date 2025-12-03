<!--
  文本编辑工具栏
  功能：提供富文本编辑工具（加粗、斜体、颜色等）
-->
<template>
  <div
    v-if="editor && isEditing"
    class="text-toolbar"
    :style="toolbarStyle"
    @mousedown.stop
    @click.stop
  >
    <!-- 文本格式 -->
    <div class="toolbar-group">
      <button
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ active: editor.isActive('bold') }"
        class="toolbar-btn"
        title="加粗 (Ctrl+B)"
      >
        <strong>B</strong>
      </button>
      <button
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ active: editor.isActive('italic') }"
        class="toolbar-btn"
        title="斜体 (Ctrl+I)"
      >
        <em>I</em>
      </button>
      <button
        @click="editor.chain().focus().toggleStrike().run()"
        :class="{ active: editor.isActive('strike') }"
        class="toolbar-btn"
        title="删除线"
      >
        <s>S</s>
      </button>
      <button
        @click="editor.chain().focus().toggleUnderline().run()"
        :class="{ active: editor.isActive('underline') }"
        class="toolbar-btn"
        title="下划线 (Ctrl+U)"
      >
        <u>U</u>
      </button>
    </div>

    <div class="divider"></div>

    <!-- 标题 -->
    <div class="toolbar-group">
      <button
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        :class="{ active: editor.isActive('heading', { level: 1 }) }"
        class="toolbar-btn"
        title="标题 1"
      >
        H1
      </button>
      <button
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ active: editor.isActive('heading', { level: 2 }) }"
        class="toolbar-btn"
        title="标题 2"
      >
        H2
      </button>
      <button
        @click="editor.chain().focus().setParagraph().run()"
        :class="{ active: editor.isActive('paragraph') }"
        class="toolbar-btn"
        title="正文"
      >
        P
      </button>
    </div>

    <div class="divider"></div>

    <!-- 列表 -->
    <div class="toolbar-group">
      <button
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ active: editor.isActive('bulletList') }"
        class="toolbar-btn"
        title="无序列表"
      >
        •
      </button>
      <button
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ active: editor.isActive('orderedList') }"
        class="toolbar-btn"
        title="有序列表"
      >
        1.
      </button>
    </div>

    <div class="divider"></div>

    <!-- 文字颜色 -->
    <div class="toolbar-group">
      <a-popover 
        v-model:popup-visible="textColorVisible"
        trigger="click" 
        position="bottom"
        :popup-container="undefined"
      >
        <button class="toolbar-btn" title="文字颜色" @click="bgColorVisible = false">
          <span class="text-icon" :style="{ color: editor.getAttributes('textStyle').color || '#000000' }">A</span>
          <span class="arrow-icon">▼</span>
        </button>
        <template #content>
          <div class="color-grid" @click.stop @mousedown.stop>
            <button
              v-for="color in colors"
              :key="color"
              @click.stop="editor.chain().focus().setColor(color).run()"
              @mousedown.stop
              class="color-item"
              :class="{ active: editor.isActive('textStyle', { color }) }"
              :title="color"
            >
              <span class="color-dot" :style="{ backgroundColor: color }"></span>
            </button>
            <button
              @click.stop="editor.chain().focus().unsetColor().run()"
              @mousedown.stop
              class="color-item remove-color"
              title="清除颜色"
            >
              ✕
            </button>
          </div>
        </template>
      </a-popover>
    </div>

    <div class="divider"></div>

    <!-- 背景颜色 -->
    <div class="toolbar-group">
      <a-popover 
        v-model:popup-visible="bgColorVisible"
        trigger="click" 
        position="bottom"
        :popup-container="undefined"
      >
        <button class="toolbar-btn" title="背景颜色" @click="textColorVisible = false">
          <span class="bg-icon" :style="{ backgroundColor: editor.getAttributes('highlight').color || 'transparent' }"></span>
          <span class="arrow-icon">▼</span>
        </button>
        <template #content>
          <div class="color-grid" @click.stop @mousedown.stop>
            <button
              v-for="bgColor in bgColors"
              :key="bgColor"
              @click.stop="editor.chain().focus().toggleHighlight({ color: bgColor }).run()"
              @mousedown.stop
              class="color-item"
              :class="{ active: editor.isActive('highlight', { color: bgColor }) }"
              :title="bgColor"
            >
              <span class="color-dot" :style="{ backgroundColor: bgColor }"></span>
            </button>
            <button
              @click.stop="editor.chain().focus().unsetHighlight().run()"
              @mousedown.stop
              class="color-item remove-color"
              title="清除背景"
            >
              ✕
            </button>
          </div>
        </template>
      </a-popover>
    </div>

    <div class="divider"></div>

    <!-- 清除格式 -->
    <div class="toolbar-group">
      <button
        @click="editor.chain().focus().unsetAllMarks().run()"
        class="toolbar-btn"
        title="清除格式"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCanvasStore } from '@/stores/canvas'

const props = defineProps<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: any 
  isEditing: boolean
  elementX: number
  elementY: number
  elementWidth: number
}>()

const canvasStore = useCanvasStore()

// Popover 可见性控制
const textColorVisible = ref(false)
const bgColorVisible = ref(false)

// 预设颜色
const colors = ['#000000', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']

// 背景颜色
const bgColors = ['#fef3c7', '#fecaca', '#fed7aa', '#bbf7d0', '#bfdbfe', '#ddd6fe', '#fbcfe8']

// 将世界坐标转换为屏幕坐标
const worldToScreen = (worldX: number, worldY: number) => {
  const viewport = canvasStore.viewport
  const canvasWidth = window.innerWidth
  const canvasHeight = window.innerHeight
  
  const screenX = (worldX * viewport.zoom) + (canvasWidth / 2 - viewport.x * viewport.zoom)
  const screenY = (worldY * viewport.zoom) + (canvasHeight / 2 - viewport.y * viewport.zoom)
  
  return { x: screenX, y: screenY }
}

// 工具栏位置（显示在元素上方）
const toolbarStyle = computed(() => {
  const padding = 8
  const toolbarHeight = 40
  
  // 转换为屏幕坐标
  const screenPos = worldToScreen(props.elementX, props.elementY)

  return {
    position: 'absolute' as const,
    left: `${screenPos.x}px`,
    top: `${screenPos.y - toolbarHeight - padding}px`,
    zIndex: 10001 // 确保在 TextEditor 之上
  }
})
</script>

<style scoped>
.text-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.1);
  user-select: none;
}

.toolbar-group {
  display: flex;
  gap: 2px;
}

.divider {
  width: 1px;
  height: 24px;
  background-color: #e0e0e0;
  margin: 0 4px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: #333;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: #f0f0f0;
}

.toolbar-btn.active {
  background: #4A90E2;
  color: white;
}

.color-btn {
  min-width: 28px;
  padding: 4px;
}

.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.text-icon {
  font-weight: bold;
  font-size: 16px;
  line-height: 1;
}

.bg-icon {
  width: 16px;
  height: 16px;
  border: 1px solid #ddd;
  border-radius: 2px;
}

.arrow-icon {
  font-size: 10px;
  margin-left: 2px;
  color: #666;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 4px;
}

.color-item {
  width: 24px;
  height: 24px;
  padding: 2px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-item:hover {
  background-color: #f0f0f0;
}

.color-item.active {
  background-color: #e6f7ff;
  border-color: #1890ff;
}

.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  border: 1px solid rgba(0,0,0,0.1);
}

.remove-color {
  font-size: 14px;
  color: #666;
}

.toolbar-label {
  font-size: 12px;
  color: #666;
  margin-right: 4px;
  white-space: nowrap;
}
</style>
