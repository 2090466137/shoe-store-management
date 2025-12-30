<template>
  <div class="returns-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="退换货管理"
      left-arrow
      @click-left="router.back()"
    >
      <template #right>
        <van-icon name="plus" @click="showTypeSelect = true" />
      </template>
    </van-nav-bar>

    <div class="content-wrapper">
      <!-- 统计卡片 -->
      <div class="stats-card card">
        <div class="stats-grid">
          <div class="stats-item">
            <div class="stats-label">今日退货</div>
            <div class="stats-value error">{{ todayReturns }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">今日换货</div>
            <div class="stats-value warning">{{ todayExchanges }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">退货金额</div>
            <div class="stats-value error">¥{{ todayReturnAmount.toFixed(2) }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">换货金额</div>
            <div class="stats-value warning">¥{{ todayExchangeAmount.toFixed(2) }}</div>
          </div>
        </div>
      </div>

      <!-- 筛选标签 -->
      <div class="filter-tabs">
        <van-tabs v-model:active="activeTab" @change="onTabChange">
          <van-tab title="全部" name="all"></van-tab>
          <van-tab title="退货" name="return"></van-tab>
          <van-tab title="换货" name="exchange"></van-tab>
        </van-tabs>
      </div>

      <!-- 退换货列表 -->
      <div class="returns-list">
        <div v-if="filteredReturns.length === 0" class="empty-state">
          <div class="empty-icon">📦</div>
          <div class="empty-text">暂无退换货记录</div>
        </div>

        <div 
          v-for="item in filteredReturns" 
          :key="item.id"
          class="return-item"
          @click="viewDetail(item)"
        >
          <div class="return-header">
            <span class="return-type" :class="item.type">
              {{ item.type === 'return' ? '退货' : '换货' }}
            </span>
            <span class="return-time">{{ formatDate(item.time) }}</span>
          </div>

          <div class="return-content">
            <!-- 原商品 -->
            <div class="product-section">
              <div class="section-label">原商品</div>
              <div class="product-info">
                <div class="product-image">
                  <img :src="item.originalProduct.image || 'https://via.placeholder.com/50'" :alt="item.originalProduct.name" />
                </div>
                <div class="product-detail">
                  <div class="product-name">{{ item.originalProduct.name }}</div>
                  <div class="product-spec">
                    {{ item.originalProduct.brand }} | {{ item.originalProduct.size }}码
                  </div>
                  <div class="product-quantity">数量: {{ item.originalProduct.quantity }}</div>
                </div>
                <div class="product-price">¥{{ item.originalProduct.price.toFixed(2) }}</div>
              </div>
            </div>

            <!-- 换货新商品 -->
            <div class="product-section" v-if="item.type === 'exchange' && item.newProduct">
              <div class="section-label">换为</div>
              <div class="product-info">
                <div class="product-image">
                  <img :src="item.newProduct.image || 'https://via.placeholder.com/50'" :alt="item.newProduct.name" />
                </div>
                <div class="product-detail">
                  <div class="product-name">{{ item.newProduct.name }}</div>
                  <div class="product-spec">
                    {{ item.newProduct.brand }} | {{ item.newProduct.size }}码
                  </div>
                  <div class="product-quantity">数量: {{ item.newProduct.quantity }}</div>
                </div>
                <div class="product-price">¥{{ item.newProduct.price.toFixed(2) }}</div>
              </div>
            </div>
          </div>

          <div class="return-footer">
            <div class="return-info">
              <span class="return-reason">原因: {{ item.reason }}</span>
              <span class="return-handler">处理人: {{ item.handler }}</span>
            </div>
            <div class="return-amount" :class="item.type">
              {{ item.type === 'return' ? '-' : '' }}¥{{ item.amount.toFixed(2) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 类型选择 -->
    <van-action-sheet
      v-model:show="showTypeSelect"
      :actions="typeActions"
      @select="onSelectType"
    />

    <!-- 退换货表单弹窗 -->
    <van-popup 
      v-model:show="showReturnForm" 
      position="bottom" 
      :style="{ height: '90%' }"
    >
      <div class="return-form">
        <div class="form-header">
          <span class="form-title">{{ returnType === 'return' ? '退货' : '换货' }}</span>
          <van-icon name="cross" @click="closeForm" />
        </div>

        <div class="form-content">
          <!-- 选择原订单 -->
          <div class="form-section">
            <div class="form-section-title">选择原订单</div>
            <van-field
              v-model="selectedSaleText"
              placeholder="点击选择订单"
              readonly
              is-link
              @click="showSalesPicker = true"
            />
          </div>

          <!-- 选择退换货商品 -->
          <div class="form-section" v-if="selectedSale">
            <div class="form-section-title">选择商品</div>
            <div class="product-select-list">
              <div 
                v-for="product in selectedSale.products" 
                :key="product.productId"
                class="product-select-item"
                :class="{ 'selected': selectedProduct?.productId === product.productId }"
                @click="selectProduct(product)"
              >
                <div class="product-select-info">
                  <div class="product-select-name">{{ product.productName }}</div>
                  <div class="product-select-spec">
                    {{ product.brand }} | {{ product.size }}码 | ×{{ product.quantity }}
                  </div>
                </div>
                <div class="product-select-price">¥{{ product.salePrice.toFixed(2) }}</div>
              </div>
            </div>
          </div>

          <!-- 退换货数量 -->
          <div class="form-section" v-if="selectedProduct">
            <div class="form-section-title">退换货数量</div>
            <van-stepper 
              v-model="returnQuantity" 
              :min="1"
              :max="selectedProduct.quantity"
            />
          </div>

          <!-- 换货新商品 -->
          <div class="form-section" v-if="returnType === 'exchange' && selectedProduct">
            <div class="form-section-title">选择新商品</div>
            <van-field
              v-model="newProductText"
              placeholder="点击选择新商品"
              readonly
              is-link
              @click="showProductPicker = true"
            />
            
            <div v-if="newProduct" class="new-product-info">
              <div class="new-product-detail">
                <span class="new-product-name">{{ newProduct.name }}</span>
                <span class="new-product-spec">{{ newProduct.size }}码</span>
              </div>
              <div class="new-product-price">¥{{ newProduct.salePrice }}</div>
            </div>

            <div class="form-section-title" style="margin-top: 16px">换货数量</div>
            <van-stepper 
              v-model="exchangeQuantity" 
              :min="1"
              :max="newProduct?.stock || 1"
            />
          </div>

          <!-- 退换货原因 -->
          <div class="form-section">
            <div class="form-section-title">退换货原因</div>
            <van-field
              v-model="returnReason"
              type="textarea"
              placeholder="请输入退换货原因"
              rows="3"
              maxlength="200"
              show-word-limit
            />
          </div>

          <!-- 处理人 -->
          <div class="form-section">
            <div class="form-section-title">处理人</div>
            <van-field
              v-model="handler"
              placeholder="点击选择处理人"
              readonly
              is-link
              @click="showHandlerPicker = true"
            />
          </div>

          <!-- 金额计算 -->
          <div class="form-section" v-if="selectedProduct">
            <div class="amount-summary">
              <div class="amount-row">
                <span class="amount-label">原商品金额</span>
                <span class="amount-value">¥{{ (selectedProduct.salePrice * returnQuantity).toFixed(2) }}</span>
              </div>
              <div class="amount-row" v-if="returnType === 'exchange' && newProduct">
                <span class="amount-label">新商品金额</span>
                <span class="amount-value">¥{{ (newProduct.salePrice * exchangeQuantity).toFixed(2) }}</span>
              </div>
              <div class="amount-row total">
                <span class="amount-label">{{ returnType === 'return' ? '退款金额' : '补差金额' }}</span>
                <span class="amount-value" :class="amountDiff >= 0 ? 'positive' : 'negative'">
                  {{ amountDiff >= 0 ? '+' : '' }}¥{{ Math.abs(amountDiff).toFixed(2) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 提交按钮 -->
          <van-button 
            type="primary" 
            size="large" 
            block
            @click="submitReturn"
            :disabled="!canSubmit"
          >
            确认{{ returnType === 'return' ? '退货' : '换货' }}
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 订单选择器 -->
    <van-popup v-model:show="showSalesPicker" position="bottom" :style="{ height: '60%' }">
      <div class="picker-popup">
        <div class="picker-header">
          <span class="picker-title">选择订单</span>
          <van-icon name="cross" @click="showSalesPicker = false" />
        </div>
        <div class="picker-content">
          <div 
            v-for="sale in recentSales" 
            :key="sale.id"
            class="sale-item"
            @click="selectSale(sale)"
          >
            <div class="sale-info">
              <div class="sale-time">{{ formatDate(sale.time) }}</div>
              <div class="sale-products">
                {{ sale.products.map(p => p.productName).join(', ') }}
              </div>
            </div>
            <div class="sale-amount">¥{{ sale.totalAmount.toFixed(2) }}</div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 商品选择器 -->
    <van-popup v-model:show="showProductPicker" position="bottom" :style="{ height: '60%' }">
      <div class="picker-popup">
        <div class="picker-header">
          <span class="picker-title">选择新商品</span>
          <van-icon name="cross" @click="showProductPicker = false" />
        </div>
        <div class="picker-content">
          <div 
            v-for="product in availableProducts" 
            :key="product.id"
            class="product-picker-item"
            @click="selectNewProduct(product)"
          >
            <div class="product-picker-info">
              <div class="product-picker-name">{{ product.name }}</div>
              <div class="product-picker-spec">
                {{ product.brand }} | {{ product.size }}码 | 库存: {{ product.stock }}
              </div>
            </div>
            <div class="product-picker-price">¥{{ product.salePrice }}</div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 处理人选择器 -->
    <van-popup v-model:show="showHandlerPicker" position="bottom">
      <van-picker
        :columns="salespersons"
        @confirm="onHandlerConfirm"
        @cancel="showHandlerPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { useSalesStore } from '@/stores/sales'
import { showToast, showConfirmDialog } from 'vant'

const router = useRouter()
const productStore = useProductStore()
const salesStore = useSalesStore()

// 退换货记录
const returns = ref([])
const activeTab = ref('all')
const showTypeSelect = ref(false)
const showReturnForm = ref(false)
const returnType = ref('return')

// 表单数据
const selectedSale = ref(null)
const selectedProduct = ref(null)
const returnQuantity = ref(1)
const newProduct = ref(null)
const exchangeQuantity = ref(1)
const returnReason = ref('')
const handler = ref('')

// 选择器
const showSalesPicker = ref(false)
const showProductPicker = ref(false)
const showHandlerPicker = ref(false)

const salespersons = ['张三', '李四', '王五', '赵六']

const typeActions = [
  { name: '退货', type: 'return' },
  { name: '换货', type: 'exchange' }
]

// 统计数据
const todayReturns = computed(() => {
  const today = new Date().setHours(0, 0, 0, 0)
  return returns.value.filter(r => r.type === 'return' && r.time >= today).length
})

const todayExchanges = computed(() => {
  const today = new Date().setHours(0, 0, 0, 0)
  return returns.value.filter(r => r.type === 'exchange' && r.time >= today).length
})

const todayReturnAmount = computed(() => {
  const today = new Date().setHours(0, 0, 0, 0)
  return returns.value
    .filter(r => r.type === 'return' && r.time >= today)
    .reduce((sum, r) => sum + r.amount, 0)
})

const todayExchangeAmount = computed(() => {
  const today = new Date().setHours(0, 0, 0, 0)
  return returns.value
    .filter(r => r.type === 'exchange' && r.time >= today)
    .reduce((sum, r) => sum + Math.abs(r.amount), 0)
})

// 筛选后的退换货记录
const filteredReturns = computed(() => {
  if (activeTab.value === 'all') {
    return returns.value
  }
  return returns.value.filter(r => r.type === activeTab.value)
})

// 最近订单
const recentSales = computed(() => {
  return salesStore.getAllSales
    .sort((a, b) => b.time - a.time)
    .slice(0, 20)
})

// 可用商品
const availableProducts = computed(() => {
  return productStore.getAllProducts.filter(p => p.stock > 0)
})

// 表单文本
const selectedSaleText = computed(() => {
  if (!selectedSale.value) return ''
  return `订单 ${formatDate(selectedSale.value.time)} - ¥${selectedSale.value.totalAmount.toFixed(2)}`
})

const newProductText = computed(() => {
  if (!newProduct.value) return ''
  return `${newProduct.value.name} - ${newProduct.value.size}码`
})

// 金额差异
const amountDiff = computed(() => {
  if (!selectedProduct.value) return 0
  
  const originalAmount = selectedProduct.value.salePrice * returnQuantity.value
  
  if (returnType.value === 'return') {
    return -originalAmount
  } else {
    if (!newProduct.value) return 0
    const newAmount = newProduct.value.salePrice * exchangeQuantity.value
    return newAmount - originalAmount
  }
})

// 是否可以提交
const canSubmit = computed(() => {
  if (!selectedSale.value || !selectedProduct.value || !handler.value || !returnReason.value) {
    return false
  }
  
  if (returnType.value === 'exchange' && !newProduct.value) {
    return false
  }
  
  return true
})

const onTabChange = () => {
  // 标签切换逻辑已在computed中处理
}

const onSelectType = (action) => {
  returnType.value = action.type
  showTypeSelect.value = false
  showReturnForm.value = true
}

const selectSale = (sale) => {
  selectedSale.value = sale
  selectedProduct.value = null
  showSalesPicker.value = false
}

const selectProduct = (product) => {
  selectedProduct.value = product
  returnQuantity.value = 1
}

const selectNewProduct = (product) => {
  newProduct.value = product
  exchangeQuantity.value = 1
  showProductPicker.value = false
}

const onHandlerConfirm = ({ selectedOptions }) => {
  handler.value = selectedOptions[0].text
  showHandlerPicker.value = false
}

const submitReturn = async () => {
  const confirmed = await showConfirmDialog({
    title: '确认' + (returnType.value === 'return' ? '退货' : '换货'),
    message: `确定要${returnType.value === 'return' ? '退货' : '换货'}吗？`
  }).catch(() => false)

  if (!confirmed) return

  // 创建退换货记录
  const returnRecord = {
    id: Date.now().toString(),
    type: returnType.value,
    time: Date.now(),
    originalSaleId: selectedSale.value.id,
    originalProduct: {
      productId: selectedProduct.value.productId,
      name: selectedProduct.value.productName,
      brand: selectedProduct.value.brand,
      size: selectedProduct.value.size,
      quantity: returnQuantity.value,
      price: selectedProduct.value.salePrice,
      image: productStore.getProductById(selectedProduct.value.productId)?.image || ''
    },
    newProduct: returnType.value === 'exchange' ? {
      productId: newProduct.value.id,
      name: newProduct.value.name,
      brand: newProduct.value.brand,
      size: newProduct.value.size,
      quantity: exchangeQuantity.value,
      price: newProduct.value.salePrice,
      image: newProduct.value.image || ''
    } : null,
    reason: returnReason.value,
    handler: handler.value,
    amount: Math.abs(amountDiff.value)
  }

  returns.value.unshift(returnRecord)
  saveReturns()

  // 更新库存
  productStore.updateStock(selectedProduct.value.productId, returnQuantity.value, 'add')
  
  if (returnType.value === 'exchange' && newProduct.value) {
    productStore.updateStock(newProduct.value.id, exchangeQuantity.value, 'subtract')
  }

  showToast({
    type: 'success',
    message: returnType.value === 'return' ? '退货成功' : '换货成功'
  })

  closeForm()
}

const closeForm = () => {
  showReturnForm.value = false
  selectedSale.value = null
  selectedProduct.value = null
  returnQuantity.value = 1
  newProduct.value = null
  exchangeQuantity.value = 1
  returnReason.value = ''
  handler.value = ''
}

const viewDetail = (item) => {
  // 可以扩展为详情页面
  showToast('详情功能待开发')
}

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 加载退换货记录
const loadReturns = () => {
  const stored = localStorage.getItem('returns')
  if (stored) {
    returns.value = JSON.parse(stored)
  }
}

// 保存退换货记录
const saveReturns = () => {
  localStorage.setItem('returns', JSON.stringify(returns.value))
}

onMounted(() => {
  productStore.loadProducts()
  salesStore.loadSales()
  loadReturns()
})
</script>

<style scoped>
.returns-page {
  background-color: #f7f8fa;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stats-item {
  text-align: center;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
}

.stats-label {
  font-size: 13px;
  color: #969799;
  margin-bottom: 8px;
}

.stats-value {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
}

.stats-value.error {
  color: #ff4d4f;
}

.stats-value.warning {
  color: #ff9800;
}

.filter-tabs {
  background: white;
  margin-bottom: 12px;
}

.returns-list {
  padding: 0 16px;
}

.return-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
}

.return-item:active {
  background: #f7f8fa;
}

.return-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebedf0;
}

.return-type {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.return-type.return {
  background: #ffebee;
  color: #ff4d4f;
}

.return-type.exchange {
  background: #fff3e0;
  color: #ff9800;
}

.return-time {
  font-size: 13px;
  color: #969799;
}

.return-content {
  margin-bottom: 12px;
}

.product-section {
  margin-bottom: 12px;
}

.product-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 12px;
  color: #969799;
  margin-bottom: 8px;
}

.product-info {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px;
  background: #f7f8fa;
  border-radius: 8px;
}

.product-image {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: white;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-detail {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-spec {
  font-size: 12px;
  color: #969799;
  margin-bottom: 2px;
}

.product-quantity {
  font-size: 12px;
  color: #1989fa;
}

.product-price {
  font-size: 15px;
  font-weight: 600;
  color: #ff4d4f;
  flex-shrink: 0;
}

.return-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #ebedf0;
}

.return-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #969799;
}

.return-amount {
  font-size: 18px;
  font-weight: 600;
}

.return-amount.return {
  color: #ff4d4f;
}

.return-amount.exchange {
  color: #ff9800;
}

.return-form {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebedf0;
}

.form-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.form-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.form-section {
  margin-bottom: 20px;
}

.form-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 12px;
}

.product-select-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-select-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
}

.product-select-item.selected {
  border-color: #1989fa;
  background: #e6f7ff;
}

.product-select-info {
  flex: 1;
}

.product-select-name {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.product-select-spec {
  font-size: 12px;
  color: #969799;
}

.product-select-price {
  font-size: 15px;
  font-weight: 600;
  color: #ff4d4f;
}

.new-product-info {
  margin-top: 12px;
  padding: 12px;
  background: #e6f7ff;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.new-product-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.new-product-name {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}

.new-product-spec {
  font-size: 12px;
  color: #969799;
}

.new-product-price {
  font-size: 16px;
  font-weight: 600;
  color: #1989fa;
}

.amount-summary {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 16px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.amount-row:last-child {
  margin-bottom: 0;
}

.amount-row.total {
  padding-top: 12px;
  border-top: 1px solid #ebedf0;
}

.amount-label {
  font-size: 14px;
  color: #969799;
}

.amount-value {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.amount-row.total .amount-value {
  font-size: 20px;
}

.amount-value.positive {
  color: #ff4d4f;
}

.amount-value.negative {
  color: #07c160;
}

.picker-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebedf0;
}

.picker-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.picker-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.sale-item {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.sale-item:active {
  background: #f7f8fa;
}

.sale-info {
  flex: 1;
}

.sale-time {
  font-size: 13px;
  color: #969799;
  margin-bottom: 4px;
}

.sale-products {
  font-size: 14px;
  color: #323233;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sale-amount {
  font-size: 16px;
  font-weight: 600;
  color: #ff4d4f;
}

.product-picker-item {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.product-picker-item:active {
  background: #f7f8fa;
}

.product-picker-info {
  flex: 1;
}

.product-picker-name {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.product-picker-spec {
  font-size: 12px;
  color: #969799;
}

.product-picker-price {
  font-size: 16px;
  font-weight: 600;
  color: #1989fa;
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

