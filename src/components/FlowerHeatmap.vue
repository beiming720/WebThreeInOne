<template>
  <div class="heatmap-card">
    <!-- Header -->
    <div class="heatmap-header">
      <h3 class="heatmap-title">
        {{ flowerData?.title || '河南省花卉数量分布' }}
      </h3>

    </div>

    <!-- Error state -->
    <div v-if="loadError" class="error-state">
      <span>⚠️</span>
      <p>数据加载失败，请刷新页面重试</p>
    </div>

    <!-- Body: variety panel + map -->
    <div v-else class="heatmap-body">
      <div class="variety-panel">
        <div class="panel-title">品种筛选</div>
        <div class="variety-list">
          <div class="variety-item" :class="{ active: selectedVariety === '全部' }" @click="selectVariety('全部')">
            <span class="variety-name">全部品种</span>
            <span class="variety-total">{{ totalAllQualified }}</span>
          </div>
          <div v-for="v in varietiesWithTotal" :key="v.name" class="variety-item"
            :class="{ active: selectedVariety === v.name }" @click="selectVariety(v.name)">
            <el-icon class="variety-icon">
              <component :is="v.icon" />
            </el-icon>
            <span class="variety-name">{{ v.name }}</span>
            <span class="variety-total">{{ v.provinceTotal }}</span>
          </div>
        </div>
      </div>

      <div class="map-area">
        <div v-if="loading" class="map-loading">加载中...</div>
        <div ref="mapChartRef" class="map-chart" v-show="!loading"></div>
        <div class="legend-hint" v-if="!loading">
          <span class="legend-label">低</span>
          <div class="legend-bar"></div>
          <span class="legend-label">高</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="flowerData && !loadError" class="heatmap-footer">
      <span style="color: #666;">📍 产量之最：{{ flowerData.summary.topCityByVolume }}</span>
      <span style="color: #666;">📈 合格率之最：{{ flowerData.summary.topCityByRate }}</span>
      <span style="color: #666;">🌿 品种之最：{{ flowerData.summary.topVarietyByVolume }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { fetchHenanMap } from '@/api/map'
import { fetchFlowerQualification } from '@/api/data'
import type { FlowerQualificationData, FlowerVariety } from '@/api/data'

// ==================== 状态 ====================
const mapChartRef = ref<HTMLElement>()
let mapChart: echarts.ECharts | null = null

const flowerData = ref<FlowerQualificationData | null>(null)
const selectedVariety = ref<string>('全部')
const loadError = ref(false)
const loading = ref(true)

// ==================== 计算属性 ====================

const varietiesWithTotal = computed(() => {
  const data = flowerData.value
  if (!data) return []
  return data.varieties.map((v: FlowerVariety) => {
    let total = 0
    for (const r of data.regions) {
      const item = r.data?.[v.name]
      if (item) {
        total += item.qualified
      }
    }
    return { ...v, provinceTotal: formatNum(total) }
  })
})

const totalAllQualified = computed(() => {
  if (!flowerData.value) return '0'
  return formatNum(flowerData.value.summary.totalQualified)
})

// ==================== 工具函数 ====================

function formatNum(n: number): string {
  return n.toLocaleString('zh-CN')
}

// ==================== 品种切换 ====================

function selectVariety(name: string) {
  selectedVariety.value = name
}

watch(selectedVariety, () => {
  updateMapData()
})

// ==================== 地图渲染 ====================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMapSeriesData(): any[] {
  if (!flowerData.value) return []

  const data = flowerData.value
  const variety = selectedVariety.value
  const regions = data.regions

  return regions.map((r) => {
    let value: number | undefined
    let rate: number | undefined
    let inspected: number | undefined

    if (variety === '全部') {
      if (r.data) {
        value = 0
        let totalInspected = 0
        let totalRate = 0
        const entries = Object.values(r.data)
        for (const e of entries) {
          value += e.qualified
          totalInspected += e.inspected
          totalRate += e.rate
        }
        rate = entries.length > 0 ? totalRate / entries.length : undefined
        inspected = totalInspected
      }
    } else {
      if (r.data && r.data[variety]) {
        value = r.data[variety].qualified
        rate = r.data[variety].rate
        inspected = r.data[variety].inspected
      }
    }

    return {
      name: r.city,
      value,
      rate,
      inspected,
    }
  })
}

function getVisualMapRange() {
  const data = buildMapSeriesData()
  const values = data
    .filter((d) => d.value != null)
    .map((d) => d.value as number)
  if (values.length === 0) return { min: 0, max: 100 }
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  }
}

async function initMap() {
  if (!mapChartRef.value) return

  try {
    const [henanJson, flower] = await Promise.all([
      fetchHenanMap(),
      fetchFlowerQualification(),
    ])

    flowerData.value = flower

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    echarts.registerMap('henan', henanJson as any)

    // 必须先让 div 可见，否则 echarts.init 在零尺寸元素上会失败
    loading.value = false
    await nextTick()

    mapChart = echarts.init(mapChartRef.value)
    renderMap()

    window.addEventListener('resize', handleResize)
  } catch (e) {
    console.error('花卉热力图加载失败:', e)
    loadError.value = true
  }
}

