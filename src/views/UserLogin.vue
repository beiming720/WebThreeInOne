<template>
  <div id="UserLogin">
    <video autoplay muted loop playsinline class="bg-video">
      <source src="../assets/audio/login.mp4" type="video/mp4" />
    </video>
    <el-row>
      <el-col :span="14">
      </el-col>
      <el-col :span="10" class="login_box">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" class="loginForm">
          <div class="form_box">
            <p class="title">欢迎登录</p>
            <el-form-item prop="username" class="input">
              <template #label>
                <span style="color: rgb(214, 220, 224);">账号:</span>
              </template>
              <el-input v-model="form.username" placeholder="请输入密码" :prefix-icon="User" />
            </el-form-item>
            <el-form-item prop="password">
              <template #label>
                <span style="color: rgb(214, 220, 224);">密码:</span>
              </template>
              <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password :prefix-icon="Lock" />
            </el-form-item>
            <el-button type="primary" class="loginBtn" @click="toLogin">登录</el-button>
          </div>
        </el-form>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { Lock, User } from '@element-plus/icons-vue';
import { reactive } from 'vue';
import { useRouter } from "vue-router";
import type { formData } from '@/types/userType';

//路由实例
const router = useRouter();

//表单数据
const form: formData = reactive({
  username: '',
  password: ''
})
//表单校验规则
const rules = reactive({
  username: [
    { required: true, min: 5, max: 10, message: '账号应在5-10位之间', trigger: 'change' },
  ],
  password: [
    { required: true, min: 6, message: '密码最少为6位', trigger: 'change' }
  ]
})

//登录按钮回调函数
const toLogin = () => {
  router.push({
    path: '/',
    replace: true
  })
}
</script>

<style scoped lang="scss">
.loginForm {
  position: relative;
  top: 30vh;

  .form_box {
    position: relative;
    left: 65px;
    width: 60%;
    text-align: center;
    padding: 20px;
    background-color: #081239;
    border-radius: 10px;
  }

  .title {
    margin-bottom: 20px;
    color: rgb(214, 220, 224);
  }

  .input {
    margin-bottom: 30px;
  }

  .loginBtn {
    width: 50%;
  }


}

.bg-video {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 100%;
  min-height: 100%;
  object-fit: cover;
  /* 关键：填满容器不变形 */
  z-index: -1;
}
</style>
