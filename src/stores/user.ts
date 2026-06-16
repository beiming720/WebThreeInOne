import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface UserInfo {
  username: string
  avatar?: string
  token: string
}

export const useUserStore = defineStore('user', () => {
  // 从 localStorage 恢复登录状态
  const saved = localStorage.getItem('user')
  const initial: UserInfo | null = saved ? JSON.parse(saved) : null

  const user = ref<UserInfo | null>(initial)
  const isLoggedIn = computed(() => user.value !== null)

  function login(username: string) {
    const userInfo: UserInfo = {
      username,
      avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(username)}`,
      token: 'mock-token-' + Date.now(),
    }
    user.value = userInfo
    localStorage.setItem('user', JSON.stringify(userInfo))
  }

  function logout() {
    user.value = null
    localStorage.removeItem('user')
  }

  return { user, isLoggedIn, login, logout }
})
