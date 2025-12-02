import { defineStore } from 'pinia'
import type { AnyElement, ShapeElement, ImageElement, TextElement, GroupElement } from '@/cores/types/element'
import { LocalStorage } from './persistence/LocalStorage'
import { useHistoryStore } from './history'
import { useSelectionStore } from './selection'

const storage = new LocalStorage('elements_')
const STORAGE_KEY = 'list'

export const useElementsStore = defineStore('elements', {
  state: () => ({
    elements: [] as AnyElement[],
    clipboard: [] as Omit<AnyElement, 'id' | 'createdAt' | 'updatedAt'>[],
  }),

  getters: {
    /**获取所有非组合元素**/
    getAllSingleElements: (state) => {
      return state.elements.filter((el) => !el.parentGroup)
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
    addShape(payload: Omit<ShapeElement, 'id' | 'type' | 'createdAt' | 'updatedAt'>): string {
      const id = this.generateId();
      const newElement: ShapeElement = {
        ...payload,
        id,
        type: 'shape',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      // 创建新数组引用，触发 watch
      this.elements = [...this.elements, newElement];
      this.recordSnapshot()
      this.saveToLocal();
      return id;
    },
    // 创建图像元素
    addImage(payload: Omit<ImageElement, 'id' | 'type' | 'createdAt' | 'updatedAt'>): string {
      const id = this.generateId();
      const newElement: ImageElement = {
        ...payload,
        id,
        type: 'image',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      // 创建新数组引用，触发 watch
      this.elements = [...this.elements, newElement];
      this.recordSnapshot()
      this.saveToLocal();
      return id;
    },
    // 创建文本元素
    addText(payload: Omit<TextElement, 'id' | 'type' | 'createdAt' | 'updatedAt'>): string {
      const id = this.generateId();
      const newElement: TextElement = {
        ...payload,
        id,
        type: 'text',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      // 创建新数组引用，触发 watch
      this.elements = [...this.elements, newElement];
      this.recordSnapshot()
      this.saveToLocal();
      return id;
    },
    // 创建组合元素
    addGroup(payload: Omit<GroupElement, 'id' | 'type' | 'createdAt' | 'updatedAt'>): string {
      const id = this.generateId();
      const newElement: GroupElement = {
        ...payload,
        id,
        type: 'group',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      // 创建新数组引用，触发 watch
      this.elements = [...this.elements, newElement];
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

      // 创建新数组引用，触发 watch
      this.elements = [...this.elements]
      this.recordSnapshot()
      this.saveToLocal()
    },

    /** 更新文本元素 */
    updateTextElement(
      elementId: string,
      updates: Partial<Omit<TextElement, 'id' | 'type' | 'createdAt' | 'updatedAt'>>
    ): void {
      const element = this.elements.find(el => el.id === elementId);
      if (!element || element.type !== 'text') return;

      Object.assign(element, updates)
      element.updatedAt = Date.now()

      // 创建新数组引用，触发 watch
      this.elements = [...this.elements]
      this.recordSnapshot()
      this.saveToLocal()
    },

    /** 更新图片元素 */
    updateImageElement(
      elementId: string,
      updates: Partial<Omit<ImageElement, 'id' | 'type' | 'createdAt' | 'updatedAt'>>
    ): void {
      const element = this.elements.find(el => el.id === elementId);
      if (!element || element.type !== 'image') return;

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
      el.updatedAt = Date.now()

      // 移动后记录快照

      // 创建新数组引用，触发 watch
      this.elements = [...this.elements]
      this.recordSnapshot()
    },

    /** 开始批处理（代理到 history） */
    beginBatch() {
      const history = useHistoryStore()
      history.beginBatch()
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
          el.updatedAt = Date.now()
        }
      })

      // 移动后记录快照
      // 创建新数组引用，触发 watch
      this.elements = [...this.elements]
      this.recordSnapshot()
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
      const boxRight = boxX + boxWidth
      const boxBottom = boxY + boxHeight

      const singleIds: string[] = []
      const groupIds: string[] = []

      this.elements.forEach(el => {
        // 已经属于某个组合的子元素不参与框选（只能通过组合整体被选中）
        if (el.parentGroup !== undefined && el.parentGroup !== null) {
          return
        }

        const elRight = el.x + el.width
        const elBottom = el.y + el.height

        const intersect = !(
          el.x > boxRight ||
          elRight < boxX ||
          el.y > boxBottom ||
          elBottom < boxY
        )

        if (!intersect) return

        if (el.type === 'group') {
          groupIds.push(el.id)
        } else {
          singleIds.push(el.id)
        }
      })

      // 返回顺序无所谓，但避免重复
      return [...singleIds, ...groupIds]
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
    /**
     * 批量更新元素
     * @param ids 要更新的元素ID数组
     * @param updates 更新对象或更新函数
     */
    updateElements(
      ids: string[],
      updates: Partial<AnyElement> | ((element: AnyElement) => void)
    ): void {
      ids.forEach(id => {
        const element = this.elements.find(el => el.id === id)
        if (element) {
          if (typeof updates === 'function') {
            updates(element)
          } else {
            Object.assign(element, updates)
          }
          element.updatedAt = Date.now()
        }
      })

      // 创建新数组引用，触发 watch
      this.elements = [...this.elements]
      this.recordSnapshot()
      this.saveToLocal()
    },

    /** 复制选中的元素 */
    copySelectedElements() {
      const selectionStore = useSelectionStore()
      if (selectionStore.selectedIds.length === 0) return

      // 获取选中的元素
      const selectedElements = this.elements.filter(el => selectionStore.selectedIds.includes(el.id))

      // 深拷贝元素，移除ID和时间戳
      this.clipboard = selectedElements.map(el => {
        // 直接深拷贝整个元素，后续创建新元素时会覆盖ID和时间戳
        const copy = JSON.parse(JSON.stringify(el))
        // 删除不需要的属性
        delete copy.id
        delete copy.createdAt
        delete copy.updatedAt
        return copy
      })
    },

    /** 粘贴元素 */
    pasteElements(position?: { x: number; y: number }) {
      if (this.clipboard.length === 0) return

      const selectionStore = useSelectionStore()
      const newElementIds: string[] = []

      // 为每个粘贴的元素生成新ID并调整位置
      this.clipboard.forEach((clipboardEl, index) => {
        const id = this.generateId()
        const offset = 10 // 偏移量

        // 计算新位置
        let newX: number;
        let newY: number;

        if (position) {
          // 如果提供了位置，使用该位置，多个元素时依次偏移
          newX = position.x + offset * index;
          newY = position.y + offset * index;
        } else {
          // 否则使用原位置偏移
          newX = clipboardEl.x + offset * (index + 1);
          newY = clipboardEl.y + offset * (index + 1);
        }

        // 创建新元素
        let newElement: AnyElement;

        if (clipboardEl.type === 'group') {
          // 组合元素需要确保有 children 属性，使用类型断言
          const groupClipboardEl = clipboardEl as Omit<GroupElement, 'id' | 'createdAt' | 'updatedAt'>;
          newElement = {
            ...groupClipboardEl,
            id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            x: newX,
            y: newY,
            children: groupClipboardEl.children || [],
          } as GroupElement;
        } else {
          // 非组合元素
          newElement = {
            ...clipboardEl,
            id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            x: newX,
            y: newY,
          } as AnyElement;
        }

        this.elements.push(newElement)
        newElementIds.push(id)
      })

      // 创建新数组引用，触发 watch 监听，确保画布重新渲染
      this.elements = [...this.elements]

      // 记录快照
      this.recordSnapshot()
      // 保存到本地
      this.saveToLocal()
      // 自动选中新粘贴的元素
      selectionStore.selectedIds = newElementIds
    },

  },
})
