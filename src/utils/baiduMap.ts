import type { ScenicSpot } from '@/types/scenic'

/**
 * 使用百度地图 Marker API 在新标签页打开指定景点的地图标记。
 * 无需 API Key，免费开放使用。
 *
 * 注意：Marker API 的 location 参数格式为 lat,lng（纬度在前），
 * 与 ECharts 的 [lng, lat] 顺序相反。
 */
export function openBaiduMap(spot: ScenicSpot): void {
  const title = encodeURIComponent(spot.name)
  const content = encodeURIComponent(spot.location)
  const url = `https://api.map.baidu.com/marker?location=${spot.lat},${spot.lng}&title=${title}&content=${content}&output=html&src=webapp.henan-tourism`
  window.open(url, '_blank')
}
