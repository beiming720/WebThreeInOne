# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

"寻花问城" — 基于 Vue 3 的河南省旅游与花卉识别 SPA。纯前端项目；花卉识别后端（Python + PyTorch CNN）独立运行在 `localhost:5000`。

用户认证目前为 localStorage Mock 实现，`API_USER.md` 中定义了完整的后端 API 规范（Flask + JWT + bcrypt，端口 `5001`），待后续对接。

## 常用命令

| 命令 | 用途 |
|---|---|
| `npm run dev` | Vite 开发服务器（HMR 热更新） |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run build-only` | 仅生产构建（跳过类型检查） |
| `npm run type-check` | `vue-tsc --build` 类型检查 |
| `npm run lint` | OxLint → ESLint 依次执行（均带 `--fix`） |
| `npm run format` | Prettier 格式化 `src/` |

项目未配置测试框架。

## 技术栈

Vue 3.5（Composition API, `<script setup>`）· TypeScript 6 · Vite 8 · Vue Router 5 · Pinia 3 · Element Plus · ECharts 6 · Axios · Sass

Node 版本要求：`^20.19.0 || >=22.12.0`

Vite 插件：`@vitejs/plugin-vue` + `vite-plugin-vue-devtools`

## 架构说明

### 入口与应用壳

`src/main.ts` → 创建 Vue 应用，全局注册 Pinia / Router / ElementPlus（含所有图标），实现基于 1440px 设计稿的响应式缩放（`--scale` CSS 自定义属性 + `fontSize` 动态设置）。

`src/App.vue` — 固定顶部导航栏（深色背景 + 火车视频背景）、`<RouterView>` 带 fade 过渡动画、`Sidebar` 组件仅在首页（`/`）显示。

### 路由

`src/router/index.ts` — 12 条路由，`createWebHistory`。所有页面组件均为懒加载。

- `/` 主页（HomeView）
- `/login` / `/register` 登录/注册
- `/user` 用户中心（嵌套路由：`/user/profile`、`/user/edit-info`、`/user/history`）
- `/flower/:season` 花卉详情（按季节：spring/summer/autumn/winter）
- `/recognition` 花卉识别
- `/data` 花卉数据页（花卉合格率统计）
- `/echarts` 旅游数据大屏
- `/city/kaifeng` `/city/luoyang` `/city/anyang` `/city/shangqiu` 城市页（ECharts 地图下钻）

### 状态管理

`src/stores/user.ts`（Pinia）— 登录/登出/更新个人信息，localStorage 持久化，token 为 `mock-token-*`。当前为纯前端 Mock，无真实后端交互。

### API 层

`src/utils/request.ts` — Axios 封装，提供 `get<T>()`、`post<T>()`、`apiRequest<T>()`（自动检查 `code !== 0` 抛出 `RequestError`）。

**API 模块不对称：**

| 模块 | 文件 | 对接方式 |
|---|---|---|
| 花卉识别 | `src/api/flower.ts` | **真实后端** `localhost:5000` |
| 用户认证 | `src/api/user.ts` | **localStorage Mock**（待对接 `localhost:5001`） |
| 旅游数据 | `src/api/data.ts` | 静态 JSON（`public/data/`） |
| 地图数据 | `src/api/map.ts` | GeoJSON（`public/map/`） |

### 花卉识别流程

`RecognitionView.vue` → 用户上传图片 → `api/flower.ts:identifyFlower()` → `POST localhost:5000/api/flower/identify`（FormData，超时 30s）→ 返回 `{ name, latin, confidence, desc }`。

识别成功后可选保存到识别历史 → `utils/history.ts:addRecord()` → localStorage（前端 Mock），对接后端后改为 `POST localhost:5001/api/user/history`。

### 识别历史

`src/types/recognition.ts` — `RecognitionRecord` 类型定义（id, imageUrl, flowerName, confidence, createdAt）。

`src/utils/history.ts` — 基于 localStorage 的增/查/删操作。`RecognitionView.vue` 写入，`UserRecognitionHistory.vue` 展示。

后端对接后应替换为 `API_USER.md` 中的 3.6~3.8 接口（`POST/GET/DELETE /api/user/history`）。

### 数据可视化

- `EchartView.vue` — 6+ 种图表类型（含 ECharts 中国/河南地图），数据来源于 `public/data/` 下的静态 JSON
- `DataView.vue` — 花卉苗木合格率统计（`public/data/henan_flower_qualification.json`）
- 城市页面（`views/city/`）— ECharts 地图下钻，GeoJSON 来自 `public/map/`

### 视图组件

| 目录/文件 | 用途 |
|---|---|
| `src/views/HomeView.vue` | 主页，组合 HomeFirst / HomeSecond / HomeThird |
| `src/views/RecognitionView.vue` | 花卉识别（图片上传 + AI 识别 + 结果展示） |
| `src/views/EchartView.vue` | 旅游数据大屏 |
| `src/views/DataView.vue` | 花卉合格率数据展示 |
| `src/views/FlowerDetail.vue` | 花卉列表详情页（按季节） |
| `src/views/city/*.vue` | 4 个城市专题页 |
| `src/views/user/*.vue` | 用户中心子页面 |
| `src/components/Sidebar.vue` | 首页侧边栏 |
| `src/components/HomeFirst.vue` | 首页 - 城市展示卡片 |
| `src/components/HomeSecond.vue` | 首页 - 花卉列表入口 |
| `src/components/HomeThird.vue` | 首页 - AI 识别宣传 |
| `src/components/FlowerHeatmap.vue` | ECharts 花卉品种热力图 |

### 静态资源

| 目录 | 内容 |
|---|---|
| `public/audio/` | 视频背景（列车.mp4） |
| `public/data/` | 旅游/花卉统计 JSON 数据 |
| `public/images/` | 各类图片资源 |
| `public/map/` | GeoJSON 地图数据（china.json, henan.json, 城市 json） |
| `src/assets/` | 组件内引用的图片、CSS |

## 代码风格

- Prettier：无分号、单引号、100 字符宽度
- 2 空格缩进、LF 换行、UTF-8 编码
- Lint 工具链：OxLint + ESLint（flat config），含 Vue 和 TypeScript 规则
- Vue 组件统一使用 `<script setup lang="ts">` 模式
- 路径别名：`@/` → `./src/`

## 后端 API 文档

- `AI_API.md` — 花卉识别 API 接口文档（Flask + PyTorch CNN，端口 5000）
- `API_USER.md` — 用户系统 API 接口文档（Flask/ASP.NET Core + JWT + bcrypt，端口 5001，含识别历史 CRUD）
- `Explanation.md` — 花卉识别接口前后端对接简要说明
