/**
 * 核心层-元素类型定义
 * 功能：定义元素的基础类型规范
 * 服务对象：为整个项目的元素管理提供统一的类型支持
 */
export interface Element {
  id: string
  type: 'shape' | 'image' | 'text'
  x: number
  y: number
  width: number
  height: number
  fill?: string
  rotation?: number
  borderWidth?: number
  borderColor?: string
}
