<template>
  <div class="inventory-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="库存盘点"
      left-arrow
      @click-left="router.back()"
    >
      <template #right>
        <van-icon 
          v-if="!isChecking" 
          name="add-o" 
          @click="startNewCheck" 
        />
        <van-icon 
          v-else 
          name="success" 
          @click="completeCheck" 
        />
      </template>
    </van-nav-bar>

    <div class="content-wrapper">
      <!-- 盘点状态 -->
      <div class="status-card card" v-if="isChecking">
        <div class="status-header">
          <span class="status-badge checking">盘点中</span>
          <span class="status-time">{{ formatDate(currentCheck.startTime) }}</span>
        </div>
        <div class="status-stats">
          <div class="status-item">
            <span class="status-label">已盘点</span>
            <span class="status-value">{{ checkedCount }}/{{ totalCount }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">差异数</span>
            <span class="status-value error">{{ differenceCount }}</span>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="quick-actions card" v-if="!isChecking">
        <van-button 
          type="primary" 
          size="large" 
          block
          icon="plus"
          @click="startNewCheck"
        >
          开始新盘点
        </van-button>
        <van-button 
          type="default" 
          size="large" 
          block
          icon="records"
          @click="showHistory = true"
          style="margin-top: 12px"
        >
          查看历史记录
        </van-button>
      </div>

      <!-- 盘点列表 -->
      <div class="check-list" v-if="isChecking">
        <!-- 搜索栏 -->
        <div class="search-wrapper">
          <van-search
            v-model="searchKeyword"
            placeholder="搜索商品"
            @search="onSearch"
          />
        </div>

        <!-- 筛选标签 -->
        <div class="filter-tabs">
          <van-tabs v-model:active="filterTab" @change="onFilterChange">
            <van-tab title="全部" name="all"></van-tab>
            <van-tab title="未盘点" name="unchecked"></van-tab>
            <van-tab title="有差异" name="difference"></van-tab>
            <van-tab title="已完成" name="checked"></van-tab>
          </van-tabs>
        </div>

        <!-- 商品列表 -->
        <div class="product-list">
          <div 
            v-for="item in filteredCheckItems" 
            :key="item.productId"
            class="check-item"
            :class="{ 
              'has-difference': item.checked && item.actualStock !== item.systemStock,
              'checked': item.checked 
            }"
            @click="openCheckDialog(item)"
          >
            <div class="item-image">
              <img :src="item.image || 'https://via.placeholder.com/60'" :alt="item.name" />
              <div class="check-status" v-if="item.checked">
                <van-icon name="success" color="#07c160" />
              </div>
            </div>
            
            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-spec">货号: {{ item.code }} | {{ item.size }}码 | {{ item.color }}</div>
              <div class="item-stocks">
                <span class="system-stock">系统: {{ item.systemStock }}</span>
                <span 
                  v-if="item.checked" 
                  class="actual-stock"
                  :class="{ 'difference': item.actualStock !== item.systemStock }"
                >
                  实际: {{ item.actualStock }}
                </span>
                <span v-else class="unchecked-tag">未盘点</span>
              </div>
            </div>

            <div class="item-action">
              <van-button 
                v-if="!item.checked" 
                type="primary" 
                size="small"
                @click.stop="openCheckDialog(item)"
              >
                盘点
              </van-button>
              <div v-else class="difference-badge">
                <span v-if="item.actualStock > item.systemStock" class="plus">
                  +{{ item.actualStock - item.systemStock }}
                </span>
                <span v-else-if="item.actualStock < item.systemStock" class="minus">
                  {{ item.actualStock - item.systemStock }}
                </span>
                <span v-else class="equal">✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 盘点结果 -->
      <div class="result-section" v-if="isChecking && checkedCount === totalCount">
        <div class="result-card card">
          <div class="result-title">📋 盘点完成</div>
          <div class="result-summary">
            <div class="result-item">
              <span class="result-label">盘点商品</span>
              <span class="result-value">{{ totalCount }} 种</span>
            </div>
            <div class="result-item">
              <span class="result-label">库存一致</span>
              <span class="result-value success">{{ matchCount }} 种</span>
            </div>
            <div class="result-item">
              <span class="result-label">库存差异</span>
              <span class="result-value error">{{ differenceCount }} 种</span>
            </div>
          </div>
          <van-button 
            type="primary" 
            size="large" 
            block
            @click="completeCheck"
          >
            完成盘点并更新库存
          </van-button>
        </div>
      </div>
    </div>

    <!-- 盘点对话框 -->
    <van-dialog
      v-model:show="showCheckDialog"
      title="盘点商品"
      show-cancel-button
      @confirm="confirmCheck"
    >
      <div class="check-dialog-content">
        <div class="dialog-product-info">
          <div class="dialog-product-name">{{ currentCheckItem?.name }}</div>
          <div class="dialog-product-spec">
            {{ currentCheckItem?.brand }} | {{ currentCheckItem?.size }}码
          </div>
        </div>
        <van-field
          v-model="actualStockInput"
          type="number"
          label="实际库存"
          placeholder="请输入实际库存数量"
          :rules="[{ required: true, message: '请输入实际库存' }]"
        >
          <template #button>
            <span>件</span>
          </template>
        </van-field>
        <van-field
          v-model="checkRemark"
          type="textarea"
          label="备注"
          placeholder="如有差异，请说明原因（选填）"
          rows="2"
          maxlength="100"
          show-word-limit
        />
      </div>
    </van-dialog>

    <!-- 历史记录 -->
    <van-popup 
      v-model:show="showHistory" 
      position="bottom" 
      :style="{ height: '80%' }"
    >
      <div class="history-popup">
        <div class="history-header">
          <span class="history-title">盘点历史</span>
          <van-icon name="cross" @click="showHistory = false" />
        </div>
        <div class="history-list">
          <div 
            v-for="record in checkHistory" 
            :key="record.id"
            class="history-item"
            @click="viewHistoryDetail(record)"
          >
            <div class="history-info">
              <div class="history-date">{{ formatDate(record.startTime) }}</div>
              <div class="history-meta">
                {{ record.totalCount }}种商品 | {{ record.differenceCount }}处差异
              </div>
            </div>
            <div class="history-status">
              <span class="status-badge completed">已完成</span>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { showToast, showConfirmDialog } from 'vant'
