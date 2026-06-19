<template>
  <div class="film-page">


    <video autoplay muted loop playsinline class="bg-video">
      <source src="/audio/jiyi.mp4" type="video/mp4" />
    </video>


    <!-- 返回按钮 -->
    <button class="film-back" @click="router.push('/')">← 返回首页</button>

    <!-- 季节标题 -->
    <div class="film-header">
      <span class="film-season-icon">{{ seasonData.icon }}</span>
      <div>
        <h1 class="film-title">{{ seasonData.label }}</h1>
        <p class="film-subtitle">{{ seasonData.subtitle }}</p>
      </div>
    </div>

    <!-- 胶片 + 控制区 同行 -->
    <div class="film-row">
      <!-- 左侧计数 -->
      <div class="film-counter">
        <span class="counter-cur">{{ currentIndex + 1 }}</span>
        <span class="counter-sep">/</span>
        <span class="counter-total">{{ flowers.length }}</span>
      </div>

      <!-- 电影胶片播放区 -->
      <div class="film-reel">
        <div class="film-sprockets top">
          <span v-for="i in 20" :key="'t' + i" class="sprocket"></span>
        </div>
        <div class="film-strip" ref="stripRef">
          <div v-for="(flower, i) in flowers" :key="flower.name" class="film-frame"
            :class="{ active: currentIndex === i }" @click="currentIndex = i">
            <img :src="flower.img" :alt="flower.name" />
            <div class="frame-overlay"></div>
            <span class="frame-name">{{ flower.name }}</span>
            <span class="frame-num">{{ String(i + 1).padStart(2, '0') }}</span>
          </div>
        </div>
        <div class="film-sprockets bottom">
          <span v-for="i in 20" :key="'b' + i" class="sprocket"></span>
        </div>
      </div>

      <!-- 右侧放映控制 -->
      <div class="film-controls">
        <button class="ctrl-btn" @click="prev" :disabled="currentIndex <= 0">⏮</button>
        <button class="ctrl-btn play-btn" @click="togglePlay">{{ playing ? '⏸' : '▶' }}</button>
        <button class="ctrl-btn" @click="next" :disabled="currentIndex >= flowers.length - 1">⏭</button>
      </div>
    </div>

    <!-- 字幕区 -->
    <div class="film-subtitle-bar" :key="currentIndex">
      <div class="subtitle-inner">
        <p class="subtitle-name">{{ currentFlower.name }}</p>
        <p class="subtitle-desc">{{ displayedSubtitle }}<span class="cursor">|</span></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 花卉图片映射（src/assets/images/FlowerList/{season}/{花名}.jpg）
const flowerImageMap: Record<string, Record<string, string>> = {
  spring: {
    '樱花': new URL('../assets/images/FlowerList/spring/樱花.jpg', import.meta.url).href,
    '桃花': new URL('../assets/images/FlowerList/spring/桃花.jpg', import.meta.url).href,
    '牡丹': new URL('../assets/images/FlowerList/spring/牡丹.jpg', import.meta.url).href,
    '海棠': new URL('../assets/images/FlowerList/spring/海棠.jpg', import.meta.url).href,
    '郁金香': new URL('../assets/images/FlowerList/spring/郁金香.jpg', import.meta.url).href,
  },
  summer: {
    '荷花': new URL('../assets/images/FlowerList/summer/荷花.jpg', import.meta.url).href,
    '紫薇': new URL('../assets/images/FlowerList/summer/紫薇.jpg', import.meta.url).href,
    '向日葵': new URL('../assets/images/FlowerList/summer/向日葵.jpg', import.meta.url).href,
    '月季': new URL('../assets/images/FlowerList/summer/月季.jpg', import.meta.url).href,
    '栀子花': new URL('../assets/images/FlowerList/summer/栀子花.jpg', import.meta.url).href,
  },
  autumn: {
    '菊花': new URL('../assets/images/FlowerList/autumn/菊花.jpg', import.meta.url).href,
    '桂花': new URL('../assets/images/FlowerList/autumn/桂花.jpg', import.meta.url).href,
    '银杏': new URL('../assets/images/FlowerList/autumn/银杏.jpg', import.meta.url).href,
    '粉黛乱子草': new URL('../assets/images/FlowerList/autumn/粉黛乱子草.jpg', import.meta.url).href,
  },
  winter: {
    '腊梅': new URL('../assets/images/FlowerList/winter/腊梅.jpg', import.meta.url).href,
    '梅花': new URL('../assets/images/FlowerList/winter/梅花.jpg', import.meta.url).href,
    '天竺葵': new URL('../assets/images/FlowerList/winter/天竺葵.jpg', import.meta.url).href,
    '冬月季': new URL('../assets/images/FlowerList/winter/冬月季.jpg', import.meta.url).href,
  },
}

