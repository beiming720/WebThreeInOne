/**
 * 花卉识别 API
 * 用于 RecognitionView
 */
import { apiRequest, get } from '@/utils/request'

/** 花卉识别结果 */
export interface FlowerIdentifyResult {
  name: string
  latin: string
  confidence: number
  desc: string
}

/** API 基地址 */
const FLOWER_API_BASE = 'http://localhost:5000'

/**
 * 识别花卉图片
 * @param file 用户上传的花卉图片文件
 */
export async function identifyFlower(file: File): Promise<FlowerIdentifyResult> {
  const formData = new FormData()
  formData.append('image', file)

  return apiRequest<FlowerIdentifyResult>(
    `${FLOWER_API_BASE}/api/flower/identify`,
    formData,
    { timeout: 30000 }
  )
}

/**
 * 健康检查
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const res = await get<{ code: number }>(`${FLOWER_API_BASE}/api/health`)
    return res.code === 0
  } catch {
    return false
  }
}
