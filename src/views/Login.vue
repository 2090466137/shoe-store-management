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
          <van-checkbox v-model="rememberMe" icon-size="10px">记住密码</van-checkbox>
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
    </div>

    <!-- 版本信息 -->
    <div class="version-info">
      v3.2 | © 2025 鞋店管理系统
    </div>
    
    <!-- 版权信息 -->
    <div class="copyright-info">
      © 2026 鞋店管理系统 · 技术支持
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

const rememberMe = ref(false)
const loading = ref(false)


// 处理登录
const handleLogin = async () => {
  loading.value = true
  
  try {
    // 确保用户数据已加载（检查 users.value 而不是 getAllUsers）
    if (!userStore.users || userStore.users.length === 0) {
      console.log('用户数据为空，开始加载...')
      
      // 设置加载超时（最多等待3秒）
      const loadPromise = userStore.loadUsers()
      const timeoutPromise = new Promise(resolve => setTimeout(resolve, 3000))
      
      await Promise.race([loadPromise, timeoutPromise])
      
      // 等待加载完成后，再次检查
      if (!userStore.users || userStore.users.length === 0) {
        // 如果还是为空，login 函数会自动使用默认用户
        console.warn('用户数据加载超时或失败，login 函数将使用默认用户')
      }
    }
    
    // 验证输入
    if (!form.value.username || !form.value.password) {
      showToast('请输入账号和密码')
      loading.value = false
      return
    }
    
    // 模拟网络延迟（减少到100ms）
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const result = await userStore.login(form.value.username, form.value.password)
    
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
      
      // 确保 currentUser 已设置（login 函数已经设置，这里再确认一下）
      const savedUser = localStorage.getItem('currentUser')
      if (!savedUser) {
        console.error('登录成功但 currentUser 未设置')
        showToast('登录状态异常，请刷新页面重试')
        loading.value = false
        return
      }
      
      // 确保路由跳转（使用多种方式）
      console.log('准备跳转到首页...')
      console.log('currentUser:', localStorage.getItem('currentUser'))
      
      // 方式1: 使用 router.push
      try {
        await router.push('/home')
        console.log('router.push 成功，已跳转到首页')
      } catch (err) {
        console.warn('router.push 失败，尝试 replace:', err)
        // 方式2: 使用 router.replace
        try {
          await router.replace('/home')
          console.log('router.replace 成功')
        } catch (replaceErr) {
          console.error('router.replace 也失败，使用 window.location:', replaceErr)
          // 方式3: 使用 window.location（强制刷新）
          setTimeout(() => {
            window.location.href = '/home'
          }, 100)
        }
      }
    } else {
      showToast(result.message || '登录失败，请重试')
    }
  } catch (error) {
    console.error('登录错误:', error)
    showToast('登录失败，请重试')
  } finally {
    loading.value = false
  }
}

// 加载记住的账号
onMounted(async () => {
  // 等待用户数据加载完成
  try {
    await userStore.loadUsers()
  } catch (error) {
    console.error('加载用户数据失败:', error)
    // 即使失败也继续，因为 login 时会再次尝试加载
  }
  
  // 如果已登录，直接跳转
  if (userStore.isLoggedIn) {
    router.replace('/home')
    return
  }
  
  // 加载记住的账号
  const remembered = localStorage.getItem('rememberedAccount')
  if (remembered) {
    try {
      const account = JSON.parse(remembered)
      form.value.username = account.username
      form.value.password = account.password
      rememberMe.value = true
    } catch (error) {
      console.error('加载记住的账号失败:', error)
      localStorage.removeItem('rememberedAccount')
    }
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
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: -80px;
  right: -80px;
}

.circle-2 {
  width: 150px;
  height: 150px;
  bottom: 80px;
  left: -60px;
}

.circle-3 {
  width: 100px;
  height: 100px;
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
  box-shadow: 0 8px 32px rgba(91, 143, 249, 0.12);
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

.remember-section :deep(.van-checkbox) {
  display: flex;
  align-items: center;
}

.remember-section :deep(.van-checkbox__icon) {
  width: 16px !important;
  height: 16px !important;
  font-size: 10px !important;
  line-height: 1;
  flex-shrink: 0;
}

.remember-section :deep(.van-checkbox__icon .van-icon) {
  font-size: 10px !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remember-section :deep(.van-checkbox__label) {
  margin-left: 8px;
  color: #646566;
  font-size: 14px;
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

/* 版本信息 */
.version-info {
  position: absolute;
  bottom: 45px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  z-index: 1;
}

.copyright-info {
  position: absolute;
  bottom: 20px;
  color: rgba(255, 255, 255, 0.95);
  font-size: 12px;
  font-weight: 600;
  z-index: 1;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 3px rgba(91, 143, 249, 0.3);
}
</style>
