import type { RecognitionRecord } from '@/types/recognition'

const STORAGE_KEY = 'recognition_history'

/** 读取全部识别历史（最新在前） */
export function getHistory(): RecognitionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** 追加一条识别记录到头部 */
export function addRecord(record: RecognitionRecord): void {
  const list = getHistory()
  list.unshift(record)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

/** 清空所有记录 */
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}
