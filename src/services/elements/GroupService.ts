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
import type { AnyElement, GroupElement } from '@/cores/types/element'

export class GroupService {
  private elementsStore = useElementsStore()
  private selectionStore = useSelectionStore()

  constructor() {}

  /**
   * 根据一组元素ID计算包围盒
   */
  private calculateBoundingBox(ids: string[]): { x: number; y: number; width: number; height: number } | null {
    if (!ids.length) return null

    const elements: AnyElement[] = ids
      .map(id => this.elementsStore.getElementById(id))
      .filter((el): el is AnyElement => !!el)

    if (!elements.length) return null

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    elements.forEach(el => {
      const rotation = el.rotation || 0
      
      if (rotation === 0) {
        // 未旋转，直接使用轴对齐边界框
        minX = Math.min(minX, el.x)
        minY = Math.min(minY, el.y)
        maxX = Math.max(maxX, el.x + el.width)
        maxY = Math.max(maxY, el.y + el.height)
      } else {
        // 已旋转，计算旋转后的四个角点，然后求其外包围盒
        const centerX = el.x + el.width / 2
        const centerY = el.y + el.height / 2
        const cos = Math.cos(rotation)
        const sin = Math.sin(rotation)
        
        // 四个角点相对于中心的坐标
        const corners = [
          { x: -el.width / 2, y: -el.height / 2 },
          { x: el.width / 2, y: -el.height / 2 },
          { x: el.width / 2, y: el.height / 2 },
          { x: -el.width / 2, y: el.height / 2 }
        ]
        
        // 旋转并转换到世界坐标，求 AABB
        corners.forEach(corner => {
          const worldX = centerX + corner.x * cos - corner.y * sin
          const worldY = centerY + corner.x * sin + corner.y * cos
          minX = Math.min(minX, worldX)
          minY = Math.min(minY, worldY)
          maxX = Math.max(maxX, worldX)
          maxY = Math.max(maxY, worldY)
        })
      }
    })

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  /**
   * 创建组合元素
   * @param elementIds 需要分组的元素ID（必须为顶层元素）
   * @returns 新建组合元素ID 或 null
   */
  createGroup(elementIds: string[]): string | null {
    const ids = Array.from(new Set(elementIds)).filter(Boolean)
    if (ids.length < 2) return null

    const bbox = this.calculateBoundingBox(ids)
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

      // 4. 持久化
      this.elementsStore.saveToLocal()

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

      // 4. 持久化
      this.elementsStore.saveToLocal()

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
