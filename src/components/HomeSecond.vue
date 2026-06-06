<template>
  <div ref="homeRef">
    <section class="screen screen-showcase">
      <video autoplay muted loop playsinline poster="../assets/images/meihua.png" class="bg-video">
        <source src="../assets/audio/meihua.mp4" type="video/mp4" />
      </video>
      <div class="overlay"></div>
      <!-- 左侧展示区 -->
      <div class="showcase-display">
        <Transition name="detail-slide" mode="out-in">
          <div class="display-content" :key="activeCity?.name" style="z-index: 1;">
            <h2 class="display-name" :style="{ color: activeCity?.charColors[0] }">{{ activeCity?.name }}</h2>
            <div class="display-attrs">
              <div class="display-attr" v-for="attr in activeCity?.attrs" :key="attr.label">
                <span class="attr-lbl" :style="{ color: activeCity?.charColors[0] }">{{ attr.label }}</span>
                <img :src="attr.imgSrc" style="width: 70%; display: block ">
                <el-button type="primary" :color="activeCity?.charColors[0]" style="width: 120px">了解更多...</el-button>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 右侧竖排卡片 -->
      <div class="card-stack">
        <div v-for="(item, i) in cities" :key="item.name" class="stack-card" :class="{ active: activeIndex === i }"
          @click="activeIndex = i">
          <div class="stack-card-inner">
            <img :src="item.imgSrc" style="width: 100%; display: block">
            <span :style="{ color: item.charColors[0] }" class="stack-name">{{ item.name }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import springImg from '../assets/images/春.png'
import summerImg from '../assets/images/夏.png'
import autumnImg from '../assets/images/秋.png'
import winterImg from '../assets/images/冬.png'
import chunyinghuaImg from "../assets/images/chunyinghua.jpg";
import xiahehuaImg from "../assets/images/xiahehua.png";
import qiujiuhuaImg from "../assets/images/qiujiuhua.png";
import donglameiImg from "../assets/images/donglamei.png";

interface City {
  name: string
  imgSrc: string
  charColors: [string]
  attrs: { label: string; imgSrc: string }[]
}

const cities: City[] = [
  {
    name: '春',
    imgSrc: springImg,
    charColors: ['#f5a0c0'],
    attrs: [
      { label: '春天，是河南最温柔的季节微风拂过中原大地早已换上了五彩缤纷的春装。樱花，如云似霞。那粉白交织的花海总能满足你对于春日浪漫的幻想。', imgSrc: chunyinghuaImg },
    ],
  },
  {
    name: '夏',
    imgSrc: summerImg,
    charColors: ['#17c900d7'],
    attrs: [
      { label: '夏天，是河南最热烈的时节骄阳洒在中原大地早已披上了生机盎然的夏装。荷花，映日别样红。那碧绿与粉白交织的荷塘总能满足你对于夏日清凉的向往。', imgSrc: xiahehuaImg },
    ],
  },
  {
    name: '秋',
    imgSrc: autumnImg,
    charColors: ['#e25808d7'],
    attrs: [
      { label: '秋天，是河南最醇厚的时节金风拂过中原大地早已铺开了满目绚烂的秋装。菊花，凌霜绽金蕊。那千姿百态的菊海总能满足你对于秋日风骨的景仰。', imgSrc: qiujiuhuaImg },
    ],
  },
  {
    name: '冬',
    imgSrc: winterImg,
    charColors: ['#b4ececd7'],
    attrs: [
      { label: '冬天，是河南最素净的时节瑞雪落满中原大地早已披上了银装素裹的冬装。腊梅，凌寒独自开。那金黄与白雪相映的梅影总能满足你对于冬日坚韧的敬仰。', imgSrc: donglameiImg },
    ],
  },
]


const activeIndex = ref(0)
const activeCity = computed(() => cities[activeIndex.value])
</script>

<style scoped>
.screen {
  height: calc(100vh - 3.75rem);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
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

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.123);
  /* 半透明遮罩 */
  z-index: 0;
}

.screen-showcase {
  align-items: stretch;
  justify-content: stretch;
  padding: 0;
  flex-direction: row;
}

/* 左侧展示区 */
.showcase-display {
  flex: 1;
  min-width: 650px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(40px, 6.25rem, 120px);
  border-right: 1px solid rgba(49, 45, 45, 0.548);
  overflow-y: hidden;
  overflow-x: hidden;
}

.display-content {
  width: 100%;
  max-width: 800px;
}

.display-emoji {
  font-size: 88px;
  line-height: 1;
  margin-bottom: 16px;
  filter: drop-shadow(0 0 28px rgba(233, 30, 140, 0.45));
}

.display-name {
  font-size: clamp(24px, 2rem, 56px);
  font-weight: 900;
  color: #f5a0c0;
  letter-spacing: 6px;
  /* margin-bottom: 4px; */
  text-align: center;
  margin-bottom: px;
}

.display-city {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
  margin-bottom: 24px;
  letter-spacing: 2px;
}

.display-attrs {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 10px;
  margin-bottom: 24px;
  min-height: min(660px, 70vh);
}

.display-attr {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.display-attr img {
  margin-bottom: 10px;
}


.attr-val {
  font-size: 12px;
  font-weight: 700;
  color: #f5a0c0;
}

.attr-lbl {
  font-size: clamp(13px, 1rem, 18px);
  display: inline-block;
  width: min(500px, 80%);
  word-break: break-word;
  /* 单词完整换行（推荐） */
  text-indent: 2em;
  overflow: hidden;
  text-overflow: ellipsis;
}

.display-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.9;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 14px 16px;
}

/* 右侧竖排卡片 */
.card-stack {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 24px 30px 24px 16px;
  gap: 8px;
  min-width: 0;
  flex-shrink: 1;
}

.stack-card {
  width: clamp(160px, 18.75vw, 270px);
  height: 55vh;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  flex-shrink: 1;
  min-width: 120px;
}

.stack-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-6px);
}

.stack-card.active {
  background: rgba(233, 30, 140, 0.15);
  border-color: rgba(233, 30, 140, 0.5);
  box-shadow: 0 8px 32px rgba(233, 30, 140, 0.25);
  transform: translateY(-12px);
}

.stack-card-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 5px 5px;
  position: relative;
  overflow: hidden;
}

.stack-name {
  font-weight: 700;
  writing-mode: vertical-rl;
  letter-spacing: 3px;

  position: absolute;
  font-size: clamp(28px, 2.8125rem, 52px);
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
  pointer-events: none;
  z-index: 1;
}
</style>
