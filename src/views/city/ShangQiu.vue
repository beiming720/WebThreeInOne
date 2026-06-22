<template>
  <div class="home" ref="homeRef">
    <section class="screen screen-cover">
      <!-- 一 -->
      <div class="map-container">
        <div class="top-buttons">
          <button class="page-back-btn" @click="router.push('/')">← 返回首页</button>
          <button v-if="currentMap !== 'china'" class="back-btn" @click="handleBack">
            返回上一级 (当前: {{ mapLabel }})
          </button>
        </div>
        <div ref="mapRef" style="width: 100%; height: 100%"></div>
      </div>
    </section>
    <section class="screen screen-scenic">
      <div class="scenic-wrapper">
        <div class="scenic-header">
          <h1 class="scenic-title">🏯 商丘 · 华商之源</h1>
          <p class="scenic-subtitle">天命玄鸟，降而生商，宅殷土芒芒</p>
        </div>
        <div class="scenic-content">
          <div class="hero-card">
            <div class="hero-img-box">
              <img :src="shangqiuImg" alt="商丘古城" />
              <div class="hero-overlay"></div>
              <div class="hero-text">
                <span class="hero-tag">商丘古城</span>
                <h2>三商之源 · 阏伯故里</h2>
              </div>
            </div>
            <p class="hero-desc">
              商丘，简称"商"，古称宋州、应天府、归德府，是河南省地级市。
              这里是华夏文明和中华民族的重要发祥地之一，燧人氏在此钻木取火，阏伯在此观星授时，
              商朝在此建都，被誉为"华商之源"。商丘古城是中国保存最为完好的府城之一。
            </p>
          </div>
          <div class="scenic-grid">
            <div v-for="spot in scenicSpots" :key="spot.name" class="scenic-card" @click="activeSpot = spot"
              :class="{ expanded: activeSpot?.name === spot.name }">
              <div class="card-img-box">
                <img :src="spot.image" :alt="spot.name" />
                <div class="card-img-shade"></div>
                <span class="card-name">{{ spot.name }}</span>
              </div>
              <div class="card-body">
                <p class="card-desc">{{ spot.description }}</p>
                <div class="card-meta">
                  <span class="meta-item">📍 {{ spot.location }}</span>
                  <span class="meta-item">🏷 {{ spot.tag }}</span>
                </div>
                <button class="map-link-btn" @click.stop="openBaiduMap(spot)">🗺️ 查看地图</button>
              </div>
            </div>
          </div>
          <div class="culture-footer">
            <div class="poem-box">
              <p class="poem-text">"玄鸟生商始有疆，燧皇取火照洪荒。古城千载归德府，犹向人间说汉唐。"</p>
              <p class="poem-author">—— 咏商丘</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
import * as echarts from 'echarts';
import { fetchMapData } from '@/api/map';
import type { ScenicSpot } from '@/types/scenic'
import { openBaiduMap } from '@/utils/baiduMap'

// 导入商丘风景图片
import shangqiuImg from '@/assets/images/cheng/商丘/商丘.jpg';
import sahngqiugucheng from '@/assets/images/cheng/商丘/商丘古城.jpg';
import suihuangling from '@/assets/images/cheng/商丘/燧皇陵.jpg';
import yingtianshuyuan from '@/assets/images/cheng/商丘/应天书院.jpg';
import huoshentai from '@/assets/images/cheng/商丘/火神台.jpg';

const scenicSpots: ScenicSpot[] = [
  {
    name: '商丘古城',
    image: sahngqiugucheng,
    description: '中国保存最为完好的府城之一，始建于明正德六年（1511年），城墙、城湖、城郭三位一体，外圆内方，呈古铜钱币造型，寓意天圆地方、招财进宝。城内街巷纵横，古建林立，漫步其中仿佛穿越回明清时期的繁华府城。',
    location: '睢阳区古城街道',
    tag: '全国重点文保',
    lat: 34.381254,
    lng: 115.616263,
  },
  {
    name: '燧皇陵',
    image: suihuangling,
    description: '华夏文明之火发源地，燧人氏钻木取火的传说就发生于此。陵区内有燧人氏雕像、取火台、火文化博物馆等景点。每年一度的火神祭祀大典在这里隆重举行，是探寻中华火文化起源的必游之地。',
    location: '睢阳区古宋路',
    tag: 'AAAA级景区',
    lat: 34.375,
    lng: 115.618,
  },
  {
    name: '应天书院',
    image: yingtianshuyuan,
    description: '北宋四大书院之首，始建于后晋，兴盛于北宋，范仲淹曾在此求学并任教。书院培养了众多杰出人才，是当时全国最高学府之一。如今复建后的应天书院再现了当年的恢宏气势，书香气息浓郁。',
    location: '睢阳区书院路',
    tag: '全国重点文保',
    lat: 34.383,
    lng: 115.620,
  },
  {
    name: '阏伯台',
    image: huoshentai,
    description: '又称火神台、观星台，是中国现存最早的观星台遗址。帝喾之子阏伯在此观测火星运行，制定了中国最早的火历，被后人尊为"火神"。登上阏伯台可俯瞰整个商丘古城，感受上古先贤的智慧与气魄。',
    location: '睢阳区火神台街',
    tag: '全国重点文保',
    lat: 34.369,
    lng: 115.606,
  },
]

