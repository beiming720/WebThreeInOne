<template>
  <div class="dashboard">
    <!-- 顶部控制栏 -->
    <header class="dash-header">
      <h1 class="dash-title">📊 中国旅游数据可视化分析平台</h1>
      <div class="dash-controls">
        <div class="control-group">
          <label>高亮省份：</label>
          <el-select v-model="highlightProvince" placeholder="选择省份" size="small" style="width:140px"
            @change="onProvinceChange">
            <el-option v-for="p in provinces" :key="p" :label="p" :value="p" />
          </el-select>
        </div>
        <span class="henan-badge">📍 当前高亮：{{ highlightProvince }}</span>
      </div>
    </header>

    <!-- 图表网格 -->
    <div class="chart-grid">
      <!-- ① 柱状图：各省A级景区数量 -->
      <div class="chart-card">
        <h3 class="card-title">① 各省A级景区数量对比（含等级拆分）</h3>
        <div ref="barChartRef" class="chart-box"></div>
        <div class="chart-info">{{ provinceStats.bar }}</div>
      </div>

      <!-- ② 旭日图：景区等级分布 -->
      <div class="chart-card">
        <h3 class="card-title">② 景区等级分布 · 旭日图</h3>
        <div ref="sunburstRef" class="chart-box"></div>
        <div class="chart-info">{{ provinceStats.sunburst }}</div>
      </div>

      <!-- ③ 平行坐标：多维度综合指标 -->
      <div class="chart-card">
        <h3 class="card-title">③ 旅行社多维度平行坐标分析</h3>
        <div ref="parallelRef" class="chart-box"></div>
        <div class="chart-info">{{ provinceStats.parallel }}</div>
      </div>

      <!-- ④ 趋势折线图：旅游事业费 -->
      <div class="chart-card">
        <h3 class="card-title">④ 文化和旅游事业费趋势（2000-2024）</h3>
        <div ref="lineRef" class="chart-box"></div>
        <div class="chart-info">{{ provinceStats.line }}</div>
      </div>

      <!-- ⑤ K-means聚类散点气泡图 -->
      <div class="chart-card chart-card-tall">
        <h3 class="card-title">⑤ K-Means聚类分析：景区数 × 营业收入（气泡=接待人次，含回归趋势线）</h3>
        <div ref="clusterRef" class="chart-box"></div>
        <div class="chart-info">{{ provinceStats.cluster }}</div>
      </div>

      <!-- ⑥ 动态排名轮播条 -->
      <div class="chart-card chart-card-tall">
        <div class="card-title-row">
          <h3 class="card-title">⑥ 动态排名轮播 · {{ currentRankMetric }}</h3>
          <el-select v-model="activeMetric" placeholder="指标" size="small" style="width:110px" @change="onMetricChange">
            <el-option label="🔄 自动" value="auto" />
            <el-option label="景区总数" value="total" />
            <el-option label="营业收入" value="revenue" />
            <el-option label="接待人次" value="visitors" />
            <el-option label="5A景区数" value="5A" />
          </el-select>
        </div>
        <div ref="rankRef" class="chart-box"></div>
        <div class="chart-info">{{ provinceStats.rank }}</div>
      </div>
    </div>

    <!-- 洞察面板 -->
    <div class="insight-panel">
      <h3>📈 {{ highlightProvince }}旅游数据洞察</h3>
      <div class="insight-grid">
        <div class="insight-item" v-for="ins in provinceInsights" :key="ins.label">
          <span class="insight-label">{{ ins.label }}</span>
          <span class="insight-value" :style="{ color: ins.color }">{{ ins.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'

// ==================== 数据状态 ====================
const highlightProvince = ref('河南')
const activeMetric = ref('auto')
const provinces = ref<string[]>([])
const provinceInsights = ref<{ label: string; value: string; color: string }[]>([])


let scenicRankData: any[] = []
let travelAgencyData: any[] = []
let scenicBasicData: any[] = []
let cultureFundingData: any = { years: [], data: [] }

// ==================== 图表 refs ====================
const barChartRef = ref<HTMLElement>()
const sunburstRef = ref<HTMLElement>()
const parallelRef = ref<HTMLElement>()
const lineRef = ref<HTMLElement>()
const clusterRef = ref<HTMLElement>()
const rankRef = ref<HTMLElement>()

let charts: echarts.ECharts[] = []
let rankTimer: any = null
const currentRankMetric = ref('景区总数排名')
const rankKeys = ['total', 'revenue', 'visitors', '5A']

// ==================== K-Means 聚类算法 ====================
function kMeans(data: number[][], k: number, maxIter = 100): { centroids: number[][]; labels: number[] } {
  const n = data.length
  if (n === 0) return { centroids: [], labels: [] }
  const dim = data[0]?.length ?? 0
  if (dim === 0) return { centroids: [], labels: [] }

  // 随机初始化质心
  const centroids: number[][] = []
  const used = new Set<number>()
  let attempts = 0
  while (centroids.length < k && attempts < n * 10) {
    const idx = Math.floor(Math.random() * n)
    const row = data[idx]
    if (!used.has(idx) && row) {
      used.add(idx)
      centroids.push([...row])
    }
    attempts++
  }
  // 如果随机不够，顺序填充
  for (let i = 0; centroids.length < k && i < n; i++) {
    const row = data[i]
    if (!used.has(i) && row) {
      centroids.push([...row])
    }
  }

  const labels = Array.from({ length: n }, () => 0)
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false
    for (let i = 0; i < n; i++) {
      let minDist = Infinity
      let bestCluster = 0
      const row = data[i]
      if (!row) continue
      for (let j = 0; j < k; j++) {
        const centroid = centroids[j]
        if (!centroid) continue
        let dist = 0
        for (let d = 0; d < dim; d++) {
          dist += ((row[d] ?? 0) - (centroid[d] ?? 0)) ** 2
        }
        if (dist < minDist) {
          minDist = dist
          bestCluster = j
        }
      }
      if (labels[i] !== bestCluster) changed = true
      labels[i] = bestCluster
    }
    if (!changed) break

    // 更新质心
    for (let j = 0; j < k; j++) {
      const centroid = Array.from({ length: dim }, () => 0) as number[]
      centroids[j] = centroid
      let count = 0
      for (let i = 0; i < n; i++) {
        if (labels[i] === j && data[i]) {
          const row = data[i]!
          for (let d = 0; d < dim; d++) centroid[d] = (centroid[d] ?? 0) + (row[d] ?? 0)
          count++
        }
      }
      if (count > 0) {
        for (let d = 0; d < dim; d++) centroid[d] = (centroid[d] ?? 0) / count
      }
    }
  }
  return { centroids, labels }
}

// 简单线性回归
function linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
  const n = x.length
  const xMean = x.reduce((a, b) => a + b, 0) / n
  const yMean = y.reduce((a, b) => a + b, 0) / n
  let numerator = 0, denomX = 0, denomY = 0
  for (let i = 0; i < n; i++) {
    const xi = x[i] ?? 0
    const yi = y[i] ?? 0
    numerator += (xi - xMean) * (yi - yMean)
    denomX += (xi - xMean) ** 2
    denomY += (yi - yMean) ** 2
  }
  const slope = numerator / denomX
  const intercept = yMean - slope * xMean
  const r2 = numerator ** 2 / (denomX * denomY)
  return { slope, intercept, r2 }
}

