import { defineStore } from 'pinia'
import type { AnyElement } from '@/cores/types/element'

export const useHistoryStore = defineStore('history', {
  state: () => ({
    stack: [] as AnyElement[][],       // 存储 elements 的快照
    index: -1,                // 当前指针
    maxSize: 200,             // 最大历史记录
    batchDepth: 0,            // 批处理深度（>0 时合并快照）
    pendingSnapshot: null as AnyElement[] | null, // 批处理中暂存的初始快照
  }),

  actions: {
    /** 记录快照 */
    pushSnapshot(snapshot: AnyElement[]) {
      // 如果处于批处理阶段，只保留第一次的初始快照（用于撤销恢复到批处理前状态）
      if (this.batchDepth > 0) {
        if (this.pendingSnapshot == null) {
          this.pendingSnapshot = JSON.parse(JSON.stringify(snapshot))
        }
        return
      }

      // 若曾经 undo 过，则需要截断未来记录
      if (this.index < this.stack.length - 1) {
        this.stack = this.stack.slice(0, this.index + 1)
      }

      // 限制最大长度
      if (this.stack.length >= this.maxSize) {
        this.stack.shift()
        this.index--
      }

      this.stack.push(JSON.parse(JSON.stringify(snapshot)))
      this.index++
    },

    /** 开始批处理：合并多次变更为一次历史快照 */
    beginBatch(initialSnapshot?: AnyElement[]) {
      this.batchDepth++
      // 如果传入初始快照，且尚未有 pendingSnapshot，则设置它（用于在 endBatch 时入栈）
      if (initialSnapshot && this.pendingSnapshot == null) {
        this.pendingSnapshot = JSON.parse(JSON.stringify(initialSnapshot))
      }
    },

    /** 结束批处理并提交合并后的快照（如果有） */
    endBatch() {
      if (this.batchDepth <= 0) return
      this.batchDepth--
      if (this.batchDepth === 0 && this.pendingSnapshot != null) {
        // 提交之前保存的初始快照为一个历史记录
        // 若曾经 undo 过，则需要截断未来记录
        if (this.index < this.stack.length - 1) {
          this.stack = this.stack.slice(0, this.index + 1)
        }

        // 限制最大长度
        if (this.stack.length >= this.maxSize) {
          this.stack.shift()
          this.index--
        }

        this.stack.push(JSON.parse(JSON.stringify(this.pendingSnapshot)))
        this.index++
        this.pendingSnapshot = null
      }
    },

    /** 撤销 */
    undo(): AnyElement[] | null {
      if (this.index <= 0) return null
      this.index--
      return JSON.parse(JSON.stringify(this.stack[this.index]))
    },

    /** 重做 */
    redo(): AnyElement[] | null {
      if (this.index >= this.stack.length - 1) return null
      this.index++
      return JSON.parse(JSON.stringify(this.stack[this.index]))
    },

    /** 获取当前快照 */
    getCurrent(): AnyElement[] | null {
      if (this.index < 0) return null
      return JSON.parse(JSON.stringify(this.stack[this.index]))
    },

    /** 清除全部记录 */
    clear() {
      this.stack = []
      this.index = -1
    }
  }
})
