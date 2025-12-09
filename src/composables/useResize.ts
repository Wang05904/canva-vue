import { useElementsStore } from '@/stores/elements'
import { useCanvasStore } from '@/stores/canvas'
import { CoordinateTransform } from '@/cores/viewport/CoordinateTransform'
import { calculateBoundingBox } from '@/cores/utils/boundingBox'
import type { CanvasService } from '@/services/canvas/CanvasService'
import type { GroupElement } from '@/cores/types/element'

export function useResize(canvasService: CanvasService | null | undefined) {
  const elementsStore = useElementsStore()
  const canvasStore = useCanvasStore()

  const updateElementsResize = (
    selectedIds: string[],
    cachedBoundingBox: { x: number; y: number; width: number; height: number },
    w: number,
    h: number,
    resizeHandle: string,
    initialPositions?: Map<string, { x: number; y: number; width: number; height: number }>
  ) => {
    const scaleX = w / cachedBoundingBox.width
    const scaleY = h / cachedBoundingBox.height
    const centerX = cachedBoundingBox.x + cachedBoundingBox.width / 2
    const centerY = cachedBoundingBox.y + cachedBoundingBox.height / 2

    // 展开组合元素，获取所有需要更新的元素ID（包括子元素）
    const getExpandedIds = (ids: string[]): string[] => {
      const expanded = new Set<string>()
      ids.forEach(id => {
        const el = elementsStore.getElementById(id)
        if (!el) return
        expanded.add(id)
        if (el.type === 'group') {
          const groupEl = el as GroupElement
          if (groupEl.children) {
            groupEl.children.forEach(childId => expanded.add(childId))
          }
        }
      })
      return Array.from(expanded)
    }

    const expandedIds = getExpandedIds(selectedIds)
    const isMulti = expandedIds.length > 1

    expandedIds.forEach(id => {
      const el = elementsStore.getElementById(id)
      if (!el) return

      // 使用初始位置（如果提供）或当前 Store 位置
      const initialPos = initialPositions?.get(id)
      const baseX = initialPos?.x ?? el.x
      const baseY = initialPos?.y ?? el.y
      const baseWidth = initialPos?.width ?? el.width
      const baseHeight = initialPos?.height ?? el.height

      let newX, newY
      if (isMulti) {
        // Multi-element: scale from center
        const relX = baseX + baseWidth / 2 - centerX
        const relY = baseY + baseHeight / 2 - centerY
        newX = centerX + relX * scaleX - baseWidth * scaleX / 2
        newY = centerY + relY * scaleY - baseHeight * scaleY / 2
      } else {
        // Single element: scale from corner
        newX = baseX
        newY = baseY
        if (resizeHandle.includes('l')) newX += baseWidth * (1 - scaleX)
        if (resizeHandle.includes('t')) newY += baseHeight * (1 - scaleY)
      }

      if (el.type === 'image') {
        const imgEl = document.querySelector(`[data-element-id="${id}"]`) as HTMLElement
        if (imgEl) {
          const newWidth = baseWidth * scaleX
          const newHeight = baseHeight * scaleY
          imgEl.style.transform = `translate3d(${newX}px, ${newY}px, 0) rotate(${el.rotation || 0}rad)`
          imgEl.style.transformOrigin = `${newWidth / 2}px ${newHeight / 2}px`
          imgEl.style.width = `${newWidth}px`
          imgEl.style.height = `${newHeight}px`
        }
      } else if (el.type === 'text') {
        const textEl = document.querySelector(`[data-element-id="${id}"]`) as HTMLElement
        if (textEl) {
          const newWidth = baseWidth * scaleX
          const newHeight = baseHeight * scaleY
          textEl.style.transform = `translate3d(${newX}px, ${newY}px, 0) rotate(${el.rotation || 0}rad)`
          textEl.style.transformOrigin = `${newWidth / 2}px ${newHeight / 2}px`
          textEl.style.width = `${newWidth}px`
          textEl.style.height = `${newHeight}px`
        }
      } else {
        canvasService?.getRenderService().updateElementPosition(id, newX + baseWidth * scaleX / 2, newY + baseHeight * scaleY / 2)
        const graphic = canvasService?.getRenderService().getGraphic(id)
        if (graphic) {
          graphic.scale.set(scaleX, scaleY)
          graphic.rotation = el.rotation || 0
        }
      }
    })
  }

  const applyResizeToStore = (
    selectedIds: string[],
    cachedBoundingBox: { x: number; y: number; width: number; height: number },
    scaleX: number,
    scaleY: number,
    resizeHandle: string,
    initialPositions?: Map<string, { x: number; y: number; width: number; height: number }>
  ) => {
    const centerX = cachedBoundingBox.x + cachedBoundingBox.width / 2
    const centerY = cachedBoundingBox.y + cachedBoundingBox.height / 2

    // // Check if any selected element is a group
    // const hasGroup = selectedIds.some(id => {
    //   const el = elementsStore.getElementById(id)
    //   return el?.type === 'group'
    // })

    // Expand groups: selected groups and their children participate in scaling
    const targetIds = new Set<string>()
    const groupIds = new Set<string>()
    selectedIds.forEach(id => {
      const el = elementsStore.getElementById(id)
      if (!el) return
      if (el.type === 'group' && 'children' in el && Array.isArray(el.children)) {
        groupIds.add(id) // 记录组合元素ID
        el.children.forEach(childId => targetIds.add(childId))
      }else if (el.type != 'group') {
        // If the element is a child of a group, include the parent group as well
        targetIds.add(id)
      }
    })

    const allTargetIds = Array.from(targetIds)
    console.log(allTargetIds)
    // For group elements, treat as multi-element (center-based scaling)
    const isMulti = allTargetIds.length > 1

    elementsStore.updateElements(allTargetIds, (el) => {
      // Skip updating group elements themselves
      if (el.type === 'group') return

      const isCircle = el.type === 'shape' && 'shapeType' in el && el.shapeType === 'circle'

      const initialPos = initialPositions?.get(el.id)
      const baseX = initialPos?.x ?? el.x
      const baseY = initialPos?.y ?? el.y
      const baseWidth = initialPos?.width ?? el.width
      const baseHeight = initialPos?.height ?? el.height

      let x = baseX
      let y = baseY
      let newWidth = baseWidth * scaleX
      let newHeight = baseHeight * scaleY

      if (isMulti) {
        // Multi-element scaling around center (including groups and their children)
        const relX = baseX + baseWidth / 2 - centerX
        const relY = baseY + baseHeight / 2 - centerY

        if (isCircle) {
          // Circle: use uniform scale to maintain aspect ratio
          const uniformScale = Math.max(scaleX, scaleY)
          const newSize = baseWidth * uniformScale
          const newCenterX = centerX + relX * uniformScale
          const newCenterY = centerY + relY * uniformScale

          x = newCenterX - newSize / 2
          y = newCenterY - newSize / 2
          newWidth = newSize
          newHeight = newSize
        } else {
          x = centerX + relX * scaleX - (baseWidth * scaleX) / 2
          y = centerY + relY * scaleY - (baseHeight * scaleY) / 2
        }
      } else {
        // Single element scaling (preserve original logic)
        if (resizeHandle.includes('l')) x += baseWidth * (1 - scaleX)
        if (resizeHandle.includes('t')) y += baseHeight * (1 - scaleY)

        if (isCircle) {
          // Single circle scaling, maintain aspect ratio
          const uniformScale = Math.max(scaleX, scaleY)
          const newSize = baseWidth * uniformScale
          newWidth = newSize
          newHeight = newSize
        }
      }

      el.x = x
      el.y = y
      el.width = newWidth
      el.height = newHeight
    })

    // 更新组合元素的边界框
    groupIds.forEach(groupId => {
      const group = elementsStore.getElementById(groupId)
      if (!group || group.type !== 'group') return

      // 重新计算组合的边界框
      const children = group.children
        .map(id => elementsStore.getElementById(id))
        .filter((el): el is import('@/cores/types/element').AnyElement => !!el)

      if (!children.length) return

      const bbox = calculateBoundingBox(children)
      if (!bbox) return

      // 更新组合元素的位置和尺寸
      elementsStore.updateElements([groupId], (el) => {
        el.x = bbox.x
        el.y = bbox.y
        el.width = bbox.width
        el.height = bbox.height
      })
    })
  }

  const resetGraphicsAfterResize = (selectedIds: string[]) => {
    const targetIds = new Set<string>()
    selectedIds.forEach(id => {
      const el = elementsStore.getElementById(id)
      if (!el) return
      if (el.type === 'group' && 'children' in el && Array.isArray(el.children)) {
        el.children.forEach(childId => targetIds.add(childId))
      }else if (el.type != 'group') {
        // If the element is a child of a group, include the parent group as well
        targetIds.add(id)
      }
    })

    const allTargetIds = Array.from(targetIds)
    allTargetIds.forEach(id => {
      const el = elementsStore.getElementById(id)
      const graphic = canvasService?.getRenderService().getGraphic(id)
      if (graphic && el) {
        graphic.scale.set(1, 1)
        graphic.rotation = el.rotation || 0
      }
    })
  }

  const updateSelectionBox = (
    box: HTMLElement,
    cachedBoundingBox: { x: number; y: number; width: number; height: number },
    w: number,
    h: number,
    resizeHandle: string,
    selectedIds: string[]
  ) => {
    const viewport = canvasStore.viewport

    // 检查是否为组合元素（组合元素应该使用中心缩放模式）
    const isGroup = selectedIds.length === 1 && selectedIds.some(id => {
      const el = elementsStore.getElementById(id)
      return el?.type === 'group'
    })

    // Get rotation for single non-group elements
    let rotation = 0
    if (selectedIds.length === 1 && selectedIds[0] && !isGroup) {
      const el = elementsStore.getElementById(selectedIds[0])
      rotation = el?.rotation || 0
    }

    // Calculate world coordinates position
    let worldX, worldY
    if (selectedIds.length > 1 || isGroup) {
      // Multi-element or group: center the selection box
      const centerX = cachedBoundingBox.x + cachedBoundingBox.width / 2
      const centerY = cachedBoundingBox.y + cachedBoundingBox.height / 2
      worldX = centerX - w / 2
      worldY = centerY - h / 2
    } else {
      // Single element: anchor from corner
      worldX = cachedBoundingBox.x
      worldY = cachedBoundingBox.y
      if (resizeHandle.includes('l')) worldX += cachedBoundingBox.width - w
      if (resizeHandle.includes('t')) worldY += cachedBoundingBox.height - h
    }

    // Convert to screen coordinates
    const canvasWidth = canvasStore.width || 800
    const canvasHeight = canvasStore.height || 600
    const screenPos = CoordinateTransform.worldToScreen(
      worldX,
      worldY,
      viewport,
      canvasWidth,
      canvasHeight
    )
    const screenWidth = w * viewport.zoom
    const screenHeight = h * viewport.zoom

    // Apply rotation for single non-group elements
    const rotationDeg = (rotation * 180) / Math.PI
    box.style.transform = `translate3d(${screenPos.x}px, ${screenPos.y}px, 0) rotate(${rotationDeg}deg)`
    box.style.transformOrigin = `${screenWidth / 2}px ${screenHeight / 2}px`
    box.style.width = screenWidth + 'px'
    box.style.height = screenHeight + 'px'
  }

  return {
    updateElementsResize,
    applyResizeToStore,
    resetGraphicsAfterResize,
    updateSelectionBox
  }
}