// ==================== 数据加载 ====================
async function loadData() {
  const [sr, ta, sb, cf] = await Promise.all([
    fetch('/data/scenic_rank.json').then(r => r.json()),
    fetch('/data/travel_agency.json').then(r => r.json()),
    fetch('/data/scenic_basic.json').then(r => r.json()),
    fetch('/data/culture_funding.json').then(r => r.json()),
  ])
  scenicRankData = sr
  travelAgencyData = ta
  scenicBasicData = sb
  cultureFundingData = cf
  provinces.value = sr.filter((d: any) => d.region !== '全国').map((d: any) => d.region).sort()
  refreshProvinceStats()
  updateProvinceInsights()
}

// ==================== 省份图表信息 ====================
function getProvinceStats(p: string) {
  const sr = scenicRankData.find((d: any) => d.region === p)
  const sb = scenicBasicData.find((d: any) => d.region === p)
  const ta = travelAgencyData.find((d: any) => d.region === p)
  const cf = cultureFundingData.data?.find((d: any) => d.region === p)
  const sorted = scenicRankData.filter((d: any) => d.region !== '全国').sort((a: any, b: any) => b.total - a.total)
  const rank = sorted.findIndex((d: any) => d.region === p) + 1
  const revSorted = scenicBasicData.filter((d: any) => d.region !== '全国').sort((a: any, b: any) => b.revenue - a.revenue)
  const revRank = revSorted.findIndex((d: any) => d.region === p) + 1

  return {
    bar: sr ? `${p} · 总计 ${sr.total} 个 · 5A:${sr['5A']} 4A:${sr['4A']} · 全国第${rank}` : '',
    sunburst: sr ? `${p} · 5A:${sr['5A']} · 4A:${sr['4A']} · 3A:${sr['3A']} · 2A:${sr['2A']} · 1A:${sr['1A']}` : '',
    parallel: ta ? `${p} · 机构 ${ta.agencies} 个 · 人员 ${ta.employees} 人 · 营收 ${(ta.revenue / 10000).toFixed(1)} 亿` : '',
    line: cf ? `${p} · 2024年 ${(cf['2024年'] / 10000).toFixed(1)} 亿元 · 2000年 ${(cf['2000年'] / 10000).toFixed(1)} 亿` : '',
    cluster: sb ? `${p} · 景区 ${sb.total} 个 · 营收 ${sb.revenue} 亿 · 人次 ${sb.visitors} 亿 · 营收第${revRank}` : '',
    rank: `${p} · 当前排名: 第${rank} 名`,
  }
}