function renderMap() {
  if (!mapChart) return

  const { min, max } = getVisualMapRange()
  const seriesData = buildMapSeriesData()

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter(params: any) {
        const d = params.data
        if (d && d.value != null) {
          const variety = selectedVariety.value
          const label = variety === '全部' ? '全部品种' : variety
          return [
            `<strong>${params.name}</strong>`,
            `品种：${label}`,
            `合格数量：${formatNum(d.value)}`,
            `检验批次：${d.inspected ? formatNum(d.inspected) : '-'}`,
            `合格率：${d.rate ? d.rate.toFixed(1) + '%' : '-'}`,
          ].join('<br/>')
        }
        return `<strong>${params.name}</strong><br/>暂无数据`
      },
    },
    visualMap: {
      type: 'continuous',
      min: min,
      max: max,
      text: ['高', '低'],
      textStyle: { color: '#888' },
      left: 'right',
      bottom: 30,
      itemWidth: 14,
      itemHeight: 120,
      inRange: {
        color: ['#f0fdf4', '#86efac', '#22c55e', '#15803d', '#052e16'],
      },
      calculable: true,
    },
    series: [
      {
        name: '花卉合格数量',
        type: 'map',
        map: 'henan',
        roam: true,
        zoom: 1.15,
        scaleLimit: { min: 0.8, max: 5 },
        label: {
          show: true,
          color: '#000',
          fontSize: 11,
          formatter: '{b}',
        },
        emphasis: {
          label: {
            show: true,
            color: '#fff',
            fontSize: 13,
            fontWeight: 'bold',
          },
          itemStyle: {
            areaColor: '#fbbf24',
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.3)',
          },
        },
        itemStyle: {
          areaColor: '#f0f0f0',
          borderColor: '#d4d4d4',
          borderWidth: 1,
        },
        universalTransition: true,
        animationDurationUpdate: 300,
        animationEasingUpdate: 'cubicInOut',
        data: seriesData,
      },
    ],
  }

  mapChart.setOption(option, true)
}

function updateMapData() {
  if (!mapChart) return

  const { min, max } = getVisualMapRange()
  const seriesData = buildMapSeriesData()

  mapChart.setOption({
    visualMap: { min, max },
    series: [{ data: seriesData }],
  })
}

// ==================== 生命周期 ====================

function handleResize() {
  try {
    mapChart?.resize()
  } catch {
    // ignore resize errors on disposed chart
  }
}

onMounted(() => {
  nextTick(() => {
    initMap()
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  mapChart?.dispose()
  mapChart = null
})
</script>

<style scoped lang="scss">
.heatmap-card {
  width: 100%;
  max-width: 900px;
  // background: #fff;
  background-image: linear-gradient(to right, #c2e59c, #64b3f4);
  border-radius: 20px;
  padding: clamp(16px, 1.75rem, 28px);
  box-shadow: 0 6px 32px rgba(46, 125, 50, 0.08);
  margin-top: 12px;
  box-sizing: border-box;
}

// ==================== Header ====================
.heatmap-header {
  text-align: center;
  margin-bottom: 12px;

  .heatmap-title {
    font-size: clamp(16px, 1.25rem, 22px);
    font-weight: 700;
    color: #2e7d32;
    margin: 0 0 4px;
  }

  .heatmap-sub {
    font-size: 13px;
    color: #888;
    margin: 0;
  }
}

// ==================== Error ====================
.error-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;

  span {
    font-size: 40px;
    display: block;
    margin-bottom: 12px;
  }

  p {
    font-size: 14px;
    margin: 0;
  }
}

// ==================== Body ====================
.heatmap-body {
  display: flex;
  gap: 16px;
  min-height: 480px;
}

// ==================== Variety Panel ====================
.variety-panel {
  width: 180px;
  flex-shrink: 0;
  background: #fafdfa;
  border: 1px solid rgba(46, 125, 50, 0.08);
  border-radius: 10px;
  padding: 12px;
  overflow-y: auto;
  max-height: 490px;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #888;
  margin: 0 0 8px;
}

.variety-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.variety-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  color: #555;

  &:hover {
    background: rgba(67, 160, 71, 0.06);
  }

  &.active {
    background: #e8f5e9;
    color: #2e7d32;
    font-weight: 600;
  }

  .variety-icon {
    font-size: 16px;
    flex-shrink: 0;
  }

  .variety-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .variety-total {
    font-size: 11px;
    color: #aaa;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  &.active .variety-total {
    color: #66bb6a;
  }
}

// ==================== Map Area ====================
.map-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.map-chart {
  width: 100%;
  flex: 1;
  min-height: 460px;
}

.map-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
  min-height: 460px;
}

.legend-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 11px;
  color: #999;
}

.legend-label {
  flex-shrink: 0;
}

.legend-bar {
  width: 100px;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0fdf4, #86efac, #22c55e, #15803d, #052e16);
}

// ==================== Footer ====================
.heatmap-footer {
  display: flex;
  justify-content: center;
  gap: 28px;
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid #e8e8e8;
  font-size: 12px;
  color: #888;

  span {
    white-space: nowrap;
  }
}

// ==================== Scrollbar ====================
.variety-panel::-webkit-scrollbar {
  width: 4px;
}

.variety-panel::-webkit-scrollbar-thumb {
  background: rgba(46, 125, 50, 0.15);
  border-radius: 2px;
}
</style>