const route = useRoute()
const router = useRouter()
const stripRef = ref<HTMLElement>()

interface FlowerItem {
  name: string
  img: string
  desc: string
}

interface SeasonData {
  label: string
  icon: string
  subtitle: string
}

const seasons: Record<string, { data: SeasonData; flowers: Omit<FlowerItem, 'img'>[] }> = {
  spring: {
    data: { label: '春 · 花开时节动京城', icon: '🌸', subtitle: '春风十里，花开如许' },
    flowers: [
      { name: '樱花', desc: '粉雪缀枝，风过便落漫天花雨。荥阳古柏渡千亩樱林依黄河铺展，鹤壁十里樱花隧道如云垂地，洛阳瀍壑朱樱塔下，粉白繁花映洛水，藏尽中原春日温柔浪漫。' },
      { name: '桃花', desc: '灼灼粉霞漫山野，一缕嫣红唤醒春山。济源桃都山、新野津湾千顷桃林连绵，巩义青龙山湖畔桃枝临水，开封长堤十里桃雾轻笼，豫地乡野尽藏桃源诗意' },
      { name: '牡丹', desc: '一花压尽满城春，雍容为国色天香。洛阳一城遍植名品，隋唐遗址、王城公园姚黄魏紫竞放，花开时节整座神都沉醉，开封、郑州园圃亦栽满芳华，是河南春日当之无愧的花魁。' },
      { name: '海棠', desc: '胭脂凝瓣，半含清愁半携柔。郑州碧沙岗海棠如云叠翠，开封朱红宫墙衬满垂丝海棠，宋苑亭台花影重重，豫东豫中园林皆植此花，自带婉约宋韵。' },
      { name: '郁金香', desc: '彩盏铺原野，打翻春日调色盘。新乡宝泉、郑州绿博园成片盛放，南阳新野白河滩万顷郁金次第铺开，红黄紫白层层相间，为中原平原晕开鲜亮烂漫春色' },
    ],
  },
  summer: {
    data: { label: '夏 · 映日荷花别样红', icon: '🪷', subtitle: '荷风送香，竹露滴清' },
    flowers: [
      { name: '荷花', desc: '碧盘承玉盏，清风送暗香。淮阳龙湖千顷荷莲连片，信阳南湾湖、开封水岸翠盖红妆相映，盛夏豫地河湖，尽是一池清雅风月。' },
      { name: '紫薇', desc: '盛夏绽红霞，花开百日长。郑州街巷、开封大道遍植紫薇，南阳医圣祠古木繁花垂枝，酷暑之中独揽一城温婉霞光。' },
      { name: '向日葵', desc: '金盘朝旭日，满目向阳明。唐河万亩葵田铺展原野，新乡平原示范区成片盛放，中原沃野之上，铺就一片热烈明媚的夏日光景。' },
      { name: '月季', desc: '四时绽芳华，繁艳贯长夏。南阳为华夏月季名城，博览园万千品种次第开放，郑州月季公园繁花不断，豫西南大地常开锦绣。' },
      { name: '栀子花', desc: '素瓣凝清雪，幽香沁晚风。豫南信阳、南阳乡间庭院多有栽种，白洁小花藏于翠叶之间，为中原盛夏添一缕干净柔和的清甜。' },
    ],
  },
  autumn: {
    data: { label: '秋 · 满城尽带黄金甲', icon: '🏵️', subtitle: '金风玉露，菊香满城' },
    flowers: [
      { name: '菊花', desc: '冷艳凝秋霜，风骨冠中原。开封满城遍植秋菊，龙亭湖畔、翰园碑林繁花叠锦，一年一度菊展名扬天下，中州秋韵皆藏此缕清傲芬芳。' },
      { name: '桂花', desc: '碎金藏碧叶，十里溢柔香。郑州园博园、洛阳洛浦公园遍栽桂树，秋风掠过街巷庭园，清甜暗香漫卷豫地清秋，温柔绵长。' },
      { name: '银杏', desc: '金叶铺云毯，一树染秋山。嵩山古寺、洛阳老城、许昌乡间遍布千年古银杏，霜降过后满树鎏金，落英铺地，勾勒中原古雅秋景。' },
      { name: '粉黛乱子草', desc: '柔雾染平芜，烟霞覆浅滩。郑州古柏渡、洛阳伊滨河畔成片丛生，如云似雾的粉紫浪海随风起伏，为中原秋野晕开朦胧温柔画意。' },
    ],
  },
  winter: {
    data: { label: '冬 · 凌寒独自开', icon: '🌺', subtitle: '梅花香自苦寒来' },
    flowers: [
      { name: '腊梅', desc: '寒蕊凝蜜香，踏雪觅清欢。许昌鄢陵素有蜡梅之乡美名，洛阳隋唐园、郑州黄河梅园隆冬绽金瓣，中州寒冬，一缕暗香漫遍亭台山野。' },
      { name: '梅花', desc: '疏枝横冷雪，淡影报初春。郑州西流湖、开封龙亭梅苑红梅白梅错落，豫北太行山麓亦有野梅点点，料峭寒风里先送人间春意。' },
      { name: '天竺葵', desc: '团簇凝妍色，晴冬绽小庭。河南各地居家、公园花坛广为栽种，不惧轻寒，红绿相间柔艳小巧，为清冷冬日添一抹鲜活暖意。' },
      { name: '冬月季', desc: '艳色不随寒岁歇，繁花伴浅冬。南阳、郑州月季园耐寒品种冬日依旧盛放，中州城隅巷陌，纵使霜风轻落，仍留一季锦绣芳菲。' },
    ],
  },
}

