<template>
  <div class="feature-scatter">
    <!-- 控制栏 -->
    <div class="control-bar">
      <div class="control-group">
        <span class="control-label">降维方法</span>
        <el-radio-group v-model="method" size="small">
          <el-radio-button value="tsne">t-SNE</el-radio-button>
          <el-radio-button value="pca">PCA</el-radio-button>
        </el-radio-group>
      </div>

      <div class="control-group">
        <span class="control-label">采样数量</span>
        <el-radio-group v-model="nSamples" size="small">
          <el-radio-button :value="50">50</el-radio-button>
          <el-radio-button :value="100">100</el-radio-button>
          <el-radio-button :value="200">200</el-radio-button>
          <el-radio-button :value="500">500</el-radio-button>
        </el-radio-group>
      </div>

      <div class="control-group" v-if="method === 'tsne'">
        <span class="control-label">Perplexity</span>
        <el-slider v-model="perplexity" :min="5" :max="50" :step="1" style="width: 120px" />
        <span class="control-value">{{ perplexity }}</span>
      </div>

      <el-button type="primary" size="small" @click="fetchData" :loading="loading">
        {{ loading ? '计算中...' : '重新计算' }}
      </el-button>
    </div>

    <!-- 提示 -->
    <el-alert v-if="method === 'tsne' && !loading"
              title="t-SNE 为随机算法，每次计算结果略有不同。增加 perplexity 可使聚类更紧凑。"
              type="info" :closable="false" show-icon style="margin-bottom: 12px" />

    <!-- 图表容器 -->
    <div ref="chartRef" class="chart-container" v-show="data"></div>

    <!-- 统计摘要 -->
    <div class="summary-bar" v-if="data">
      <div class="summary-item">
        <span class="summary-label">降维方法</span>
        <span class="summary-value">{{ data.method.toUpperCase() }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">样本数</span>
        <span class="summary-value">{{ data.n_samples }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">类别数</span>
        <span class="summary-value highlight">{{ data.classes.length }}</span>
      </div>
    </div>

    <!-- 加载遮罩 -->
    <div class="loading-overlay" v-if="loading">
      <div class="loading-content">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        <p>正在计算 {{ method.toUpperCase() }} 降维，请稍候...</p>
        <p class="loading-hint">（首次计算可能需要 5~15 秒）</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { Loading } from '@element-plus/icons-vue'
import { getFeatures, type FeatureData, type FeaturePoint } from '@/api/model'

const chartRef = ref<HTMLElement>()
const data = ref<FeatureData>()
const loading = ref(false)
const method = ref<'tsne' | 'pca'>('tsne')
const nSamples = ref(200)
const perplexity = ref(30)
let chart: echarts.ECharts | null = null

/** 按类别分组散点 */
function groupByClass(points: FeaturePoint[]) {
  const groups: Record<number, FeaturePoint[]> = {}
  for (const p of points) {
    ;(groups[p.class_id] ??= []).push(p)
  }
  return groups
}

/** 构建 ECharts 配置 */
function buildOption(d: FeatureData) {
  const groups = groupByClass(d.points)

  const series = Object.entries(groups)
    .filter(([_, pts]) => pts.length > 0)
    .map(([cls, pts]) => ({
      name: pts[0]!.class_name,
    type: 'scatter' as const,
    symbolSize: 8,
    data: pts.map(p => [p.x, p.y, p.class_name, p.sample_index]),
    emphasis: {
      itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' },
    },
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => {
        const [x, y, name, idx] = p.value
        return `<b>${name}</b><br/>x: ${x.toFixed(2)}<br/>y: ${y.toFixed(2)}<br/>样本 #${idx}`
      },
    },
    legend: {
      type: 'scroll',
      top: 10,
      textStyle: { fontSize: 10 },
      pageTextStyle: { fontSize: 10 },
    },
    grid: { left: 50, right: 20, top: 60, bottom: 50 },
    xAxis: {
      name: `${d.method.toUpperCase()} dim1`,
      type: 'value',
      nameLocation: 'center',
      nameGap: 30,
    },
    yAxis: {
      name: `${d.method.toUpperCase()} dim2`,
      type: 'value',
      nameLocation: 'center',
      nameGap: 35,
    },
    dataZoom: [
      { type: 'inside' },
      { type: 'slider', bottom: 8 },
    ],
    series,
  } as echarts.EChartsOption
}

/** 渲染图表 */
function renderChart() {
  if (!chartRef.value || !data.value) return
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }
  chart.setOption(buildOption(data.value), true)
}

/** 拉取数据 */
async function fetchData() {
  loading.value = true
  try {
    data.value = await getFeatures({
      method: method.value,
      nSamples: nSamples.value,
      perplexity: perplexity.value,
    })
    await nextTick()
    renderChart()
  } catch (e) {
    console.error('特征降维加载失败:', e)
  } finally {
    loading.value = false
  }
}

/** 响应窗口变化 */
function onResize() {
  chart?.resize()
}

// 监听参数变化自动刷新
watch([method, nSamples], () => {
  fetchData()
})

// perplexity 变化不自动刷新（t-SNE 耗时），由用户手动点击
watch(perplexity, () => {
  // 可选：自动刷新
})

onMounted(() => {
  fetchData()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.feature-scatter {
  padding: 16px 0;
  position: relative;
}

/* 控制栏 */
.control-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f9f9f9;
  border-radius: 8px;
}
.control-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.control-label {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
}
.control-value {
  font-size: 13px;
  color: #7F00FF;
  font-weight: 600;
  min-width: 24px;
}

/* 图表容器 */
.chart-container {
  width: 100%;
  height: 480px;
  border-radius: 8px;
  border: 1px solid #eee;
}

/* 统计摘要 */
.summary-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8f6ff, #fff0f8);
  border-radius: 8px;
}
.summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.summary-label {
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
}
.summary-value {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}
.summary-value.highlight { color: #7F00FF; }

/* 加载遮罩 */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  z-index: 10;
}
.loading-content {
  text-align: center;
  color: #555;
}
.loading-content p {
  margin: 8px 0 0;
  font-size: 14px;
}
.loading-hint {
  font-size: 12px;
  color: #999;
}
</style>
