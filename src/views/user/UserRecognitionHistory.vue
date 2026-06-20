<template>
  <div class="history">
    <h3 class="hi-title">识别记录</h3>

    <el-table v-if="records.length > 0" :data="records" stripe class="hi-table">
      <el-table-column label="图片" width="80">
        <template #default="{ row }">
          <img :src="row.imageUrl" class="hi-thumb" alt="" />
        </template>
      </el-table-column>
      <el-table-column prop="flowerName" label="识别结果" />
      <el-table-column prop="confidence" label="置信度" width="100">
        <template #default="{ row }">
          {{ (row.confidence * 100).toFixed(1) }}%
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="识别时间" width="170" />
    </el-table>

    <el-empty v-else description="暂无识别记录" :image-size="120" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { RecognitionRecord } from '@/types/recognition'
import { getHistory } from '@/utils/history'

const records = ref<RecognitionRecord[]>([])

onMounted(() => {
  records.value = getHistory()
})
</script>

<style scoped lang="scss">
.history {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 16px rgba(233, 150, 122, 0.1);
  min-height: 360px;
}

.hi-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0 0 24px;
}

.hi-table {
  border-radius: 12px;
  overflow: hidden;
}

.hi-thumb {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}
</style>
