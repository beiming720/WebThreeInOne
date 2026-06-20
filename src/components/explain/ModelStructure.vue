<template>
  <div class="structure-view">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      <span>正在加载模型结构...</span>
    </div>

    <template v-else-if="structure">
      <!-- 顶部统计条 -->
      <div class="stat-bar">
        <div class="stat-item">
          <span class="stat-label">模型类型</span>
          <span class="stat-value">{{ structure.model_type }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总参数量</span>
          <span class="stat-value highlight">{{ formatParams(structure.total_params) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">可训练参数</span>
          <span class="stat-value green">{{ formatParams(structure.trainable_params) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">输入尺寸</span>
          <span class="stat-value">{{ structure.input_shape.join(' × ') }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">输出类别</span>
          <span class="stat-value">{{ structure.output_classes }}</span>
        </div>
      </div>

      <!-- 主体：左侧流程图 + 右侧详情 -->
      <div class="structure-body">
        <!-- 左侧流程图 -->
        <div class="flow-chart">
          <!-- 输入节点 -->
          <div class="flow-node input-node">
            <span class="node-icon">📥</span>
            <span class="node-name">Input</span>
            <span class="node-shape">{{ structure.input_shape.join('×') }}</span>
          </div>
          <div class="flow-arrow">↓</div>

          <!-- 模型层节点 -->
          <template v-for="(layer, idx) in structure.layers" :key="layer.name">
            <div class="flow-node"
                 :class="{
                   selected: selectedLayer && selectedLayer.name === layer.name,
                   frozen: !layer.trainable,
                   'has-children': layer.children && layer.children.length > 0
                 }"
                 @click="selectLayer(layer)">
              <span class="node-icon">{{ getLayerIcon(layer.type) }}</span>
              <span class="node-name">{{ layer.name }}</span>
              <span class="node-type">{{ layer.type }}</span>
              <span class="node-shape" v-if="layer.out_shape && layer.out_shape.length">{{ layer.out_shape.join('×') }}</span>
              <span class="node-params">{{ formatParams(layer.params) }}</span>
              <span class="node-badge" v-if="layer.children && layer.children.length">{{ layer.children.length }} 子层</span>
            </div>
            <div class="flow-arrow" v-if="idx < structure.layers.length - 1">↓</div>
          </template>

          <!-- 输出节点 -->
          <div class="flow-arrow">↓</div>
          <div class="flow-node output-node">
            <span class="node-icon">🎯</span>
            <span class="node-name">Output</span>
            <span class="node-shape">{{ structure.output_classes }} classes</span>
          </div>
        </div>

        <!-- 右侧详情面板 -->
        <div class="detail-panel" v-if="selectedLayer">
          <div class="detail-header">
            <h4>{{ getLayerIcon(selectedLayer.type) }} {{ selectedLayer.name }}</h4>
            <el-tag :type="selectedLayer.trainable ? 'success' : 'info'" size="small">
              {{ selectedLayer.trainable ? '可训练' : '冻结' }}
            </el-tag>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">层类型</span>
              <span class="value">{{ selectedLayer.type }}</span>
            </div>
            <div class="detail-item">
              <span class="label">输出尺寸</span>
              <span class="value">{{ selectedLayer.out_shape ? selectedLayer.out_shape.join(' × ') : '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">参数量</span>
              <span class="value highlight">{{ formatParams(selectedLayer.params) }}</span>
            </div>
            <div class="detail-item" v-if="selectedLayer.detail">
              <span class="label">详细配置</span>
              <span class="value">{{ selectedLayer.detail }}</span>
            </div>
          </div>

          <!-- 子层列表 -->
          <div v-if="selectedLayer.children && selectedLayer.children.length" class="children-section">
            <h5>子层结构</h5>
            <div class="children-list">
              <div v-for="child in selectedLayer.children" :key="child.name"
                   class="child-item"
                   :class="{ frozen: !child.trainable }"
                   @click="selectLayer(child)">
                <span class="child-name">{{ child.name }}</span>
                <span class="child-type">{{ child.type }}</span>
                <span class="child-params">{{ formatParams(child.params) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 无选中时的提示 -->
        <div class="detail-panel empty" v-else>
          <div class="empty-hint">
            <span class="empty-icon">👆</span>
            <p>点击左侧任意层查看详细信息</p>
          </div>
        </div>
      </div>
    </template>

    <!-- 错误状态 -->
    <div v-else class="error-state">
      <p>模型结构加载失败，请确认后端服务已启动</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { getModelStructure, type ModelLayer, type ModelStructure as MS } from '@/api/model'

const structure = ref<MS>()
const selectedLayer = ref<ModelLayer>()
const loading = ref(true)

function formatParams(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

function selectLayer(layer: ModelLayer) {
  selectedLayer.value = layer
}

function getLayerIcon(type: string): string {
  const iconMap: Record<string, string> = {
    Conv2d: '🔲', BatchNorm2d: '📊', ReLU: '⚡', MaxPool2d: '🔽',
    AdaptiveAvgPool2d: '🔽', Sequential: '📦', Linear: '🔗',
    Dropout: '🚫', Flatten: '📐', Bottleneck: '🧱',
  }
  return iconMap[type] || '📄'
}

onMounted(async () => {
  try {
    structure.value = await getModelStructure()
    if (structure.value && structure.value.layers.length > 0) {
      selectLayer(structure.value.layers[0] as ModelLayer)
    }
  } catch (e) {
    console.error('模型结构加载失败:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.structure-view {
  padding: 16px 0;
}

/* 加载 / 错误状态 */
.loading-state, .error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
  color: #888;
  font-size: 15px;
}

/* 统计条 */
.stat-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8f6ff, #fff0f8);
  border-radius: 10px;
  margin-bottom: 20px;
}
.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-label {
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
}
.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}
.stat-value.highlight { color: #7F00FF; }
.stat-value.green { color: #27ae60; }

/* 主体布局 */
.structure-body {
  display: flex;
  gap: 20px;
  min-height: 400px;
}

/* 左侧流程图 */
.flow-chart {
  flex: 0 0 280px;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.flow-arrow {
  color: #ccc;
  font-size: 18px;
  line-height: 1;
  padding: 4px 0;
}

.flow-node {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.flow-node:hover {
  border-color: #7F00FF;
  box-shadow: 0 2px 12px rgba(127, 0, 255, 0.15);
}
.flow-node.selected {
  border-color: #7F00FF;
  background: linear-gradient(135deg, #f8f0ff, #fff0f8);
  box-shadow: 0 4px 16px rgba(127, 0, 255, 0.2);
}
.flow-node.frozen {
  border-color: #e0e0e0;
  background: #f9f9f9;
  opacity: 0.7;
}
.flow-node.has-children {
  border-left: 4px solid #7F00FF;
}
.flow-node.input-node, .flow-node.output-node {
  background: linear-gradient(135deg, #e8f5e9, #f1f8e9);
  border-color: #4caf50;
  justify-content: center;
}

.node-icon { font-size: 16px; }
.node-name {
  font-weight: 600;
  font-size: 13px;
  color: #333;
}
.node-type {
  font-size: 11px;
  color: #888;
  background: #f0f0f0;
  padding: 1px 6px;
  border-radius: 4px;
}
.node-shape {
  font-size: 11px;
  color: #666;
  font-family: monospace;
}
.node-params {
  font-size: 11px;
  color: #7F00FF;
  margin-left: auto;
}
.node-badge {
  font-size: 10px;
  background: #7F00FF;
  color: #fff;
  padding: 1px 6px;
  border-radius: 8px;
}

/* 右侧详情面板 */
.detail-panel {
  flex: 1;
  background: #fafafa7a;
  border-radius: 10px;
  padding: 20px;
  border: 1px solid #eee;
}
.detail-panel.empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.detail-header h4 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.detail-item .label {
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
}
.detail-item .value {
  font-size: 14px;
  color: #333;
}
.detail-item .value.highlight {
  color: #7F00FF;
  font-weight: 700;
}

/* 子层列表 */
.children-section {
  margin-top: 16px;
  border-top: 1px solid #eee;
  padding-top: 12px;
}
.children-section h5 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #555;
}
.children-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.child-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 12px;
}
.child-item:hover { background: #f0f0f0; }
.child-item.frozen { opacity: 0.5; }
.child-name { font-weight: 600; color: #333; }
.child-type { color: #888; }
.child-params { margin-left: auto; color: #7F00FF; }

/* 空状态提示 */
.empty-hint {
  text-align: center;
  color: #bbb;
}
.empty-icon { font-size: 48px; display: block; margin-bottom: 8px; }
</style>
