<template>
  <div class="data-page">
    <Transition name="search-shrink">
      <div v-if="!searched" class="search-hero">
        <h2 class="search-title">🌼 花卉数据库</h2>
        <p class="search-sub">输入花卉名称，探索详细信息</p>
        <div class="search-box-wrap">
          <input v-model="query" class="search-input" placeholder="例如：向日葵、玫瑰、薰衣草..." @keyup.enter="doSearch" />
          <button class="search-btn" @click="doSearch">搜索</button>
        </div>
      </div>
    </Transition>

    <div v-if="searched" class="search-compact">
      <div class="search-box-wrap compact">
        <input v-model="query" class="search-input" @keyup.enter="doSearch" />
        <button class="search-btn" @click="doSearch">搜索</button>
      </div>
    </div>

    <Transition name="result-appear">
      <div v-if="searched && flowerData" class="result-wrap">
        <div class="flower-card">
          <div class="flower-card-header">
            <span class="flower-emoji">{{ flowerData.emoji }}</span>
            <div>
              <h3 class="flower-name">{{ flowerData.name }}</h3>
              <p class="flower-latin">{{ flowerData.latin }}</p>
            </div>
            <el-tag type="success" class="flower-tag">{{ flowerData.family }}</el-tag>
          </div>
          <el-divider />
          <div class="flower-attrs">
            <div class="attr-item" v-for="attr in flowerData.attrs" :key="attr.label">
              <span class="attr-label">{{ attr.label }}</span>
              <span class="attr-value">{{ attr.value }}</span>
            </div>
          </div>
          <p class="flower-desc">{{ flowerData.desc }}</p>
        </div>
      </div>
    </Transition>

    <Transition name="result-appear">
      <div v-if="searched && !flowerData" class="no-result">
        <span>🔍</span>
        <p>未找到"{{ lastQuery }}"的相关信息</p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const query = ref('')
const lastQuery = ref('')
const searched = ref(false)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const flowerData = ref<any>(null)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: Record<string, any> = {
  '向日葵': {
    emoji: '🌻', name: '向日葵', latin: 'Helianthus annuus', family: '菊科',
    attrs: [
      { label: '花期', value: '7 - 9 月' },
      { label: '原产地', value: '北美洲' },
      { label: '株高', value: '1 - 3 米' },
      { label: '花色', value: '黄色' },
    ],
    desc: '向日葵是菊科向日葵属一年生草本植物，因花序随太阳转动而得名。种子富含不饱和脂肪酸，可榨油食用，也是重要的观赏植物。',
  },
  '玫瑰': {
    emoji: '🌹', name: '玫瑰', latin: 'Rosa rugosa', family: '蔷薇科',
    attrs: [
      { label: '花期', value: '5 - 6 月' },
      { label: '原产地', value: '中国' },
      { label: '株高', value: '1 - 2 米' },
      { label: '花色', value: '红、粉、白' },
    ],
    desc: '玫瑰是蔷薇科蔷薇属落叶灌木，花朵芳香浓郁，是重要的香料植物和观赏植物，也是爱情的象征。',
  },
  '薰衣草': {
    emoji: '💜', name: '薰衣草', latin: 'Lavandula angustifolia', family: '唇形科',
    attrs: [
      { label: '花期', value: '6 - 8 月' },
      { label: '原产地', value: '地中海地区' },
      { label: '株高', value: '30 - 60 厘米' },
      { label: '花色', value: '紫色' },
    ],
    desc: '薰衣草是唇形科薰衣草属多年生草本植物，以其独特的香气著称，广泛用于香料、精油和园艺观赏。',
  },
}

function doSearch() {
  if (!query.value.trim()) return
  lastQuery.value = query.value.trim()
  searched.value = true
  flowerData.value = db[lastQuery.value] ?? null
}
</script>

<style scoped>
.data-page {
  min-height: calc(100vh - 3.75rem);
  background: linear-gradient(160deg, #fdf6f0 0%, #e8f5e9 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 24px 40px;
}

.search-hero {
  text-align: center;
  width: 100%;
  max-width: min(600px, 90vw);
}

.search-title {
  font-size: clamp(22px, 2rem, 40px);
  font-weight: 700;
  color: #2e7d32;
  margin-bottom: 8px;
}

.search-sub {
  font-size: clamp(13px, 0.9375rem, 17px);
  color: #888;
  margin-bottom: 32px;
}

.search-box-wrap {
  display: flex;
  gap: 0;
  border-radius: 40px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(46, 125, 50, 0.15);
}

.search-box-wrap.compact {
  max-width: 480px;
  width: 100%;
}

.search-input {
  flex: 1;
  padding: 16px 24px;
  font-size: 15px;
  border: none;
  outline: none;
  background: #fff;
}

.search-btn {
  padding: 16px 28px;
  background: linear-gradient(135deg, #43a047, #00897b);
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: opacity 0.2s;
}

.search-btn:hover {
  opacity: 0.9;
}

.search-compact {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 20px 0 32px;
}

.result-wrap {
  width: 100%;
  max-width: min(600px, 90vw);
}

.flower-card {
  background: #fff;
  border-radius: 20px;
  padding: clamp(16px, 1.75rem, 32px);
  box-shadow: 0 8px 40px rgba(46, 125, 50, 0.12);
}

.flower-name {
  font-size: clamp(16px, 1.375rem, 26px);
  font-weight: 700;
  color: #1b5e20;
}

.flower-latin {
  font-size: 13px;
  color: #999;
  font-style: italic;
}

.flower-tag {
  margin-left: auto;
}

.flower-attrs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.attr-item {
  background: #f1f8e9;
  border-radius: 10px;
  padding: 10px 14px;
}

.attr-label {
  font-size: 11px;
  color: #888;
  display: block;
  margin-bottom: 2px;
}

.attr-value {
  font-size: 14px;
  font-weight: 600;
  color: #2e7d32;
}

.flower-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.8;
}

.no-result {
  text-align: center;
  color: #aaa;
  font-size: 15px;
  margin-top: 40px;
}

.no-result span {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}

.search-shrink-leave-active {
  transition: all 0.5s ease;
}

.search-shrink-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

.result-appear-enter-active {
  transition: all 0.5s ease 0.2s;
}

.result-appear-enter-from {
  opacity: 0;
  transform: translateY(24px);
}
</style>
