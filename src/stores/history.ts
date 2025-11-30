import { defineStore } from 'pinia'
import type { AnyElement } from '@/cores/types/element'

export interface HistoryRecord {
  before: AnyElement[] | null
  after: AnyElement[] | null
  changedIds: string[]
  desc: string
}

export const useHistoryStore = defineStore('history', {
  state: () => ({
    stack: [] as HistoryRecord[],
    index: -1,
    maxSize: 200,
    batchDepth: 0,
    pendingRecord: null as HistoryRecord | null,
  }),

  actions: {
    /** 自动生成 changedIds */
    getChangedIds(before: AnyElement[] | null, after: AnyElement[] | null): string[] {
      if (!before && after) return after.map(e => e.id)
      if (!after && before) return before.map(e => e.id)
      if (!before || !after) return []

      const beforeMap = new Map(before.map(e => [e.id, e]))
      const changed: string[] = []

      for (const el of after) {
        const prev = beforeMap.get(el.id)
        if (!prev || JSON.stringify(prev) !== JSON.stringify(el)) {
          changed.push(el.id)
        }
      }

      return changed
    },

    /** 自动获取调用 pushSnapshot 的上级方法名称 */
    getCallerMethodName(): string {
      const stack = new Error().stack?.split('\n') || []
      const line = stack[3] || ''
      const match = line.match(/at\s+(\w+)/)
      return match?.[1] || 'unknown'
    },

    /** 推入历史记录（以 diff 形式） */
    pushSnapshot(snapshot: AnyElement[]) {
      const clonedAfter = JSON.parse(JSON.stringify(snapshot))
      const desc = this.getCallerMethodName()

      let before: AnyElement[] | null = null
      if (this.index >= 0 && this.stack[this.index]) {
        // TODO：stack获取为空情况需要解决
        before = JSON.parse(JSON.stringify(this.stack[this.index].after))
      }

      const changedIds = this.getChangedIds(before, clonedAfter)

      const record: HistoryRecord = {
        before,
        after: clonedAfter,
        changedIds,
        desc
      }

      // 批处理中暂存
      if (this.batchDepth > 0) {
        this.pendingRecord = record
        return
      }

      // 截断未来记录
      if (this.index < this.stack.length - 1) {
        this.stack = this.stack.slice(0, this.index + 1)
      }

      // 限制最大数
      if (this.stack.length >= this.maxSize) {
        this.stack.shift()
        this.index--
      }

      this.stack.push(record)
      this.index++
    },

    beginBatch() {
      if (this.batchDepth === 0) this.pendingRecord = null
      this.batchDepth++
    },

    endBatch() {
      if (this.batchDepth <= 0) return
      this.batchDepth--

      if (this.batchDepth === 0 && this.pendingRecord) {
        // 截掉未来记录
        if (this.index < this.stack.length - 1) {
          this.stack = this.stack.slice(0, this.index + 1)
        }

        if (this.stack.length >= this.maxSize) {
          this.stack.shift()
          this.index--
        }

        this.stack.push(this.pendingRecord)
        this.index++
        this.pendingRecord = null
      }
    },

    /** 撤销 */
    undo() {
      // 保证 index - 1 不会越界
      if (this.index <= 0) return null

      const record = this.stack[this.index]
      if (!record) return null  // TS：这里已经保证 record 有类型保护

      this.index--

      return {
        snapshot: record.before ? JSON.parse(JSON.stringify(record.before)) : null,
        changedIds: [...record.changedIds],
        desc: record.desc
      }
    },

    /** 重做 */
    redo() {
      if (this.index >= this.stack.length - 1) return null

      const nextIndex = this.index + 1
      const record = this.stack[nextIndex]
      if (!record) return null

      this.index = nextIndex

      return {
        snapshot: record.after ? JSON.parse(JSON.stringify(record.after)) : null,
        changedIds: [...record.changedIds],
        desc: record.desc
      }
    },

    /** 获取当前快照 */
    getCurrent() {
      if (this.index < 0) return null

      const record = this.stack[this.index]
      if (!record) return null

      return record.after ? JSON.parse(JSON.stringify(record.after)) : null
    },

    /** 清除全部记录 */
    clear() {
      this.stack = []
      this.index = -1
      this.pendingRecord = null
    }
  }
})
