/**
 * 地图 JSON 数据 API
 * 用于 ECharts 地图下钻（城市组件）
 */
import { get } from '@/utils/request'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fetchChinaMap(): Promise<any> {
  return get('/map/china.json')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fetchHenanMap(): Promise<any> {
  return get('/map/henan.json')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fetchCityMap(city: string): Promise<any> {
  return get(`/map/${city}.json`)
}

/**
 * 一次获取多个地图数据（中国 + 河南 + 指定城市）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchMapData(city: string): Promise<[any, any, any]> {
  return Promise.all([
    fetchChinaMap(),
    fetchHenanMap(),
    fetchCityMap(city),
  ])
}
