/**
 * 基础请求工具 — 基于 axios 封装，统一错误处理和响应解析
 */
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T | null
}

export class RequestError extends Error {
  code: number
  constructor(message: string, code: number) {
    super(message)
    this.code = code
    this.name = 'RequestError'
  }
}

/** 创建 axios 实例 */
const http: AxiosInstance = axios.create({
  timeout: 30000,
})

// 响应拦截器：统一处理错误
http.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (axios.isCancel(error)) {
      throw new RequestError('请求已取消', 0)
    }
    if (error.code === 'ECONNABORTED') {
      throw new RequestError('请求超时', 408)
    }
    // 尝试从服务端响应中提取错误信息
    const status = error.response?.status ?? 0
    const msg = error.response?.data?.message || error.message || '网络请求失败'
    throw new RequestError(msg, status > 0 ? status : 0)
  }
)

/**
 * GET 请求
 */
export function get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return http.get(url, config).then(res => res.data)
}

/**
 * POST 请求
 */
export function post<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return http.post(url, data, config).then(res => res.data)
}

/**
 * 带 code/message/data 格式的 API 响应解析
 * 当 code !== 0 时自动抛出 RequestError
 */
export async function apiRequest<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const res = await http.post<ApiResponse<T>>(url, data, config)
  const body = res.data

  if (body.code !== undefined && body.code !== 0) {
    throw new RequestError(body.message || '请求失败', body.code)
  }

  return (body.data ?? body) as unknown as T
}

export default http
