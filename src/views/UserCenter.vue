<template>
  <div class="user-center-layout">
    <aside class="uc-sidebar">
      <nav class="uc-nav">
        <RouterLink to="/user/profile" class="uc-nav-item" active-class="uc-nav-active">
          <span class="uc-nav-icon">
            <User />
          </span>
          <span class="uc-nav-text">个人中心</span>
        </RouterLink>
        <RouterLink to="/user/edit-info" class="uc-nav-item" active-class="uc-nav-active">
          <span class="uc-nav-icon">
            <EditPen />
          </span>
          <span class="uc-nav-text">修改信息</span>
        </RouterLink>
        <RouterLink to="/user/history" class="uc-nav-item" active-class="uc-nav-active">
          <span class="uc-nav-icon">
            <Clock />
          </span>
          <span class="uc-nav-text">识别记录</span>
        </RouterLink>

        <div class="uc-nav-divider" />

        <div v-for="item in externalLinks" :key="item.label" class="uc-nav-item uc-nav-external"
          @click="router.push(item.path)">
          <span class="uc-nav-icon">
            <component :is="item.icon" />
          </span>
          <span class="uc-nav-text">{{ item.label }}</span>
        </div>
      </nav>

      <button class="uc-btn-logout" @click="handleLogout">退出登录</button>
    </aside>

    <main class="uc-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter, RouterLink, RouterView } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const externalLinks = [
  { icon: 'HomeFilled', label: '前往首页', path: '/' },
  { icon: 'Histogram', label: '数据大屏', path: '/echarts' },
  { icon: 'CameraFilled', label: '花卉识别', path: '/recognition' },
  { icon: 'Collection', label: '花卉知识库', path: '/data' },
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
.user-center-layout {
  min-height: calc(100vh - 3.75rem);
  display: flex;
  // background: linear-gradient(160deg, #fdf6f0 0%, #fce4ec 50%, #f3e5f5 100%);
  background-image: url('@/assets/images/bg/userCenterBg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.uc-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(233, 150, 122, 0.12);
  display: flex;
  flex-direction: column;
  padding: 24px 0;
}

.uc-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 12px;
}

.uc-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  text-decoration: none;
  color: #555;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #0f629d52;
    color: #000000;
  }
}

.uc-nav-active {
  background: linear-gradient(135deg, #2193b0, #6dd5ed);
  color: #000000;
  font-weight: 600;
  box-shadow: inset 3px 0 0 #2193b0;
}

.uc-nav-icon {
  font-size: 18px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  color: inherit;

  :deep(svg) {
    width: 1em;
    height: 1em;
  }
}

.uc-nav-text {
  white-space: nowrap;
}

.uc-nav-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(233, 150, 122, 0.3), transparent);
  margin: 8px 4px;
}

.uc-nav-external {
  .uc-nav-icon {
    opacity: 0.7;
  }
}

.uc-btn-logout {
  margin: 16px 12px 0;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(54, 47, 47, 0.5);
  background: #bfd7dd;
  color: #000000;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #0f629d52;
    border-color: #2b2929;
  }
}

.uc-content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .user-center-layout {
    flex-direction: column;
  }

  .uc-sidebar {
    width: 100%;
    flex-direction: row;
    align-items: center;
    padding: 12px 16px;
    border-right: none;
    border-bottom: 1px solid rgba(233, 150, 122, 0.12);
    overflow-x: auto;
  }

  .uc-nav {
    flex: 1;
    flex-direction: row;
    gap: 4px;
    padding: 0;
  }

  .uc-nav-item {
    flex-shrink: 0;
    padding: 8px 12px;
    font-size: 13px;
    gap: 4px;
  }

  .uc-nav-active {
    box-shadow: inset 0 -3px 0 0 #c0392b;
  }

  .uc-nav-divider {
    display: none;
  }

  .uc-btn-logout {
    margin: 0 0 0 8px;
    padding: 8px 14px;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .uc-content {
    padding: 16px;
  }
}
</style>
