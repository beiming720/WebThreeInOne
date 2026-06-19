<template>
  <div class="edit-info">
    <h3 class="ei-title">修改信息</h3>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" class="ei-form">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" maxlength="10" show-word-limit />
      </el-form-item>

      <el-form-item label="头像种子" prop="seed">
        <div class="ei-avatar-row">
          <img :src="avatarPreview" class="ei-avatar" alt="" />
          <el-input v-model="form.seed" placeholder="输入文字生成头像" @input="onSeedChange" />
        </div>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" class="ei-btn-save" @click="handleSave">保存修改</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const formRef = ref<FormInstance>()

const avatarPreview = ref(userStore.user?.avatar ?? '')

const form = reactive({
  username: userStore.user?.username ?? '',
  seed: userStore.user?.username ?? '',
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 10, message: '用户名长度 2-10 个字符', trigger: 'blur' },
  ],
}

function onSeedChange(val: string) {
  avatarPreview.value = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(val || '?')}`
}

function handleSave() {
  formRef.value?.validate((valid) => {
    if (!valid) return
    userStore.updateProfile({
      username: form.username,
      avatar: avatarPreview.value,
    })
    ElMessage.success('信息已更新')
  })
}
</script>

<style scoped lang="scss">
.edit-info {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 16px rgba(233, 150, 122, 0.1);
  max-width: 520px;
  width: 100%;
}

.ei-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0 0 24px;
}

.ei-form {
  :deep(.el-form-item__label) {
    color: #666;
    font-weight: 500;
  }
}

.ei-avatar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.ei-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f4a0a0;
  flex-shrink: 0;
}

.ei-btn-save {
  background: linear-gradient(135deg, #cf53aa, #e07a5f) !important;
  border: none !important;

  &:hover {
    opacity: 0.9;
  }
}
</style>