const provinceStats = ref(getProvinceStats('河南'))

function refreshProvinceStats() {
  provinceStats.value = getProvinceStats(highlightProvince.value)
}

// ==================== 省份数据洞察 ====================
function updateProvinceInsights() {
  const p = highlightProvince.value
  const rank = scenicRankData.find((d: any) => d.region === p)
  const basic = scenicBasicData.find((d: any) => d.region === p)
  const agency = travelAgencyData.find((d: any) => d.region === p)

  const rankTotal = scenicRankData.filter((d: any) => d.region !== '全国').sort((a: any, b: any) => b.total - a.total)
  const pRank = rankTotal.findIndex((d: any) => d.region === p) + 1

  const revRank = scenicBasicData.filter((d: any) => d.region !== '全国').sort((a: any, b: any) => b.revenue - a.revenue)
  const pRevRank = revRank.findIndex((d: any) => d.region === p) + 1

  provinceInsights.value = [
    { label: 'A级景区总数', value: `${rank?.total || '-'} 个（全国第${pRank}）`, color: '#f59e0b' },
    { label: '5A级景区', value: `${rank?.['5A'] || '-'} 个`, color: '#ef4444' },
    { label: '旅游营业收入', value: `${basic?.revenue || '-'} 亿元（全国第${pRevRank}）`, color: '#06b6d4' },
    { label: '接待人次', value: `${basic?.visitors || '-'} 亿人次`, color: '#10b981' },
    { label: '旅行社机构数', value: `${agency?.agencies || '-'} 个`, color: '#f97316' },
  ]
}

