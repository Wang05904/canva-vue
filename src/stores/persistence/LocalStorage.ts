export class LocalStorage {
  private prefix: string

  constructor(prefix: string = 'canvas_') {
    this.prefix = prefix
  }

  /** 拼接 key，避免冲突 */
  private buildKey(key: string) {
    return `${this.prefix}${key}`
  }

  /** 保存数据 */
  set<T>(key: string, value: T) {
    try {
      localStorage.setItem(this.buildKey(key), JSON.stringify(value))
    } catch (e) {
      console.error('LocalStorage 写入失败：', e)
    }
  }

  /** 读取数据 */
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(this.buildKey(key))
      if (!raw) return fallback
      return JSON.parse(raw)
    } catch (e) {
      console.error('LocalStorage 读取失败：', e)
      return fallback
    }
  }

  /** 删除键 */
  remove(key: string) {
    localStorage.removeItem(this.buildKey(key))
  }
}
