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

import chunyinghuaImg from '@/assets/images/chunyinghua.jpg'
import xiahehuaImg from '@/assets/images/xiahehua.png'
import qiujiuhuaImg from '@/assets/images/qiujiuhua.png'
import donglameiImg from '@/assets/images/donglamei.png'

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
      { name: '樱花', desc: '如云似霞，粉白交织，春日浪漫的象征。郑州绿博园、洛阳隋唐植物园是赏樱胜地。' },
      { name: '桃花', desc: '桃之夭夭，灼灼其华。河南各地三月桃花盛开，太行山谷十里桃林最为壮观。' },
      { name: '牡丹', desc: '唯有牡丹真国色，花开时节动京城。洛阳牡丹甲天下，四月花会万人空巷。' },
      { name: '海棠', desc: '东风袅袅泛崇光，香雾空蒙月转廊。郑州碧沙岗公园海棠花海引人醉。' },
      { name: '郁金香', desc: '亭亭玉立，色彩斑斓。郑州绿博园郁金香展每年春季如约而至。' },
    ],
  },
  summer: {
    data: { label: '夏 · 映日荷花别样红', icon: '🪷', subtitle: '荷风送香，竹露滴清' },
    flowers: [
      { name: '荷花', desc: '接天莲叶无穷碧，映日荷花别样红。信阳南湾湖、开封清明上河园荷塘胜景。接天莲叶无穷碧，映日荷花别样红。信阳南湾湖、开封清明上河园荷塘胜景。接天莲叶无穷碧，映日荷花别样红。信阳南湾湖、开封清明上河园荷塘胜景。接天莲叶无穷碧，映日荷花别样红。信阳南湾湖、开封清明上河园荷塘胜景。接天莲叶无穷碧，映日荷花别样红。信阳南湾湖、开封清明上河园荷塘胜景。接天莲叶无穷碧，映日荷花别样红。信阳南湾湖、开封清明上河园荷塘胜景。接天莲叶无穷碧，映日荷花别样红。信阳南湾湖、开封清明上河园荷塘胜景。接天莲叶无穷碧，映日荷花别样红。信阳南湾湖、开封清明上河园荷塘胜景。接天莲叶无穷碧，映日荷花别样红。信阳南湾湖、开封清明上河园荷塘胜景。' },
      { name: '紫薇', desc: '盛夏绿遮眼，此花红满堂。紫薇花期长达百日，为夏日增添一抹绚烂色彩。' },
      { name: '向日葵', desc: '金黄灿烂，向阳而生。河南多地向日葵花海在七八月迎来最佳观赏期。' },
      { name: '月季', desc: '花中皇后，四季常开。郑州为"中国月季之乡"，市区月季花开不断。' },
      { name: '栀子花', desc: '色疑琼树倚，香似玉京来。洁白芬芳的栀子花是夏日最动人的气息。' },
    ],
  },
  autumn: {
    data: { label: '秋 · 满城尽带黄金甲', icon: '🏵️', subtitle: '金风玉露，菊香满城' },
    flowers: [
      { name: '菊花', desc: '不是花中偏爱菊，此花开尽更无花。开封菊花文化节闻名全国。' },
      { name: '桂花', desc: '桂子月中落，天香云外飘。河南各地金秋时节桂香满城，沁人心脾。' },
      { name: '木芙蓉', desc: '千林扫作一番黄，只有芙蓉独自芳。霜降时节木芙蓉傲然绽放。' },
      { name: '美人蕉', desc: '叶满丛深殷似火，不唯夏艳亦秋光。花色艳丽，是秋日里的一抹暖色。' },
    ],
  },
  winter: {
    data: { label: '冬 · 凌寒独自开', icon: '🌺', subtitle: '梅花香自苦寒来' },
    flowers: [
      { name: '腊梅', desc: '枝横碧玉天然瘦，蕾破黄金分外香。许昌鄢陵"蜡梅之乡"，千年种植历史。' },
      { name: '梅花', desc: '墙角数枝梅，凌寒独自开。郑州植物园冬季梅花展，暗香浮动。' },
      { name: '山茶花', desc: '山茶花开春未归，冰雪林中著此身。河南南部山茶花在寒冬中绽放美丽。' },
      { name: '水仙', desc: '借水开花自一奇，水沉为骨玉为肌。春节前后水仙花开，清香满室。' },
    ],
  },
}

// 为每个季节的花分配图片（循环使用现有图片）
const flowerImages = [chunyinghuaImg, xiahehuaImg, qiujiuhuaImg, donglameiImg]

const seasonKey = computed(() => (route.params.season as string) || 'spring')
const seasonEntry = computed(() => seasons[seasonKey.value] ?? seasons.spring)
const seasonData = computed(() => seasonEntry.value!.data)
const flowers = computed(() =>
  seasonEntry.value!.flowers.map((f, i): FlowerItem => ({
    ...f,
    img: flowerImages[i % flowerImages.length]!,
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
