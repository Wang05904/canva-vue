import { defineStore } from 'pinia'
import type { Guideline } from '@/cores/types/geometry'

export const useGuidelinesStore = defineStore('guidelines', {
  state: () => ({
    // 当前显示的辅助线（新版：线段式）
    verticalLines: [] as Guideline[],
    horizontalLines: [] as Guideline[],
    // 是否启用吸附功能（全局开关）
    isSnapEnabled: true
  }),

  actions: {
    setLines(vertical: Guideline[], horizontal: Guideline[]) {
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
