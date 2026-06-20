import './assets/main.css'
import { createApp } from 'vue'

// 基于设计稿宽度 1440px 自动缩放
function setScale() {
  const scale = window.innerWidth / 1440
  document.documentElement.style.setProperty('--scale', String(scale))
  document.documentElement.style.fontSize = `${scale * 16}px`
}
setScale()
window.addEventListener('resize', setScale)
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// ===== 全局错误恢复 =====
// 捕获 Vue 渲染、侦听器、生命周期中的未处理错误
app.config.errorHandler = (err: unknown, instance, info: string) => {
  const name = instance?.$.type?.name || 'unknown'
  console.error(`[Global Vue Error] ${name} (${info}):`, err)

  try {
    const message = err instanceof Error ? err.message : String(err)
    ElMessage.error(`应用异常: ${message}`)
  } catch {
    // ElMessage 不可用时回退到 console（如初始挂载期间出错）
    console.error('[ElMessage 调用失败]')
  }
}

// 捕获未处理的 Promise rejection
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  console.error('[未处理的 Promise 拒绝]', event.reason)

  try {
    const message = event.reason instanceof Error ? event.reason.message : String(event.reason)
    ElMessage.error(`请求异常: ${message}`)
  } catch {
    console.error('[ElMessage 调用失败]')
  }

  event.preventDefault()
})

app.mount('#app')
