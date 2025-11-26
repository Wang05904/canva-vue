import { defineStore } from 'pinia'
import type { AnyElement,ShapeElement,ImageElement,TextElement,GroupElement } from '@/cores/types/element'
import { LocalStorage } from './persistence/LocalStorage'

const storage = new LocalStorage('elements_')
const STORAGE_KEY = 'list'

export const useElementsStore = defineStore('elements', {
  state: () => ({
    elements: [] as AnyElement[],
  }),

  getters: {
    /**获取所有非组合元素**/
    getAllSingleElements: (state) => {
      return state.elements.filter((el) => !el.parentGroup )
    },
    getElementById: (state) => (id: string) =>
      state.elements.find((el) => el.id === id),
  },

  actions: {
    /** 初始化：从 LocalStorage 读取 */
    loadFromLocal() {
      this.elements = storage.get<AnyElement[]>(STORAGE_KEY, [])
    },

    /** 保存到 LocalStorage */
    saveToLocal() {
      storage.set(STORAGE_KEY, this.elements)
    },

    /** 添加元素 */
    addElement(payload: Omit<AnyElement, 'id'>) {
      // 兼容环境没有 crypto.randomUUID 的场景
      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}_${Math.floor(Math.random() * 100000)}`
      // 根据 payload 的 type 创建不同类型的元素
      let newElement: AnyElement;
      switch (payload.type) {
        case 'shape':
          newElement = {
            ...payload as Omit<ShapeElement, 'id'>,
            id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          } as ShapeElement;
          break;
        case 'image':
          newElement = {
            ...payload as Omit<ImageElement, 'id'>,
            id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          } as ImageElement;
          break;
        case 'text':
          newElement = {
            ...payload as Omit<TextElement, 'id'>,
            id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          } as TextElement;
          break;
        case 'group':
          newElement = {
            ...payload as Omit<GroupElement, 'id'>,
            id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          } as GroupElement;
          break;
        default:
          throw new Error(`Unknown element type: ${payload.type}`);
      }

      this.elements.push(newElement)
      this.saveToLocal()
      return id
    },

    /** 更新元素内容 */
    updateShapeElementProperties(
      elementId: string,
      //从ShapeElement中选出fillcolor,strokeWidth,strokeColor三个属性，Partial表示可选
      updates: Partial<Pick<ShapeElement, 'fillColor' | 'strokeWidth' | 'strokeColor'>>
    ): void {
      const element = this.elements.find(el => el.id === elementId);
      if (!element) return;
      //不用判断类型是否有效，在view层就限制只有图形元素才能编辑这些属性
      //对象合并Object.assign(目标对象, 源对象)
      Object.assign(element, updates)
      element.updatedAt = Date.now()
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

  },
})
