<template>
  <div ref="homeRef">
    <section class="screen screen-cover">
      <video autoplay muted loop playsinline poster="../assets/images/hua.png" class="bg-video">
        <source src="../assets/audio/hua.mp4" type="video/mp4" />
      </video>
      <div class="overlay"></div>
      <div class="cover-content">
        <h1 class="cover-title">寻花问城，遇见时光里的河南</h1>
        <p class="cover-sub1">花·城·景</p>
        <p class="cover-sub">花开有时，古城无恙</p>
        <button class="btn-start" @click="router.push('/recognition')">开始游览 →</button>
      </div>
      <div class="scroll-hint" @click="scrollTo(1)">
        <span>向下探索</span>
        <div class="scroll-arrow">↓</div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const homeRef = ref<HTMLElement>()
const currentScreen = ref(0)

function scrollTo(index: number) {
  const screens = homeRef.value?.querySelectorAll('.screen')
  currentScreen.value = index
  window.dispatchEvent(new CustomEvent('screen-change', { detail: index }))
    ; (screens?.[index] as Element)?.scrollIntoView({ behavior: 'smooth' })
}
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

.flowers-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.float-flower {
  position: absolute;
  animation: floatAnim linear infinite;
  user-select: none;
}

@keyframes floatAnim {
  0% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-30px) rotate(15deg);
  }

  100% {
    transform: translateY(0) rotate(0deg);
  }
}

.cover-content {
  text-align: center;
  z-index: 1;
}

.cover-title {
  font-size: clamp(28px, 3.5rem, 72px);
  font-weight: 800;
  color: #f5d1f2;
  text-shadow: 0 0 40px rgba(233, 30, 140, 0.6);
  margin-bottom: 16px;
  letter-spacing: 4px;
}

.cover-sub {
  font-size: clamp(13px, 1.125rem, 22px);
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 40px;
}

.cover-sub1 {
  font-size: clamp(13px, 1.125rem, 22px);
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 20px;
}

.btn-start {
  padding: 0.875rem 3rem;
  font-size: clamp(13px, 1rem, 18px);
  font-weight: 600;
  background: linear-gradient(135deg, #853e3e, #db01c9);
  color: #f5d1f2;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  box-shadow: 0 8px 32px rgba(233, 30, 140, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-start:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(233, 30, 140, 0.6);
}

.scroll-hint {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  text-align: center;
  cursor: pointer;
  animation: bounce 2s infinite;
}

.scroll-arrow {
  font-size: 18px;
  margin-top: 4px;
}

@keyframes bounce {

  0%,
  100% {
    transform: translateX(-50%) translateY(0);
  }

  50% {
    transform: translateX(-50%) translateY(6px);
  }
}
</style>
