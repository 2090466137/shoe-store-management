<template>
  <div class="login-page">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
    
    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- Logo区域 -->
      <div class="logo-section">
        <div class="logo-icon">👟</div>
        <h1 class="app-title">鞋店管理系统</h1>
        <p class="app-subtitle">专业的鞋店仓库管理解决方案</p>
      </div>
      
      <!-- 登录表单 -->
      <van-form @submit="handleLogin" class="login-form">
        <van-cell-group inset>
          <van-field
            v-model="form.username"
            name="username"
            label="账号"
            placeholder="请输入账号"
            left-icon="user-o"
            :rules="[{ required: true, message: '请输入账号' }]"
            clearable
          />
          <van-field
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            name="password"
            label="密码"
            placeholder="请输入密码"
            left-icon="lock"
            :right-icon="showPassword ? 'eye-o' : 'closed-eye'"
            @click-right-icon="showPassword = !showPassword"
            :rules="[{ required: true, message: '请输入密码' }]"
          />
        </van-cell-group>
        
        <!-- 记住密码 -->
        <div class="remember-row">
          <van-checkbox v-model="rememberMe" shape="square" icon-size="16px">
            记住密码
          </van-checkbox>
        </div>
        
        <!-- 登录按钮 -->
        <div class="submit-btn">
          <van-button 
            round 
            block 
            type="primary" 
            native-type="submit"
            :loading="loading"
            loading-text="登录中..."
          >
            登 录
          </van-button>
        </div>
      </van-form>
      
      <!-- 忘记密码提示 -->
      <div class="forgot-password">
        <p>忘记密码？请联系管理员重置</p>
      </div>
    </div>
    
    <!-- 版本信息 -->
    <div class="version-info">
      v3.1 · 权限管理版
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const form = ref({
  username: '',
  password: ''
})

const showPassword = ref(false)
const rememberMe = ref(false)
const loading = ref(false)


// 处理登录
const handleLogin = async () => {
  loading.value = true
  
  try {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const result = userStore.login(form.value.username, form.value.password)
    
    if (result.success) {
      // 保存记住密码
      if (rememberMe.value) {
        localStorage.setItem('rememberedAccount', JSON.stringify({
          username: form.value.username,
          password: form.value.password
        }))
      } else {
        localStorage.removeItem('rememberedAccount')
      }
      
      showSuccessToast('登录成功')
      
      // 跳转到首页
      setTimeout(() => {
        router.replace('/home')
      }, 500)
    } else {
      showToast(result.message)
    }
  } catch (error) {
    showToast('登录失败，请重试')
  } finally {
    loading.value = false
  }
}

// 加载记住的账号
onMounted(() => {
  userStore.loadUsers()
  
  // 如果已登录，直接跳转
  if (userStore.isLoggedIn) {
    router.replace('/home')
    return
  }
  
  // 加载记住的账号
  const remembered = localStorage.getItem('rememberedAccount')
  if (remembered) {
    const account = JSON.parse(remembered)
    form.value.username = account.username
    form.value.password = account.password
    rememberMe.value = true
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  right: -100px;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: 100px;
  left: -80px;
}

.circle-3 {
  width: 150px;
  height: 150px;
  bottom: -50px;
  right: 50px;
}

/* 登录卡片 */
.login-card {
  width: 100%;
  max-width: 380px;
  background: white;
  border-radius: 20px;
  padding: 30px 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

/* Logo区域 */
.logo-section {
  text-align: center;
  margin-bottom: 30px;
}

.logo-icon {
  font-size: 60px;
  margin-bottom: 10px;
}

.app-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0 0 8px 0;
}

.app-subtitle {
  font-size: 14px;
  color: #999;
  margin: 0;
}

/* 登录表单 */
.login-form {
  margin-bottom: 20px;
}

.login-form :deep(.van-cell-group--inset) {
  margin: 0;
}

.login-form :deep(.van-cell) {
  padding: 14px 16px;
}

.login-form :deep(.van-field__left-icon) {
  margin-right: 10px;
  color: #667eea;
}

/* 记住密码 */
.remember-row {
  padding: 15px 5px;
}

.remember-row :deep(.van-checkbox__label) {
  color: #666;
  font-size: 14px;
}

/* 登录按钮 */
.submit-btn {
  padding: 0 5px;
}

.submit-btn :deep(.van-button) {
  height: 46px;
  font-size: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

/* 忘记密码提示 */
.forgot-password {
  text-align: center;
  margin-top: 20px;
  padding: 15px;
}

.forgot-password p {
  font-size: 13px;
  color: #999;
  margin: 0;
}

/* 版本信息 */
.version-info {
  position: absolute;
  bottom: 20px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}
</style>

