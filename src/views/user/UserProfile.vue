<template>
  <div class="profile">
    <!-- 头像信息卡片 -->
    <div class="up-card up-profile">
      <div class="up-avatar-box">
        <img :src="userStore.user?.avatar" class="up-avatar" alt="" />
      </div>
      <div class="up-info">
        <h2 class="up-username">{{ userStore.user?.username }}</h2>
        <p class="up-bio">寻花问城 · 遇见时光里的河南</p>
      </div>
      <button class="up-btn-logout" @click="handleLogout">退出登录</button>
    </div>

    <!-- 功能导航卡片 -->
    <div class="up-grid">
      <div class="up-card up-func" v-for="item in menuItems" :key="item.label" @click="item.action()">
        <span class="up-func-icon">{{ item.icon }}</span>
        <div>
          <div class="up-func-label">{{ item.label }}</div>
          <div class="up-func-desc">{{ item.desc }}</div>
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
.profile {
  max-width: 680px;
}

.up-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(233, 150, 122, 0.1);
}

.up-profile {
  padding: 32px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.up-avatar-box {
  flex-shrink: 0;
}

.up-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f4a0a0;
}

.up-info {
  flex: 1;
  min-width: 0;
}

.up-username {
  font-size: 22px;
  font-weight: 700;
  color: #c0392b;
  margin-bottom: 4px;
}

.up-bio {
  font-size: 13px;
  color: #999;
}

.up-btn-logout {
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

.up-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.up-func {
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

.up-func-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.up-func-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.up-func-desc {
  font-size: 12px;
  color: #999;
}
</style>
