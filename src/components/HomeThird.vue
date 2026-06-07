<template>
  <div>
    <section class="screen screen-carousel" :style="{ backgroundImage: `url(${bgShuye})` }">
      <el-carousel ref="carouselRef" :interval="isHovering ? 0 : 3000" arrow="always" height="100%"
        class="carousel-container" @mouseenter="isHovering = true" @mouseleave="isHovering = false">
        <el-carousel-item v-for="(slide, i) in slides" :key="i">
          <div class="slide-inner" :style="{ backgroundImage: `url(${slide.bgImage})` }">
            <div class="slide-overlay"></div>
            <div class="slide-content">
              <h2 class="slide-title">{{ slide.title }}</h2>
              <p class="slide-desc">{{ slide.description }}</p>
              <el-button v-if="slide.btnText" type="primary" :color="slide.btnColor" size="large" round
                class="slide-btn" @click="goCity(slide.routeName)">
                {{ slide.btnText }}
              </el-button>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { CarouselInstance } from 'element-plus'

const router = useRouter()

// ===== 轮播图数据（按需修改） =====
interface Slide {
  bgImage: string       // 背景图
  title: string         // 标题
  description: string   // 描述文案
  btnText?: string      // 按钮文字（不写则不显示按钮）
  btnColor?: string     // 按钮颜色
  routeName: string     // 跳转路由名称
}

function goCity(routeName: string) {
  router.push({ name: routeName })
}

// 导入图片
import bgShuye from '../assets/images/cheng/书页背景.png'
import kaifeng from '../assets/images/cheng/开封.png'
import luoyang from '../assets/images/cheng/洛阳.jpg'
import anyang from '../assets/images/cheng/安阳.jpg'
import shangqiu from '../assets/images/cheng/商丘.jpg'

const carouselRef = ref<CarouselInstance>()
const isHovering = ref(false)

const slides: Slide[] = [
  {
    bgImage: kaifeng,
    title: '开封',
    description: '八朝古都，以《清明上河图》为蓝本再现北宋东京梦华，是一座"城摞城"的水中古城。',
    btnText: '了解更多',
    btnColor: '#2196f3',
    routeName: 'kaifeng',
  },
  {
    bgImage: luoyang,
    title: '洛阳',
    description: '十三朝古都，拥有世界文化遗产龙门石窟与盛唐气象的隋唐洛阳城，是华夏文明的重要发祥地。',
    btnText: '了解更多',
    btnColor: '#2196f3',
    routeName: 'luoyang',
  },
  {
    bgImage: anyang,
    title: '安阳',
    description: '七朝古都，甲骨文的发现地与殷墟所在地，是探索商文明与汉字起源的文字之都。',
    btnText: '了解更多',
    btnColor: '#2196f3',
    routeName: 'anyang',
  },
  {
    bgImage: shangqiu,
    title: '商丘',
    description: '三商之源，拥有外圆内方、形似古钱币的明清归德府城，其下叠压着"城摞城"的千年奇观。',
    btnText: '了解更多',
    btnColor: '#2196f3',
    routeName: 'shangqiu',
  },
]
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

.screen-carousel {
  padding: 0;
  background-size: cover;
  background-position: center;
}

/* 轮播容器 — 等比缩小居中 */
.carousel-container {
  width: 60%;
  height: 68%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 48px rgba(0, 0, 0, 0.35);
}

.carousel-container :deep(.el-carousel__container) {
  height: 100%;
}

.slide-inner {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.slide-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 0;
}

.slide-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 480px;
  padding: 0 24px;
}

.slide-title {
  font-size: clamp(22px, 2.4vw, 38px);
  font-weight: 800;
  color: #fff;
  margin-bottom: 12px;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}

.slide-desc {
  font-size: clamp(13px, 1.1vw, 16px);
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.7;
  margin-bottom: 24px;
}

.slide-btn {
  font-size: 15px;
  padding: 12px 32px;
}
</style>
