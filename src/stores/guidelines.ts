import { defineStore } from 'pinia'

export const useGuidelinesStore = defineStore('guidelines', {
  state: () => ({
    // 当前显示的辅助线坐标
    verticalLines: [] as number[],
    horizontalLines: [] as number[],
    // 是否启用吸附功能（全局开关）
    isSnapEnabled: true
  }),

  actions: {
    setLines(vertical: number[], horizontal: number[]) {
      this.verticalLines = vertical
      this.horizontalLines = horizontal
    },

    clearLines() {
      this.verticalLines = []
      this.horizontalLines = []
    },
    
    toggleSnap(enabled?: boolean) {
      this.isSnapEnabled = enabled ?? !this.isSnapEnabled
    }
  }
})