import { smartSearch } from '@/utils/search'

const router = useRouter()
const productStore = useProductStore()

const isChecking = ref(false)
const currentCheck = ref(null)
const checkItems = ref([])
const searchKeyword = ref('')
const filterTab = ref('all')
const showCheckDialog = ref(false)
const currentCheckItem = ref(null)
const actualStockInput = ref('')
const checkRemark = ref('')
const showHistory = ref(false)
const checkHistory = ref([])

// 统计数据
const totalCount = computed(() => checkItems.value.length)
const checkedCount = computed(() => checkItems.value.filter(item => item.checked).length)
const differenceCount = computed(() => {
  return checkItems.value.filter(item => 
    item.checked && item.actualStock !== item.systemStock
  ).length
})
const matchCount = computed(() => {
  return checkItems.value.filter(item => 
    item.checked && item.actualStock === item.systemStock
  ).length
})

// 筛选后的商品列表
const filteredCheckItems = computed(() => {
  let items = checkItems.value

  // 搜索过滤
  if (searchKeyword.value) {
    items = smartSearch(items, searchKeyword.value)
  }

  // 状态筛选
  if (filterTab.value === 'unchecked') {
    items = items.filter(item => !item.checked)
  } else if (filterTab.value === 'difference') {
    items = items.filter(item => item.checked && item.actualStock !== item.systemStock)
  } else if (filterTab.value === 'checked') {
    items = items.filter(item => item.checked)
  }

  return items
})

// 开始新盘点
const startNewCheck = () => {
  const products = productStore.getAllProducts
  if (products.length === 0) {
    showToast('暂无商品，无法进行盘点')
    return
  }

  isChecking.value = true
  currentCheck.value = {
    id: Date.now().toString(),
    startTime: Date.now(),
    endTime: null
  }

  checkItems.value = products.map(product => ({
    productId: product.id,
    name: product.name,
    code: product.code,
    size: product.size,
    color: product.color,
    image: product.image,
    systemStock: product.stock,
    actualStock: null,
    checked: false,
    remark: ''
  }))

  showToast('盘点已开始')
}

// 打开盘点对话框
const openCheckDialog = (item) => {
  currentCheckItem.value = item
  actualStockInput.value = item.checked ? item.actualStock.toString() : ''
  checkRemark.value = item.remark || ''
  showCheckDialog.value = true
}

// 确认盘点
const confirmCheck = () => {
  if (!actualStockInput.value && actualStockInput.value !== '0') {
    showToast('请输入实际库存')
    return
  }

  const actualStock = parseInt(actualStockInput.value)
  const item = checkItems.value.find(i => i.productId === currentCheckItem.value.productId)
  
  if (item) {
    item.actualStock = actualStock
    item.checked = true
    item.remark = checkRemark.value
  }

  showToast('盘点成功')
  actualStockInput.value = ''
  checkRemark.value = ''
}

