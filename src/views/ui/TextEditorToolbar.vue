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

    <!-- 颜色 -->
    <div class="toolbar-group">
      <button
        v-for="color in colors"
        :key="color"
        @click="editor.chain().focus().setColor(color).run()"
        class="toolbar-btn color-btn"
        :title="`设置颜色: ${color}`"
      >
        <span class="color-preview" :style="{ backgroundColor: color }"></span>
      </button>
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
import { computed } from 'vue'

const props = defineProps<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: any 
  isEditing: boolean
  elementX: number
  elementY: number
  elementWidth: number
}>()

// 预设颜色
const colors = ['#000000', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']

// 工具栏位置（显示在元素上方）
const toolbarStyle = computed(() => {
  const padding = 8
  const toolbarHeight = 40

  return {
    position: 'absolute' as const,
    left: `${props.elementX}px`,
    top: `${props.elementY - toolbarHeight - padding}px`,
    zIndex: 1001
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
</style>
