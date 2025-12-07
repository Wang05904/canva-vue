import { defineStore } from 'pinia'
import type { ViewportState } from '@/cores/types/canvas'

export type ToolType = 'select' | 'pan' | 'rectangle' | 'circle' | 'triangle' | 'text'

export const useCanvasStore = defineStore('canvas', {
  state: () => ({
    width: 0,
    height: 0,
    currentTool: 'select' as ToolType,
    // 视口状态（无限画布）
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    } as ViewportState
  }),

  actions: {
    setTool(tool: ToolType) {
      this.currentTool = tool
    },

    updateViewport(partial: Partial<ViewportState>) {
      this.viewport = { ...this.viewport, ...partial }
    }
  }
})
