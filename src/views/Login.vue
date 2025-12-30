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
      <div class="logo-section">
        <div class="logo">👟</div>
        <h1 class="app-name">鞋店管理系统</h1>
        <p class="app-desc">Shoe Store Management</p>
      </div>

      <van-form @submit="handleLogin">
        <van-cell-group inset>
          <van-field
            v-model="form.username"
            name="username"
            label="账号"
            placeholder="请输入账号"
            :rules="[{ required: true, message: '请输入账号' }]"
            left-icon="user-o"
          />
          <van-field
            v-model="form.password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
            left-icon="lock"
          />
        </van-cell-group>

        <div class="remember-section">
          <van-checkbox v-model="rememberMe">记住密码</van-checkbox>
        </div>

        <div class="login-btn-wrapper">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="loading"
            loading-text="登录中..."
          >
            登录
          </van-button>
        </div>
      </van-form>

      <!-- 默认账号提示 -->
      <div class="default-accounts">
        <div class="accounts-title">测试账号</div>
        <div class="accounts-list">
          <div class="account-item" @click="fillAccount('luhongpeng', 'lu17303838326')">
            <span class="role-tag manager">店长</span>
            <span class="account-info">luhongpeng / lu17303838326</span>
          </div>
          <div class="account-item" @click="fillAccount('lhp', '123456')">
            <span class="role-tag staff">店员</span>
            <span class="account-info">lhp / 123456</span>
          </div>
          <div class="account-item" @click="fillAccount('test', '123456')">
            <span class="role-tag staff">测试店员</span>
            <span class="account-info">test / 123456</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 版本信息 -->
    <div class="version-info">
      v1.1.0 | © 2025 鞋店管理系统
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { showToast, showSuccessToast } from 'vant'

const router = useRouter()
const userStore = useUserStore()

const form = ref({
  username: '',
  password: ''
})

const rememberMe = ref(false)
const loading = ref(false)

// 填充账号
const fillAccount = (username, password) => {
  form.value.username = username
  form.value.password = password
}

// 登录处理
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
  background: linear-gradient(135deg, #5B8FF9 0%, #4A7FE8 100%);
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
  top: 50%;
  right: 10%;
}

/* 登录卡片 */
.login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 20px;
  padding: 32px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  font-size: 64px;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.app-name {
  font-size: 24px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 8px;
}

.app-desc {
  font-size: 14px;
  color: #969799;
  letter-spacing: 1px;
}

.remember-section {
  padding: 16px 16px 0;
}

.login-btn-wrapper {
  padding: 24px 16px 16px;
}

.login-btn-wrapper :deep(.van-button) {
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  background: #5B8FF9;
  border: none;
}

/* 默认账号 */
.default-accounts {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebedf0;
}

.accounts-title {
  font-size: 13px;
  color: #969799;
  text-align: center;
  margin-bottom: 12px;
}

.accounts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.account-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.account-item:hover {
  background: #e8f4ff;
  transform: translateX(4px);
}

.account-item:active {
  transform: scale(0.98);
}

.role-tag {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: white;
}

.role-tag.admin {
  background: #5B8FF9;
}

.role-tag.manager {
  background: #FF9845;
}

.role-tag.staff {
  background: #5AD8A6;
}

.account-info {
  font-size: 13px;
  color: #646566;
  font-family: 'Courier New', monospace;
}

/* 版本信息 */
.version-info {
  position: absolute;
  bottom: 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  z-index: 1;
}
</style>