const activeSpot = ref<ScenicSpot | null>(null)

// ===== 滚轮切屏 =====
const homeRef = ref<HTMLElement>()
const currentScreen = ref(0)
let isScrolling = false
const SCREEN_KEY = 'shangqiu_current_screen'

function saveScreen(index: number) {
  currentScreen.value = index
  sessionStorage.setItem(SCREEN_KEY, String(index))
}

function scrollToScreen(index: number) {
  const screens = homeRef.value?.querySelectorAll('.screen')
  if (!screens || !screens[index]) return
  saveScreen(index)
    ; (screens[index] as Element).scrollIntoView({ behavior: 'smooth' })
}

function onWheel(e: WheelEvent) {
  if (isScrolling) return

  const scrollable = (e.target as HTMLElement)?.closest('.scenic-content') as HTMLElement | null
  if (scrollable) {
    const { scrollTop, scrollHeight, clientHeight } = scrollable
    const atTop = scrollTop <= 1
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1
    if (e.deltaY > 0 && !atBottom) return
    if (e.deltaY < 0 && !atTop) return
  }

  const screens = homeRef.value?.querySelectorAll('.screen')
  if (!screens) return
  const next = e.deltaY > 0
    ? Math.min(currentScreen.value + 1, screens.length - 1)
    : Math.max(currentScreen.value - 1, 0)
  if (next === currentScreen.value) return
  isScrolling = true
  saveScreen(next)
    ; (screens[next] as Element).scrollIntoView({ behavior: 'smooth' })
  setTimeout(() => { isScrolling = false }, 800)
}

const mapRef = ref<HTMLElement | null>(null);
let myChart: echarts.ECharts | null = null;

// 2. 调整层级类型，初始设为 'china'
type MapLevel = 'china' | 'henan' | 'shangqiu';
const currentMap = ref<MapLevel>('china');

const SHANGQIU_COORD: [number, number] = [115.656, 34.414];

// 动态计算面包屑标签
const mapLabel = computed(() => {
  switch (currentMap.value) {
    case 'henan': return '河南省地图';
    case 'shangqiu': return '商丘市地图';
    default: return '中国地图';
  }
});

onMounted(async () => {
  if (!mapRef.value) return;

  // 异步加载地图 JSON 数据
  const [chinaJson, henanJson, shangqiuJson] = await fetchMapData('shangqiu');

  myChart = echarts.init(mapRef.value);

  // 3. 注册三级地图
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  echarts.registerMap('china', chinaJson as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  echarts.registerMap('henan', henanJson as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  echarts.registerMap('shangqiu', shangqiuJson as any);

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
      if (name === '商丘' || name === '商丘市') {
        renderShangqiuMap();
        scrollToScreen(1)  // 同时跳转到第二屏
      }
    }
    else if (currentMap.value === 'shangqiu') {
      // 点击商丘市内区县 → 也可跳转第二屏
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
          ; (screens[index] as Element).scrollIntoView({ behavior: 'auto' })
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
  if (currentMap.value === 'shangqiu') {
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
    title: { text: '河南省地图 - 点击商丘市查看详情', left: 'center', top: 20 },
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
            name: '商丘市',
            itemStyle: { areaColor: '#fecaca' }
          }
        ]
      },
      {
        name: '商丘市标点',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        geoIndex: 0,
        data: [{ name: '商丘市', value: [...SHANGQIU_COORD, 100] }],
        symbolSize: 16,
        itemStyle: { color: '#ef4444', shadowBlur: 8, shadowColor: '#333' },
        label: {
          show: true,
          formatter: '{b} (点击进入)',
          position: 'right',
          color: '#ef4444',
          fontSize: 12,
          fontWeight: 'bold'
        },
        zlevel: 2
      }
    ]
  };
  myChart.setOption(option, true);
};

