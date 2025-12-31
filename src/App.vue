<template>
  <div id="app">
    <!-- 离线状态指示器 -->
    <OfflineIndicator />
    
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
import { useUserStore } from './stores/user'
import { useMemberStore } from './stores/member'
import { requestNotificationPermission } from './utils/notification'
import { setupAutoSync, getQueueSize } from './utils/offlineQueue'
import OfflineIndicator from './components/OfflineIndicator.vue'

const router = useRouter()
const productStore = useProductStore()
const salesStore = useSalesStore()
const userStore = useUserStore()
const memberStore = useMemberStore()

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

onMounted(async () => {
  try {
    // 初始化用户数据（等待完成）
    await userStore.loadUsers()
    
    // 初始化商品和销售数据
    productStore.loadProducts()
    salesStore.loadSales()
    memberStore.loadMembers()
    
    // 请求通知权限
    await requestNotificationPermission()
    
    // 设置自动同步
    setupAutoSync({
      productStore,
      salesStore,
      memberStore,
      userStore
    })
    
    // 检查离线队列
    const queueSize = getQueueSize()
    if (queueSize > 0) {
      console.log(`📝 有 ${queueSize} 个操作待同步`)
    }
  } catch (error) {
    console.error('应用初始化错误:', error)
  }
})
</script>

<style>
#app {
  height: 100vh;
  background-color: #f7f8fa;
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
</style>