// ==================== ① 柱状图：各省景区数量 ====================
function renderBarChart() {
  if (!barChartRef.value) return
  const chart = echarts.init(barChartRef.value)
  const data = scenicRankData.filter((d: any) => d.region !== '全国').sort((a: any, b: any) => b.total - a.total)
  const regions = data.map((d: any) => d.region)
  const totals = data.map((d: any) => d.total)

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const d = data[params[0].dataIndex]
        return `<b>${d.region}</b><br/>总计: ${d.total}<br/>5A: ${d['5A']} | 4A: ${d['4A']}<br/>3A: ${d['3A']} | 2A: ${d['2A']} | 1A: ${d['1A']}`
      }
    },
    grid: { left: 65, right: 30, top: 35, bottom: 55 },
    xAxis: {
      type: 'category', data: regions,
      axisLabel: { rotate: 60, fontSize: 12, color: '#cbd5e1' }
    },
    yAxis: { type: 'value', name: '景区数量', nameLocation: 'center', nameGap: 40, axisLabel: { color: '#94a3b8', fontSize: 11 }, nameTextStyle: { color: '#cbd5e1', fontSize: 12 } },
    series: [{
      type: 'bar', data: totals.map((v: number, i: number) => ({
        value: v,
        itemStyle: { color: regions[i] === highlightProvince.value ? '#f59e0b' : '#4f46e5', borderRadius: [4, 4, 0, 0] }
      })),
      emphasis: { itemStyle: { color: '#fbbf24' } }
    }]
  })
  charts.push(chart)
}

// ==================== ② 旭日图 ====================
function renderSunburst() {
  if (!sunburstRef.value) return
  const chart = echarts.init(sunburstRef.value)
  const data = scenicRankData.filter((d: any) => d.region !== '全国')

  const sunData: any[] = []
  // 只展示前15个省份以保持可读性
  const top15 = [...data].sort((a: any, b: any) => b.total - a.total).slice(0, 15)

  // 计算各等级总数
  const total5A = data.reduce((s: number, d: any) => s + d['5A'], 0)
  const total4A = data.reduce((s: number, d: any) => s + d['4A'], 0)
  const total3A = data.reduce((s: number, d: any) => s + d['3A'], 0)

  sunData.push({
    name: 'A级景区', itemStyle: { color: '#4f46e5' },
    children: [
      {
        name: '5A级', value: total5A, itemStyle: { color: '#ef4444' },
        children: top15.map((d: any) => ({ name: d.region, value: d['5A'], itemStyle: { color: d.region === highlightProvince.value ? '#f59e0b' : undefined } }))
      },
      {
        name: '4A级', value: total4A, itemStyle: { color: '#f97316' },
        children: top15.map((d: any) => ({ name: d.region, value: d['4A'], itemStyle: { color: d.region === highlightProvince.value ? '#f59e0b' : undefined } }))
      },
      {
        name: '3A级', value: total3A, itemStyle: { color: '#06b6d4' },
        children: top15.map((d: any) => ({ name: d.region, value: d['3A'], itemStyle: { color: d.region === highlightProvince.value ? '#f59e0b' : undefined } }))
      },
    ]
  })

  chart.setOption({
    tooltip: { formatter: (p: any) => `${p.name}<br/>个数: ${p.value}` },
    series: [{
      name: '个数', type: 'sunburst', data: sunData, radius: ['12%', '78%'],
      label: { rotate: 'radial', fontSize: 10 },
      itemStyle: { borderRadius: 2, borderWidth: 1, borderColor: '#1e293b' },
      levels: [
        { label: { show: true, formatter: () => '返回', fontSize: 10, color: '#cbd5e1' }, itemStyle: { color: '#374151' } },
        { r0: '12%', r: '35%', label: { fontSize: 12 } },
        { r0: '35%', r: '56%', label: { fontSize: 11 } },
        { r0: '56%', r: '78%', label: { fontSize: 10, overflow: 'truncate', minAngle: 5 } }
      ]
    }]
  })
  charts.push(chart)
}

