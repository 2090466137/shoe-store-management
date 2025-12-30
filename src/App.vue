<template>
  <div id="app" :class="{ 'dark-mode': isDarkMode }">
    <router-view v-slot="{ Component, route }">
      <transition :name="transitionName" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from './stores/product'
import { useSalesStore } from './stores/sales'
import { requestNotificationPermission } from './utils/notification'

const router = useRouter()
const productStore = useProductStore()
const salesStore = useSalesStore()

// 暗黑模式
const isDarkMode = ref(false)

// 页面过渡动画
const transitionName = ref('slide-left')

// 路由历史记录
const routeHistory = ref([])

// 监听路由变化，设置过渡动画
watch(
  () => router.currentRoute.value,
  (to, from) => {
    const toDepth = to.path.split('/').length
    const fromDepth = from?.path?.split('/').length || 0
    
    // 根据路由深度判断前进还是后退
    if (toDepth > fromDepth) {
      transitionName.value = 'slide-left'
    } else if (toDepth < fromDepth) {
      transitionName.value = 'slide-right'
    } else {
      transitionName.value = 'fade'
    }
    
    // 记录路由历史
    routeHistory.value.push(to.path)
    if (routeHistory.value.length > 10) {
      routeHistory.value.shift()
    }
  },
  { immediate: true }
)

// 检查暗黑模式设置
const checkDarkMode = () => {
  const saved = localStorage.getItem('darkMode')
  if (saved !== null) {
    isDarkMode.value = saved === 'true'
  } else {
    // 检查系统设置
    isDarkMode.value = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  
  // 应用暗黑模式
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// 切换暗黑模式（导出供其他组件使用）
window.toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('darkMode', isDarkMode.value.toString())
  
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

onMounted(async () => {
  // 初始化数据
  productStore.loadProducts()
  salesStore.loadSales()
  
  // 请求通知权限
  await requestNotificationPermission()
  
  // 检查暗黑模式
  checkDarkMode()
  
  // 监听系统暗黑模式变化
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (localStorage.getItem('darkMode') === null) {
        isDarkMode.value = e.matches
        if (e.matches) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    })
  }
})
</script>

<style>
#app {
  height: 100vh;
  background-color: #f7f8fa;
  transition: background-color 0.3s ease;
}

/* 暗黑模式 */
#app.dark-mode {
  background-color: #1a1a1a;
  color: #e0e0e0;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 左滑入动画（前进） */
.slide-left-enter-active {
  animation: slide-in-left 0.3s ease-out;
}

.slide-left-leave-active {
  animation: slide-out-left 0.3s ease-in;
}

@keyframes slide-in-left {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-out-left {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-30%);
    opacity: 0;
  }
}

/* 右滑入动画（后退） */
.slide-right-enter-active {
  animation: slide-in-right 0.3s ease-out;
}

.slide-right-leave-active {
  animation: slide-out-right 0.3s ease-in;
}

@keyframes slide-in-right {
  from {
    transform: translateX(-30%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-out-right {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* 横屏优化 */
@media screen and (orientation: landscape) and (max-height: 500px) {
  #app {
    overflow-y: auto;
  }
  
  /* 优化导航栏高度 */
  .van-nav-bar {
    height: 40px;
    line-height: 40px;
  }
  
  .van-nav-bar__title {
    font-size: 14px;
  }
  
  /* 优化卡片间距 */
  .card {
    margin-bottom: 8px !important;
    padding: 12px !important;
  }
  
  /* 优化按钮高度 */
  .van-button--large {
    height: 36px !important;
  }
  
  /* 优化统计卡片 */
  .stat-card,
  .stats-card {
    padding: 8px !important;
  }
  
  .stat-value,
  .stats-value {
    font-size: 18px !important;
  }
  
  /* 优化表单项 */
  .van-cell {
    padding: 8px 16px !important;
  }
}

/* 暗黑模式样式 */
:root.dark {
  --van-background: #1a1a1a;
  --van-background-2: #2a2a2a;
  --van-text-color: #e0e0e0;
  --van-text-color-2: #b0b0b0;
  --van-text-color-3: #808080;
  --van-border-color: #3a3a3a;
  --van-active-color: #4a4a4a;
  --van-card-background: #2a2a2a;
}

.dark-mode .card {
  background-color: #2a2a2a;
  border-color: #3a3a3a;
}

.dark-mode .van-nav-bar {
  background-color: #2a2a2a;
}

.dark-mode .van-tabbar {
  background-color: #2a2a2a;
}

.dark-mode .page-container {
  background-color: #1a1a1a;
}

.dark-mode .stat-card,
.dark-mode .stats-card {
  background: linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%);
}

.dark-mode .section-title {
  color: #e0e0e0;
}

.dark-mode .empty-state {
  color: #808080;
}
</style>

