# 河南花卉合格数量热力图 — 实现方案

> **目标**：用 ECharts 河南省地图热力图 + 左上角列表框（品种选择），展示各地市花卉苗木合格数量分布。
>
> **数据来源**：`public/data/henan_flower_qualification.json`（18 地市 × 10 品种）
>
> **地图来源**：`public/map/henan.json`（已有的 GeoJSON，18 个地市 feature）

---

## 一、设计规范速查表

| 设计维度 | 推荐做法 | 避坑指南 |
| :--- | :--- | :--- |
| 列表框位置 | 置于地图左上角或顶部悬浮面板，不遮挡核心区域 | ❌ 不要放在底部或右侧边缘，易被忽略 |
| 默认状态 | 默认选中"全部"（汇总所有品种），避免空白地图 | ❌ 不要默认无选中，用户会误以为数据加载失败 |
| 颜色策略 | 单品种时用连续色阶（浅绿→深绿）；"全部"模式用同一色阶 | ❌ 多品种混用时不要用同一色阶，会导致数值误读 |
| 反馈机制 | 切换品种时添加 0.3s 过渡动画，热力图平滑渐变 | ❌ 不要瞬间跳变，用户难以追踪变化 |
| 空数据处理 | 某地区无该品种数据时显示灰色底图 + tooltip 提示"暂无数据" | ❌ 不要留白或显示 0 值深色，易误解为"不合格" |
| 辅助信息 | 列表项旁标注该品种全省合格总数，帮助用户预判 | ❌ 不要只显示品种名，缺乏上下文 |

---

## 二、文件变更清单

```
src/
├── api/
│   └── data.ts                          # ① 新增花卉数据 API 类型 + 请求函数
├── views/
│   └── FlowerHeatmap.vue                # ② 新建页面组件（核心）
└── router/
    └── index.ts                         # ③ 新增路由 /flower-heatmap
```

只需要 **新建 1 个页面 + 修改 2 个已有文件**，不改动现有组件。

---

## 三、数据结构说明

`public/data/henan_flower_qualification.json` 结构如下：

```jsonc
{
  "title": "河南省花卉苗木合格数量分布",
  "year": 2024,
  "varieties": [
    { "name": "牡丹", "emoji": "🌺", "family": "芍药科" },
    { "name": "月季", "emoji": "🌹", "family": "蔷薇科" }
    // ... 共 10 个品种
  ],
  "regions": [
    {
      "city": "洛阳市",
      "data": {
        "牡丹": { "qualified": 28600, "inspected": 30200, "rate": 94.7 },
        "月季": { "qualified": 4280,  "inspected": 4600,  "rate": 93.0 }
        // ... 10 个品种
      }
    }
    // ... 共 18 个地市
  ],
  "summary": {
    "totalInspected": 402370,
    "totalQualified": 369550,
    "overallRate": 91.8,
    "topCityByRate": "许昌市",
    "topCityByVolume": "洛阳市",
    "topVarietyByVolume": "月季"
  }
}
```

**关键映射**：`regions[i].city` 的值（如 `"洛阳市"`）必须与 `henan.json` GeoJSON 中的 `features[].properties.name` 完全一致，否则 ECharts `map` 系列无法匹配着色。经验证，18 个地市名完全匹配。

---

## 四、逐步实现

### 步骤 1：在 `src/api/data.ts` 中新增花卉数据 API

在文件末尾追加以下内容：

```typescript
// ==================== 花卉合格数据 ====================

export interface FlowerVariety {
  name: string
  emoji: string
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
```

---

### 步骤 2：新建 `src/views/FlowerHeatmap.vue`

这是核心页面，分为 **模板** 和 **脚本** 两大部分。

#### 2.1 模板结构