// ==================== ③ 平行坐标 ====================
function renderParallel() {
  if (!parallelRef.value) return
  const chart = echarts.init(parallelRef.value)

  const rawData = travelAgencyData.filter((d: any) => d.region !== '全国' && d.agencies > 0)

  const parallelData = rawData.map((d: any) => ({
    name: d.region,
    value: [
      d.agencies, d.employees,
      (d.revenue / 10000).toFixed(1),
      (d.domestic / 10000).toFixed(1),
      (d.profit / 10000).toFixed(1)
    ],
    lineStyle: d.region === highlightProvince.value
      ? { color: '#f59e0b', width: 3 }
      : { color: 'rgba(255, 255, 255, 0.8)', width: 1 }
  }))

  chart.setOption({
    tooltip: { trigger: 'item' },
    parallelAxis: [
      { dim: 0, name: '机构数', type: 'value', axisLabel: { fontSize: 12, color: '#94a3b8' } },
      { dim: 1, name: '从业人员', type: 'value', axisLabel: { fontSize: 12, color: '#94a3b8' } },
      { dim: 2, name: '营收(亿元)', type: 'value', axisLabel: { fontSize: 12, color: '#94a3b8' } },
      { dim: 3, name: '国内旅游营收(亿元)', type: 'value', axisLabel: { fontSize: 12, color: '#94a3b8' } },
      { dim: 4, name: '利润(亿元)', type: 'value', axisLabel: { fontSize: 12, color: '#94a3b8' } },
    ],
    parallel: {
      left: 85, right: 65, top: 40, bottom: 45,
      parallelAxisDefault: { nameTextStyle: { color: '#cbd5e1', fontSize: 13 } }
    },
    series: [{ type: 'parallel', data: parallelData }]
  })
  charts.push(chart)
}

// ==================== ④ 趋势折线图 ====================
const provinceNeighbors: Record<string, string[]> = {
  '河南': ['湖北', '安徽', '山东', '陕西', '山西', '河北'],
  '河北': ['北京', '天津', '山西', '河南', '山东', '辽宁', '内蒙古'],
  '山西': ['河北', '河南', '陕西', '内蒙古'],
  '山东': ['河北', '河南', '安徽', '江苏'],
  '湖北': ['河南', '安徽', '江西', '湖南', '重庆', '陕西'],
  '安徽': ['河南', '湖北', '江苏', '浙江', '江西', '山东'],
  '陕西': ['河南', '山西', '湖北', '甘肃', '四川', '宁夏', '内蒙古'],
  '江苏': ['山东', '安徽', '浙江', '上海'],
  '浙江': ['江苏', '安徽', '福建', '江西', '上海'],
  '湖南': ['湖北', '江西', '广东', '广西', '贵州', '重庆'],
  '四川': ['陕西', '甘肃', '青海', '西藏', '云南', '贵州', '重庆'],
  '广东': ['湖南', '江西', '福建', '广西', '海南'],
  '北京': ['河北', '天津'],
  '天津': ['北京', '河北'],
  '上海': ['江苏', '浙江'],
  '重庆': ['四川', '湖北', '湖南', '贵州'],
  '辽宁': ['河北', '吉林', '内蒙古'],
  '吉林': ['辽宁', '黑龙江', '内蒙古'],
  '黑龙江': ['吉林', '内蒙古'],
  '内蒙古': ['黑龙江', '吉林', '辽宁', '河北', '山西', '陕西', '宁夏', '甘肃'],
  '江西': ['湖北', '安徽', '浙江', '福建', '广东', '湖南'],
  '福建': ['浙江', '江西', '广东'],
  '广西': ['广东', '湖南', '贵州', '云南'],
  '贵州': ['重庆', '四川', '云南', '广西', '湖南'],
  '云南': ['四川', '贵州', '广西', '西藏'],
  '西藏': ['新疆', '青海', '四川', '云南'],
  '新疆': ['西藏', '青海', '甘肃'],
  '甘肃': ['新疆', '青海', '四川', '陕西', '宁夏', '内蒙古'],
  '青海': ['新疆', '甘肃', '四川', '西藏'],
  '宁夏': ['内蒙古', '陕西', '甘肃'],
  '海南': ['广东'],
}

