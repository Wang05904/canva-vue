<template>
  <div class="app-container">
    <!-- 左侧编辑器 -->
    <div class="panel editor-panel">
      <div class="panel-header">Tiptap 编辑器</div>
      <div class="toolbar">
        <button @click="editor?.chain().focus().toggleBold().run()" :class="{ active: editor?.isActive('bold') }" title="加粗 (Ctrl+B)">
          <strong>B</strong>
        </button>
        <button @click="editor?.chain().focus().toggleItalic().run()" :class="{ active: editor?.isActive('italic') }" title="斜体 (Ctrl+I)">
          <em>I</em>
        </button>
        <button @click="editor?.chain().focus().setColor('#ef4444').run()" title="红色文字">
          <span style="color: #ef4444;">A</span>
        </button>
      </div>
      <div class="editor-wrapper">
        <EditorContent v-if="editor" :editor="editor" class="tiptap" />
      </div>
    </div>
    
    <!-- 右侧渲染对比 -->
    <div class="render-container">
      <!-- DOM 渲染 -->
      <div class="panel render-panel">
        <div class="panel-header">
          DOM 渲染
        </div>
        <div class="render-wrapper dom-render" v-html="htmlContent"></div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Editor, EditorContent} from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Color } from '@tiptap/extension-color'
const editor = ref<Editor | null>(null)

const htmlContent = computed(() => {
  return editor.value?.getHTML() ?? ''
})

onMounted(() => {
  // 初始化 Tiptap
  editor.value = new Editor({
    extensions: [
      StarterKit,
      Color
    ],
    content: `
      <h2>DOM 渲染</h2>
      <ul>
        <li>选中文字时自动显示</li>
        <li>支持<strong>加粗</strong>、<em>斜体</em>、<s>删除线</s></li>
        <li>支持标题和颜色切换</li>
        <li>点击空白处自动隐藏</li>
      </ul>
    `,
    editable: true,
  })

})

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.app-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100vh;
  gap: 20px;
  padding: 20px;
  background: #f7fafc;
}

.render-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.editor-panel {
  grid-row: 1 / -1;
}

.render-panel {
  flex: 1;
  min-height: 0;
}

.panel-header {
  padding: 12px 20px;
  background: rgb(146, 232, 127);
  color: white;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tag {
  background: rgba(255,255,255,0.2);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.toolbar {
  display: flex;
  gap: 6px;
  padding: 10px 16px;
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.toolbar button {
  padding: 6px 12px;
  border: 1px solid #cbd5e0;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  min-width: 36px;
}

.toolbar button:hover {
  background: #edf2f7;
  border-color: #a0aec0;
  transform: translateY(-1px);
}

.toolbar button.active {
  background: #667eea;
  color: white;
  border-color: #5a67d8;
}

.editor-wrapper {
  flex: 1;
  overflow-y: auto;
}

.tiptap {
  padding: 20px;
  outline: none;
  min-height: 100%;
  font-size: 15px;
  line-height: 1.6;
}

.tiptap :deep(h1) { 
  font-size: 2em; 
  margin: 0.6em 0 0.4em;
  font-weight: 700;
  color: #1a202c;
}

.tiptap :deep(h2) { 
  font-size: 1.5em; 
  margin: 0.5em 0 0.3em;
  font-weight: 600;
  color: #2d3748;
}

.tiptap :deep(p) { 
  margin: 0.5em 0; 
  color: #4a5568;
}

.tiptap :deep(strong) { 
  font-weight: 600;
  color: #2d3748;
}

.tiptap :deep(em) { 
  font-style: italic;
  color: #4299e1;
}

.tiptap :deep(ul), 
.tiptap :deep(ol) { 
  padding-left: 1.5em; 
  margin: 0.5em 0; 
}

.tiptap :deep(li) {
  margin: 0.3em 0;
  color: #4a5568;
}

.tiptap :deep(li strong) {
  color: #2d3748;
}

/* DOM 渲染样式 */
.render-wrapper {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.dom-render {
  padding: 20px;
  background: white;
  font-size: 15px;
  line-height: 1.6;
}

.dom-render :deep(h1) { 
  font-size: 1.8em; 
  margin: 0.6em 0 0.4em;
  font-weight: 700;
  color: #1a202c;
}

.dom-render :deep(h2) { 
  font-size: 1.4em; 
  margin: 0.5em 0 0.3em;
  font-weight: 600;
  color: #2d3748;
}

.dom-render :deep(p) { 
  margin: 0.5em 0; 
  color: #4a5568;
}

.dom-render :deep(strong) { 
  font-weight: 600;
  color: #2d3748;
}

.dom-render :deep(em) { 
  font-style: italic;
  color: #4299e1;
}

.dom-render :deep(ul), 
.dom-render :deep(ol) { 
  padding-left: 1.5em; 
  margin: 0.5em 0; 
}

.dom-render :deep(li) {
  margin: 0.3em 0;
  color: #4a5568;
}
</style>