```vue
<template>
  <div class="heatmap-page">
    <!-- 顶部标题栏 -->
    <header class="heatmap-header">
      <h1>🌸 河南省花卉苗木合格数量分布</h1>
      <p class="sub-title">数据年份：{{ flowerData?.year }} · 综合合格率：{{ flowerData?.summary.overallRate }}%</p>
    </header>

    <!-- 主体区域 -->
    <div class="heatmap-body">
      <!-- 左上角：品种选择面板 -->
      <div class="variety-panel">
        <h3 class="panel-title">🔍 选择品种</h3>
        <div class="variety-list">
          <!-- "全部"选项 -->
          <div
            class="variety-item"
            :class="{ active: selectedVariety === '全部' }"
            @click="selectVariety('全部')"
          >
            <span class="variety-emoji">📊</span>
            <span class="variety-name">全部品种</span>
            <span class="variety-total">{{ totalAllQualified }}</span>
          </div>
          <!-- 各品种选项 -->
          <div
            v-for="v in varietiesWithTotal"
            :key="v.name"
            class="variety-item"
            :class="{ active: selectedVariety === v.name }"
            @click="selectVariety(v.name)"
          >
            <span class="variety-emoji">{{ v.emoji }}</span>
            <span class="variety-name">{{ v.name }}</span>
            <span class="variety-total">{{ v.provinceTotal }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧：地图区域 -->
      <div class="map-area">
        <div ref="mapChartRef" class="map-chart"></div>
        <!-- 图例说明 -->
        <div class="legend-hint">
          <span class="legend-low">低</span>
          <div class="legend-bar"></div>
          <span class="legend-high">高</span>
          <span class="legend-label">合格数量</span>
        </div>
      </div>
    </div>

    <!-- 底部摘要 -->
    <footer class="heatmap-footer">
      <span>📍 产地之最：{{ flowerData?.summary.topCityByVolume }}</span>
      <span>📈 合格率之最：{{ flowerData?.summary.topCityByRate }}</span>
      <span>🌿 品种之最：{{ flowerData?.summary.topVarietyByVolume }}</span>
    </footer>
  </div>
</template>
```

**设计要点**：
- 列表框悬浮于地图左上角（`position: absolute`），不遮挡地图核心区域
- 每个品种项旁标注全省合格总数（`variety-total`），提供上下文
- 底部展示摘要统计信息

#### 2.2 脚本逻辑

```vue
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { fetchHenanMap } from '@/api/map'
import { fetchFlowerQualification } from '@/api/data'
import type { FlowerQualificationData, FlowerVariety } from '@/api/data'

// ==================== 状态 ====================
const mapChartRef = ref<HTMLElement>()
let mapChart: echarts.ECharts | null = null

const flowerData = ref<FlowerQualificationData | null>(null)
const selectedVariety = ref<string>('全部')

// ==================== 计算属性 ====================

/** 各品种全省合格总数（用于列表框旁标注） */
const varietiesWithTotal = computed(() => {
  if (!flowerData.value) return []
  return flowerData.value.varieties.map((v: FlowerVariety) => {
    let total = 0
    for (const r of flowerData.value!.regions) {
      if (r.data && r.data[v.name]) {
        total += r.data[v.name].qualified
      }
    }
    return { ...v, provinceTotal: formatNum(total) }
  })
})

/** "全部"模式下全省合格总数 */
const totalAllQualified = computed(() => {
  if (!flowerData.value) return '0'
  return formatNum(flowerData.value.summary.totalQualified)
})

// ==================== 工具函数 ====================

/** 数字格式化：12345 → "12,345" */
function formatNum(n: number): string {
  return n.toLocaleString('zh-CN')
}

// ==================== 品种切换 ====================

function selectVariety(name: string) {
  selectedVariety.value = name
}

// 监听品种切换，更新地图（带 0.3s 过渡动画）
watch(selectedVariety, () => {
  updateMapData()
})

// ==================== 地图渲染 ====================

/** 构建 ECharts map 系列的 data 数组 */
function buildMapSeriesData() {
  if (!flowerData.value) return []

  const variety = selectedVariety.value
  const regions = flowerData.value.regions

  return regions.map((r) => {
    let value: number | null = null
    let rate: number | null = null
    let inspected: number | null = null

    if (variety === '全部') {
      // 汇总所有品种
      if (r.data) {
        value = 0
        for (const v of Object.values(r.data)) {
          value += v.qualified
        }
        // 计算平均合格率
        const entries = Object.values(r.data)
        rate = entries.reduce((s, e) => s + e.rate, 0) / entries.length
        inspected = entries.reduce((s, e) => s + e.inspected, 0)
      }
    } else {
      // 单品种
      if (r.data && r.data[variety]) {
        value = r.data[variety].qualified
        rate = r.data[variety].rate
        inspected = r.data[variety].inspected
      }
    }

    return {
      name: r.city,
      value: value,
      rate: rate,
      inspected: inspected,
    }
  })
}

/** 获取连续色阶范围 */
function getVisualMapRange() {
  const data = buildMapSeriesData()
  const values = data.filter((d) => d.value != null).map((d) => d.value as number)
  if (values.length === 0) return { min: 0, max: 100 }
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  }
}

/** 初始化地图 */
async function initMap() {
  if (!mapChartRef.value) return

  // 并行加载 GeoJSON 和花卉数据
  const [henanJson, flower] = await Promise.all([
    fetchHenanMap(),
    fetchFlowerQualification(),
  ])

  flowerData.value = flower

  // 注册地图
  echarts.registerMap('henan', henanJson as any)

  // 创建图表实例
  mapChart = echarts.init(mapChartRef.value)

  // 渲染初始状态
  renderMap()

  // 监听窗口缩放
  window.addEventListener('resize', handleResize)
}

/** 渲染/重绘地图（完整 setOption） */
function renderMap() {
  if (!mapChart) return

  const { min, max } = getVisualMapRange()
  const seriesData = buildMapSeriesData()

  const option: echarts.EChartsOption = {
    // 关闭默认 title，由模板 header 承担
    tooltip: {
      trigger: 'item',
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
      textStyle: { color: '#64748b' },
      left: 'right',
      bottom: 30,
      itemWidth: 16,
      itemHeight: 140,
      // 浅绿 → 深绿 色阶
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
          color: '#334155',
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
        // 空数据区域显示灰色
        itemStyle: {
          areaColor: '#e2e8f0',
          borderColor: '#cbd5e1',
          borderWidth: 1,
        },
        // 0.3s 过渡动画
        universalTransition: true,
        animationDurationUpdate: 300,
        animationEasingUpdate: 'cubicInOut',
        data: seriesData,
      },
    ],
  }

  mapChart.setOption(option, true)
}

/** 更新地图数据（仅更新 series data + visualMap，不重绘整个 option） */
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
  mapChart?.resize()
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
```

