/**
 * 模型可解释性 API
 * 用于 ModelExplainPanel（RecognitionView 第二屏）
 */
import { get } from '@/utils/request'
import type { ApiResponse } from '@/utils/request'

/** 后端基地址 */
const MODEL_API_BASE = 'http://localhost:5000'

// ============ 类型定义 ============

/** 模型结构层节点 */
export interface ModelLayer {
  name: string
  type: string
  out_shape: number[]
  params: number
  trainable: boolean
  detail?: string
  children?: ModelLayer[]
}

/** 模型结构信息 */
export interface ModelStructure {
  model_type: string
  total_params: number
  trainable_params: number
  input_shape: number[]
  output_classes: number
  layers: ModelLayer[]
}

/** 训练历史曲线 */
export interface TrainingHistory {
  model_type: string
  total_epochs: number
  epochs: number[]
  train_loss: number[]
  val_loss: number[]
  train_acc: number[]
  val_acc: number[]
  lr?: number[]
}

/** Grad-CAM 结果 */
export interface GradCAMResult {
  original: string
  heatmap: string
  overlay: string
  predicted_class: number
  predicted_name: string
  target_class: number
  top5: { class_id: number; class_name: string; prob: number }[]
  target_layer: string
  alpha: number
}

/** t-SNE 散点数据点 */
export interface FeaturePoint {
  x: number
  y: number
  class_id: number
  class_name: string
  sample_index: number
}

/** t-SNE 类别质心 */
export interface FeatureClass {
  class_id: number
  class_name: string
  count: number
  centroid_x: number
  centroid_y: number
}

/** t-SNE 完整数据 */
export interface FeatureData {
  method: string
  n_samples: number
  points: FeaturePoint[]
  classes: FeatureClass[]
}

// ============ API 函数 ============

/**
 * GET 请求并解包 {code, message, data} 格式
 * 后端统一返回 ApiResponse<T>，此函数自动解包 data
 */
async function apiGet<T>(url: string): Promise<T> {
  const res = await get<ApiResponse<T>>(url)

  // 防御：校验响应体存在且为对象
  if (!res || typeof res !== 'object') {
    throw new Error('接口返回数据格式异常')
  }

  if (res.code !== undefined && res.code !== 0) {
    throw new Error(res.message || '请求失败')
  }
  return res.data as T
}

/** 获取 ResNet50 模型结构 */
export function getModelStructure(): Promise<ModelStructure> {
  return apiGet<ModelStructure>(`${MODEL_API_BASE}/api/model/structure`)
}

/** 获取训练历史曲线数据 */
export function getTrainingHistory(): Promise<TrainingHistory> {
  return apiGet<TrainingHistory>(`${MODEL_API_BASE}/api/model/training`)
}

/** 生成 Grad-CAM 热力图 */
export async function getGradCAM(params: {
  image?: File
  sampleIndex?: number
  targetLayer?: string
  targetClass?: number
  alpha?: number
}): Promise<GradCAMResult> {
  // 后端 Grad-CAM 是 GET 接口，参数放 URL query
  // 上传图片的情况暂不支持（需要后端改为 POST）
  const q = new URLSearchParams()
  if (params.sampleIndex !== undefined) q.set('sample_index', String(params.sampleIndex))
  if (params.targetLayer) q.set('target_layer', params.targetLayer)
  if (params.targetClass !== undefined) q.set('target_class', String(params.targetClass))
  if (params.alpha !== undefined) q.set('alpha', String(params.alpha))

  const res = await get<ApiResponse<GradCAMResult>>(`${MODEL_API_BASE}/api/model/gradcam?${q.toString()}`, {
    timeout: 30000,
  })
  if (!res || typeof res !== 'object') {
    throw new Error('Grad-CAM 接口返回数据格式异常')
  }
  if (res.code !== undefined && res.code !== 0) {
    throw new Error(res.message || 'Grad-CAM 请求失败')
  }
  return res.data as GradCAMResult
}

/** 获取 t-SNE / PCA 特征降维数据 */
export function getFeatures(params: {
  nSamples?: number
  perplexity?: number
  method?: 'tsne' | 'pca'
}): Promise<FeatureData> {
  const q = new URLSearchParams()
  if (params.nSamples) q.set('n_samples', String(params.nSamples))
  if (params.perplexity) q.set('perplexity', String(params.perplexity))
  if (params.method) q.set('method', params.method)
  return apiGet<FeatureData>(`${MODEL_API_BASE}/api/model/features?${q.toString()}`)
}
