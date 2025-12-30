<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useProductStore } from './stores/product'
import { useSalesStore } from './stores/sales'

const productStore = useProductStore()
const salesStore = useSalesStore()

onMounted(() => {
  // 初始化数据
  productStore.loadProducts()
  salesStore.loadSales()
})
</script>

<style>
#app {
  height: 100vh;
  background-color: #f7f8fa;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