**关键实现细节**：

1. **0.3s 过渡动画**：通过 `animationDurationUpdate: 300` + `animationEasingUpdate: 'cubicInOut'` 实现。切换品种时调用 `updateMapData()` 只更新 `series[0].data` 和 `visualMap` 的 min/max，ECharts 自动做平滑渐变。

2. **空数据灰色处理**：`itemStyle.areaColor: '#e2e8f0'` 作为默认底色。`buildMapSeriesData()` 对无数据的城市返回 `{ name, value: null }`，ECharts 会使用默认底色。tooltip 中对 `value === null` 显示"暂无数据"。

3. **默认选中"全部"**：`selectedVariety` 初始值为 `'全部'`，汇总所有品种合格数。

4. **辅助信息**：列表框每项右侧显示该品种全省合格总数（`provinceTotal`），由 `varietiesWithTotal` 计算属性提供。

#### 2.3 样式

```vue
<style scoped lang="scss">
.heatmap-page {
  width: 100%;
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  padding: 20px 28px;
  box-sizing: border-box;
}

// ==================== 顶部标题 ====================
.heatmap-header {
  text-align: center;
  margin-bottom: 16px;

  h1 {
    font-size: 22px;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(90deg, #86efac, #22c55e);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .sub-title {
    margin: 4px 0 0;
    font-size: 13px;
    color: #94a3b8;
  }
}

// ==================== 主体区域 ====================
.heatmap-body {
  flex: 1;
  position: relative;
  min-height: 500px;
}

// ==================== 左上角品种面板 ====================
.variety-panel {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  width: 200px;
  max-height: calc(100% - 40px);
  overflow-y: auto;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 10px;
  padding: 14px;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
  margin: 0 0 10px;
}

.variety-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.variety-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  color: #cbd5e1;

  &:hover {
    background: rgba(34, 197, 94, 0.1);
  }

  &.active {
    background: rgba(34, 197, 94, 0.2);
    color: #86efac;
    font-weight: 600;
  }

  .variety-emoji {
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
    font-size: 12px;
    color: #64748b;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  &.active .variety-total {
    color: #86efac;
  }
}

// ==================== 地图区域 ====================
.map-area {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.map-chart {
  width: 100%;
  flex: 1;
  min-height: 480px;
}

// ==================== 图例说明 ====================
.legend-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 11px;
  color: #64748b;
}

.legend-bar {
  width: 100px;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0fdf4, #86efac, #22c55e, #15803d, #052e16);
}

// ==================== 底部摘要 ====================
.heatmap-footer {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 12px 0 4px;
  font-size: 13px;
  color: #94a3b8;

  span {
    white-space: nowrap;
  }
}

// ==================== 滚动条 ====================
.variety-panel::-webkit-scrollbar {
  width: 4px;
}

.variety-panel::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 2px;
}
</style>
```

