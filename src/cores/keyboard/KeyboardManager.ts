/**
 * Cores层-键盘事件管理器
 * 功能：提供底层键盘事件系统，支持快捷键注册
 * 职责：
 * 1. 提供统一的键盘事件监听
 * 2. 支持快捷键注册
 * 3. 处理快捷键优先级
 *
 */

export type KeyboardHandler = (event: KeyboardEvent) => void | boolean

export interface KeyboardShortcut {
  key: string
  handler: KeyboardHandler
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  description?: string
  priority?: number // 优先级，数字越大越优先
}

/**
 * 键盘管理器类
 * 提供键盘快捷键注册和管理功能
 */
export class KeyboardManager {
  private shortcuts: Map<string, KeyboardShortcut[]> = new Map()
  private isListening: boolean = false

  /**
   * 生成快捷键唯一标识
   */
  private getShortcutKey(shortcut: Omit<KeyboardShortcut, 'handler' | 'description' | 'priority'>): string {
    const modifiers: string[] = []
    if (shortcut.ctrl) modifiers.push('ctrl')
    if (shortcut.meta) modifiers.push('meta')
    if (shortcut.shift) modifiers.push('shift')
    if (shortcut.alt) modifiers.push('alt')
    return [...modifiers, shortcut.key.toLowerCase()].join('+')
  }

  /**
   * 检查键盘事件是否匹配快捷键
   */
  private matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    const key = event.key.toLowerCase()
    const code = event.code.toLowerCase()
    const shortcutKey = shortcut.key.toLowerCase()

    // 匹配按键（支持 key 和 code）
    const keyMatches = key === shortcutKey || code === shortcutKey

    // 匹配修饰键
    const ctrlMatches = !!shortcut.ctrl === (event.ctrlKey || event.metaKey)
    const shiftMatches = !!shortcut.shift === event.shiftKey
    const altMatches = !!shortcut.alt === event.altKey

    return keyMatches && ctrlMatches && shiftMatches && altMatches
  }

  /**
   * 注册快捷键
   */
  register(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut)

    if (!this.shortcuts.has(key)) {
      this.shortcuts.set(key, [])
    }

    const list = this.shortcuts.get(key)!
    list.push(shortcut)

    // 按优先级排序（高优先级在前）
    list.sort((a, b) => (b.priority || 0) - (a.priority || 0))
  }

  /**
   * 全局键盘事件处理器
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    // 遍历所有已注册的快捷键
    for (const [, list] of this.shortcuts) {
      for (const shortcut of list) {
        if (this.matchesShortcut(event, shortcut)) {
          // 执行处理器，如果返回 false 则停止传播
          const result = shortcut.handler(event)
          if (result === false) {
            return
          }
        }
      }
    }
  }

  /**
   * 开始监听键盘事件
   */
  startListening(): void {
    if (!this.isListening) {
      window.addEventListener('keydown', this.handleKeyDown)
      this.isListening = true
    }
  }
}
