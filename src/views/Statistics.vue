<template>
  <div class="statistics-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="数据统计"
      left-arrow
      @click-left="router.back()"
    />

    <div class="content-wrapper">
      <!-- 总览数据 -->
      <div class="card">
        <div class="section-title">💰 总体数据</div>
        <div class="total-stats">
          <div class="total-stat-item">
            <div class="total-stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              💵
            </div>
            <div class="total-stat-info">
              <div class="total-stat-label">总销售额</div>
              <div class="total-stat-value">¥{{ salesStore.totalSales.toFixed(2) }}</div>
            </div>
          </div>
          
          <div class="total-stat-item">
            <div class="total-stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
              📈
            </div>
            <div class="total-stat-info">
              <div class="total-stat-label">总利润</div>
              <div class="total-stat-value">¥{{ salesStore.totalProfit.toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 时间段数据 -->
      <div class="card">
        <div class="section-title">📅 时间段数据</div>
        <van-tabs v-model:active="activeTab">
          <van-tab title="今日">
            <div class="period-stats">
              <div class="period-stat-item">
                <div class="period-stat-label">销售额</div>
                <div class="period-stat-value primary">¥{{ salesStore.todaySales.toFixed(2) }}</div>
              </div>
              <div class="period-stat-divider"></div>
              <div class="period-stat-item">
                <div class="period-stat-label">利润</div>
                <div class="period-stat-value success">¥{{ salesStore.todayProfit.toFixed(2) }}</div>
              </div>
            </div>
          </van-tab>
          
          <van-tab title="本月">
            <div class="period-stats">
              <div class="period-stat-item">
                <div class="period-stat-label">销售额</div>
                <div class="period-stat-value primary">¥{{ salesStore.monthSales.toFixed(2) }}</div>
              </div>
              <div class="period-stat-divider"></div>
              <div class="period-stat-item">
                <div class="period-stat-label">利润</div>
                <div class="period-stat-value success">¥{{ salesStore.monthProfit.toFixed(2) }}</div>
              </div>
            </div>
          </van-tab>
        </van-tabs>
      </div>

      <!-- 热销商品排行 -->
      <div class="card">
        <div class="section-title">🏆 热销商品排行</div>
        
        <div v-if="salesStore.topProducts.length === 0" class="empty-state">
          <div class="empty-state-icon">📊</div>
          <div class="empty-state-text">暂无销售数据</div>
        </div>

        <div 
          v-for="(product, index) in salesStore.topProducts" 
          :key="product.productId"
          class="rank-item"
        >
          <div class="rank-badge" :class="`rank-${index + 1}`">
            {{ index + 1 }}
          </div>
          <div class="rank-info">
            <div class="rank-name">{{ product.productName }}</div>
            <div class="rank-stats">
              <span>销量: {{ product.quantity }}件</span>
              <span>销售额: ¥{{ product.amount.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 库存分析 -->
      <div class="card">
        <div class="section-title">📦 库存分析</div>
        <div class="inventory-stats">
          <div class="inventory-item">
            <div class="inventory-label">商品总数</div>
            <div class="inventory-value">{{ productStore.totalProducts }}</div>
          </div>
          <div class="inventory-item">
            <div class="inventory-label">库存总值</div>
            <div class="inventory-value">¥{{ productStore.totalStockValue.toFixed(0) }}</div>
          </div>
          <div class="inventory-item warning">
            <div class="inventory-label">低库存商品</div>
            <div class="inventory-value">{{ productStore.lowStockProducts.length }}</div>
          </div>
        </div>
        <van-button 
          type="primary" 
          size="large" 
          block
          icon="records"
          @click="router.push('/inventory')"
          style="margin-top: 16px"
        >
          库存盘点
        </van-button>
      </div>
    </div>

    <!-- 底部导航 -->
    <van-tabbar v-model="active" active-color="#1989fa" inactive-color="#7d7e80">
      <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="bag-o" to="/products">商品</van-tabbar-item>
      <van-tabbar-item icon="shopping-cart-o" to="/sales">销售</van-tabbar-item>
      <van-tabbar-item icon="bar-chart-o" to="/statistics">统计</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { useSalesStore } from '@/stores/sales'

const router = useRouter()
const productStore = useProductStore()
const salesStore = useSalesStore()
const active = ref(3)
const activeTab = ref(0)
</script>

<style scoped>
.statistics-page {
  background-color: #f7f8fa;
}

.total-stats {
  margin-top: 12px;
}

.total-stat-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.total-stat-item:last-child {
  margin-bottom: 0;
}

.total-stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-right: 16px;
}

.total-stat-info {
  flex: 1;
}

.total-stat-label {
  font-size: 13px;
  color: #969799;
  margin-bottom: 6px;
}

.total-stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #323233;
}

.period-stats {
  display: flex;
  align-items: center;
  padding: 20px 0;
}

.period-stat-item {
  flex: 1;
  text-align: center;
}

.period-stat-label {
  font-size: 13px;
  color: #969799;
  margin-bottom: 8px;
}

.period-stat-value {
  font-size: 24px;
  font-weight: 600;
}

.period-stat-value.primary {
  color: #1989fa;
}

.period-stat-value.success {
  color: #07c160;
}

.period-stat-divider {
  width: 1px;
  height: 50px;
  background: #ebedf0;
}

.rank-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.rank-item:last-child {
  margin-bottom: 0;
}

.rank-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-right: 12px;
  flex-shrink: 0;
}

.rank-badge.rank-1 {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #8b6914;
}

.rank-badge.rank-2 {
  background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
  color: #666;
}

.rank-badge.rank-3 {
  background: linear-gradient(135deg, #cd7f32 0%, #e8a87c 100%);
  color: #5c3a1a;
}

.rank-badge:not(.rank-1):not(.rank-2):not(.rank-3) {
  background: linear-gradient(135deg, #969799 0%, #c8c9cc 100%);
}

.rank-info {
  flex: 1;
}

.rank-name {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.rank-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #969799;
}

.inventory-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.inventory-item {
  text-align: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.inventory-item.warning {
  background: #fff7e6;
}

.inventory-label {
  font-size: 12px;
  color: #969799;
  margin-bottom: 8px;
}

.inventory-value {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
}

.inventory-item.warning .inventory-value {
  color: #ff4d4f;
}
</style>

