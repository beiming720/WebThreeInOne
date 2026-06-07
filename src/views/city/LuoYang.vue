<template>
  <div class="home" ref="homeRef">
    <section class="screen screen-cover">
      <!-- 一 -->
      <div class="map-container">
        <button v-if="currentMap !== 'china'" class="back-btn" @click="handleBack">
          返回上一级 (当前: {{ mapLabel }})
        </button>
        <div ref="mapRef" style="width: 100%; height: 100%"></div>
      </div>
    </section>
    <section class="screen screen-cover">
      <div>风景介绍</div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

// 1. 地图 JSON 数据（通过 fetch 异步加载）

// ===== 滚轮切屏 =====
const homeRef = ref<HTMLElement>()
const currentScreen = ref(0)
let isScrolling = false
const SCREEN_KEY = 'luoyang_current_screen'

function saveScreen(index: number) {
  currentScreen.value = index
  sessionStorage.setItem(SCREEN_KEY, String(index))
}

function scrollToScreen(index: number) {
  const screens = homeRef.value?.querySelectorAll('.screen')
  if (!screens || !screens[index]) return
  saveScreen(index)
  ;(screens[index] as Element).scrollIntoView({ behavior: 'smooth' })
}

function onWheel(e: WheelEvent) {
  if (isScrolling) return
  const screens = homeRef.value?.querySelectorAll('.screen')
  if (!screens) return
  const next = e.deltaY > 0
    ? Math.min(currentScreen.value + 1, screens.length - 1)
    : Math.max(currentScreen.value - 1, 0)
  if (next === currentScreen.value) return
  isScrolling = true
  saveScreen(next)
  ;(screens[next] as Element).scrollIntoView({ behavior: 'smooth' })
  setTimeout(() => { isScrolling = false }, 800)
}

const mapRef = ref<HTMLElement | null>(null);
let myChart: echarts.ECharts | null = null;

// 2. 调整层级类型，初始设为 'china'
type MapLevel = 'china' | 'henan' | 'luoyang';
const currentMap = ref<MapLevel>('china');

const LUOYANG_COORD: [number, number] = [112.454, 34.620];

// 动态计算面包屑标签
const mapLabel = computed(() => {
  switch (currentMap.value) {
    case 'henan': return '河南省地图';
    case 'luoyang': return '洛阳市地图';
    default: return '中国地图';
  }
});

onMounted(async () => {
  if (!mapRef.value) return;

  // 异步加载地图 JSON 数据
  const [chinaJson, henanJson, luoyangJson] = await Promise.all([
    fetch('/map/china.json').then(r => r.json()),
    fetch('/map/henan.json').then(r => r.json()),
    fetch('/map/luoyang.json').then(r => r.json()),
  ]);

  myChart = echarts.init(mapRef.value);

  // 3. 注册三级地图
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  echarts.registerMap('china', chinaJson as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  echarts.registerMap('henan', henanJson as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  echarts.registerMap('luoyang', luoyangJson as any);

  // 默认直接渲染中国地图
  renderChinaMap();

  // 4. 点击事件路由
  myChart.on('click', (params: echarts.ECElementEvent) => {
    const name = params.name;

    if (currentMap.value === 'china') {
      if (name === '河南' || name === '河南省') {
        renderHenanMap();
      }
    }
    else if (currentMap.value === 'henan') {
      if (name === '洛阳' || name === '洛阳市') {
        renderLuoyangMap();
        scrollToScreen(1)  // 同时跳转到第二屏
      }
    }
    else if (currentMap.value === 'luoyang') {
      // 点击洛阳市内区县 → 也可跳转第二屏
      scrollToScreen(1)
    }
  });

  window.addEventListener('resize', handleResize);
  homeRef.value?.addEventListener('wheel', onWheel, { passive: true });

  // 恢复上次停留的页面
  const saved = sessionStorage.getItem(SCREEN_KEY)
  if (saved !== null) {
    const index = Number(saved)
    currentScreen.value = index
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const screens = homeRef.value?.querySelectorAll('.screen')
        if (screens && screens[index]) {
          ;(screens[index] as Element).scrollIntoView({ behavior: 'auto' })
        }
      })
    })
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  homeRef.value?.removeEventListener('wheel', onWheel);
  if (myChart) myChart.dispose();
});

