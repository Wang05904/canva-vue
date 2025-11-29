/**
 * 文本编辑器 Composable
 * 功能：管理 Tiptap 编辑器的生命周期和状态
 */
import { ref, onBeforeUnmount } from 'vue'
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import type { TextElement } from '@/cores/types/element'

export function useTextEditor() {
  const editor = ref<Editor | null>(null)
  const isEditing = ref(false)
  const currentElementId = ref<string | null>(null)

  /**
   * 创建编辑器实例
   */
  const createEditor = (element: TextElement, onUpdate: (html: string) => void) => {
    // 如果已有编辑器，先销毁
    if (editor.value) {
      editor.value.destroy()
    }

    // 创建新编辑器
    editor.value = new Editor({
      extensions: [
        StarterKit.configure({
          // 禁用不需要的功能
          heading: {
            levels: [1, 2, 3]
          },
          bulletList: {
            keepMarks: true,
            keepAttributes: false
          },
          orderedList: {
            keepMarks: true,
            keepAttributes: false
          }
        }),
        TextStyle,
        Color
      ],
      content: element.htmlContent || `<p>${element.content}</p>`,
      editable: true,
      autofocus: 'end', // 自动聚焦到末尾
      onUpdate: ({ editor }) => {
        // 实时保存 HTML 内容
        const html = editor.getHTML()
        onUpdate(html)
      },
      editorProps: {
        attributes: {
          class: 'tiptap-editor',
          style: `font-size: ${element.fontSize}px; color: ${element.color}; font-family: ${element.fontFamily};`
        }
      }
    })

    isEditing.value = true
    currentElementId.value = element.id

    return editor.value
  }

  /**
   * 销毁编辑器
   */
  const destroyEditor = () => {
    if (editor.value) {
      editor.value.destroy()
      editor.value = null
    }
    isEditing.value = false
    currentElementId.value = null
  }

  /**
   * 获取纯文本内容
   */
  const getTextContent = (): string => {
    return editor.value?.getText() || ''
  }

  /**
   * 获取 HTML 内容
   */
  const getHtmlContent = (): string => {
    return editor.value?.getHTML() || ''
  }

  /**
   * 应用样式
   */
  const applyStyle = (style: {
    fontSize?: number
    color?: string
    fontFamily?: string
  }) => {
    if (!editor.value) return

    const editorElement = editor.value.view.dom as HTMLElement
    if (style.fontSize) {
      editorElement.style.fontSize = `${style.fontSize}px`
    }
    if (style.color) {
      editorElement.style.color = style.color
    }
    if (style.fontFamily) {
      editorElement.style.fontFamily = style.fontFamily
    }
  }

  // 组件卸载时清理
  onBeforeUnmount(() => {
    destroyEditor()
  })

  return {
    editor,
    isEditing,
    currentElementId,
    createEditor,
    destroyEditor,
    getTextContent,
    getHtmlContent,
    applyStyle
  }
}
