/**
 * 核心层-元素类型定义
 * 功能：定义元素的基础类型规范
 * 服务对象：为整个项目的元素管理提供统一的类型支持
 */
//新增了一个点
export interface Point {
  x: number;
  y: number;
}
// 画布元素基础类型
export interface CanvasElement {
  id: string
  type: 'text' | 'shape' | 'image' | 'group'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean  // 表示是否可以编辑元素特殊属性，比如图片的滤镜，当组合或多个元素被选中时不能编辑，设为true，解组或取消选中时设为false
  zIndex: number
  createdAt: number
  updatedAt: number
  parentGroup?: string  // 所属组合ID
}

// 文本元素类型
export interface TextElement extends CanvasElement {
  type: 'text'
  content: string
  fontSize: number
  fontFamily: string
  color: string
  // 其他文本属性
}

// 图形元素类型
export interface ShapeElement extends CanvasElement {
      type: 'shape'
      shapeType: 'rectangle' | 'circle' | 'triangle' | 'roundedRect'
      fillColor: string
      strokeWidth: number
      strokeColor: string
      borderRadius?: number // 圆角半径，默认10px
}

// 图片元素类型
export interface ImageElement extends CanvasElement {
  type: 'image'
  src: string
  filters: ImageFilter[]
  naturalWidth: number
  naturalHeight: number
}

// 三种简单滤镜类型
export type SimpleFilterType = 'blur' | 'brightness' | 'contrast'

// 滤镜接口
export interface ImageFilter {
  type: SimpleFilterType    //滤镜类型
  value: number  // 滤镜强度值
}

/**
 * 组合元素
 * 设计说明：
 * 1. GroupElement也是一种CanvasElement，因此继承自CanvasElement
 * 2. 包含在AnyElement中，便于统一处理所有元素类型
 * 3. 组合可以嵌套，即children可以包含其他GroupElement的id
 */
// 组合元素
export interface GroupElement extends CanvasElement {
  type: 'group'
  children: string[] // 子元素ID数组
}

// 元素联合类型（包含所有具体元素类型）
export type AnyElement = TextElement | ShapeElement | ImageElement | GroupElement
