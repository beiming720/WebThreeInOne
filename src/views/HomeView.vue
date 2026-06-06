<template>
  <div class="home" ref="homeRef">
    <!-- 第一页欢迎页 -->
    <HomeFirst></HomeFirst>

    <!-- 第二页花部分 -->
    <HomeSecond></HomeSecond>

    <!-- 第三页轮播图 -->
    <HomeThird></HomeThird>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const homeRef = ref<HTMLElement>()
const currentScreen = ref(0)
let isScrolling = false

const SCREEN_KEY = 'home_current_screen'

import HomeFirst from '@/components/HomeFirst.vue'
import HomeSecond from '@/components/HomeSecond.vue'
import HomeThird from '@/components/HomeThird.vue'

function saveScreen(index: number) {
  currentScreen.value = index
  sessionStorage.setItem(SCREEN_KEY, String(index))
}

function scrollToScreen(index: number) {
  const screens = homeRef.value?.querySelectorAll('.screen')
  if (!screens || !screens[index]) return
  ;(screens[index] as Element).scrollIntoView({ behavior: 'auto' })
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
  window.dispatchEvent(new CustomEvent('screen-change', { detail: next }))
    ; (screens[next] as Element).scrollIntoView({ behavior: 'smooth' })
  setTimeout(() => { isScrolling = false }, 800)
}

function onScreenChange(e: Event) {
  const index = (e as CustomEvent).detail
  saveScreen(index)
}

onMounted(() => {
  // 恢复上次停留的页面
  const saved = sessionStorage.getItem(SCREEN_KEY)
  if (saved !== null) {
    const index = Number(saved)
    currentScreen.value = index
    // 等 DOM 就绪后滚动
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToScreen(index))
    })
  }

  homeRef.value?.addEventListener('wheel', onWheel, { passive: true })
  window.addEventListener('screen-change', onScreenChange)
})

onUnmounted(() => {
  homeRef.value?.removeEventListener('wheel', onWheel)
  window.removeEventListener('screen-change', onScreenChange)
})
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

/* 切换动画 */
.detail-slide-enter-active,
.detail-slide-leave-active {
  transition: all 0.4s ease;
}

.detail-slide-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.detail-slide-leave-to {
  opacity: 0;
  transform: translateY(-16px);
}
</style>
