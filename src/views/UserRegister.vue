<template>
  <div id="UserRegister">
    <video autoplay muted loop playsinline class="bg-video">
      <source src="/audio/login.mp4" type="video/mp4" />
    </video>
    <el-row>
      <el-col :span="14">
      </el-col>
      <el-col :span="10" class="login_box">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" class="regForm">
          <div class="form_box">
            <video autoplay muted loop playsinline class="bg-video" style="border-radius: 15px;">
              <source src="/audio/loginform.mp4" type="video/mp4" />
            </video>
            <p class="title">Hello~ 欢迎注册 专属于你 的账号</p>
            <el-form-item prop="username" class="input">
              <template #label>
                <span style="color: #cf53aa;">账号:</span>
              </template>
              <el-input v-model="form.username" placeholder="请输入账号" :prefix-icon="User" />
            </el-form-item>
            <el-form-item prop="password" class="input">
              <template #label>
                <span style="color: #cf53aa;">密码:</span>
              </template>
              <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password :prefix-icon="Lock" />
            </el-form-item>
            <el-form-item prop="password1">
              <template #label>
                <span style="color: #cf53aa;">确认密码:</span>
              </template>
              <el-input v-model="form.password1" type="password" placeholder="请确认密码" show-password
                :prefix-icon="Lock" />
            </el-form-item>
            <el-form-item prop="agree" class="agree-item">
              <el-checkbox v-model="form.agree" size="large">
                <span style="color: #cf53aa;">我已阅读并同意《用户协议》和《隐私政策》</span>
              </el-checkbox>
            </el-form-item>
            <el-button type="primary" class="regBtn" @click="toLogin" color="#cf53aa">注册</el-button>
          </div>
        </el-form>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { Lock, User } from '@element-plus/icons-vue';
import { reactive, ref } from 'vue';
import { useRouter } from "vue-router";
import type { regFormData } from '@/types/userType';
import type { FormInstance } from 'element-plus';

//路由实例
const router = useRouter();
//创建并获取 <el-form> 表单组件的实例引用
const formRef = ref<FormInstance>();

//表单数据
const form: regFormData = reactive({
  username: '',
  password: '',
  password1: '',
  agree: false
})

// 自定义校验规则：验证两次输入的密码是否一致
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validatePassword2 = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'));
  } else if (value !== form.password) {
    callback(new Error('两次输入的密码不一致!'));
  } else {
    callback(); // 校验通过
  }
};

// 2. 自定义协议勾选的校验函数
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validateAgree = (rule: any, value: any, callback: any) => {
  if (!value) {
    // 如果用户没有勾选（value 为 false）
    callback(new Error('请阅读并勾选同意用户协议与隐私政策'));
  } else {
    callback(); // 校验通过
  }
};


//表单校验规则
const rules = reactive({
  username: [
    { required: true, min: 5, max: 10, message: '账号应在5-10位之间', trigger: 'change' },
  ],
  password: [
    { required: true, min: 6, message: '密码最少为6位', trigger: 'change' }
  ],
  password1: [
    { required: true, min: 6, message: '密码最少为6位', trigger: 'change' },
    { validator: validatePassword2, trigger: 'change' }
  ],
  agree: [
    { validator: validateAgree, trigger: 'change' }
  ]
})

// 提交按钮回调函数
const toLogin = async () => {
  //如果存在每通过验证的字段，就返回
  if (!formRef.value) return;

  // 触发整表验证（包含账号、密码、确认密码、协议勾选）
  await formRef.value.validate((valid) => {
    if (valid) {
      // 只有全部校验通过（包括勾选了协议），才会执行到这里
      console.log('全部校验通过，准备发起注册');
      router.push({
        path: '/login',
        replace: true
      })
    } else {
      console.log('有项目未校验通过，无法提交');
    }
  })
}
</script>

<style scoped lang="scss">
.regForm {
  position: relative;
  top: 10em;

  :deep(.el-input__inner::placeholder) {
    color: #cf53aa81 !important;
    /* 也可以使用透明度 */
  }

  .form_box {
    position: relative;
    left: 65px;
    width: 60%;
    text-align: center;
    padding: 20px;
    // background-color: #081239;
    border-radius: 10px;

    overflow: visible;
  }

  .title {
    margin-bottom: 20px;
    color: #cf53aa;
  }

  .input {
    margin-bottom: 30px;
  }

  /* 勾选框居中 */
  .agree-item :deep(.el-form-item__content) {
    justify-content: center;
  }

  /* 错误提示居中 */
  .agree-item :deep(.el-form-item__error) {
    width: 100%;
    text-align: center;
    left: 0;
  }

  .regBtn {
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

// .form-bg-video {
//   position: absolute;

//   left: -25%;
//   top: -25%;

//   width: 150%;
//   height: 150%;


//   object-fit: cover;
//   /* 填满容器 */
//   z-index: -1;
// }
</style>
