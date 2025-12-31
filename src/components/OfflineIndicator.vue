<template>
  <transition name="slide-down">
    <div v-if="!isOnline" class="offline-indicator">
      <van-notice-bar
        left-icon="warning-o"
        color="#ff976a"
        background="#fff7cc"
        :scrollable="false"
      >
        <template #default>
          <span class="offline-text">
            📡 当前处于离线模式，数据已保存到本地，恢复网络后将自动同步
          </span>
        </template>
      </van-notice-bar>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isOnline = ref(navigator.onLine)

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
  
  if (isOnline.value) {
    console.log('✅ 网络已恢复')
    // 触发数据同步
    window.dispatchEvent(new CustomEvent('online-sync'))
  } else {
    console.log('📡 网络已断开，进入离线模式')
  }
}

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<style scoped>
.offline-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
}

.offline-text {
  font-size: 13px;
  font-weight: 500;
}

/* 动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>

