/**
 * 用户 API（Mock 实现）
 * 模拟后端登录/注册接口
 */
import type { loginFormData, regFormData } from '@/types/userType'

/** 模拟网络延迟 */
function delay(ms = 800): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** 从 localStorage 读取已注册用户 */
function getUsers(): { username: string; password: string }[] {
  const raw = localStorage.getItem('registered_users')
  return raw ? JSON.parse(raw) : []
}

/** 保存注册用户 */
function saveUser(username: string, password: string) {
  const users = getUsers()
  users.push({ username, password })
  localStorage.setItem('registered_users', JSON.stringify(users))
}

/**
 * 登录接口（Mock）
 */
export async function loginAPI(data: loginFormData): Promise<{ username: string }> {
  await delay(1000)

  if (!data.username || !data.password) {
    throw new Error('请输入账号和密码')
  }

  const users = getUsers()
  const found = users.find(u => u.username === data.username && u.password === data.password)

  if (!found) {
    throw new Error('账号或密码错误')
  }

  return { username: data.username }
}

/**
 * 注册接口（Mock）
 */
export async function registerAPI(data: regFormData): Promise<{ username: string }> {
  await delay(1000)

  if (!data.username || !data.password) {
    throw new Error('请输入账号和密码')
  }

  if (data.username.length < 5 || data.username.length > 10) {
    throw new Error('账号应在5-10位之间')
  }

  if (data.password.length < 6) {
    throw new Error('密码最少为6位')
  }

  if (data.password !== data.password1) {
    throw new Error('两次输入的密码不一致')
  }

  const users = getUsers()
  if (users.find(u => u.username === data.username)) {
    throw new Error('该账号已被注册')
  }

  saveUser(data.username, data.password)
  return { username: data.username }
}