// ==================== 3. 商丘市地图 ====================
const renderShangqiuMap = () => {
  if (!myChart) return;
  currentMap.value = 'shangqiu';

  const option: echarts.EChartsOption = {
    title: { text: '商丘市细分区县地图', left: 'center', top: 20 },
    tooltip: { trigger: 'item', formatter: '{b}' },
    series: [
      {
        name: '商丘市地图',
        type: 'map',
        map: 'shangqiu',
        roam: true,
        label: { show: true, color: '#0f172a', fontSize: 12 },
        itemStyle: {
          areaColor: '#fca5a5',
          borderColor: '#ffffff',
          borderWidth: 1.5
        },
        emphasis: {
          itemStyle: { areaColor: '#f87171' },
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

.top-buttons {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  display: flex;
  gap: 10px;
}

.page-back-btn {
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

.page-back-btn:hover {
  background-color: #1e293b;
  transform: translateY(-1px);
}

.map-link-btn {
  margin-top: 10px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #853e3e, #db01c9);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  letter-spacing: 1px;
  transition: all 0.25s;
}

.map-link-btn:hover {
  opacity: 0.85;
  transform: translateY(-1px);
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
  background-image: linear-gradient(to right, #92FE9D, #00C9FF);
  overflow: hidden;
  width: 100%;
  height: calc(100vh - 3.75rem);
}

.back-btn {
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

/* ==================== 风景介绍页 ==================== */
.screen-scenic {
  flex-direction: column;
  justify-content: flex-start;
  overflow-y: auto;
  overflow-x: hidden;
}

.scenic-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.scenic-header {
  text-align: center;
  padding: 24px 20px 16px;
  flex-shrink: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.4), transparent);
}

.scenic-title {
  font-size: clamp(20px, 1.8rem, 40px);
  font-weight: 900;
  color: #f5d1f2;
  text-shadow: 0 0 30px rgba(233, 150, 122, 0.5);
  letter-spacing: 4px;
  margin-bottom: 6px;
}

.scenic-subtitle {
  font-size: clamp(12px, 0.875rem, 17px);
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 3px;
  font-style: italic;
}

.scenic-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 28px 32px;
  scroll-behavior: smooth;
}

.screen-scenic {
  scrollbar-width: thin;
  scrollbar-color: rgba(233, 150, 122, 0.7) rgba(255, 255, 255, 0.06);
}

.screen-scenic::-webkit-scrollbar {
  width: 8px;
}

.screen-scenic::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
}

.screen-scenic::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #853e3e, #db01c9);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.screen-scenic::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #a04e4e, #e830d8);
}

.hero-card {
  margin-bottom: 24px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(19, 17, 17, 0.164);
  backdrop-filter: blur(6px);
}

.hero-img-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 550px;
  overflow: hidden;
}

.hero-img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.hero-card:hover .hero-img-box img {
  transform: scale(1.05);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.7) 0%, transparent 60%);
}

.hero-text {
  position: absolute;
  bottom: 20px;
  left: 24px;
  z-index: 2;
}

.hero-tag {
  display: inline-block;
  padding: 4px 14px;
  background: linear-gradient(135deg, #853e3e, #db01c9);
  color: #fff;
  font-size: 12px;
  border-radius: 12px;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.hero-text h2 {
  color: #fff;
  font-size: clamp(18px, 1.5rem, 32px);
  font-weight: 800;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
  letter-spacing: 3px;
}

.hero-desc {
  padding: 18px 20px;
  color: rgba(7, 6, 6, 0.7);
  font-size: clamp(12px, 0.8125rem, 15px);
  line-height: 1.9;
  text-indent: 2em;
  letter-spacing: 0.5px;
}

.scenic-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

@media (max-width: 900px) {
  .scenic-grid {
    grid-template-columns: 1fr;
  }
}

.scenic-card {
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(4px);
}

.scenic-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(233, 150, 122, 0.4);
  transform: translateY(-4px);
  box-shadow: 0 12px 36px rgba(233, 30, 140, 0.2);
}

.scenic-card.expanded {
  border-color: rgba(233, 150, 122, 0.6);
  box-shadow: 0 8px 40px rgba(233, 30, 140, 0.3);
}

.card-img-box {
  position: relative;
  aspect-ratio: 16 / 9;
  max-height: 100%;
  overflow: hidden;
}

.card-img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.scenic-card:hover .card-img-box img {
  transform: scale(1.08);
}

.card-img-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.55) 0%, transparent 55%);
}

.card-name {
  position: absolute;
  bottom: 12px;
  left: 14px;
  color: #fff;
  font-size: clamp(14px, 1rem, 20px);
  font-weight: 700;
  letter-spacing: 2px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  z-index: 2;
}

.card-body {
  padding: 14px 16px;
}

.card-desc {
  color: rgba(7, 6, 6, 0.7);
  font-size: clamp(11px, 0.75rem, 14px);
  line-height: 1.75;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 10px;
  text-indent: 2em;
}

.scenic-card.expanded .card-desc {
  -webkit-line-clamp: unset;
}

.card-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 11px;
  color: rgba(233, 150, 122, 0.8);
  letter-spacing: 0.5px;
}

.culture-footer {
  padding: 20px 0 10px;
  text-align: center;
}

.poem-box {
  display: inline-block;
  padding: 20px 32px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.poem-text {
  color: rgba(7, 6, 6, 0.7);
  font-size: clamp(13px, 0.875rem, 17px);
  font-style: italic;
  letter-spacing: 2px;
  line-height: 1.8;
  margin-bottom: 8px;
}

.poem-author {
  color: rgba(7, 6, 6, 0.7);
  font-size: 12px;
  letter-spacing: 1px;
}
</style>
