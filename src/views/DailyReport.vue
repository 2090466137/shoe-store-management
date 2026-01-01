<template>
  <div class="daily-report-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="每日营业报表"
      left-arrow
      @click-left="router.back()"
    >
      <template #right>
        <van-icon name="share-o" @click="exportReport" />
      </template>
    </van-nav-bar>

    <div class="content-wrapper">
      <!-- 日期选择 -->
      <div class="date-selector card">
        <van-cell 
          title="选择日期" 
          :value="selectedDateText"
          is-link
          @click="showDatePicker = true"
        />
      </div>

      <!-- 营业概况 -->
      <div class="summary-section card">
        <div class="section-title">📊 营业概况</div>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">销售额</div>
            <div class="summary-value primary">¥{{ dailyData.totalSales.toFixed(2) }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">成本</div>
            <div class="summary-value">¥{{ dailyData.totalCost.toFixed(2) }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">利润</div>
            <div class="summary-value success">¥{{ dailyData.totalProfit.toFixed(2) }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">利润率</div>
            <div class="summary-value">{{ dailyData.profitRate }}%</div>
          </div>
        </div>
      </div>

      <!-- 销售统计 -->
      <div class="stats-section card">
        <div class="section-title">🛒 销售统计</div>
        <van-cell-group inset>
          <van-cell title="订单数量" :value="`${dailyData.orderCount} 单`" />
          <van-cell title="商品数量" :value="`${dailyData.productCount} 件`" />
          <van-cell title="客单价" :value="`¥${dailyData.avgOrderAmount.toFixed(2)}`" />
          <van-cell title="件单价" :value="`¥${dailyData.avgProductPrice.toFixed(2)}`" />
        </van-cell-group>
      </div>

      <!-- 销售员业绩 -->
      <div class="staff-section card" v-if="dailyData.staffStats.length > 0">
        <div class="section-title">👥 销售员业绩</div>
        <div class="staff-list">
          <div 
            v-for="(staff, index) in dailyData.staffStats" 
            :key="staff.name"
            class="staff-item"
          >
            <div class="staff-rank">{{ index + 1 }}</div>
            <div class="staff-info">
              <div class="staff-name">{{ staff.name }}</div>
              <div class="staff-meta">
                {{ staff.orderCount }}单 | {{ staff.productCount }}件
              </div>
            </div>
            <div class="staff-amount">
              <div class="staff-sales">¥{{ staff.sales.toFixed(2) }}</div>
              <div class="staff-profit">利润 ¥{{ staff.profit.toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 热销商品 -->
      <div class="hot-products-section card" v-if="dailyData.hotProducts.length > 0">
        <div class="section-title">🔥 热销商品 TOP5</div>
        <div class="hot-list">
          <div 
            v-for="(product, index) in dailyData.hotProducts" 
            :key="product.id"
            class="hot-item"
          >
            <div class="hot-rank" :class="`rank-${index + 1}`">{{ index + 1 }}</div>
            <div class="hot-image">
              <img :src="product.image || 'https://via.placeholder.com/50'" :alt="product.name" />
            </div>
            <div class="hot-info">
              <div class="hot-name">{{ product.name }}</div>
              <div class="hot-meta">货号: {{ product.code }} | {{ product.size }}码 | {{ product.color }}</div>
            </div>
            <div class="hot-stats">
              <div class="hot-quantity">销量: {{ product.quantity }}</div>
              <div class="hot-amount">¥{{ product.amount.toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 销售明细 -->
      <div class="details-section card" v-if="dailyData.orders.length > 0">
        <div class="section-title">📝 销售明细</div>
        <div class="order-list">
          <div 
            v-for="order in dailyData.orders" 
            :key="order.id"
            class="order-item"
          >
            <div class="order-header">
              <span class="order-time">{{ formatTime(order.time) }}</span>
              <span class="order-salesperson">{{ order.salesperson }}</span>
            </div>
            <div class="order-products">
              <div 
                v-for="product in order.products" 
                :key="product.productId"
                class="order-product"
              >
                <span class="product-name">{{ product.productName }}</span>
                <span class="product-quantity">×{{ product.quantity }}</span>
                <span class="product-price">¥{{ product.salePrice.toFixed(2) }}</span>
              </div>
            </div>
            <div class="order-footer">
              <span class="order-total">合计: ¥{{ order.totalAmount.toFixed(2) }}</span>
              <span class="order-profit">利润: ¥{{ order.profit.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="dailyData.orderCount === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-text">当天暂无销售记录</div>
      </div>
    </div>

    <!-- 日期选择器 -->
    <van-popup 
      v-model:show="showDatePicker" 
      position="bottom"
      round
      closeable
      close-icon="close"
      :style="{ paddingTop: '46px' }"
    >
      <van-date-picker
        v-model="selectedDate"
        title="选择日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSalesStore } from '@/stores/sales'
import { useProductStore } from '@/stores/product'
import { showToast } from 'vant'

const router = useRouter()
const salesStore = useSalesStore()
const productStore = useProductStore()

const showDatePicker = ref(false)
const selectedDate = ref([
  new Date().getFullYear(),
  new Date().getMonth() + 1,
  new Date().getDate()
])

const minDate = new Date(2024, 0, 1)
const maxDate = new Date()

const selectedDateText = computed(() => {
  return `${selectedDate.value[0]}-${String(selectedDate.value[1]).padStart(2, '0')}-${String(selectedDate.value[2]).padStart(2, '0')}`
})

// 获取当日数据
const dailyData = computed(() => {
  const dateStr = selectedDateText.value
  const startTime = new Date(dateStr).setHours(0, 0, 0, 0)
  const endTime = new Date(dateStr).setHours(23, 59, 59, 999)

  // 筛选当日订单
  const orders = salesStore.getAllSales.filter(sale => {
    const saleTime = sale.time || sale.date
    return saleTime >= startTime && saleTime <= endTime
  })

  if (orders.length === 0) {
    return {
      totalSales: 0,
      totalCost: 0,
      totalProfit: 0,
      profitRate: 0,
      orderCount: 0,
      productCount: 0,
      avgOrderAmount: 0,
      avgProductPrice: 0,
      staffStats: [],
      hotProducts: [],
      orders: []
    }
  }

  // 计算总销售额、成本、利润
  let totalSales = 0
  let totalCost = 0
  let totalProfit = 0
  let productCount = 0

  orders.forEach(order => {
    totalSales += order.totalAmount
    totalProfit += order.profit
    
    // 计算商品数量（支持单商品和多商品订单）
    if (order.products && Array.isArray(order.products)) {
      productCount += order.products.reduce((sum, p) => sum + p.quantity, 0)
    } else {
      productCount += order.quantity || 0
    }
  })

  totalCost = totalSales - totalProfit

  // 销售员统计
  const staffMap = {}
  orders.forEach(order => {
    const name = order.salesperson || '未指定'
    if (!staffMap[name]) {
      staffMap[name] = {
        name,
        orderCount: 0,
        productCount: 0,
        sales: 0,
        profit: 0
      }
    }
    staffMap[name].orderCount++
    
    // 计算商品数量
    if (order.products && Array.isArray(order.products)) {
      staffMap[name].productCount += order.products.reduce((sum, p) => sum + p.quantity, 0)
    } else {
      staffMap[name].productCount += order.quantity || 0
    }
    
    staffMap[name].sales += order.totalAmount
    staffMap[name].profit += order.profit
  })

  const staffStats = Object.values(staffMap).sort((a, b) => b.sales - a.sales)

  // 热销商品统计
  const productMap = {}
  orders.forEach(order => {
    // 处理多商品订单
    if (order.products && Array.isArray(order.products)) {
      order.products.forEach(p => {
        if (!productMap[p.productId]) {
          const product = productStore.getProductById(p.productId)
          productMap[p.productId] = {
            id: p.productId,
            name: p.productName,
            code: p.code,
            size: p.size,
            color: p.color,
            image: product?.image || '',
            quantity: 0,
            amount: 0
          }
        }
        productMap[p.productId].quantity += p.quantity
        productMap[p.productId].amount += p.salePrice * p.quantity
      })
    } else {
      // 处理单商品订单
      if (order.productId) {
        if (!productMap[order.productId]) {
          const product = productStore.getProductById(order.productId)
          productMap[order.productId] = {
            id: order.productId,
            name: order.productName,
            brand: order.brand || '',
            size: order.size || '',
            image: product?.image || '',
            quantity: 0,
            amount: 0
          }
        }
        productMap[order.productId].quantity += order.quantity
        productMap[order.productId].amount += order.totalAmount
      }
    }
  })

  const hotProducts = Object.values(productMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  return {
    totalSales,
    totalCost,
    totalProfit,
    profitRate: totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0,
    orderCount: orders.length,
    productCount,
    avgOrderAmount: totalSales / orders.length,
    avgProductPrice: productCount > 0 ? totalSales / productCount : 0,
    staffStats,
    hotProducts,
    orders: orders.sort((a, b) => b.time - a.time)
  }
})

const onDateConfirm = () => {
  showDatePicker.value = false
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const exportReport = () => {
  const report = {
    date: selectedDateText.value,
    summary: {
      totalSales: dailyData.value.totalSales,
      totalCost: dailyData.value.totalCost,
      totalProfit: dailyData.value.totalProfit,
      profitRate: dailyData.value.profitRate,
      orderCount: dailyData.value.orderCount,
      productCount: dailyData.value.productCount
    },
    staffStats: dailyData.value.staffStats,
    hotProducts: dailyData.value.hotProducts,
    orders: dailyData.value.orders
  }

  const dataStr = JSON.stringify(report, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `营业报表_${selectedDateText.value}.json`
  link.click()
  URL.revokeObjectURL(url)

  showToast({
    type: 'success',
    message: '报表已导出'
  })
}

onMounted(() => {
  salesStore.loadSales()
  productStore.loadProducts()
})
</script>

<style scoped>
.daily-report-page {
  background-color: #f7f8fa;
}

.date-selector {
  margin-bottom: 12px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.summary-item {
  text-align: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(91, 143, 249, 0.08);
  border: 1px solid #e5e7eb;
}

.summary-label {
  font-size: 13px;
  color: #969799;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
}

.summary-value.primary {
  color: #1989fa;
}

.summary-value.success {
  color: #07c160;
}

.staff-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.staff-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(91, 143, 249, 0.08);
  border: 1px solid #e5e7eb;
}

.staff-rank {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1989fa;
  color: white;
  border-radius: 6px;
  font-weight: 600;
  flex-shrink: 0;
}

.staff-info {
  flex: 1;
  min-width: 0;
}

.staff-name {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.staff-meta {
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

.hot-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hot-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(91, 143, 249, 0.08);
  border: 1px solid #e5e7eb;
}

.hot-rank {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #969799;
  color: white;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.hot-rank.rank-1 {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #8b4513;
}

.hot-rank.rank-2 {
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  color: #666;
}

.hot-rank.rank-3 {
  background: linear-gradient(135deg, #cd7f32, #e6a85c);
  color: white;
}

.hot-image {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: white;
}

.hot-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hot-info {
  flex: 1;
  min-width: 0;
}

.hot-name {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-meta {
  font-size: 12px;
  color: #969799;
}

.hot-stats {
  text-align: right;
}

.hot-quantity {
  font-size: 13px;
  color: #323233;
  margin-bottom: 4px;
}

.hot-amount {
  font-size: 15px;
  font-weight: 600;
  color: #ff4d4f;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(91, 143, 249, 0.08);
  border: 1px solid #e5e7eb;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebedf0;
}

.order-time {
  font-size: 13px;
  color: #969799;
}

.order-salesperson {
  font-size: 13px;
  color: #1989fa;
  font-weight: 600;
}

.order-products {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.order-product {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #323233;
}

.product-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
}

.product-quantity {
  color: #969799;
  margin-right: 12px;
}

.product-price {
  font-weight: 600;
  color: #ff4d4f;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid #ebedf0;
  font-size: 14px;
}

.order-total {
  font-weight: 600;
  color: #323233;
}

.order-profit {
  color: #07c160;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #969799;
}
</style>

