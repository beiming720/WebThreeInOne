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
app.mount('#app')
