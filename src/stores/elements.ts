import { defineStore } from 'pinia'
import type { AnyElement,ShapeElement,ImageElement,TextElement,GroupElement } from '@/cores/types/element'
import { LocalStorage } from './persistence/LocalStorage'
import { useHistoryStore } from './history'

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
    /** 记录当前快照 */
    recordSnapshot() {
      const history = useHistoryStore()
      history.pushSnapshot(JSON.parse(JSON.stringify(this.elements)))
    },

    /** 初始化：从 LocalStorage 读取 */
    loadFromLocal() {
      this.elements = storage.get<AnyElement[]>(STORAGE_KEY, [])
      // 将当前加载的状态作为初始快照推入历史，确保刷新后首次操作可被撤销
      try {
        const history = useHistoryStore()
        if (history.index === -1) {
          history.pushSnapshot(JSON.parse(JSON.stringify(this.elements)))
        }
      } catch {
        // 在某些环境中 useHistoryStore 可能不可用，忽略错误以保证兼容性
        // 保留原行为
      }
    },

    /** 保存到 LocalStorage */
    saveToLocal() {
      storage.set(STORAGE_KEY, this.elements)
    },
    /** 生成唯一ID */
    generateId(): string {
      return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    },
    /** 添加元素 */
    addShape(payload: Omit<ShapeElement, 'id'| 'type'|'createdAt'| 'updatedAt'>): string {
      const id = this.generateId();
      const newElement: ShapeElement = {
        ...payload,
        id,
        type: 'shape',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.elements.push(newElement);
      this.recordSnapshot()
      this.saveToLocal();
      return id;
    },
    // 创建图像元素
    addImage(payload: Omit<ImageElement, 'id'| 'type'|'createdAt'| 'updatedAt'>): string {
      const id = this.generateId();
      const newElement: ImageElement = {
        ...payload,
        id,
        type: 'image',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.elements.push(newElement);
      this.recordSnapshot()
      this.saveToLocal();
      return id;
    },
    // 创建文本元素
    addText(payload: Omit<TextElement, 'id'| 'type'|'createdAt'| 'updatedAt'>): string {
      const id = this.generateId();
      const newElement: TextElement = {
        ...payload,
        id,
        type: 'text',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.elements.push(newElement);
      this.recordSnapshot()
      this.saveToLocal();
      return id;
    },
    // 创建组合元素
    addGroup(payload: Omit<GroupElement, 'id'| 'type'|'createdAt'| 'updatedAt'>): string {
      const id = this.generateId();
      const newElement: GroupElement = {
        ...payload,
        id,
        type: 'group',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.elements.push(newElement);
      this.recordSnapshot()
      this.saveToLocal();
      return id;
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
      this.recordSnapshot()
      this.saveToLocal()
    },

    /** 移动元素（相对移动） */
    moveElement(id: string, dx: number, dy: number) {
      const el = this.elements.find((e) => e.id === id)
      if (!el) return
      el.x += dx
      el.y += dy
      this.recordSnapshot()
      this.saveToLocal()
    },

    /** 开始批处理（代理到 history） */
    beginBatch() {
      const history = useHistoryStore()
      history.beginBatch(JSON.parse(JSON.stringify(this.elements)))
    },

    /** 结束批处理（代理到 history） */
    endBatch() {
      const history = useHistoryStore()
      history.endBatch()
    },

    /**
     * 批量移动元素（多选拖拽）
     * @param ids 要移动元素的id
     * @param dx 水平移动距离
     * @param dy 垂直移动距离
     */
    moveElements(ids: string[], dx: number, dy: number) {
      ids.forEach(id => {
        const el = this.elements.find((e) => e.id === id)
        if (el) {
          el.x += dx
          el.y += dy
        }
      })
      this.recordSnapshot()
      this.saveToLocal()
    },

    /**
     *  获取框选区域内的元素ID列表
     * @param boxX 边框起始X坐标
     * @param boxY 边框起始Y坐标
     * @param boxWidth 边框宽度
     * @param boxHeight 边框高度
     * @returns 元素ID列表
     */
    getElementsInBox(boxX: number, boxY: number, boxWidth: number, boxHeight: number): string[] {
      return this.elements
        .filter(el => {
          // 检查元素是否与框选区域相交
          const elRight = el.x + el.width
          const elBottom = el.y + el.height
          const boxRight = boxX + boxWidth
          const boxBottom = boxY + boxHeight

          return !(
            el.x > boxRight ||
            elRight < boxX ||
            el.y > boxBottom ||
            elBottom < boxY
          )
        })
        .map(el => el.id)
    },

    /** 删除元素 */
    removeElement(id: string) {
      this.elements = this.elements.filter((el) => el.id !== id)
      this.recordSnapshot()
      this.saveToLocal()
    },

    /** 批量删除元素 */
    removeElements(ids: string[]) {
      const idSet = new Set(ids)
      this.elements = this.elements.filter(el => !idSet.has(el.id))
      this.recordSnapshot()
      this.saveToLocal()
    },

    /** 清空所有元素 */
    clear() {
      this.elements = []
      this.recordSnapshot()
      this.saveToLocal()
    },

    /** 撤销 */
    undo() {
      const history = useHistoryStore()
      const snapshot = history.undo()
      if (snapshot) {
        this.elements = snapshot
        this.saveToLocal()
      }
    },

    /** 重做 */
    redo() {
      const history = useHistoryStore()
      const snapshot = history.redo()
      if (snapshot) {
        this.elements = snapshot
        this.saveToLocal()
      }
    }
  },
})
