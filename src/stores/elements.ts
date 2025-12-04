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
      this.saveToLocal()
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
      const idSet = new Set(ids)
      const now = Date.now()

      // 一次性批量构造新数组（极大减少响应式开销）
      this.elements = this.elements.map(el => {
        if (!idSet.has(el.id)) return el

        // 返回新的元素对象（不可变更新）
        return {
          ...el,
          x: el.x + dx,
          y: el.y + dy,
          updatedAt: now
        }
      })

      // 下面逻辑保持完全不变（顺序也不变）
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

      // 展开组合元素，收集所有需要复制的元素（包括组合的子元素）
      const elementsToCopy: Array<{ element: AnyElement; originalId: string; isGroup: boolean }> = []
      const processedIds = new Set<string>()
      
      selectedElements.forEach(el => {
        if (processedIds.has(el.id)) return
        
        if (el.type === 'group') {
          // 组合元素：先添加组合本身，再添加所有子元素
          elementsToCopy.push({ element: el, originalId: el.id, isGroup: true })
          processedIds.add(el.id)
          
          const groupEl = el as GroupElement
          if (groupEl.children) {
            groupEl.children.forEach(childId => {
              if (!processedIds.has(childId)) {
                const childEl = this.getElementById(childId)
                if (childEl) {
                  elementsToCopy.push({ element: childEl, originalId: childId, isGroup: false })
                  processedIds.add(childId)
                }
              }
            })
          }
        } else {
          // 非组合元素：直接添加（但跳过已经是组合子元素的元素）
          if (!el.parentGroup) {
            elementsToCopy.push({ element: el, originalId: el.id, isGroup: false })
            processedIds.add(el.id)
          }
        }
      })

      // 深拷贝元素，移除ID和时间戳，但保留原始ID用于匹配
      // 同时记录每个元素所属的组合ID（如果有）
      const groupIdMap = new Map<string, string>() // 子元素ID -> 组合ID
      selectedElements.forEach(el => {
        if (el.type === 'group') {
          const groupEl = el as GroupElement
          if (groupEl.children) {
            groupEl.children.forEach(childId => {
              groupIdMap.set(childId, el.id)
            })
          }
        }
      })
      
      this.clipboard = elementsToCopy.map(({ element, originalId, isGroup }) => {
        const copy = JSON.parse(JSON.stringify(element)) as ClipboardElement
        // 删除不需要的属性
        delete copy.id
        delete copy.createdAt
        delete copy.updatedAt
        delete copy.parentGroup // 清除 parentGroup，粘贴时会重新设置
        // 保存原始ID用于匹配（临时属性，不会保存到最终元素）
        copy.__originalId = originalId
        copy.__isGroup = isGroup
        // 保存所属组合ID（如果有）
        const parentGroupId = groupIdMap.get(originalId)
        if (parentGroupId) {
          copy.__parentGroupId = parentGroupId
        }
        return copy
      })
    },

    /** 粘贴元素 */
    pasteElements(position?: { x: number; y: number }) {
      if (this.clipboard.length === 0) return

      const selectionStore = useSelectionStore()
      const newElementIds: string[] = []
      const idMapping = new Map<string, string>() // 旧ID -> 新ID的映射
      const offset = 10 // 偏移量

      // 第一步：分离组合元素、子元素和独立元素
      const groupElements: Array<{ clipboardEl: ClipboardElement; originalId: string; index: number }> = []
      const childElements: Array<{ clipboardEl: ClipboardElement; originalId: string; parentGroupId: string }> = []
      const independentElements: Array<{ clipboardEl: ClipboardElement; originalId: string; index: number }> = []
      let groupIndex = 0
      let independentIndex = 0
      
      this.clipboard.forEach((clipboardEl) => {
        const typedClipboardEl = clipboardEl as ClipboardElement
        const isGroup = typedClipboardEl.__isGroup === true
        const originalId = typedClipboardEl.__originalId
        const parentGroupId = typedClipboardEl.__parentGroupId
        
        if (isGroup) {
          // 组合元素稍后处理
          groupElements.push({ clipboardEl: typedClipboardEl, originalId, index: groupIndex })
          groupIndex++
        } else if (parentGroupId) {
          // 组合的子元素：稍后处理，需要根据组合的偏移量计算位置
          childElements.push({ clipboardEl: typedClipboardEl, originalId, parentGroupId })
        } else {
          // 独立的非组合元素：立即创建
          independentElements.push({ clipboardEl: typedClipboardEl, originalId, index: independentIndex })
          independentIndex++
        }
      })
      
      // 第二步：先创建独立的非组合元素
      independentElements.forEach(({ clipboardEl, originalId, index }) => {
        const id = this.generateId()
        idMapping.set(originalId, id)

        // 计算新位置
        let newX: number;
        let newY: number;

        if (position) {
          newX = position.x + offset * index;
          newY = position.y + offset * index;
        } else {
          newX = clipboardEl.x + offset * (index + 1);
          newY = clipboardEl.y + offset * (index + 1);
        }

        const newElement: AnyElement = {
          ...clipboardEl,
          id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          x: newX,
          y: newY,
        } as AnyElement
        
        // 删除临时属性
        delete (newElement as ClipboardElement).__originalId
        delete (newElement as ClipboardElement).__isGroup
        delete (newElement as ClipboardElement).__parentGroupId

        this.elements.push(newElement)
      })
      
      // 第三步：计算组合的偏移量（但不创建组合元素）
      const groupOffsetMap = new Map<string, { originalX: number; originalY: number; offsetX: number; offsetY: number }>()
      groupElements.forEach(({ clipboardEl, originalId }) => {
        // 计算组合的新位置
        let newX: number;
        let newY: number;

        if (position) {
          newX = position.x + offset * index;
          newY = position.y + offset * index;
        } else {
          newX = clipboardEl.x + offset * (index + 1);
          newY = clipboardEl.y + offset * (index + 1);
        }

        // 计算组合的偏移量（用于调整子元素位置）
        const offsetX = newX - clipboardEl.x
        const offsetY = newY - clipboardEl.y
        groupOffsetMap.set(originalId, {
          originalX: clipboardEl.x,
          originalY: clipboardEl.y,
          offsetX,
          offsetY
        })
      })
      
      // 第四步：创建组合的子元素，保持相对位置
      childElements.forEach(({ clipboardEl, originalId, parentGroupId }) => {
        const id = this.generateId()
        idMapping.set(originalId, id)
        
        // 获取组合的偏移量
        const groupOffset = groupOffsetMap.get(parentGroupId)
        if (!groupOffset) {
          // 如果找不到组合偏移量，使用默认偏移
          const newElement: AnyElement = {
            ...clipboardEl,
            id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            x: clipboardEl.x + offset,
            y: clipboardEl.y + offset,
          } as AnyElement
          
          delete (newElement as ClipboardElement).__originalId
          delete (newElement as ClipboardElement).__isGroup
          delete (newElement as ClipboardElement).__parentGroupId
          
          this.elements.push(newElement)
          return
        }
        
        // 计算子元素的新位置：原位置 + 组合偏移量
        const newX = clipboardEl.x + groupOffset.offsetX
        const newY = clipboardEl.y + groupOffset.offsetY
        
        const newElement: AnyElement = {
          ...clipboardEl,
          id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          x: newX,
          y: newY,
        } as AnyElement
        
        // 删除临时属性
        delete (newElement as ClipboardElement).__originalId
        delete (newElement as ClipboardElement).__isGroup
        delete (newElement as ClipboardElement).__parentGroupId
        
        this.elements.push(newElement)
      })
      
      // 第五步：创建组合元素，此时子元素已经创建，可以正确映射ID
      groupElements.forEach(({ clipboardEl, originalId }) => {
        const groupClipboardEl = clipboardEl as Omit<GroupElement, 'id' | 'createdAt' | 'updatedAt'>
        const groupId = this.generateId()
        idMapping.set(originalId, groupId)
        
        // 计算组合的新位置（使用之前计算的偏移量）
        const groupOffset = groupOffsetMap.get(originalId)!
        const newX = groupOffset.originalX + groupOffset.offsetX
        const newY = groupOffset.originalY + groupOffset.offsetY

        // 映射子元素ID：将旧的子元素ID映射为新的ID
        const newChildrenIds: string[] = []
        if (groupClipboardEl.children && Array.isArray(groupClipboardEl.children)) {
          groupClipboardEl.children.forEach((oldChildId: string) => {
            const newChildId = idMapping.get(oldChildId)
            if (newChildId) {
              newChildrenIds.push(newChildId)
              // 更新子元素的 parentGroup
              const childEl = this.getElementById(newChildId)
              if (childEl) {
                childEl.parentGroup = groupId
              }
            }
          })
        }

        const newGroupElement: GroupElement = {
          ...groupClipboardEl,
          id: groupId,
          type: 'group',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          x: newX,
          y: newY,
          children: newChildrenIds,
        } as GroupElement
        
        // 删除临时属性
        delete (newGroupElement as ClipboardElement).__originalId
        delete (newGroupElement as ClipboardElement).__isGroup

        this.elements.push(newGroupElement)
        newElementIds.push(groupId)
      })

      // 收集所有新创建的元素ID（只包括顶层元素，不包括组合的子元素）
      this.clipboard.forEach((clipboardEl) => {
        const typedClipboardEl = clipboardEl as ClipboardElement
        const isGroup = typedClipboardEl.__isGroup === true
        const originalId = typedClipboardEl.__originalId
        
        if (isGroup) {
          // 组合元素ID已经在上面添加了
          const groupId = idMapping.get(originalId)
          if (groupId && !newElementIds.includes(groupId)) {
            newElementIds.push(groupId)
          }
        } else {
          // 非组合元素：只添加顶层元素（不是组合子元素的）
          const newId = idMapping.get(originalId)
          if (newId) {
            const el = this.getElementById(newId)
            if (el && !el.parentGroup) {
              newElementIds.push(newId)
            }
          }
        }
      })

      // 创建新数组引用，触发 watch 监听，确保画布重新渲染
      this.elements = [...this.elements]

      // 记录快照
      this.recordSnapshot()
      // 保存到本地
      this.saveToLocal()
      // 自动选中新粘贴的元素（只选中顶层元素，不包括组合的子元素）
      selectionStore.selectedIds = newElementIds
    },

  },
})
