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
    <section class="screen screen-scenic">
      <div class="scenic-wrapper">
        <!-- 顶部标题栏 -->
        <div class="scenic-header">
          <h1 class="scenic-title">🏯 开封 · 八朝古都</h1>
          <p class="scenic-subtitle">一城宋韵半城水，梦华飘尽汴梁秋</p>
        </div>

        <!-- 内容滚动区 -->
        <div class="scenic-content">
          <!-- 主推大图 -->
          <div class="hero-card">
            <div class="hero-img-box">
              <img :src="kaifengImg" alt="开封古城" />
              <div class="hero-overlay"></div>
              <div class="hero-text">
                <span class="hero-tag">开封古城</span>
                <h2>东京梦华 · 千年遗韵</h2>
              </div>
            </div>
            <p class="hero-desc">
              开封，简称"汴"，古称汴州、汴梁、汴京，是河南省地级市，中国八大古都之一。
              迄今已有4100余年的建城史和建都史，素有"八朝古都"之称。清明上河图描绘的便是北宋东京开封的繁华盛景，
              城内水系纵横，有"北方水城"之美誉。
            </p>
          </div>

          <!-- 景点卡片网格 -->
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
              </div>
            </div>
          </div>

          <!-- 底部文化诗句 -->
          <div class="culture-footer">
            <div class="poem-box">
              <p class="poem-text">"汴水流，泗水流，流到瓜州古渡头。吴山点点愁。"</p>
              <p class="poem-author">—— 白居易《长相思》</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';
import { fetchMapData } from '@/api/map';

// 导入开封风景图片
import kaifengImg from '@/assets/images/cheng/开封.png';
import qingmingshangheyuan from '@/assets/images/cheng/开封/清明上河园.jpg';
import longtinggongyuan from '@/assets/images/cheng/开封/龙亭公园.jpg';
import daxiangguoshi from '@/assets/images/cheng/开封/大相国寺.jpg';
import tietagongyuan from '@/assets/images/cheng/开封/铁塔公园.jpg';

// 风景点数据
interface ScenicSpot {
  name: string
  image: string
  description: string
  location: string
  tag: string
}

const scenicSpots: ScenicSpot[] = [
  {
    name: '清明上河园',
    image: qingmingshangheyuan,
    description: '以《清明上河图》为蓝本复原的大型宋代文化主题公园，再现了北宋东京开封的繁华景象。园内古建筑鳞次栉比，汴河蜿蜒穿园而过，虹桥卧波，舟楫往来，置身其中仿佛穿越千年，回到了那个"汴京富丽天下无"的盛世时代。',
    location: '龙亭区龙亭西路5号',
    tag: 'AAAAA级景区',
  },
  {
    name: '龙亭公园',
    image: longtinggongyuan,
    description: '位于开封古城中轴线上的皇家园林，曾是北宋皇宫所在地，也是历代帝王祭祀的场所。高台耸立，碧波环绕，每逢金秋时节，园内万菊竞放，游人如织。登龙亭而望，整个开封古城尽收眼底。',
    location: '龙亭区宋都御街北端',
    tag: 'AAAA级景区',
  },
  {
    name: '大相国寺',
    image: daxiangguoshi,
    description: '始建于北齐天保六年（公元555年），是中国佛教禅宗祖庭之一。寺内梵音缭绕，古木参天，八角琉璃殿、藏经楼等建筑气势恢宏。千手千眼观音像更是国宝级文物，令人叹为观止。',
    location: '鼓楼区自由路西段36号',
    tag: '全国重点文保',
  },
  {
    name: '铁塔公园',
    image: tietagongyuan,
    description: '以开宝寺塔（俗称"铁塔"）为核心的景区，该塔始建于北宋皇祐元年，高55.88米，八角十三层，通体以褐色琉璃砖砌成，远望如铁铸，历经千年风雨地震仍巍然屹立，被誉为"天下第一塔"。',
    location: '顺河回族区北门大街210号',
    tag: '全国重点文保',
  },
]

const activeSpot = ref<ScenicSpot | null>(null)

// ===== 滚轮切屏 =====
const homeRef = ref<HTMLElement>()
const currentScreen = ref(0)
let isScrolling = false
const SCREEN_KEY = 'kaifeng_current_screen'

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

  // 检查事件是否发生在可滚动区域内部
  const scrollable = (e.target as HTMLElement)?.closest('.scenic-content') as HTMLElement | null
  if (scrollable) {
    const { scrollTop, scrollHeight, clientHeight } = scrollable
    const atTop = scrollTop <= 1
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1

    // 向下滚动但内部还未到底 → 交给内部滚动
    if (e.deltaY > 0 && !atBottom) return
    // 向上滚动但内部还未到顶 → 交给内部滚动
    if (e.deltaY < 0 && !atTop) return
  }

  // 内部滚到边界 → 切换全屏
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
type MapLevel = 'china' | 'henan' | 'kaifeng';
const currentMap = ref<MapLevel>('china');

const KAIFENG_COORD: [number, number] = [114.341447, 34.797049];

// 动态计算面包屑标签
const mapLabel = computed(() => {
  switch (currentMap.value) {
    case 'henan': return '河南省地图';
    case 'kaifeng': return '开封市地图';
    default: return '中国地图';
  }
});

onMounted(async () => {
  if (!mapRef.value) return;

  // 异步加载地图 JSON 数据
  const [chinaJson, henanJson, kaifengJson] = await fetchMapData('kaifeng');

  myChart = echarts.init(mapRef.value);

  // 3. 注册三级地图
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  echarts.registerMap('china', chinaJson as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  echarts.registerMap('henan', henanJson as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  echarts.registerMap('kaifeng', kaifengJson as any);

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
      if (name === '开封' || name === '开封市') {
        renderKaifengMap();
        scrollToScreen(1)  // 同时跳转到第二屏
      }
    }
    else if (currentMap.value === 'kaifeng') {
      // 点击开封市内区县 → 也可跳转第二屏
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
  if (currentMap.value === 'kaifeng') {
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
    title: { text: '河南省地图 - 点击开封市查看详情', left: 'center', top: 20 },
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
            name: '开封市',
            itemStyle: { areaColor: '#bae6fd' }
          }
        ]
      },
      {
        name: '开封市标点',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        geoIndex: 0,
        data: [{ name: '开封市', value: [...KAIFENG_COORD, 100] }],
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

// ==================== 3. 开封市地图 ====================
const renderKaifengMap = () => {
  if (!myChart) return;
  currentMap.value = 'kaifeng';

  const option: echarts.EChartsOption = {
    title: { text: '开封市细分区县地图', left: 'center', top: 20 },
    tooltip: { trigger: 'item', formatter: '{b}' },
    series: [
      {
        name: '开封市地图',
        type: 'map',
        map: 'kaifeng',
        roam: true,
        label: { show: true, color: '#0f172a', fontSize: 12 },
        itemStyle: {
          areaColor: '#6ee7b7',
          borderColor: '#ffffff',
          borderWidth: 1.5
        },
        emphasis: {
          itemStyle: { areaColor: '#34d399' },
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
  background-image: linear-gradient(to right, #92FE9D, #00C9FF);
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

/* 标题栏 */
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

/* 内容滚动区 */
.scenic-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 28px 32px;
  scroll-behavior: smooth;
}

/* 自定义滚动条 */
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

/* 主推大图卡片 */
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

/* 景点卡片网格 */
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

/* 底部文化诗句 */
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
