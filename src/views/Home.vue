<template>
  <div class="home-page">
    <!-- 头部 -->
    <div class="header">
      <div class="header-content">
        <h1 class="title">鞋店管理系统</h1>
        <p class="subtitle">{{ currentDate }}</p>
      </div>
    </div>

    <!-- 数据概览 -->
    <div class="content-wrapper">
      <div class="stats-grid">
        <div class="stat-card" @click="router.push('/statistics')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
            💰
          </div>
          <div class="stat-info">
            <div class="stat-label">今日销售额</div>
            <div class="stat-value">¥{{ salesStore.todaySales.toFixed(2) }}</div>
          </div>
        </div>

        <div class="stat-card" @click="router.push('/statistics')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
            📈
          </div>
          <div class="stat-info">
            <div class="stat-label">今日利润</div>
            <div class="stat-value">¥{{ salesStore.todayProfit.toFixed(2) }}</div>
          </div>
        </div>

        <div class="stat-card" @click="router.push('/products')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
            👟
          </div>
          <div class="stat-info">
            <div class="stat-label">商品总数</div>
            <div class="stat-value">{{ productStore.totalProducts }}</div>
          </div>
        </div>

        <div class="stat-card" @click="router.push('/products')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)">
            📦
          </div>
          <div class="stat-info">
            <div class="stat-label">库存总值</div>
            <div class="stat-value">¥{{ productStore.totalStockValue.toFixed(0) }}</div>
          </div>
        </div>
      </div>

      <!-- 低库存预警 -->
      <div class="card" v-if="productStore.lowStockProducts.length > 0">
        <div class="section-title">⚠️ 低库存预警</div>
        <div class="warning-list">
          <div 
            v-for="product in productStore.lowStockProducts" 
            :key="product.id"
            class="warning-item"
            @click="router.push(`/product/edit/${product.id}`)"
          >
            <div class="warning-info">
              <div class="warning-name">{{ product.name }}</div>
              <div class="warning-detail">
                {{ product.brand }} | {{ product.size }}码 | {{ product.color }}
              </div>
            </div>
            <div class="warning-stock">
              <span class="stock-badge low">剩余 {{ product.stock }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 今日员工业绩 -->
      <div class="card" v-if="salesStore.todaySalespersonStats.length > 0">
        <div class="section-title">👥 今日业绩</div>
        <div class="staff-stats">
          <div 
            v-for="staff in salesStore.todaySalespersonStats" 
            :key="staff.name"
            class="staff-item"
          >
            <div class="staff-info">
              <div class="staff-name">{{ staff.name }}</div>
              <div class="staff-detail">{{ staff.salesCount }}单 | {{ staff.quantity }}件</div>
            </div>
            <div class="staff-amount">
              <div class="staff-sales">¥{{ staff.totalAmount.toFixed(0) }}</div>
              <div class="staff-profit">利润 ¥{{ staff.totalProfit.toFixed(0) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 会员管理 -->
      <div class="card" @click="router.push('/members')">
        <div class="section-title">👥 会员管理</div>
        <div class="quick-action">
          <div class="action-icon">💳</div>
          <div class="action-text">查看和管理会员信息</div>
          <van-icon name="arrow" class="action-arrow" />
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="card">
        <div class="section-title">🚀 快捷操作</div>
        <div class="quick-actions">
          <van-button 
            type="primary" 
            size="large" 
            block
            class="action-btn"
            @click="router.push('/sales/add')"
          >
            <van-icon name="shopping-cart-o" />
            收银台
          </van-button>
          
          <div class="action-row">
            <van-button 
              type="success" 
              size="large" 
              class="action-btn half"
              @click="router.push('/purchase')"
            >
              <van-icon name="add-o" />
              进货
            </van-button>
            
            <van-button 
              type="warning" 
              size="large" 
              class="action-btn half"
              @click="router.push('/product/batch-add')"
            >
              <van-icon name="apps-o" />
              批量添加
            </van-button>
          </div>
          
          <div class="action-row">
            <van-button 
              type="default" 
              size="large" 
              class="action-btn half backup-btn"
              @click="router.push('/daily-report')"
            >
              <van-icon name="description" />
              每日报表
            </van-button>
            
            <van-button 
              type="default" 
              size="large" 
              class="action-btn half stats-btn"
              @click="router.push('/staff-stats')"
            >
              <van-icon name="friends-o" />
              员工业绩
            </van-button>
          </div>
          
          <van-button 
            type="default" 
            size="large" 
            block
            class="action-btn backup-btn"
            @click="router.push('/data-management')"
          >
            <van-icon name="records" />
            数据备份
          </van-button>
        </div>
      </div>

      <!-- 本月数据 -->
      <div class="card">
        <div class="section-title">📊 本月数据</div>
        <div class="month-stats">
          <div class="month-stat-item">
            <div class="month-stat-label">销售额</div>
            <div class="month-stat-value primary">¥{{ salesStore.monthSales.toFixed(2) }}</div>
          </div>
          <div class="month-stat-divider"></div>
          <div class="month-stat-item">
            <div class="month-stat-label">利润</div>
            <div class="month-stat-value success">¥{{ salesStore.monthProfit.toFixed(2) }}</div>
          </div>
        </div>
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { useSalesStore } from '@/stores/sales'

const router = useRouter()
const productStore = useProductStore()
const salesStore = useSalesStore()
const active = ref(0)

const currentDate = computed(() => {
  const date = new Date()
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
  return date.toLocaleDateString('zh-CN', options)
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1989fa 0%, #1989fa 200px, #f7f8fa 200px);
  padding-bottom: 60px;
}

.header {
  padding: 20px 16px 30px;
  color: white;
}

.header-content {
  text-align: center;
}

.title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 13px;
  opacity: 0.9;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: -20px;
  padding: 0 16px 16px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.2s;
}

.stat-card:active {
  transform: scale(0.98);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 12px;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 12px;
  color: #969799;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.warning-list {
  margin-top: 12px;
}

.warning-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fff7e6;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.warning-item:last-child {
  margin-bottom: 0;
}

.warning-item:active {
  background: #ffe7ba;
}

.warning-info {
  flex: 1;
}

.warning-name {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 4px;
}

.warning-detail {
  font-size: 12px;
  color: #969799;
}

.stock-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.stock-badge.low {
  background: #ff4d4f;
  color: white;
}

.quick-action {
  display: flex;
  align-items: center;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: transform 0.2s;
}

.quick-action:active {
  transform: scale(0.98);
}

.action-icon {
  font-size: 32px;
  margin-right: 12px;
}

.action-text {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
}

.action-arrow {
  font-size: 18px;
  opacity: 0.8;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.action-btn {
  height: 48px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 8px;
}

.action-btn :deep(.van-icon) {
  margin-right: 8px;
  font-size: 18px;
}

.action-row {
  display: flex;
  gap: 12px;
}

.action-btn.half {
  flex: 1;
}

.backup-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.stats-btn {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
  border: none;
}

.staff-stats {
  margin-top: 12px;
}

.staff-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
  margin-bottom: 8px;
}

.staff-item:last-child {
  margin-bottom: 0;
}

.staff-info {
  flex: 1;
}

.staff-name {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.staff-detail {
  font-size: 12px;
  color: #969799;
}

.staff-amount {
  text-align: right;
}

.staff-sales {
  font-size: 16px;
  font-weight: 600;
  color: #1989fa;
  margin-bottom: 4px;
}

.staff-profit {
  font-size: 12px;
  color: #07c160;
}

.month-stats {
  display: flex;
  align-items: center;
  margin-top: 12px;
}

.month-stat-item {
  flex: 1;
  text-align: center;
}

.month-stat-label {
  font-size: 13px;
  color: #969799;
  margin-bottom: 8px;
}

.month-stat-value {
  font-size: 22px;
  font-weight: 600;
}

.month-stat-value.primary {
  color: #1989fa;
}

.month-stat-value.success {
  color: #07c160;
}

.month-stat-divider {
  width: 1px;
  height: 40px;
  background: #ebedf0;
}
</style>
