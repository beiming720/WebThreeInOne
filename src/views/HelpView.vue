<template>
  <div class="help-page">
    <div class="help-card">
      <div class="help-icon">🚧</div>
      <h2>帮助页面</h2>
      <p>该功能尚未开发，敬请期待</p>
      <button class="btn-back" @click="router.push('/')">返回主页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<style scoped>
.help-page {
  min-height: calc(100vh - 60px);
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(160deg, #fdf6f0 0%, #fce4ec 100%);
}
.help-card {
  text-align: center; background: #fff; border-radius: 24px;
  padding: 60px 48px; box-shadow: 0 8px 40px rgba(233,150,122,0.15);
}
.help-icon { font-size: 64px; margin-bottom: 20px; }
h2 { font-size: 24px; color: #333; margin-bottom: 12px; }
p { font-size: 15px; color: #999; margin-bottom: 32px; }
.btn-back {
  padding: 12px 32px; border-radius: 20px; border: none; cursor: pointer;
  background: linear-gradient(135deg, #e74c3c, #e91e8c);
  color: #fff; font-size: 14px; font-weight: 600;
  transition: transform 0.2s;
}
.btn-back:hover { transform: translateY(-2px); }
</style>