const seasonKey = computed(() => (route.params.season as string) || 'spring')
const seasonEntry = computed(() => seasons[seasonKey.value] ?? seasons.spring)
const seasonData = computed(() => seasonEntry.value!.data)
const flowers = computed(() =>
  seasonEntry.value!.flowers.map((f): FlowerItem => ({
    ...f,
    img: flowerImageMap[seasonKey.value]?.[f.name] ?? '',
  }))
)

// ---- 轮播状态 ----
const currentIndex = ref(0)
const playing = ref(true)
let autoTimer: ReturnType<typeof setTimeout> | null = null
let typeTimer: ReturnType<typeof setTimeout> | null = null
const typingDone = ref(false)
const displayedSubtitle = ref('')
const SUBTITLE_SPEED = 60  // ms/字
const PAUSE_AFTER_TYPE = 5000  // 打完字后等待5秒

const currentFlower = computed(() => flowers.value[currentIndex.value]!)

// 打字机效果 → 完成后回调
function typeSubtitle(text: string, onDone?: () => void) {
  stopType()
  typingDone.value = false
  displayedSubtitle.value = ''

  let i = 0
  const tick = () => {
    if (i < text.length) {
      displayedSubtitle.value += text[i]
      i++
      typeTimer = setTimeout(tick, SUBTITLE_SPEED)
    } else {
      typingDone.value = true
      onDone?.()
    }
  }
  tick()
}

function stopType() {
  if (typeTimer) { clearTimeout(typeTimer); typeTimer = null }
}

// 切换花 → 停止当前自动计时，重新开始
function goTo(index: number) {
  stopAutoTimer()
  currentIndex.value = index
  typeSubtitle(currentFlower.value.desc, () => {
    if (playing.value) scheduleNext()
  })
  scrollToFrame(index)
}

function scrollToFrame(index: number) {
  nextTick(() => {
    const frame = stripRef.value?.children[index] as HTMLElement
    frame?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  })
}

function next() {
  if (currentIndex.value < flowers.value.length - 1) {
    goTo(currentIndex.value + 1)
  }
}

function prev() {
  if (currentIndex.value > 0) {
    goTo(currentIndex.value - 1)
  }
}

function togglePlay() {
  playing.value = !playing.value
  if (playing.value) {
    // 如果已打完字，直接排下一张；否则等打完
    if (typingDone.value) {
      scheduleNext()
    }
  } else {
    stopAutoTimer()
  }
}

function scheduleNext() {
  stopAutoTimer()
  autoTimer = setTimeout(() => {
    currentIndex.value = (currentIndex.value + 1) % flowers.value.length
    goTo(currentIndex.value)
  }, PAUSE_AFTER_TYPE)
}