const handleResize = () => {
  if (myChart) myChart.resize();
};

// 5. 简化的逐级返回逻辑
const handleBack = () => {
  if (currentMap.value === 'luoyang') {
    renderHenanMap();
  } else if (currentMap.value === 'henan') {
    renderChinaMap();
  }
};

// ==================== 1. 中国地图 ====================
const renderChinaMap = () => {
  if (!myChart) return;
  currentMap.value = 'china';

  const option: echarts.EChartsOption = {
    title: { text: '中国地图 - 点击河南省下钻', left: 'center', top: 20 },
    tooltip: { trigger: 'item' },
    series: [
      {
        name: '中国地图',
        type: 'map',
        map: 'china',
        roam: true,
        label: { show: true, fontSize: 10, color: '#333' },
        itemStyle: { areaColor: '#e2e8f0', borderColor: '#ffffff' },
        emphasis: { itemStyle: { areaColor: '#93c5fd' } },
        // 高亮河南省
        data: [
          {
            name: '河南省',
            itemStyle: {
              areaColor: '#f59e0b',
              shadowBlur: 8,
              shadowColor: 'rgba(0,0,0,0.3)'
            }
          }
        ]
      }
    ]
  };
  myChart.setOption(option, true);
};

// ==================== 2. 河南省地图 ====================
const renderHenanMap = () => {
  if (!myChart) return;
  currentMap.value = 'henan';

  const option: echarts.EChartsOption = {
    title: { text: '河南省地图 - 点击洛阳市查看详情', left: 'center', top: 20 },
    tooltip: { trigger: 'item' },
    series: [
      {
        name: '河南省地图',
        type: 'map',
        map: 'henan',
        roam: true,
        label: { show: true, color: '#334155', fontSize: 11 },
        itemStyle: { areaColor: '#f1f5f9', borderColor: '#cbd5e1' },
        emphasis: { itemStyle: { areaColor: '#e2e8f0' } },
        data: [
          {
            name: '洛阳市',
            itemStyle: { areaColor: '#a5f3fc' }
          }
        ]
      },
      {
        name: '洛阳市标点',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        geoIndex: 0,
        data: [{ name: '洛阳市', value: [...LUOYANG_COORD, 100] }],
        symbolSize: 16,
        itemStyle: { color: '#06b6d4', shadowBlur: 8, shadowColor: '#333' },
        label: {
          show: true,
          formatter: '{b} (点击进入)',
          position: 'right',
          color: '#06b6d4',
          fontSize: 12,
          fontWeight: 'bold'
        },
        zlevel: 2
      }
    ]
  };
  myChart.setOption(option, true);
};

// ==================== 3. 洛阳市地图 ====================
const renderLuoyangMap = () => {
  if (!myChart) return;
  currentMap.value = 'luoyang';

  const option: echarts.EChartsOption = {
    title: { text: '洛阳市细分区县地图', left: 'center', top: 20 },
    tooltip: { trigger: 'item', formatter: '{b}' },
    series: [
      {
        name: '洛阳市地图',
        type: 'map',
        map: 'luoyang',
        roam: true,
        label: { show: true, color: '#0f172a', fontSize: 12 },
        itemStyle: {
          areaColor: '#67e8f9',
          borderColor: '#ffffff',
          borderWidth: 1.5
        },
        emphasis: {
          itemStyle: { areaColor: '#22d3ee' },
          label: { color: '#fff', fontWeight: 'bold' }
        }
      }
    ]
  };
  myChart.setOption(option, true);
};
</script>

<style scoped>
.home {
  height: calc(100vh - 3.75rem);
  overflow: hidden;
}

.screen {
  height: calc(100vh - 3.75rem);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}


.map-container {
  position: relative;
  background-color: #015a26af;
  overflow: hidden;
  width: 100%;
  height: calc(100vh - 3.75rem);
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  padding: 8px 14px;
  background-color: #0f172a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.back-btn:hover {
  background-color: #1e293b;
  transform: translateY(-1px);
}
</style>
