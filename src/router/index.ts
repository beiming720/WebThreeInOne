import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/login', name: 'login', component: () => import('../views/UserLogin.vue') },
    { path: '/register', name: 'register', component: () => import('../views/UserRegister.vue') },
    {
      path: '/recognition',
      name: 'recognition',
      component: () => import('../views/RecognitionView.vue'),
    },
    { path: '/data', name: 'data', component: () => import('../views/DataView.vue') },
    {
      path: '/echarts',
      name: 'echarts',
      component: () => import('../views/EchartView.vue'),
    },
    {
      path: '/city/kaifeng',
      name: 'kaifeng',
      component: () => import('../views/city/KaiFeng.vue'),
    },
    {
      path: '/city/luoyang',
      name: 'luoyang',
      component: () => import('../views/city/LuoYang.vue'),
    },
    { path: '/city/anyang', name: 'anyang', component: () => import('../views/city/AnYang.vue') },
    {
      path: '/city/shangqiu',
      name: 'shangqiu',
      component: () => import('../views/city/ShangQiu.vue'),
    },
  ],
})

export default router
