/**
 * Service层-分组服务
 * 功能：
 * 1. 处理元素的组合与解组操作（创建组、解散组）
 * 2. 维护组合元素与子元素之间的关系（parentGroup / children）
 * 3. 为 View / Composables 层提供简单的分组 API
 *
 * 设计约定：
 * - 组合元素本身也是一个 `AnyElement`，类型为 `group`
 * - 子元素通过 `parentGroup` 字段指向所属组合
 * - 命中测试只对顶层元素（`parentGroup` 为空）生效，因此被分组后的子元素无法直接被点击选中
 */
import { useElementsStore } from '@/stores/elements'
import { useSelectionStore } from '@/stores/selection'
import { calculateBoundingBox } from '@/cores/utils/boundingBox'
import type { AnyElement, GroupElement } from '@/cores/types/element'

export class GroupService {
  private elementsStore = useElementsStore()
  private selectionStore = useSelectionStore()

  constructor() {}

  /**
   * 创建组合元素
   * @param elementIds 需要分组的元素ID（必须为顶层元素）
   * @returns 新建组合元素ID 或 null
   */
  createGroup(elementIds: string[]): string | null {
    const ids = Array.from(new Set(elementIds)).filter(Boolean)
    if (ids.length < 2) return null

    const elements = ids
      .map(id => this.elementsStore.getElementById(id))
      .filter((el): el is AnyElement => !!el)

    const bbox = calculateBoundingBox(elements)
    if (!bbox) return null

    // 开启批处理，避免多次历史记录
    this.elementsStore.beginBatch()

    try {
      // 1. 创建组合元素
      const groupId = this.elementsStore.addGroup({
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: this.elementsStore.elements.length,
        children: ids
      } as Omit<GroupElement, 'id' | 'type' | 'createdAt' | 'updatedAt'>)

      // 2. 将子元素标记为隶属于该组合（使其在命中测试中不再作为顶层元素）
      this.elementsStore.updateElements(ids, (el) => {
        el.parentGroup = groupId
      })

      // 3. 选中新建的组合元素
      this.selectionStore.selectElement(groupId)

      return groupId
    } finally {
      this.elementsStore.endBatch()
    }
  }

  /**
   * 解组
   * @param groupId 组合元素ID
   * @returns 被释放的子元素ID数组
   */
  ungroup(groupId: string): string[] {
    const group = this.elementsStore.getElementById(groupId) as GroupElement | undefined
    if (!group || group.type !== 'group') return []

    const childrenIds = Array.isArray(group.children) ? [...group.children] : []

    this.elementsStore.beginBatch()

    try {
      // 1. 清除子元素的 parentGroup，使其恢复为顶层元素
      if (childrenIds.length) {
        this.elementsStore.updateElements(childrenIds, (el) => {
          if (el.parentGroup === groupId) {
            delete el.parentGroup
          }
        })
      }

      // 2. 删除组合元素本身
      this.elementsStore.removeElement(groupId)

      // 3. 更新选区为子元素
      this.selectionStore.selectedIds = childrenIds

      return childrenIds
    } finally {
      this.elementsStore.endBatch()
    }
  }

  /**
   * 删除组合元素（包括其子元素）
   * 用于 Delete 操作时确保组合整体被删除
   */
  deleteGroups(groupIds: string[]): void {
    if (!groupIds.length) return

    const toDelete = new Set<string>()

    groupIds.forEach((id) => {
      const el = this.elementsStore.getElementById(id)
      if (el && el.type === 'group') {
        toDelete.add(id)
        ;(el as GroupElement).children.forEach(childId => toDelete.add(childId))
      }
    })

    if (!toDelete.size) return

    this.elementsStore.removeElements(Array.from(toDelete))
    this.selectionStore.clearSelection()
  }
}