function stopAutoTimer() {
  if (autoTimer) { clearTimeout(autoTimer); autoTimer = null }
}

watch(seasonKey, () => {
  stopAutoTimer()
  stopType()
  currentIndex.value = 0
  goTo(0)
})

// 启动
goTo(0)

onBeforeUnmount(() => {
  stopAutoTimer()
  stopType()
})
</script>

<style scoped lang="scss">
.film-page {
  min-height: calc(100vh - 3.75rem);
  padding: 14px 16px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  overflow-y: auto;
}


.bg-video {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 100%;
  min-height: 100%;
  object-fit: cover;
  /* 关键：填满容器不变形 */
  z-index: -1;
}


.film-back {
  align-self: flex-start;
  padding: 6px 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: #cbd5e1;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }
}

.film-header {
  display: flex;
  align-items: center;
  gap: 14px;

  .film-season-icon {
    font-size: 44px;
    flex-shrink: 0;
  }
}

.film-title {
  font-size: clamp(20px, 1.2rem, 32px);
  font-weight: 800;
  color: #f5d1f2;
  letter-spacing: 2px;
  text-shadow: 0 0 20px rgba(233, 150, 122, 0.3);
}

.film-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
  letter-spacing: 1px;
}

/* ======== 胶片区 ======== */
.film-row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  max-width: 960px;
}

.film-reel {
  flex: 1;
  min-width: 0;
}

.film-sprockets {
  display: flex;
  justify-content: space-between;
  padding: 0 4px;
  height: 18px;

  &.top {
    margin-bottom: 8px;
  }

  &.bottom {
    margin-top: 8px;
  }
}

.sprocket {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #0f0f1a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
}

/* 胶卷画幅 */
.film-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 6px 8px;
  background: #0d0d1a;
  border-top: 3px solid #222;
  border-bottom: 3px solid #222;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(233, 150, 122, 0.3);
    border-radius: 2px;
  }
}

.film-frame {
  flex-shrink: 0;
  width: clamp(160px, 22vw, 220px);
  aspect-ratio: 3 / 4;
  border-radius: 6px;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  position: relative;
  transition: all 0.35s ease;
  filter: brightness(0.55);

  &.active {
    border-color: #f59e0b;
    filter: brightness(1);
    transform: scale(1.04);
    box-shadow: 0 0 28px rgba(245, 158, 11, 0.25);
    z-index: 2;
  }

  &:hover {
    filter: brightness(0.8);
  }

  &.active:hover {
    filter: brightness(1);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.frame-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.5) 0%, transparent 40%);
}

.frame-name {
  position: absolute;
  bottom: 8px;
  left: 8px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
}

.frame-num {
  position: absolute;
  top: 6px;
  right: 8px;
  color: rgba(255, 255, 255, 0.45);
  font-size: 10px;
  font-family: monospace;
  letter-spacing: 1px;
}

/* ======== 字幕区 ======== */
.film-subtitle-bar {
  width: 100%;
  max-width: 700px;
  min-height: 80px;
  background: rgba(0, 0, 0, 0.733);
  border: 1px solid rgba(255, 255, 255, 0.116);
  border-radius: 10px;
  padding: 14px 20px;
  text-align: center;
}

.subtitle-inner {
  animation: fadeSlideUp 0.4s ease;
}

.subtitle-name {
  font-size: 16px;
  font-weight: 700;
  color: #f59e0b;
  letter-spacing: 3px;
  margin-bottom: 6px;
}

.subtitle-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.8;
  letter-spacing: 1px;
  min-height: 24px;
}

.cursor {
  color: #f59e0b;
  animation: blink 0.8s infinite;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

/* ======== 控制区（纵向排列） ======== */
.film-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 0 4px;
}

.ctrl-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(167, 166, 166, 0.06);
  color: #cbd5e1;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
}

.play-btn {
  width: 48px;
  height: 48px;
  font-size: 18px;
  border-color: rgba(245, 158, 11, 0.4);
  color: #f59e0b;
}

.film-counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  padding: 0 6px;
}

.counter-cur {
  font-size: 22px;
  font-weight: 700;
  color: #f59e0b;
  font-family: monospace;
}

.counter-sep {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.25);
}

.counter-total {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.35);
  font-family: monospace;
}
</style>
