<template>
  <div class="explain-panel">
    <h2 class="panel-title">
      <el-icon class="panel-title-icon"><Opportunity /></el-icon>
      ResNet50 模型可解释性分析
    </h2>

    <el-tabs v-model="activeTab" type="card" class="explain-tabs">
      <el-tab-pane label="模型结构" name="structure">
        <ModelStructure v-if="activeTab === 'structure'" />
      </el-tab-pane>
      <el-tab-pane label="训练曲线" name="curves">
        <TrainingCurves v-if="activeTab === 'curves'" />
      </el-tab-pane>
      <el-tab-pane label="Grad-CAM" name="gradcam">
        <GradCAMViewer v-if="activeTab === 'gradcam'" />
      </el-tab-pane>
      <el-tab-pane label="特征降维" name="features">
        <FeatureScatter v-if="activeTab === 'features'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Opportunity } from '@element-plus/icons-vue'
import ModelStructure from './ModelStructure.vue'
import TrainingCurves from './TrainingCurves.vue'
import GradCAMViewer from './GradCAMViewer.vue'
import FeatureScatter from './FeatureScatter.vue'

const activeTab = ref('structure')
</script>

<style scoped>
.explain-panel {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.panel-title {
  text-align: center;
  margin-bottom: 20px;
  font-size: clamp(20px, 2rem, 28px);
  font-weight: 700;
  background: linear-gradient(90deg, #7F00FF, #E100FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.panel-title-icon {
  font-size: clamp(22px, 2.2rem, 30px);
  color: #7F00FF;
}

.explain-tabs {
  background: #ffffffd3;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}
</style>
