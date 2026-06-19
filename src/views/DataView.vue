<template>
  <div class="data-page">
    <Transition name="search-shrink">
      <div v-if="!searched" class="search-hero">
        <h2 class="search-title">🌼 花卉数据库</h2>
        <p class="search-sub">输入花卉名称，探索详细信息</p>
        <div class="search-box-wrap">
          <input v-model="query" class="search-input" placeholder="例如：牡丹、月季、菊花..." @keyup.enter="doSearch" />
          <button class="search-btn" @click="doSearch">搜索</button>
        </div>
      </div>
    </Transition>

    <Transition name="heatmap-fade">
      <FlowerHeatmap v-if="!searched" />
    </Transition>

    <div v-if="searched" class="search-compact">
      <div class="search-box-wrap compact">
        <input v-model="query" class="search-input" @keyup.enter="doSearch" />
        <button class="search-btn" @click="doSearch">搜索</button>
      </div>
      <button class="back-overview-btn" @click="goBackToOverview">← 返回总览</button>
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
import { ref, onMounted } from 'vue'
import FlowerHeatmap from '@/components/FlowerHeatmap.vue'

interface FlowerRawEntry {
  name: string
  latin: string
  desc: string
  family: string
  genus: string
  bloom_season: string
  origin: string
  habitat: string
  uses: string
}

interface FlowerDisplayData {
  emoji: string
  name: string
  latin: string
  family: string
  attrs: { label: string; value: string }[]
  desc: string
}

const query = ref('')
const lastQuery = ref('')
const searched = ref(false)
const flowerData = ref<FlowerDisplayData | null>(null)
const flowerDb = ref<Record<string, FlowerRawEntry>>({})

onMounted(async () => {
  try {
    const res = await fetch('/data/flower_data.json')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    flowerDb.value = await res.json()
  } catch (e) {
    console.error('Failed to load flower data:', e)
  }
})

function mapToDisplay(raw: FlowerRawEntry): FlowerDisplayData {
  return {
    emoji: '🌸',
    name: raw.name,
    latin: raw.latin,
    family: raw.family,
    attrs: [
      { label: '花期', value: raw.bloom_season },
      { label: '原产地', value: raw.origin },
      { label: '生境', value: raw.habitat },
      { label: '用途', value: raw.uses },
    ],
    desc: raw.desc,
  }
}

function doSearch() {
  if (!query.value.trim()) return
  lastQuery.value = query.value.trim()
  searched.value = true

  const db = flowerDb.value
  if (!db || Object.keys(db).length === 0) {
    flowerData.value = null
    return
  }

  const q = lastQuery.value
  const qLower = q.toLowerCase()

  for (const [key, entry] of Object.entries(db)) {
    if (
      entry.name.includes(q) ||
      key.toLowerCase().includes(qLower) ||
      entry.latin.toLowerCase().includes(qLower)
    ) {
      flowerData.value = mapToDisplay(entry)
      return
    }
  }

  flowerData.value = null
}

function goBackToOverview() {
  searched.value = false
  query.value = ''
  flowerData.value = null
}
</script>

<style scoped>
.data-page {
  min-height: calc(100vh - 3.75rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 24px 40px;
  background-image: url('@/assets/images/bg/flowerDataBg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.search-hero {
  text-align: center;
  width: 100%;
  max-width: min(600px, 90vw);
}

.search-title {
  font-size: clamp(22px, 2rem, 40px);
  font-weight: 700;
  color: #0b8311;
  margin-bottom: 8px;
}

.search-sub {
  font-size: clamp(13px, 0.9375rem, 17px);
  color: #dadada;
  margin-bottom: 20px;
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
  background-image: linear-gradient(to right, #00F260, #0575E6);
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
  align-items: center;
  gap: 12px;
  padding: 20px 0 32px;
}

.back-overview-btn {
  padding: 14px 20px;
  background-image: linear-gradient(to right, #00F260, #0575E6);
  color: #2e7d32;
  border: 1px solid rgba(46, 125, 50, 0.25);
  border-radius: 40px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;
}

.back-overview-btn:hover {
  opacity: 0.9;
  border-color: rgba(46, 125, 50, 0.4);
}

.result-wrap {
  width: 100%;
  max-width: min(600px, 90vw);
}

.flower-card {
  background-image: linear-gradient(to right, #c2e59c, #64b3f4);
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

.heatmap-fade-enter-active {
  transition: all 0.6s ease 0.1s;
}

.heatmap-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.heatmap-fade-leave-active {
  transition: all 0.3s ease;
}

.heatmap-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