function renderLineChart() {
  if (!lineRef.value) return
  const chart = echarts.init(lineRef.value)
  const { years, data } = cultureFundingData
  const p = highlightProvince.value
  const national = data.find((d: any) => d.region === '全国')
  const selected = data.find((d: any) => d.region === p)
  const neighbors = provinceNeighbors[p] || []
  const neighborData = data.filter((d: any) => neighbors.includes(d.region))
  const neighborAvg = years.map((_y: string, i: number) => {
    const sum = neighborData.reduce((s: number, d: any) => s + (d[years[i]] || 0), 0)
    return (sum / (neighborData.length || 1)).toFixed(0)
  })

  const yearLabels = years.map((y: string) => y.replace('年', ''))

  chart.setOption({
    tooltip: { trigger: 'axis', valueFormatter: (v: any) => (v / 10000).toFixed(1) + ' 亿元' },
    legend: { top: 5, textStyle: { color: '#cbd5e1', fontSize: 13 } },
    grid: { left: 80, right: 30, top: 45, bottom: 30 },
    xAxis: { type: 'category', data: yearLabels, axisLabel: { color: '#94a3b8', fontSize: 12 } },
    yAxis: { type: 'value', name: '亿元', axisLabel: { color: '#94a3b8', fontSize: 11, formatter: (v: number) => (v / 10000).toFixed(1) }, nameTextStyle: { color: '#cbd5e1', fontSize: 12 } },
    series: [
      {
        name: '全国', type: 'line',
        data: years.map((y: string) => national?.[y] || 0),
        lineStyle: { color: '#94a3b8', type: 'dashed', width: 1.5 }, itemStyle: { color: '#94a3b8' }, symbol: 'none'
      },
      {
        name: p, type: 'line',
        data: years.map((y: string) => selected?.[y] || 0),
        lineStyle: { color: '#f59e0b', width: 3 }, itemStyle: { color: '#f59e0b' },
        symbol: 'circle', symbolSize: 6, areaStyle: { color: 'rgba(245,158,11,0.1)' }
      },
      {
        name: '邻省均值', type: 'line',
        data: neighborAvg,
        lineStyle: { color: '#06b6d4', type: 'dashed', width: 1.5 }, itemStyle: { color: '#06b6d4' }, symbol: 'diamond', symbolSize: 5
      }
    ]
  })
  charts.push(chart)
}

// ==================== ⑤ K-Means 聚类散点图 ====================
function renderClusterChart() {
  if (!clusterRef.value) return
  const chart = echarts.init(clusterRef.value)

  const data = scenicBasicData.filter((d: any) => d.region !== '全国' && d.total > 0 && d.revenue > 0)
  if (data.length === 0) return
  const raw = data.map((d: any) => [d.total, d.revenue, d.visitors, d.employees])

  // 归一化
  const firstRow = raw[0]!
  const mins = firstRow.map((_: any, i: number) => Math.min(...raw.map(r => r[i] ?? 0)))
  const maxs = firstRow.map((_: any, i: number) => Math.max(...raw.map(r => r[i] ?? 0)))
  const normalized = raw.map(r => r.map((v, i) => (v - (mins[i] ?? 0)) / ((maxs[i] ?? 0) - (mins[i] ?? 0) || 1)))

  // K-means (k=4)
  const { labels } = kMeans(normalized, 4)

  // 线性回归
  const xVals = data.map((d: any) => d.total)
  const yVals = data.map((d: any) => d.revenue)
  const reg = linearRegression(xVals, yVals)

  // 回归线
  const xMin = Math.min(...xVals)
  const xMax = Math.max(...xVals)
  const regLine: [number, number][] = [
    [xMin, reg.slope * xMin + reg.intercept],
    [xMax, reg.slope * xMax + reg.intercept]
  ]

  const clusterColors = ['#ef4444', '#06b6d4', '#10b981', '#8b5cf6']
  const seriesData = data.map((d: any, i: number) => ({
    name: d.region,
    value: [d.total, d.revenue, d.visitors * 100, d.employees * 10],
    itemStyle: {
      color: d.region === highlightProvince.value ? '#f59e0b' : (clusterColors[labels[i] ?? 0] ?? '#4f46e5'),
      borderColor: d.region === highlightProvince.value ? '#fff' : 'transparent',
      borderWidth: d.region === highlightProvince.value ? 2 : 0,
      shadowBlur: d.region === highlightProvince.value ? 10 : 0,
      shadowColor: 'rgba(245,158,11,0.5)'
    },
    label: {
      show: d.region === highlightProvince.value || data.length <= 12,
      formatter: d.region, position: 'top', fontSize: 12, color: '#cbd5e1'
    }
  }))

  chart.setOption({
    tooltip: {
      formatter: (p: any) => {
        const idx = p.dataIndex ?? 0
        const d = data[idx]
        return `<b>${d.region}</b><br/>景区数: ${d.total}<br/>营收: ${d.revenue}亿元<br/>人次: ${d.visitors}亿<br/>聚类: 第${(labels[idx] ?? 0) + 1}组`
      }
    },
    legend: { top: 0, textStyle: { color: '#94a3b8', fontSize: 12 } },
    grid: { left: 60, right: 30, top: 50, bottom: 35 },
    xAxis: { type: 'value', name: 'A级景区总数', axisLabel: { color: '#94a3b8', fontSize: 11 }, nameTextStyle: { color: '#cbd5e1', fontSize: 12 }, nameLocation: 'center', nameGap: 25 },
    yAxis: { type: 'value', name: '营业收入(亿元)', nameLocation: 'center', nameGap: 42, axisLabel: { color: '#94a3b8', fontSize: 11 }, nameTextStyle: { color: '#cbd5e1', fontSize: 12 } },
    series: [
      {
        type: 'scatter', data: seriesData, symbolSize: (val: number[]) => Math.max(6, Math.min((val[2] ?? 10) / 5, 40)),
        emphasis: { scale: 1.5 }
      },
      {
        name: `趋势线 R²=${reg.r2.toFixed(2)}`, type: 'line', data: regLine,
        lineStyle: { color: '#f59e0b', type: 'dashed', width: 1.5 },
        symbol: 'none', silent: true, z: 1
      }
    ]
  })
  charts.push(chart)
  // 确保画布尺寸匹配新容器
  requestAnimationFrame(() => chart.resize())
}

