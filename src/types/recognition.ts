/** 识别记录，供 RecognitionView（写入）和 UserRecognitionHistory（读取）共用 */
export interface RecognitionRecord {
  id: string
  imageUrl: string
  flowerName: string
  /** 0-1 归一化值，UI 渲染时需 ×100 */
  confidence: number
  /** ISO 时间字符串 */
  createdAt: string
}
