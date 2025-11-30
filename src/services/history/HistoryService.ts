import type { AnyElement } from '@/cores/types/element'
import { useHistoryStore } from '@/stores/history'
import { useElementsStore } from '@/stores/elements'

/**
 * Service层-历史服务
 * 功能：处理历史记录管理（操作记录、撤销、重做等）
 * 服务对象：为Composables层提供历史操作支持
 */
export class HistoryService {
  private get store() {
    return useHistoryStore()
  }

  private get elementsStore() {
    return useElementsStore()
  }

  constructor() {}

  pushSnapshot(snapshot: AnyElement[]) {
    this.store.pushSnapshot(snapshot)
  }

  beginBatch() {
    this.store.beginBatch()
  }

  endBatch() {
    this.store.endBatch()
  }

  undo() {
    const result = this.store.undo()
    if (result && result.snapshot) {
      // 使用history中的snapshot更新elementsStore的状态
      this.elementsStore.elements = result.snapshot
    }
    return result
  }

  redo() {
    const result = this.store.redo()
    if (result && result.snapshot) {
      // 使用history中的snapshot更新elementsStore的状态
      this.elementsStore.elements = result.snapshot
    }
    return result
  }

  getCurrent() {
    return this.store.getCurrent()
  }

  clear() {
    this.store.clear()
  }

  canUndo() {
    return this.store.index > 0
  }

  canRedo() {
    return this.store.index < this.store.stack.length - 1
  }
}

export const historyService = new HistoryService()
export default historyService