// ==================== ⑥ 动态排名轮播 ====================
let rankChart: echarts.ECharts | null = null

function renderRankChart(metric?: string) {
  if (!rankRef.value) return

  // 首次初始化，后续复用实例保持动画
  if (!rankChart || rankChart.isDisposed()) {
    rankChart = echarts.init(rankRef.value)
    charts.push(rankChart)
  }

  const metricKey = metric || 'total'
  const metricNames: Record<string, string> = {
    total: '景区总数排名', revenue: '营业收入排名', visitors: '接待人次排名', '5A': '5A景区数排名'
  }
  currentRankMetric.value = metricNames[metricKey] || '景区总数排名'

  let data: any[]
  if (metricKey === 'total' || metricKey === '5A') {
    data = scenicRankData.filter((d: any) => d.region !== '全国').map((d: any) => ({
      name: d.region, value: d[metricKey] || 0
    }))
  } else {
    data = scenicBasicData.filter((d: any) => d.region !== '全国').map((d: any) => ({
      name: d.region, value: d[metricKey] || 0
    }))
  }

  data.sort((a: any, b: any) => b.value - a.value)
  const top15 = data.slice(0, 15)
  const names = top15.map((d: any) => d.name).reverse()
  const values = top15.map((d: any) => d.value).reverse()

  rankChart.setOption({
    animationDuration: 600,
    animationDurationUpdate: 800,
    animationEasing: 'cubicInOut',
    animationEasingUpdate: 'cubicInOut',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 10, right: 10, top: 5, bottom: 15, containLabel: true },
    xAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 12 } },
    yAxis: {
      type: 'category', data: names,
      axisLabel: { color: '#cbd5e1', fontSize: 12, fontWeight: 'bold', width: 65, overflow: 'truncate' }
    },
    series: [{
      type: 'bar', data: values.map((v: number, i: number) => ({
        value: v,
        itemStyle: {
          color: names[i] === highlightProvince.value ? '#f59e0b' : '#4f46e5',
          borderRadius: [0, 4, 4, 0]
        }
      })),
      barMaxWidth: 24,
      label: { show: true, position: 'right', color: '#cbd5e1', fontSize: 12 }
    }]
  })
}

// ==================== 动态轮播 ====================
function startRankRotation() {
  let idx = 1  // 从第二个开始，初始渲染已展示第一个
  // 立即展示（不等待 4s）
  renderRankChart(rankKeys[idx])
  // 后续每 4 秒轮播
  rankTimer = setInterval(() => {
    idx = (idx + 1) % rankKeys.length
    renderRankChart(rankKeys[idx])
  }, 4000)
}

