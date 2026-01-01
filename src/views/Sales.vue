<template>
  <div class="sales-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="销售管理"
      left-arrow
      @click-left="router.back()"
    >
      <template #right>
        <van-icon name="plus" size="20" @click="router.push('/sales/add')" />
      </template>
    </van-nav-bar>

    <!-- 今日数据概览 -->
    <div class="content-wrapper">
      <div class="card" v-if="userStore.hasPermission(PERMISSIONS.STATS_PROFIT)">
        <div class="section-title">📊 今日数据</div>
        <div class="today-stats">
          <div class="today-stat-item">
            <div class="today-stat-value primary">¥{{ salesStore.todaySales.toFixed(2) }}</div>
            <div class="today-stat-label">销售额</div>
          </div>
          <div class="today-stat-divider"></div>
          <div class="today-stat-item">
            <div class="today-stat-value success">¥{{ salesStore.todayProfit.toFixed(2) }}</div>
            <div class="today-stat-label">利润</div>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="card">
        <van-button 
          type="warning" 
          size="large" 
          block
          icon="exchange"
          @click="router.push('/returns')"
        >
          退换货管理
        </van-button>
      </div>

      <!-- 销售记录 -->
      <div class="card">
        <div class="section-title">📋 销售记录</div>
        
        <div v-if="salesStore.sales.length === 0" class="empty-state">
          <van-icon name="shopping-cart-o" size="64" color="#4A90E2" />
          <div class="empty-state-text">暂无销售记录</div>
          <div class="empty-state-tip">前往收银台开始销售</div>
        </div>

        <div 
          v-for="sale in salesStore.sales" 
          :key="sale.id"
          class="sale-item"
        >
          <div class="sale-header">
            <div class="sale-product">
              <!-- 多商品订单显示 -->
              <template v-if="sale.products && sale.products.length > 0">
                <span v-if="sale.products.length === 1">{{ sale.products[0].productName }}</span>
                <span v-else>{{ sale.products[0].productName }} 等{{ sale.products.length }}件商品</span>
              </template>
              <!-- 单商品显示 -->
              <template v-else>
                {{ sale.productName }}
              </template>
            </div>
            <div class="sale-amount" v-if="userStore.hasPermission(PERMISSIONS.STATS_PROFIT)">
              ¥{{ sale.totalAmount.toFixed(2) }}
            </div>
          </div>
          <div class="sale-info">
            <!-- 多商品订单信息 -->
            <template v-if="sale.products && sale.products.length > 0">
              <span>共{{ sale.products.reduce((sum, p) => sum + p.quantity, 0) }}件</span>
              <span v-if="sale.salesperson">销售员: {{ sale.salesperson }}</span>
            </template>
            <!-- 单商品信息 -->
            <template v-else>
              <span>数量: {{ sale.quantity }}件</span>
              <span v-if="userStore.hasPermission(PERMISSIONS.STATS_PROFIT)">
                单价: ¥{{ sale.salePrice }}
              </span>
              <span v-if="sale.salesperson">销售员: {{ sale.salesperson }}</span>
            </template>
          </div>
          <div class="sale-footer">
            <div class="sale-profit" v-if="userStore.hasPermission(PERMISSIONS.STATS_PROFIT)">
              <span class="profit-label">利润:</span>
              <span class="profit-value">¥{{ sale.profit.toFixed(2) }}</span>
            </div>
            <div class="sale-actions">
              <span class="sale-date">{{ formatDate(sale.time || sale.date) }}</span>
              <van-icon name="delete-o" class="delete-icon" @click.stop="deleteSale(sale)" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <van-tabbar v-model="active" active-color="#5B8FF9" inactive-color="#7d7e80">
      <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="bag-o" to="/products">商品</van-tabbar-item>
      <van-tabbar-item icon="shopping-cart-o" to="/sales">销售</van-tabbar-item>
      <van-tabbar-item 
        v-if="userStore.hasPermission(PERMISSIONS.STATS_PROFIT)"
        icon="bar-chart-o" 
        to="/statistics"
      >
        统计
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSalesStore } from '@/stores/sales'
import { useProductStore } from '@/stores/product'
import { useUserStore, PERMISSIONS } from '@/stores/user'
import { showConfirmDialog, showToast } from 'vant'

const router = useRouter()
const salesStore = useSalesStore()
const productStore = useProductStore()
const userStore = useUserStore()
const active = ref(2)

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const deleteSale = (sale) => {
  // 构建确认消息
  let productInfo = ''
  if (sale.products && sale.products.length > 0) {
    productInfo = sale.products.map(p => `${p.productName} ×${p.quantity}`).join('\n')
  } else {
    productInfo = `${sale.productName}\n数量：${sale.quantity}件`
  }
  
  showConfirmDialog({
    title: '确认删除',
    message: `确定要删除这条销售记录吗？\n\n${productInfo}\n金额：¥${sale.totalAmount.toFixed(2)}\n\n删除后将恢复库存`,
  })
    .then(() => {
      // 恢复库存
      if (sale.products && sale.products.length > 0) {
        // 多商品订单
        sale.products.forEach(item => {
          productStore.updateStock(item.productId, item.quantity, 'add')
        })
      } else {
        // 单商品
        productStore.updateStock(sale.productId, sale.quantity, 'add')
      }
      
      // 删除销售记录
      salesStore.deleteSale(sale.id)
      
      showToast({
        type: 'success',
        message: '删除成功，库存已恢复'
      })
    })
    .catch(() => {
      // 取消删除
    })
}
</script>

<style scoped>
.sales-page {
  background-color: #f7f8fa;
}

.today-stats {
  display: flex;
  align-items: center;
  margin-top: 12px;
}

.today-stat-item {
  flex: 1;
  text-align: center;
}

.today-stat-value {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.today-stat-value.primary {
  color: #5B8FF9;
}

.today-stat-value.success {
  color: #5AD8A6;
}

.today-stat-label {
  font-size: 13px;
  color: #969799;
}

.today-stat-divider {
  width: 1px;
  height: 50px;
  background: #ebedf0;
}

.sale-item {
  padding: 16px;
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(91, 143, 249, 0.08);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.sale-item:last-child {
  margin-bottom: 0;
}

.sale-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.sale-product {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}

.sale-amount {
  font-size: 16px;
  font-weight: 600;
  color: #ff4d4f;
}

.sale-info {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #646566;
  margin-bottom: 8px;
}

.sale-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.sale-profit {
  color: #5AD8A6;
}

.profit-label {
  color: #969799;
  margin-right: 4px;
}

.profit-value {
  font-weight: 600;
}

.sale-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sale-date {
  color: #969799;
}

.delete-icon {
  font-size: 16px;
  color: #ff4d4f;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-state-text {
  font-size: 16px;
  color: #646566;
  margin: 16px 0 8px;
  font-weight: 500;
}

.empty-state-tip {
  font-size: 14px;
  color: #969799;
}
</style>

