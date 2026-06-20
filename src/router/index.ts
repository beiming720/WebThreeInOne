import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/login', name: 'login', component: () => import('../views/UserLogin.vue') },
    { path: '/register', name: 'register', component: () => import('../views/UserRegister.vue') },
    {
      path: '/user',
      component: () => import('../views/UserCenter.vue'),
      redirect: '/user/profile',
      children: [
        {
          path: 'profile',
          name: 'user-profile',
          component: () => import('../views/user/UserProfile.vue'),
        },
        {
          path: 'edit-info',
          name: 'user-edit-info',
          component: () => import('../views/user/UserEditInfo.vue'),
        },
        {
          path: 'history',
          name: 'user-history',
          component: () => import('../views/user/UserRecognitionHistory.vue'),
        },
      ],
    },
    { path: '/flower/:season', name: 'flower', component: () => import('../views/FlowerDetail.vue') },
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

// 捕获懒加载组件加载失败等导航级错误，避免被全局 unhandledrejection 静默吞掉
router.onError((err) => {
  console.error('[路由错误]', err)
})

export default router