// ==================== 全量渲染 ====================
function renderAllCharts() {
  // 清理旧图表
  charts.forEach(c => c.dispose())
  charts = []
  rankChart = null
  renderBarChart()
  renderSunburst()
  renderParallel()
  renderLineChart()
  renderClusterChart()
  renderRankChart('total')  // 初始展示"景区总数排名"
  // 兜底刷新洞察面板
  updateProvinceInsights()
  refreshProvinceStats()
}

function onMetricChange(val: string) {
  if (val === 'auto') {
    // 恢复自动轮播
    if (rankTimer) clearInterval(rankTimer)
    startRankRotation()
  } else {
    // 手动选择 → 停止轮播，展示该指标
    if (rankTimer) clearInterval(rankTimer)
    renderRankChart(val)
  }
}

function onProvinceChange() {
  refreshProvinceStats()
  updateProvinceInsights()
  // 省份切换需全部重绘
  charts.forEach(c => c.dispose())
  charts = []
  rankChart = null
  renderBarChart()
  renderSunburst()
  renderParallel()
  renderLineChart()
  renderClusterChart()
  if (activeMetric.value === 'auto') {
    if (rankTimer) clearInterval(rankTimer)
    startRankRotation()
  } else {
    renderRankChart(activeMetric.value)
  }
}

// ==================== 生命周期 ====================
onMounted(async () => {
  await loadData()
  await nextTick()
  renderAllCharts()
  startRankRotation()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  charts.forEach(c => c.dispose())
  if (rankTimer) clearInterval(rankTimer)
  window.removeEventListener('resize', handleResize)
})

const handleResize = () => {
  // 等容器布局更新后再 resize ECharts
  requestAnimationFrame(() => {
    charts.forEach(c => {
      try { c.resize() } catch { /* 忽略已销毁实例 */ }
    })
  })
}
</script>

<style scoped lang="scss">
.dashboard {
  min-height: calc(100vh - 3.75rem);
  max-width: 100vw;
  // background: #0f172a;
  background-image: linear-gradient(to right, #355C7D, #6C5B7B, #C06C84);
  padding: 16px 20px 24px;
  overflow-x: hidden;
  overflow-y: auto;
  box-sizing: border-box;
}

.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 20px;
  background: #040c38b2;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 16px;
}

.dash-title {
  font-size: clamp(16px, 1.25rem, 24px);
  font-weight: 800;
  color: #f5d1f2;
  letter-spacing: 2px;
  text-shadow: 0 0 20px rgba(233, 150, 122, 0.3);
}

.dash-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 6px;

  label {
    color: #94a3b8;
    font-size: 12px;
    white-space: nowrap;
  }
}

.henan-badge {
  padding: 4px 14px;
  background: linear-gradient(135deg, #92400e, #f59e0b);
  color: #fff;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 600;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-bottom: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  background: #040c38b2;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

.card-title {
  font-size: 13px;
  font-weight: 700;
  color: #cbd5e1;
  margin-bottom: 0;
  letter-spacing: 1px;
  flex-shrink: 0;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.chart-box {
  flex: 1;
  min-height: 300px;
  min-width: 0;
  width: 100%;
}

.chart-info {
  position: absolute;
  bottom: 6px;
  left: 10px;
  padding: 3px 10px;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-size: 11px;
  letter-spacing: 0.5px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 5;
  backdrop-filter: blur(4px);
  max-width: calc(100% - 20px);
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 高卡片：聚类散点 & 动态排名 */
.chart-card-tall .chart-box {
  min-height: 460px;
}

/* 洞察面板 */
.insight-panel {
  background: #040c38b2;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 16px 20px;

  h3 {
    color: #f5d1f2;
    font-size: 15px;
    margin-bottom: 12px;
    letter-spacing: 2px;
  }
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.insight-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.insight-label {
  font-size: 11px;
  color: #94a3b8;
}

.insight-value {
  font-size: 16px;
  font-weight: 800;
}
</style>
