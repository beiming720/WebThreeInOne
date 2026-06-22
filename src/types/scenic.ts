/** 单个景点数据 */
export interface ScenicSpot {
  name: string
  image: string
  description: string
  /** 文字地址，同时用作百度地图 Marker API 的 content 参数 */
  location: string
  tag: string
  /** 纬度 */
  lat: number
  /** 经度 */
  lng: number
}
