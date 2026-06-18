/**
 * 旅游数据 API
 * 用于 EchartView 数据大屏
 */
import { get } from '@/utils/request'

// ==================== 数据类型 ====================
export interface ScenicRankItem {
  region: string
  total: number
  '5A': number
  '4A': number
  '3A': number
  '2A': number
  '1A': number
}

export interface ScenicBasicItem {
  region: string
  total: number
  employees: number
  visitors: number
  revenue: number
  ticketRevenue: number
}

export interface TravelAgencyItem {
  region: string
  agencies: number
  employees: number
  revenue: number
  domestic: number
  inbound: number
  outbound: number
  profit: number
}

export interface CultureFundingItem {
  region: string
  [year: string]: number | string
}

export interface CultureFundingData {
  years: string[]
  data: CultureFundingItem[]
}

// ==================== API 方法 ====================
export function fetchScenicRank(): Promise<ScenicRankItem[]> {
  return get<ScenicRankItem[]>('/data/scenic_rank.json')
}

export function fetchTravelAgency(): Promise<TravelAgencyItem[]> {
  return get<TravelAgencyItem[]>('/data/travel_agency.json')
}

export function fetchScenicBasic(): Promise<ScenicBasicItem[]> {
  return get<ScenicBasicItem[]>('/data/scenic_basic.json')
}

export function fetchCultureFunding(): Promise<CultureFundingData> {
  return get<CultureFundingData>('/data/culture_funding.json')
}

/**
 * 一次加载所有旅游数据
 */
export interface AllTourismData {
  scenicRank: ScenicRankItem[]
  travelAgency: TravelAgencyItem[]
  scenicBasic: ScenicBasicItem[]
  cultureFunding: CultureFundingData
}

export async function fetchAllTourismData(): Promise<AllTourismData> {
  const [scenicRank, travelAgency, scenicBasic, cultureFunding] = await Promise.all([
    fetchScenicRank(),
    fetchTravelAgency(),
    fetchScenicBasic(),
    fetchCultureFunding(),
  ])

  return { scenicRank, travelAgency, scenicBasic, cultureFunding }
}

// ==================== 花卉合格数据 ====================

export interface FlowerVariety {
  name: string
  icon: string
  family: string
}

export interface FlowerQualifiedItem {
  qualified: number
  inspected: number
  rate: number
}

export interface FlowerRegion {
  city: string
  data: Record<string, FlowerQualifiedItem> | null
}

export interface FlowerQualificationData {
  title: string
  description: string
  year: number
  source: string
  varieties: FlowerVariety[]
  regions: FlowerRegion[]
  summary: {
    totalInspected: number
    totalQualified: number
    overallRate: number
    topCityByRate: string
    topCityByVolume: string
    topVarietyByVolume: string
  }
}

/** 获取河南省花卉苗木合格数量分布数据 */
export function fetchFlowerQualification(): Promise<FlowerQualificationData> {
  return get<FlowerQualificationData>('/data/henan_flower_qualification.json')
}
