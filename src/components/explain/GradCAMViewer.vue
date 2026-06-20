<template>
  <div class="gradcam-view">
    <!-- 控制栏 -->
    <div class="control-bar">
      <div class="control-group">
        <span class="control-label">样本来源</span>
        <el-radio-group v-model="source" size="small">
          <el-radio-button value="upload">上传图片</el-radio-button>
          <el-radio-button value="sample">测试集样本</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 测试集样本控制 -->
      <template v-if="source === 'sample'">
        <div class="control-group">
          <span class="control-label">样本序号</span>
          <el-input-number v-model="sampleIndex" :min="0" :max="999" size="small" />
        </div>
        <el-button size="small" @click="prevSample">上一个</el-button>
        <el-button size="small" @click="nextSample">下一个</el-button>
      </template>

      <!-- 上传图片控制 -->
      <template v-else>
        <input type="file" accept="image/*" @change="onUpload" ref="fileRef" hidden />
        <el-button size="small" @click="fileRef && fileRef.click()">选择图片</el-button>
        <span class="file-name" v-if="fileName">{{ fileName }}</span>
      </template>

      <div class="control-group">
        <span class="control-label">目标层</span>
        <el-select v-model="targetLayer" size="small" style="width: 130px">
          <el-option label="Layer 1 (浅层)" value="layer1" />
          <el-option label="Layer 2" value="layer2" />
          <el-option label="Layer 3" value="layer3" />
          <el-option label="Layer 4 (深层)" value="layer4" />
        </el-select>
      </div>

      <div class="control-group" v-if="result && result.top5 && result.top5.length">
        <span class="control-label">目标类别</span>
        <el-select v-model="targetClass" size="small" style="width: 180px" placeholder="预测类别">
          <el-option v-for="t in result.top5" :key="t.class_id"
                     :label="`${t.class_name} (${(t.prob * 100).toFixed(1)}%)`"
                     :value="t.class_id" />
        </el-select>
      </div>

      <div class="control-group">
        <span class="control-label">透明度 α</span>
        <el-slider v-model="alpha" :min="0" :max="1" :step="0.05" style="width: 120px" />
      </div>

      <el-button type="primary" size="small" @click="generate" :loading="loading">
        生成热力图
      </el-button>
    </div>

    <!-- 三图对比 -->
    <div class="image-row" v-if="result">
      <div class="img-cell">
        <h5>原图</h5>
        <img :src="result.original" alt="原图" />
      </div>
      <div class="img-cell">
        <h5>Grad-CAM 热力图</h5>
        <img :src="result.heatmap" alt="热力图" />
      </div>
      <div class="img-cell">
        <h5>叠加图 (α={{ result.alpha.toFixed(2) }})</h5>
        <img :src="result.overlay" alt="叠加图" />
      </div>
    </div>

    <!-- 预测结果摘要 -->
    <div class="prediction-bar" v-if="result">
      <div class="pred-item">
        <span class="pred-label">预测类别</span>
        <span class="pred-value highlight">{{ result.predicted_name }} (#{{ result.predicted_class }})</span>
      </div>
      <div class="pred-item">
        <span class="pred-label">目标类别</span>
        <span class="pred-value">#{{ result.target_class }}</span>
      </div>
      <div class="pred-item">
        <span class="pred-label">目标层</span>
        <span class="pred-value">{{ result.target_layer }}</span>
      </div>
    </div>

    <!-- Top5 置信度条形图 -->
    <div class="top5-section" v-if="result && result.top5 && result.top5.length">
      <h5>Top-5 预测置信度</h5>
      <div class="bar-list">
        <div v-for="(t, i) in result.top5" :key="t.class_id" class="bar-row">
          <span class="bar-rank">#{{ i + 1 }}</span>
          <span class="bar-label">{{ t.class_name }}</span>
          <div class="bar-track">
            <div class="bar-fill" :style="{ width: (t.prob * 100) + '%' }"></div>
          </div>
          <span class="bar-value">{{ (t.prob * 100).toFixed(1) }}%</span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-if="!result && !loading">
      <p>点击「生成热力图」查看 Grad-CAM 可视化结果</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getGradCAM, type GradCAMResult } from '@/api/model'

const source = ref<'upload' | 'sample'>('sample')
const sampleIndex = ref(0)
const targetLayer = ref('layer4')
const targetClass = ref<number>()
const alpha = ref(0.5)
const fileName = ref('')
const fileRef = ref<HTMLInputElement>()
const uploadedFile = ref<File>()
const result = ref<GradCAMResult>()
const loading = ref(false)

function onUpload(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) {
    uploadedFile.value = f
    fileName.value = f.name
  }
}

function prevSample() {
  if (sampleIndex.value > 0) {
    sampleIndex.value--
    generate()
  }
}

function nextSample() {
  sampleIndex.value++
  generate()
}

async function generate() {
  loading.value = true
  try {
    result.value = await getGradCAM({
      image: source.value === 'upload' ? uploadedFile.value : undefined,
      sampleIndex: source.value === 'sample' ? sampleIndex.value : undefined,
      targetLayer: targetLayer.value,
      targetClass: targetClass.value,
      alpha: alpha.value,
    })
  } catch (e) {
    console.error('Grad-CAM 生成失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 默认加载第一个测试样本
  generate()
})
</script>

<style scoped>
.gradcam-view {
  padding: 16px 0;
}

/* 控制栏 */
.control-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f9f9f9;
  border-radius: 8px;
}
.control-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.control-label {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
}
.file-name {
  font-size: 12px;
  color: #888;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 三图对比 */
.image-row {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 20px;
}
.img-cell {
  flex: 1;
  max-width: 300px;
  text-align: center;
}
.img-cell h5 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #555;
}
.img-cell img {
  width: 100%;
  max-width: 224px;
  border-radius: 8px;
  border: 1px solid #eee;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 预测结果 */
.prediction-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8f6ff, #fff0f8);
  border-radius: 8px;
  margin-bottom: 20px;
}
.pred-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.pred-label {
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
}
.pred-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}
.pred-value.highlight { color: #7F00FF; }

/* Top5 条形图 */
.top5-section {
  margin-top: 16px;
}
.top5-section h5 {
  margin: 0 0 12px;
  font-size: 15px;
  color: #444;
}
.bar-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bar-rank {
  font-size: 12px;
  color: #999;
  width: 24px;
  text-align: right;
}
.bar-label {
  font-size: 13px;
  color: #333;
  width: 120px;
  text-align: right;
}
.bar-track {
  flex: 1;
  height: 18px;
  background: #f0f0f0;
  border-radius: 9px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 9px;
  background: linear-gradient(90deg, #7F00FF, #E100FF);
  transition: width 0.6s ease;
  min-width: 2px;
}
.bar-value {
  font-size: 13px;
  font-weight: 600;
  color: #7F00FF;
  width: 50px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #bbb;
  font-size: 14px;
}
</style>
