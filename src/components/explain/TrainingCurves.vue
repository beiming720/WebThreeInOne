<template>
  <div class="training-curves">
    <!-- 控制栏 -->
    <div class="control-bar">
      <div class="control-group">
        <span class="control-label">平滑系数</span>
        <el-radio-group v-model="smoothWindow" size="small">
          <el-radio-button :value="1">原始</el-radio-button>
          <el-radio-button :value="3">3</el-radio-button>
          <el-radio-button :value="5">5</el-radio-button>
          <el-radio-button :value="10">10</el-radio-button>
        </el-radio-group>
      </div>
      <div class="control-group">
        <span class="control-label">显示指标</span>
        <el-checkbox-group v-model="visibleSeries" size="small">
          <el-checkbox label="train_loss" value="train_loss">训练 Loss</el-checkbox>
          <el-checkbox label="val_loss" value="val_loss">验证 Loss</el-checkbox>
          <el-checkbox label="train_acc" value="train_acc">训练 Acc</el-checkbox>
          <el-checkbox label="val_acc" value="val_acc">验证 Acc</el-checkbox>
        </el-checkbox-group>
      </div>
    </div>

    <!-- 图表容器 -->
    <div ref="chartRef" class="chart-container"></div>

    <!-- 最终指标摘要 -->
    <div class="summary-bar" v-if="history">
      <div class="summary-item">
        <span class="summary-label">总 Epoch</span>
        <span class="summary-value">{{ history.total_epochs }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">最终训练 Loss</span>
        <span class="summary-value">{{ lastTrainLoss }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">最终验证 Loss</span>
        <span class="summary-value">{{ lastValLoss }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">最终训练 Acc</span>
        <span class="summary-value green">{{ lastTrainAcc }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">最终验证 Acc</span>
        <span class="summary-value highlight">{{ lastValAcc }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getTrainingHistory, type TrainingHistory } from '@/api/model'

const chartRef = ref<HTMLElement>()
const history = ref<TrainingHistory>()
const smoothWindow = ref(3)
const visibleSeries = ref<string[]>(['train_loss', 'val_loss', 'train_acc', 'val_acc'])
let chart: echarts.ECharts | null = null

// 最终指标计算属性
const lastTrainLoss = computed(() => {
  const h = history.value
  if (!h || h.train_loss.length === 0) return '—'
  return h.train_loss[h.train_loss.length - 1]!.toFixed(4)
})
const lastValLoss = computed(() => {
  const h = history.value
  if (!h || h.val_loss.length === 0) return '—'
  return h.val_loss[h.val_loss.length - 1]!.toFixed(4)
})
const lastTrainAcc = computed(() => {
  const h = history.value
  if (!h || h.train_acc.length === 0) return '—'
  return (h.train_acc[h.train_acc.length - 1]! * 100).toFixed(2) + '%'
})
const lastValAcc = computed(() => {
  const h = history.value
  if (!h || h.val_acc.length === 0) return '—'
  return (h.val_acc[h.val_acc.length - 1]! * 100).toFixed(2) + '%'
})

/** 移动平均平滑 */
function smooth(arr: number[], window: number): number[] {
  if (window <= 1) return arr
  return arr.map((_, i) => {
    const s = Math.max(0, i - Math.floor(window / 2))
    const e = Math.min(arr.length, s + window)
    return arr.slice(s, e).reduce((a, b) => a + b, 0) / (e - s)
  })
}

/** 构建 ECharts 配置 */
function buildOption(h: TrainingHistory, window: number, visible: string[]) {
  const series: echarts.SeriesOption[] = []

  if (visible.includes('train_loss')) {
    series.push({
      name: '训练 Loss',
      type: 'line',
      data: smooth(h.train_loss, window),
      yAxisIndex: 0,
      lineStyle: { type: 'dashed', width: 1.5 },
      itemStyle: { color: '#E74C3C' },
      symbol: 'none',
    })
  }
  if (visible.includes('val_loss')) {
    series.push({
      name: '验证 Loss',
      type: 'line',
      data: smooth(h.val_loss, window),
      yAxisIndex: 0,
      lineStyle: { width: 2 },
      itemStyle: { color: '#E74C3C' },
      symbol: 'none',
    })
  }
  if (visible.includes('train_acc')) {
    series.push({
      name: '训练 Acc',
      type: 'line',
      data: smooth(h.train_acc, window),
      yAxisIndex: 1,
      lineStyle: { type: 'dashed', width: 1.5 },
      itemStyle: { color: '#2ECC71' },
      symbol: 'none',
    })
  }
  if (visible.includes('val_acc')) {
    series.push({
      name: '验证 Acc',
      type: 'line',
      data: smooth(h.val_acc, window),
      yAxisIndex: 1,
      lineStyle: { width: 2 },
      itemStyle: { color: '#2ECC71' },
      symbol: 'none',
    })
  }

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: ['训练 Loss', '验证 Loss', '训练 Acc', '验证 Acc'],
      top: 10,
    },
    grid: { left: 60, right: 70, bottom: 80, top: 50 },
    xAxis: {
      type: 'category',
      data: h.epochs,
      name: 'Epoch',
      nameLocation: 'center',
      nameGap: 30,
    },
    yAxis: [
      {
        type: 'value',
        name: 'Loss',
        position: 'left',
        axisLine: { lineStyle: { color: '#E74C3C' } },
      },
      {
        type: 'value',
        name: 'Accuracy',
        position: 'right',
        min: 0,
        max: 1,
        axisLabel: { formatter: (v: number) => (v * 100).toFixed(0) + '%' },
        axisLine: { lineStyle: { color: '#2ECC71' } },
      },
    ],
    dataZoom: [
      { type: 'slider', xAxisIndex: 0, start: 0, end: 100, bottom: 16 },
      { type: 'inside', xAxisIndex: 0 },
    ],
    series,
  } as echarts.EChartsOption
}

/** 渲染图表 */
function renderChart() {
  if (!chartRef.value || !history.value) return
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }
  chart.setOption(buildOption(history.value, smoothWindow.value, visibleSeries.value), true)
}

/** 响应窗口变化 */
function onResize() {
  chart?.resize()
}

/** 监听控制参数变化 */
watch([smoothWindow, visibleSeries], () => {
  renderChart()
})

onMounted(async () => {
  try {
    history.value = await getTrainingHistory()
    await nextTick()
    renderChart()
  } catch (e) {
    console.error('训练历史加载失败:', e)
  }
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.training-curves {
  padding: 16px 0;
}

/* 控制栏 */
.control-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f9f9f9;
  border-radius: 8px;
}
.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.control-label {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
}

/* 图表容器 */
.chart-container {
  width: 100%;
  height: 420px;
  border-radius: 8px;
  border: 1px solid #eee;
}

/* 摘要条 */
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
.summary-value.green { color: #27ae60; }
</style>
