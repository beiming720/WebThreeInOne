# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

"寻花问城" — 基于 Vue 3 的河南省旅游与花卉识别 SPA。纯前端项目；花卉识别后端（Python + PyTorch CNN）独立运行在 `localhost:5000`。用户认证后端当前使用 localStorage 模拟。

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

## 架构说明

**入口：** `src/main.ts` → 创建 Vue 应用，全局注册 Pinia/Router/ElementPlus，实现基于 1440px 设计稿的响应式缩放（通过 CSS `--scale` 自定义属性）。

**路由：** `src/router/index.ts` — 12 条路由，使用 `createWebHistory`。页面视图在 `src/views/`，公共组件在 `src/components/`。

**状态管理：** `src/stores/user.ts`（Pinia）— 登录/登出，localStorage 持久化，模拟 token。

**API 层：** `src/api/` 各模块使用 `src/utils/request.ts`（Axios 封装，含拦截器和 `ApiResponse<T>` 泛型）。花卉识别请求发送至 `http://localhost:5000/api/flower/identify`。

**数据可视化：** `EchartView.vue` 包含 6+ 种图表类型，数据来源于 `public/data/` 下的静态 JSON。城市页面（`views/city/`）使用 ECharts 地图，GeoJSON 数据来自 `public/map/`。

**静态资源：** `public/audio/`（视频背景）、`public/data/`（旅游数据 JSON/Excel）、`public/images/`、`public/map/`（GeoJSON 地图数据）。

## 代码风格

- Prettier：无分号、单引号、100 字符宽度
- 2 空格缩进、LF 换行、UTF-8 编码
- Lint 工具链：OxLint + ESLint（flat config），含 Vue 和 TypeScript 规则
- Vue 组件统一使用 `<script setup lang="ts">` 模式
- 路径别名：`@/` → `./src/`

## 后端 API 文档

- `AI_API.md` — 花卉识别 API 接口文档（Flask + PyTorch）
- `API_USER.md` — 用户系统 API 接口文档（Flask + JWT + bcrypt）
- `Explanation.md` — 前后端对接说明
