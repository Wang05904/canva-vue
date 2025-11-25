import { defineStore } from 'pinia'
import type { Element } from '@/cores/types/element'
import { LocalStorage } from './persistence/LocalStorage'

const storage = new LocalStorage('elements_')
const STORAGE_KEY = 'list'

export const useElementsStore = defineStore('elements', {
  state: () => ({
    elements: [] as Element[],
  }),

  getters: {
    getElementById: (state) => (id: string) =>
      state.elements.find((el) => el.id === id),
  },

  actions: {
    /** 初始化：从 LocalStorage 读取 */
    loadFromLocal() {
      this.elements = storage.get<Element[]>(STORAGE_KEY, [])
    },

    /** 保存到 LocalStorage */
    saveToLocal() {
      storage.set(STORAGE_KEY, this.elements)
    },

    /** 添加元素 */
    addElement(payload: Omit<Element, 'id'>) {
      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}_${Math.floor(Math.random() * 100000)}`
      const newElement: Element = { id, ...payload }

      this.elements.push(newElement)
      this.saveToLocal()
      return id
    },

    /** 更新元素内容 */
    updateElement(id: string, patch: Partial<Element>) {
      const index = this.elements.findIndex((el) => el.id === id)
      if (index === -1) return

      this.elements[index] = { ...this.elements[index], ...patch }
      this.saveToLocal()
    },

    /** 移动元素（相对移动） */
    moveElement(id: string, dx: number, dy: number) {
      const el = this.elements.find((e) => e.id === id)
      if (!el) return

      el.x += dx
      el.y += dy
      this.saveToLocal()
    },

    /** 删除元素 */
    removeElement(id: string) {
      this.elements = this.elements.filter((el) => el.id !== id)
      this.saveToLocal()
    },

    /** 清空所有元素 */
    clear() {
      this.elements = []
      this.saveToLocal()
    },

    // ============ 批量操作方法 ============

    /**
     * 批量移动元素（相对位移）
     * @param ids - 要移动的元素 ID 列表
     * @param dx - X 轴移动距离
     * @param dy - Y 轴移动距离
     */
    moveElements(ids: string[], dx: number, dy: number) {
      ids.forEach((id) => {
        const el = this.elements.find((e) => e.id === id)
        if (el) {
          el.x += dx
          el.y += dy
        }
      })
      this.saveToLocal()
    },

    /**
     * 批量缩放元素
     * @param ids - 要缩放的元素 ID 列表
     * @param scaleX - X 轴缩放倍数
     * @param scaleY - Y 轴缩放倍数
     */
    scaleElements(ids: string[], scaleX: number, scaleY: number) {
      ids.forEach((id) => {
        const el = this.elements.find((e) => e.id === id)
        if (el) {
          el.width *= scaleX
          el.height *= scaleY
        }
      })
      this.saveToLocal()
    },

    /**
     * 批量旋转元素
     * @param ids - 要旋转的元素 ID 列表
     * @param angle - 旋转角度（度数）
     */
    rotateElements(ids: string[], angle: number) {
      ids.forEach((id) => {
        const el = this.elements.find((e) => e.id === id)
        if (el) {
          el.rotation = ((el.rotation || 0) + angle) % 360
        }
      })
      this.saveToLocal()
    },

    /**
     * 批量更新元素属性
     * @param ids - 要更新的元素 ID 列表
     * @param patch - 要应用的属性更新
     */
    updateElements(ids: string[], patch: Partial<Element>) {
      ids.forEach((id) => {
        const index = this.elements.findIndex((el) => el.id === id)
        if (index !== -1) {
          this.elements[index] = { ...this.elements[index], ...patch }
        }
      })
      this.saveToLocal()
    },

    /**
     * 批量删除元素
     * @param ids - 要删除的元素 ID 列表
     */
    removeElements(ids: string[]) {
      this.elements = this.elements.filter((el) => !ids.includes(el.id))
      this.saveToLocal()
    },

    /**
     * 获取元素们的边界框（用于多选时的统一变换）
     * @param ids - 元素 ID 列表
     * @returns 包含 x, y, width, height, centerX, centerY 的边界信息
     */
    getBoundingBox(ids: string[]) {
      const matchingElements = this.elements.filter((el) =>
        ids.includes(el.id)
      )

      if (matchingElements.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0, centerX: 0, centerY: 0 }
      }

      const minX = Math.min(...matchingElements.map((el) => el.x))
      const minY = Math.min(...matchingElements.map((el) => el.y))
      const maxX = Math.max((el) => el.x + el.width)
      const maxY = Math.max(...matchingElements.map((el) => el.y + el.height))

      const width = maxX - minX
      const height = maxY - minY

      return {
        x: minX,
        y: minY,
        width,
        height,
        centerX: minX + width / 2,
        centerY: minY + height / 2,
      }
    },
  },
})
