<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <aside class="sidebar-capsule" :class="{ collapsed: hidden }" @mouseenter="show" @mouseleave="startTimer">
    <div class="capsule-inner">
      <div v-for="(item, i) in sections" :key="i" class="capsule-item" :class="{ active: activeIndex === i }"
        @click="scrollTo(i)">
        <span class="capsule-dot"></span>
        <span class="capsule-text">{{ item }}</span>
      </div>
    </div>
    <div class="capsule-tab" @mouseenter="show">
      <span class="tab-arrow">›</span>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const sections = ['欢迎', '花', '城']
const activeIndex = ref(0)
const hidden = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

function scrollTo(index: number) {
  const screens = document.querySelectorAll('.screen')
  screens[index]?.scrollIntoView({ behavior: 'smooth' })
  activeIndex.value = index
}

function onScreenChange(e: Event) {
  activeIndex.value = (e as CustomEvent).detail
}

function show() {
  hidden.value = false
  clearTimer()
}

function startTimer() {
  clearTimer()
  timer = setTimeout(() => { hidden.value = true }, 3000)
}

function clearTimer() {
  if (timer) { clearTimeout(timer); timer = null }
}

onMounted(() => {
  window.addEventListener('screen-change', onScreenChange)
  startTimer()
})
onUnmounted(() => {
  clearTimer()
  window.removeEventListener('screen-change', onScreenChange)
})
</script>

<style scoped>
.sidebar-capsule {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 90;
  display: flex;
  align-items: center;
  flex-direction: row-reverse;
  transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-capsule.collapsed {
  transform: translateY(-50%) translateX(calc(-100% + 14px));
}

.capsule-inner {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(16px);
  border-radius: 0 28px 28px 0;
  padding: 12px 12px 12px 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 4px 0 28px rgba(233, 150, 122, 0.12), 0 4px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(233, 150, 122, 0.15);
  border-left: none;
  min-width: 100px;
}

.capsule-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px 10px 8px;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.25s;
  white-space: nowrap;
}

.capsule-item:hover {
  background: rgba(233, 150, 122, 0.12);
}

.capsule-item.active {
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.12), rgba(233, 30, 140, 0.08));
}

.capsule-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d4d4d4;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.capsule-item.active .capsule-dot {
  background: linear-gradient(135deg, #e74c3c, #e91e8c);
  box-shadow: 0 0 8px rgba(231, 76, 60, 0.5);
  transform: scale(1.3);
}

.capsule-text {
  font-size: 13px;
  font-weight: 500;
  color: #202020;
  transition: color 0.3s;
}

.capsule-item.active .capsule-text {
  color: #c0392b;
  font-weight: 600;
}

.capsule-tab {
  width: 14px;
  height: 48px;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(233, 150, 122, 0.15);
  border-right: none;
  border-radius: 10px 0 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.35s;
}

.sidebar-capsule:not(.collapsed) .capsule-tab {
  opacity: 0;
  pointer-events: none;
}

.tab-arrow {
  font-size: 14px;
  color: #c0392b;
  line-height: 1;
  user-select: none;
}
</style>
