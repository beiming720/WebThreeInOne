<template>
  <div class="recognition-page">
    <div class="recognition-card">
      <h2 class="page-title">花卉识别</h2>

      <!-- Upload zone -->
      <div class="upload-zone" :class="{ 'has-image': previewUrl, dragging }" @click="!previewUrl && fileInput?.click()"
        @dragover.prevent="dragging = true" @dragleave="dragging = false" @drop.prevent="onDrop">
        <template v-if="!previewUrl">
          <div class="upload-icon">📷</div>
          <p class="upload-text">点击或拖拽图片至此处</p>
          <p class="upload-hint">支持 JPG、PNG、WEBP 格式</p>
        </template>
        <template v-else>
          <img :src="previewUrl" class="preview-img" alt="预览" />
          <button class="btn-change" @click.stop="reset">重新选择</button>
        </template>
      </div>

      <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileChange" />

      <!-- Identify button -->
      <Transition name="slide-up">
        <button v-if="previewUrl && !loading" class="btn-identify" @click="identify">
          点击识别
        </button>
      </Transition>

      <!-- Loading -->
      <div v-if="loading" class="loading-wrap">
        <div class="petal-spinner">
          <span v-for="i in 8" :key="i" :style="{ '--i': i }">🌸</span>
        </div>
        <p>识别中...</p>
      </div>

      <!-- Result -->
      <Transition name="fade-up">
        <div v-if="result" class="result-card">
          <div class="result-header">
            <span class="result-emoji">🌺</span>
            <div>
              <div class="result-name">{{ result.name }}</div>
              <div class="result-latin">{{ result.latin }}</div>
            </div>
            <div class="result-confidence">{{ result.confidence }}%</div>
          </div>
          <p class="result-desc">{{ result.desc }}</p>
          <div class="confidence-bar">
            <div class="confidence-fill" :style="{ width: result.confidence + '%' }"></div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { identifyFlower } from '@/api/flower'
import type { FlowerIdentifyResult } from '@/api/flower'
import { addRecord } from '@/utils/history'
import type { RecognitionRecord } from '@/types/recognition'

const fileInput = ref<HTMLInputElement>()
const previewUrl = ref('')
const selectedFile = ref<File | null>(null)
const loading = ref(false)
const dragging = ref(false)
const result = ref<FlowerIdentifyResult | null>(null)

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) loadFile(file)
}

function onDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file?.type.startsWith('image/')) loadFile(file)
}

function loadFile(file: File) {
  result.value = null
  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => { previewUrl.value = e.target?.result as string }
  reader.readAsDataURL(file)
}

function reset() {
  previewUrl.value = ''
  selectedFile.value = null
  result.value = null
  if (fileInput.value) fileInput.value.value = ''
}

async function identify() {
  if (!selectedFile.value) return
  loading.value = true
  result.value = null

  try {
    result.value = await identifyFlower(selectedFile.value)

    // 保存识别记录到 localStorage
    const record: RecognitionRecord = {
      id: crypto.randomUUID(),
      imageUrl: previewUrl.value,
      flowerName: result.value.name,
      confidence: result.value.confidence / 100, // 后端 0-100 → 归一化 0-1
      createdAt: new Date().toISOString(),
    }
    addRecord(record)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    alert(err?.message || '网络请求失败，请检查后端服务是否启动')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.recognition-page {
  min-height: calc(100vh - 3.75rem);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  background-image: url('@/assets/images/bg/花卉识别页1.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.recognition-card {
  position: relative;
  border-radius: 15px;
  padding: clamp(24px, 2.5rem, 48px);
  width: 90%;
  max-width: 58vh;
  box-shadow: 0 8px 48px rgba(233, 150, 122, 0.15);

}

.recognition-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('@/assets/images/bg/相机框.jpg');
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.8;
  z-index: 0;
  border-radius: inherit;
  pointer-events: none;
}

.page-title {
  font-size: clamp(18px, 1.5rem, 28px);
  font-weight: 700;
  color: black;
  margin-bottom: 10px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.upload-icon {
  font-size: clamp(32px, 3rem, 56px);
}

.upload-text {
  font-size: clamp(13px, 0.9375rem, 14px);
  color: #555;
  font-weight: 500;
}

.upload-hint {
  font-size: clamp(11px, 0.75rem, 14px);
  color: #aaa;
}

.upload-zone {
  border: 2px dashed #141414;
  border-radius: 16px;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
  overflow: hidden;
}

.upload-zone:hover,
.upload-zone.dragging {
  border-color: #00042b;
  background: #c0149e36;
}

.upload-zone.has-image {
  cursor: default;
  border-style: solid;
}

.preview-img {
  max-width: 100%;
  max-height: 260px;
  border-radius: 12px;
  object-fit: contain;
}

.btn-change {
  position: absolute;
  bottom: 12px;
  right: 12px;
  padding: 6px 14px;
  font-size: 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  cursor: pointer;
}

.btn-identify {
  width: 100%;
  margin-top: 20px;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  background: linear-gradient(135deg, #5022ad, #e03fd3);
  color: #fff;
  box-shadow: 0 4px 20px rgba(233, 30, 140, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  z-index: 1;
}

.btn-identify:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(233, 30, 140, 0.4);
}

.loading-wrap {
  text-align: center;
  padding: 24px 0;
  color: #e74c3c;
  font-size: 14px;
}

.petal-spinner {
  position: relative;
  width: 60px;
  height: 60px;
  margin: 0 auto 12px;
}

.petal-spinner span {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 16px;
  transform-origin: 0 0;
  transform: rotate(calc(var(--i) * 45deg)) translateY(-24px);
  animation: spin 1.2s linear infinite;
  animation-delay: calc(var(--i) * -0.15s);
}

@keyframes spin {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.2;
  }
}

.result-card {
  margin-top: 24px;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f7f7f7, #f0acf7);
  border: 1px solid #5f25b1a1;
  position: relative;
  z-index: 1;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.result-emoji {
  font-size: 36px;
}

.result-name {
  font-size: 20px;
  font-weight: 700;
  color: #c0392b;
}

.result-latin {
  font-size: 12px;
  color: #999;
  font-style: italic;
}

.result-confidence {
  margin-left: auto;
  font-size: 28px;
  font-weight: 800;
  color: #e74c3c;
}

.result-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.7;
  margin-bottom: 12px;
}

.confidence-bar {
  height: 6px;
  background: #f0d0d0;
  border-radius: 3px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #E100FF, #7F00FF);
  transition: width 1s ease;
}

.slide-up-enter-active {
  transition: all 0.4s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.fade-up-enter-active {
  transition: all 0.5s ease;
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
</style>
