<template>
  <div class="user-center">
    <div class="uc-container">
      <!-- 头像信息卡片 -->
      <div class="uc-card uc-profile">
        <div class="uc-avatar-box">
          <img :src="userStore.user?.avatar" class="uc-avatar" alt="" />
        </div>
        <div class="uc-info">
          <h2 class="uc-username">{{ userStore.user?.username }}</h2>
          <p class="uc-bio">寻花问城 · 遇见时光里的河南</p>
        </div>
        <button class="uc-btn-logout" @click="handleLogout">退出登录</button>
      </div>

      <!-- 功能卡片 -->
      <div class="uc-grid">
        <div class="uc-card uc-func" v-for="item in menuItems" :key="item.label" @click="item.action?.()">
          <span class="uc-func-icon">{{ item.icon }}</span>
          <div>
            <div class="uc-func-label">{{ item.label }}</div>
            <div class="uc-func-desc">{{ item.desc }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const menuItems = [
  { icon: '🏙️', label: '前往首页', desc: '浏览河南四大古城详情与风景', action: () => router.push('/') },
  { icon: '📊', label: '数据大屏', desc: '查看中国旅游数据可视化分析', action: () => router.push('/echarts') },
  { icon: '🌸', label: '花卉识别', desc: '上传花卉图片进行AI识别', action: () => router.push('/recognition') },
  { icon: '📚', label: '花卉知识库', desc: '了解各种花卉的详细信息', action: () => router.push('/data') },
  { icon: '🔑', label: '修改信息', desc: '更改您的用户信息', action: () => ElMessage.info('功能开发中...') },
  { icon: '📝', label: '识别记录', desc: '查看您的花卉识别历史记录', action: () => ElMessage.info('功能开发中...') },
]

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push({ path: '/', replace: true })
  }).catch(() => { })
}
</script>

<style scoped lang="scss">
.user-center {
  min-height: calc(100vh - 3.75rem);
  background: linear-gradient(160deg, #fdf6f0 0%, #fce4ec 50%, #f3e5f5 100%);
  padding: 40px 24px;
  display: flex;
  justify-content: center;
}

.uc-container {
  width: 100%;
  max-width: 680px;
}

.uc-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(233, 150, 122, 0.1);
}

.uc-profile {
  padding: 32px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.uc-avatar-box {
  flex-shrink: 0;
}

.uc-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f4a0a0;
}

.uc-info {
  flex: 1;
  min-width: 0;
}

.uc-username {
  font-size: 22px;
  font-weight: 700;
  color: #c0392b;
  margin-bottom: 4px;
}

.uc-bio {
  font-size: 13px;
  color: #999;
}

.uc-btn-logout {
  padding: 8px 20px;
  border-radius: 20px;
  border: 1px solid #e0c0c0;
  background: #fff;
  color: #c0392b;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: #fce4ec;
    border-color: #c0392b;
  }
}

.uc-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.uc-func {
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.25s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(233, 150, 122, 0.15);
  }
}

.uc-func-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.uc-func-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.uc-func-desc {
  font-size: 12px;
  color: #999;
}
</style>