---

### 步骤 3：在 `src/router/index.ts` 中新增路由

在 `routes` 数组中追加一条：

```typescript
{
  path: '/flower-heatmap',
  name: 'flower-heatmap',
  component: () => import('../views/FlowerHeatmap.vue'),
},
```

（可选）在 `App.vue` 的导航栏中加入入口链接：

```html
<RouterLink to="/flower-heatmap" class="nav-item">花卉热力图</RouterLink>
```

---

## 五、ECharts 配置要点详解

### 5.1 色阶设计（单品种 / 全部模式）

```
"全部"模式：浅绿 → 深绿（连续色阶，适合汇总数量对比）
  #f0fdf4 → #86efac → #22c55e → #15803d → #052e16

单品种模式：同一色阶（保持一致性，仅 min/max 动态调整）
```

切换品种时，`updateMapData()` 会重新计算该品种的 min/max，`visualMap` 自动适配新的值域。

### 5.2 空数据处理

```typescript
// buildMapSeriesData() 中：
if (r.data && r.data[variety]) {
  value = r.data[variety].qualified   // 有数据 → 正常着色
} else {
  value = null                         // 无数据 → 使用默认灰色底色
}

// tooltip 中：
if (d && d.value != null) {
  // 正常显示数据
} else {
  return `<strong>${params.name}</strong><br/>暂无该品种数据`
}
```

### 5.3 过渡动画

```typescript
series: [{
  animationDurationUpdate: 300,      // 数据更新动画时长 0.3s
  animationEasingUpdate: 'cubicInOut', // 缓动函数，平滑渐变
  universalTransition: true,          // 启用通用过渡
}]
```

切换品种时只调用 `mapChart.setOption({ visualMap, series })` 而非 `setOption(option, true)` 全量替换，ECharts 会自动对变化的区域做颜色插值动画。

### 5.4 Tooltip 增强

```typescript
formatter(params) {
  // params.data 结构: { name: "洛阳市", value: 28600, rate: 94.7, inspected: 30200 }
  return [
    `<strong>${params.name}</strong>`,
    `品种：${selectedVariety === '全部' ? '全部品种' : selectedVariety}`,
    `合格数量：${formatNum(d.value)}`,
    `检验批次：${formatNum(d.inspected)}`,
    `合格率：${d.rate}%`,
  ].join('<br/>')
}
```

---

## 六、交互流程图

```
用户打开页面
    │
    ▼
initMap()  ← 并行加载 henan.json + flower_qualification.json
    │
    ▼
renderMap()  ← 默认 selectedVariety = "全部"
    │          汇总所有品种合格数 → 热力图着色
    │
    ▼
┌─────────────────────────────────┐
│  用户点击品种列表项              │
│  selectVariety("牡丹")          │
│       │                         │
│       ▼                         │
│  watch → updateMapData()        │
│       │                         │
│       ▼                         │
│  buildMapSeriesData()           │
│  → 只提取"牡丹"的 qualified     │
│       │                         │
│       ▼                         │
│  setOption({ visualMap, series })│
│  → 0.3s 平滑渐变动画            │
└─────────────────────────────────┘
```

---

## 七、启动验证

```bash
# 1. 确保数据文件存在
ls public/data/henan_flower_qualification.json

# 2. 启动开发服务器
npm run dev

# 3. 浏览器访问
http://localhost:5173/flower-heatmap

# 4. 验证清单：
#    ✅ 地图默认显示"全部"模式，18 个地市按合格总数着色
#    ✅ 左上角列表框显示 10 个品种 + "全部"，每项旁有全省总数
#    ✅ 切换品种时地图平滑渐变（约 0.3s）
#    ✅ 无数据地区显示灰色底图 + tooltip 提示"暂无数据"
#    ✅ tooltip 显示品种名、合格数量、检验批次、合格率
#    ✅ 窗口缩放时图表自适应
```

---

## 八、后续可扩展方向

| 方向 | 说明 |
|---|---|
| 地市下钻 | 点击地市后进入区县级地图，需准备区县 GeoJSON + 区县花卉数据 |
| 时间轴 | 加入多年数据，用 `timeline` 组件展示年份变化趋势 |
| 排名条 | 右侧添加横向柱状图，展示当前品种 Top 10 地市排名 |
| 数据源替换 | 将 `henan_flower_qualification.json` 替换为真实 API 接口，组件无需改动 |
| 移动端适配 | 面板改为底部抽屉式弹出，地图高度缩小 |
