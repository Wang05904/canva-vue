import { defineStore } from 'pinia'

export const useSelectionStore = defineStore('selection', {
  state: () => ({
    selectedIds: [] as string[]
  }),

  getters: {
    hasSelection: (state) => state.selectedIds.length > 0,
    selectedId: (state) => state.selectedIds[0] || null
  },

  actions: {
    select(id: string) {
      this.selectedIds = [id]
    },

    deselect() {
      this.selectedIds = []
    },

    isSelected(id: string) {
      return this.selectedIds.includes(id)
    }
  }
})
