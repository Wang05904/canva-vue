import { defineStore } from 'pinia'

export type ToolType = 'select' | 'rectangle' | 'circle' | 'triangle' | 'text'

export const useCanvasStore = defineStore('canvas', {
  state: () => ({
    width: 0,
    height: 0,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    currentTool: 'select' as ToolType
  }),

  actions: {
    setTool(tool: ToolType) {
      this.currentTool = tool
    }
  }
})