// 完成盘点
const completeCheck = async () => {
  if (checkedCount.value < totalCount.value) {
    const confirmed = await showConfirmDialog({
      title: '提示',
      message: `还有 ${totalCount.value - checkedCount.value} 种商品未盘点，确定要完成盘点吗？`
    }).catch(() => false)

    if (!confirmed) return
  }

  // 更新库存
  for (const item of checkItems.value) {
    if (item.checked) {
      await productStore.updateProduct(item.productId, {
        stock: item.actualStock
      })
    }
  }

  // 保存盘点记录
  const record = {
    id: currentCheck.value.id,
    startTime: currentCheck.value.startTime,
    endTime: Date.now(),
    totalCount: totalCount.value,
    checkedCount: checkedCount.value,
    differenceCount: differenceCount.value,
    matchCount: matchCount.value,
    items: checkItems.value.filter(item => item.checked)
  }

  checkHistory.value.unshift(record)
  saveHistory()

  showToast({
    type: 'success',
    message: '盘点完成，库存已更新'
  })

  // 重置状态
  isChecking.value = false
  currentCheck.value = null
  checkItems.value = []
  filterTab.value = 'all'
  searchKeyword.value = ''
}

// 查看历史详情
const viewHistoryDetail = (record) => {
  // 可以扩展为详细页面
  showToast('历史详情功能待开发')
}

const onSearch = () => {
  // 搜索逻辑在computed中处理
}

const onFilterChange = () => {
  // 筛选逻辑在computed中处理
}

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 加载历史记录
const loadHistory = () => {
  const stored = localStorage.getItem('inventoryHistory')
  if (stored) {
    checkHistory.value = JSON.parse(stored)
  }
}

// 保存历史记录
const saveHistory = () => {
  localStorage.setItem('inventoryHistory', JSON.stringify(checkHistory.value))
}

onMounted(() => {
  productStore.loadProducts()
  loadHistory()
})
</script>

<style scoped>
.inventory-page {
  background-color: #f7f8fa;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.status-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.checking {
  background: rgba(255, 255, 255, 0.3);
}

.status-badge.completed {
  background: #07c160;
  color: white;
}

.status-time {
  font-size: 13px;
  opacity: 0.9;
}

.status-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.status-item {
  text-align: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
}

.status-label {
  display: block;
  font-size: 13px;
  margin-bottom: 8px;
  opacity: 0.9;
}

.status-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
}

.status-value.error {
  color: #ffeb3b;
}

.quick-actions {
  padding: 20px;
}

.search-wrapper {
  background: white;
  padding: 8px 0;
  margin-bottom: 12px;
}

.filter-tabs {
  background: white;
  margin-bottom: 12px;
}

.product-list {
  padding: 0 16px;
}

.check-item {
  background: white;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  display: flex;
  gap: 12px;
  align-items: center;
  transition: all 0.3s;
}

.check-item.checked {
  border: 2px solid #07c160;
}

.check-item.has-difference {
  border: 2px solid #ff4d4f;
}

.item-image {
  position: relative;
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #f7f8fa;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.check-status {
  position: absolute;
  top: 0;
  right: 0;
  background: white;
  border-radius: 0 8px 0 8px;
  padding: 2px;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-spec {
  font-size: 12px;
  color: #969799;
  margin-bottom: 6px;
}

.item-stocks {
  display: flex;
  gap: 12px;
  font-size: 13px;
}

.system-stock {
  color: #1989fa;
}

.actual-stock {
  color: #07c160;
}

.actual-stock.difference {
  color: #ff4d4f;
  font-weight: 600;
}

.unchecked-tag {
  color: #969799;
  font-size: 12px;
}

.item-action {
  flex-shrink: 0;
}

.difference-badge {
  font-size: 16px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f7f8fa;
}

.difference-badge .plus {
  color: #ff4d4f;
}

.difference-badge .minus {
  color: #ff9800;
}

.difference-badge .equal {
  color: #07c160;
}

.result-section {
  padding: 0 16px;
}

.result-card {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.result-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
}

.result-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
}

.result-label {
  font-size: 14px;
}

.result-value {
  font-size: 16px;
  font-weight: 600;
}

.result-value.success {
  color: #d4edda;
}

.result-value.error {
  color: #ffeb3b;
}

.check-dialog-content {
  padding: 20px;
}

.dialog-product-info {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebedf0;
}

.dialog-product-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 8px;
}

.dialog-product-spec {
  font-size: 13px;
  color: #969799;
}

.history-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebedf0;
}

.history-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.history-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.history-item:active {
  background: #f7f8fa;
}

.history-info {
  flex: 1;
}

.history-date {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 6px;
}

.history-meta {
  font-size: 13px;
  color: #969799;
}
</style>

