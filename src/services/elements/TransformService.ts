import type { Graphics, FederatedPointerEvent } from 'pixi.js'

/**
 * Service层-变换服务
 * 功能：处理元素的变换操作（移动、缩放、旋转等）
 * 服务对象：为Composables层的useTransform提供业务支持
 */
export class TransformService {
  constructor() {}

  /**
   * 为图形元素添加拖拽功能
   * @param graphic - Pixi图形对象
   * @param onDragStart - 拖拽开始回调
   * @param onDragMove - 拖拽移动回调
   * @param onDragEnd - 拖拽结束回调
   */
  makeDraggable(
    graphic: Graphics,
    onDragStart?: (x: number, y: number) => void,
    onDragMove?: (x: number, y: number) => void,
    onDragEnd?: (x: number, y: number) => void
  ): void {
    // 拖拽状态
    let dragging = false
    // 拖拽偏移量
    const dragOffset = { x: 0, y: 0 }

    // 启用交互
    graphic.eventMode = 'static'
    graphic.cursor = 'pointer'

    /**
     * 处理指针移动事件，实现拖拽效果
     * @param event - 指针事件对象
     */
    const onPointerMove = (event: FederatedPointerEvent) => {
      if (dragging) {
        const position = event.global
        graphic.x = position.x - dragOffset.x
        graphic.y = position.y - dragOffset.y
        onDragMove?.(graphic.x, graphic.y)
        console.log(`Dragging to (${graphic.x}, ${graphic.y})`)
      }
    }
    
    /**
     * 处理指针抬起事件，结束拖拽
     */
    const onPointerUp = () => {
      if (dragging) {
        dragging = false
        graphic.cursor = 'pointer'
        
        // 移除全局事件监听
        const stage = graphic.parent
        if (stage) {
          stage.off('pointermove', onPointerMove)
          stage.off('pointerup', onPointerUp)
          stage.off('pointerupoutside', onPointerUp)
        }
        
        onDragEnd?.(graphic.x, graphic.y)
      }
    }

    // 鼠标按下 - 开始拖拽
    graphic.on('pointerdown', (event) => {
      dragging = true
      const position = event.global
      dragOffset.x = position.x - graphic.x
      dragOffset.y = position.y - graphic.y
      graphic.cursor = 'grabbing'
      console.log('选择了元素，开始拖拽')
      event.stopPropagation()

      // 在stage上添加全局监听
      const stage = graphic.parent
      if (stage) {
        stage.on('pointermove', onPointerMove)
        stage.on('pointerup', onPointerUp)
        stage.on('pointerupoutside', onPointerUp)
      }

      onDragStart?.(graphic.x, graphic.y)
    })
  }
}
