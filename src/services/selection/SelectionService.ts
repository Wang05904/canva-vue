/**
 * Service层-选择服务
 * 功能：处理选择相关业务逻辑（状态管理、多选操作、选择框计算等）
 * 服务对象：为Composables层的useSelection提供业务支持
 */
import type { AnyElement } from '@/cores/types/element'
import { useElementsStore } from '@/stores/elements'

export class SelectionService {
  private elementsStore = useElementsStore()

  constructor() {}

  /**
   * 缩放单个元素
   * @param elementId 元素ID
   * @param handleType 控制点类型
   * @param dx 水平移动距离
   * @param dy 垂直移动距离
   * @param startX 元素原始X坐标
   * @param startY 元素原始Y坐标
   * @param startWidth 元素原始宽度
   * @param startHeight 元素原始高度
   */
  resizeElement(
    elementId: string,
    handleType: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
    dx: number,
    dy: number,
    startX: number,
    startY: number,
    startWidth: number,
    startHeight: number
  ): void {
    const element = this.elementsStore.getElementById(elementId)
    if (!element) return

    let newX = startX
    let newY = startY
    let newWidth = startWidth
    let newHeight = startHeight

    switch (handleType) {
      case 'top-left':
        newX = startX + dx
        newY = startY + dy
        newWidth = Math.max(1, startWidth - dx)
        newHeight = Math.max(1, startHeight - dy)
        break
      case 'top-right':
        newY = startY + dy
        newWidth = Math.max(1, startWidth + dx)
        newHeight = Math.max(1, startHeight - dy)
        break
      case 'bottom-left':
        newX = startX + dx
        newWidth = Math.max(1, startWidth - dx)
        newHeight = Math.max(1, startHeight + dy)
        break
      case 'bottom-right':
        newWidth = Math.max(1, startWidth + dx)
        newHeight = Math.max(1, startHeight + dy)
        break
    }

    // 特殊处理圆形元素：保持宽高一致
    if (element.type === 'shape' && element.shapeType === 'circle') {
      // 取宽高中的较大值作为圆形的直径
      const diameter = Math.max(newWidth, newHeight)
      newWidth = diameter
      newHeight = diameter

      // 根据控制点类型调整位置，保持圆形居中
      switch (handleType) {
        case 'top-left':
          newX = startX + dx - (diameter - (startWidth - dx)) / 2
          newY = startY + dy - (diameter - (startHeight - dy)) / 2
          break
        case 'top-right':
          newY = startY + dy - (diameter - (startHeight - dy)) / 2
          break
        case 'bottom-left':
          newX = startX + dx - (diameter - (startWidth - dx)) / 2
          break
        // bottom-right 不需要调整位置，因为右下角控制点不会改变圆心的位置
      }
    }

    // 更新元素属性
     // 使用批量更新接口更新元素属性
     this.elementsStore.updateElements([elementId], {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
      updatedAt: Date.now()
    })
  }

/**
 * 缩放多个元素（保持相对位置和比例）
 * @param elementIds 元素ID数组
 * @param handleType 控制点类型
 * @param dx 水平移动距离
 * @param dy 垂直移动距离
 * @param startBoundingBox 原始边界框
 */
/**
 * 缩放多个元素（等比例缩放，以中心为锚点）bug还没改
 */
resizeElements(
  elementIds: string[],
  handleType: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  dx: number,
  dy: number,
  startBoundingBox: { x: number; y: number; width: number; height: number }
): void {
  if (elementIds.length === 0) return

  const elements = elementIds
    .map(id => this.elementsStore.getElementById(id))
    .filter(el => el != null) as AnyElement[]

  if (elements.length === 0) return

  const { x: startX, y: startY, width: startWidth, height: startHeight } = startBoundingBox

  // 计算中心点
  const centerX = startX + startWidth / 2;
  const centerY = startY + startHeight / 2;
  // 用dx计算缩放比例
  let scale = 1;

  switch (handleType) {
    case 'top-left':
      scale = (startWidth-dx)/startWidth;  // 向左拖拽dx为负，缩放比例减小
      break;
    case 'top-right':
      scale = (startWidth+dx)/startWidth;  // 向右拖拽dx为正，缩放比例增加
      break;
    case 'bottom-left':
      scale = (startWidth-dx)/startWidth;  // 向左拖拽dx为负，缩放比例减小
      break;
    case 'bottom-right':
      scale = (startWidth+dx)/startWidth;  // 向右拖拽dx为正，缩放比例增加
      break;
  }
  console.log("Mouse movement - dx:", dx, "dy:", dy);
    console.log("Original bounding box - x:", startX, "y:", startY, "width:", startWidth, "height:", startHeight);
    console.log("Scale factor:", scale);
  scale = Math.max(0.01, scale); // 防止缩放为0或负数

  // // 计算新的宽高（等比例）
  // const newWidth = startWidth * scale;
  // const newHeight = startHeight * scale;

  // // 计算新的位置（保持中心点不变）
  // const newX = centerX - newWidth / 2;
  // const newY = centerY - newHeight / 2;
  // console.log("selectBox startX:", startX, "startY:", startY, "startWidth:", startWidth, "startHeight:", startHeight,"selectBox center:", centerX, centerY);
   // 计算新的边界框信息
   const newWidth = startWidth * scale;
   const newHeight = startHeight * scale;
   const newX = centerX - newWidth / 2;
   const newY = centerY - newHeight / 2;

   console.log("New bounding box - x:", newX, "y:", newY, "width:", newWidth, "height:", newHeight);
   console.log("Vertex movement - top-left: (", newX - startX, ",", newY - startY, ")");
  // 更新所有元素：用统一的缩放比例
  elements.forEach(element => {
    // 计算元素相对于中心点的向量
    const vectorX = element.x - centerX;
    const vectorY = element.y - centerY;
    // console.log("element id:", element.id, "vectorX:", vectorX, "vectorY:", vectorY, "scale:", scale,"newX:", centerX + vectorX * scale, "newY:", centerY + vectorY * scale, "newWidth:", element.width * scale, "newHeight:", element.height * scale);
    // 应用统一的缩放变换
    this.elementsStore.updateElements([element.id], {
      x: centerX + vectorX * scale,
      y: centerY + vectorY * scale,
      width: element.width * scale,
      height: element.height * scale,
      updatedAt: Date.now()
    });
  });
}

  /**
   * 计算元素的边界框
   * @param elementIds 元素ID数组
   */
  calculateBoundingBox(elementIds: string[]): { x: number; y: number; width: number; height: number } | null {
    if (elementIds.length === 0) return null

    const elements = elementIds
      .map(id => this.elementsStore.getElementById(id))
      .filter(el => el != null) as AnyElement[]

    if (elements.length === 0) return null

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    elements.forEach(el => {
      minX = Math.min(minX, el.x)
      minY = Math.min(minY, el.y)
      maxX = Math.max(maxX, el.x + el.width)
      maxY = Math.max(maxY, el.y + el.height)
    })

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }
}
