<template>
  <div class="app-layout">
    <header class="top-nav">
      <div class="nav-brand">
        <img class="brand-logo" src="./assets//images/logo.jpg" />
        <div class="brand-container">
          <span class="brand-name">寻花问城 —</span>
          <span class="brand-name" style="font-size: 17px; ">遇见时光里的河南</span>
        </div>

      </div>
      <video autoplay muted loop playsinline class="bg-video">
        <source src="/audio/列车.mp4" type="video/mp4" />
      </video>
      <nav class="nav-links">
        <RouterLink to="/" class="nav-item">主页</RouterLink>
        <RouterLink to="/echarts" class="nav-item">旅游数据</RouterLink>
        <RouterLink to="/data" class="nav-item">花卉数据</RouterLink>
        <RouterLink to="/recognition" class="nav-item">花卉识别</RouterLink>
        <template v-if="userStore.isLoggedIn">
          <RouterLink to="/user" class="nav-item nav-user">
            <img :src="userStore.user?.avatar" class="nav-avatar" alt="" />
            用户中心
          </RouterLink>
        </template>
        <template v-else>
          <RouterLink to="/login" class="nav-item">登录</RouterLink>
          <RouterLink to="/register" class="nav-item">注册</RouterLink>
        </template>
      </nav>
    </header>

    <div class="main-wrapper">
      <main class="content-area">
        <RouterView v-slot="{ Component }">
          <Transition name="fade">
            <component :is="Component" :key="$route.fullPath" />
          </Transition>
        </RouterView>
      </main>
    </div>

    <Sidebar v-if="isHome" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from './stores/user'
import Sidebar from './components/Sidebar.vue'

const route = useRoute()
const userStore = useUserStore()
const isHome = computed(() => route.path === '/')


</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: #fdf6f0;
}

.bg-video {
  height: 100%;
  object-fit: cover;
  /* 关键：填满容器不变形 */
  z-index: -1;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 3.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  background: #101942;
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(180, 180, 180, 0.623);
  box-shadow: 0 2px 16px rgba(233, 150, 122, 0.1);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-logo {
  height: 3.125rem;
}


.brand-container {
  display: flex;
  align-items: baseline;
  gap: 5px;
  overflow: hidden;
}

.brand-name {
  font-size: clamp(14px, 1.125rem, 22px);
  font-weight: 700;
  color: #fa3c9bc9;
  letter-spacing: 1px;
  white-space: nowrap;
}



.nav-links {
  display: flex;
  gap: 8px;
}

.nav-item {
  padding: 0.5rem 1.25rem;
  border-radius: 20px;
  text-decoration: none;
  color: #c9c9c9;
  font-size: clamp(12px, 0.875rem, 16px);
  font-weight: 500;
  transition: all 0.25s ease;
}

.nav-item:hover {
  background: #d3acd1;
  color: #e63e2c;
}

.nav-item.router-link-active {
  background: linear-gradient(135deg, #853e3e, #db01c9);
  color: #fff;
}

.nav-user {
  display: flex !important;
  align-items: center;
  gap: 6px;
}

.nav-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.main-wrapper {
  display: flex;
  margin-top: 3.75rem;
  flex: 1;
  overflow: hidden;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
