<template>
  <div class="product-query-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="商品查询"
      left-arrow
      @click-left="router.back()"
    >
      <template #right>
        <van-icon 
          name="filter-o" 
          size="22" 
          @click="showFilterPopup = true" 
        />
      </template>
    </van-nav-bar>

    <!-- 搜索栏 -->
    <div class="search-wrapper">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索货号、颜色、尺码或分类"
        @search="onSearch"
        @clear="onSearch"
        @input="onSearch"
      />
    </div>

    <!-- 统计信息 -->
    <div class="stats-bar">
      <div class="stat-item">
        <div class="stat-value">{{ filteredProducts.length }}</div>
        <div class="stat-label">查询结果</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ inStockCount }}</div>
        <div class="stat-label">有库存</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ outOfStockCount }}</div>
        <div class="stat-label">缺货</div>
      </div>
    </div>

    <!-- 筛选标签 -->
    <div class="filter-tags" v-if="hasActiveFilters">
      <van-tag
        v-if="filterCategory"
        closeable
        type="primary"
        @close="filterCategory = ''"
      >
        {{ filterCategory }}
      </van-tag>
      <van-tag
        v-if="filterStockStatus"
        closeable
        type="warning"
        @close="filterStockStatus = ''"
      >
        {{ filterStockStatus === 'inStock' ? '有库存' : filterStockStatus === 'outOfStock' ? '缺货' : '库存紧张' }}
      </van-tag>
      <van-button
        size="small"
        type="danger"
        plain
        @click="clearFilters"
      >
        清除全部
      </van-button>
    </div>

    <!-- 商品列表 -->
    <div class="content-wrapper">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <div v-if="filteredProducts.length === 0" class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-text">未找到匹配的商品</div>
          <div class="empty-tip">尝试调整搜索条件</div>
        </div>

        <div 
          v-for="product in filteredProducts" 
          :key="product.id"
          class="product-card"
          :class="{ 'out-of-stock': product.stock === 0 }"
        >
          <!-- 商品图片 -->
          <div class="product-image">
            <img 
              v-if="product.image" 
              :src="product.image" 
              :alt="product.name"
              @error="handleImageError"
            />
            <div v-else class="image-placeholder">
              <van-icon name="photo-o" size="32" />
            </div>
            <div 
              v-if="product.stock === 0" 
              class="stock-badge out-of-stock-badge"
            >
              缺货
            </div>
            <div 
              v-else-if="product.stock <= product.minStock" 
              class="stock-badge low-stock-badge"
            >
              库存紧张
            </div>
          </div>

          <!-- 商品信息 -->
          <div class="product-info">
            <div class="product-header">
              <h3 class="product-name">{{ product.name }}</h3>
              <div class="product-price">¥{{ product.salePrice.toFixed(2) }}</div>
            </div>

            <div class="product-meta">
              <van-tag type="primary" size="small">货号: {{ product.code }}</van-tag>
              <van-tag plain size="small" v-if="product.category">{{ product.category }}</van-tag>
              <span class="product-spec">{{ product.size }}码 | {{ product.color }}</span>
            </div>

            <div class="product-footer">
              <div class="stock-info">
                <span class="stock-label">库存:</span>
                <span 
                  class="stock-value"
                  :class="{ 
                    'low-stock': product.stock > 0 && product.stock <= product.minStock,
                    'out-of-stock': product.stock === 0
                  }"
                >
                  {{ product.stock }} 件
                </span>
              </div>
              <div class="price-info">
                <span class="price-label">售价:</span>
                <span class="price-value">¥{{ product.salePrice.toFixed(2) }}</span>
              </div>
            </div>

            <!-- 商品编码（可选显示） -->
            <div v-if="product.code" class="product-code">
              <van-icon name="qr" size="12" />
              <span>编码: {{ product.code }}</span>
            </div>
          </div>
        </div>
      </van-pull-refresh>
    </div>

    <!-- 筛选弹窗 -->
    <van-popup
      v-model:show="showFilterPopup"
      position="bottom"
      :style="{ height: '50%' }"
      round
    >
      <div class="filter-popup">
        <div class="popup-header">
          <span class="popup-title">筛选条件</span>
          <van-button type="primary" size="small" @click="applyFilter">
            应用
          </van-button>
        </div>

        <div class="filter-content">
          <!-- 分类筛选 -->
          <van-cell-group title="商品分类" inset>
            <van-radio-group v-model="tempFilterCategory">
              <van-cell
                title="全部"
                clickable
                @click="tempFilterCategory = ''"
              >
                <template #right-icon>
                  <van-radio name="" />
                </template>
              </van-cell>
              <van-cell
                v-for="category in categories"
                :key="category"
                :title="category"
                clickable
                @click="tempFilterCategory = category"
              >
                <template #right-icon>
                  <van-radio :name="category" />
                </template>
              </van-cell>
            </van-radio-group>
          </van-cell-group>

          <!-- 库存状态筛选 -->
          <van-cell-group title="库存状态" inset>
            <van-radio-group v-model="tempFilterStockStatus">
              <van-cell
                title="全部"
                clickable
                @click="tempFilterStockStatus = ''"
              >
                <template #right-icon>
                  <van-radio name="" />
                </template>
              </van-cell>
              <van-cell
                title="有库存"
                clickable
                @click="tempFilterStockStatus = 'inStock'"
              >
                <template #right-icon>
                  <van-radio name="inStock" />
                </template>
              </van-cell>
              <van-cell
                title="缺货"
                clickable
                @click="tempFilterStockStatus = 'outOfStock'"
              >
                <template #right-icon>
                  <van-radio name="outOfStock" />
                </template>
              </van-cell>
              <van-cell
                title="库存紧张"
                clickable
                @click="tempFilterStockStatus = 'lowStock'"
              >
                <template #right-icon>
                  <van-radio name="lowStock" />
                </template>
              </van-cell>
            </van-radio-group>
          </van-cell-group>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { showToast } from 'vant'
import { debounce } from '@/utils/debounce'

const router = useRouter()
const productStore = useProductStore()

// UI 状态
const searchKeyword = ref('')
const refreshing = ref(false)
const showFilterPopup = ref(false)

// 筛选条件
const filterCategory = ref('')
const filterStockStatus = ref('')

// 临时筛选条件（用于弹窗）
const tempFilterCategory = ref('')
const tempFilterStockStatus = ref('')

// 商品分类列表
const categories = computed(() => {
  const cats = new Set()
  productStore.getAllProducts.forEach(p => {
    if (p.category) cats.add(p.category)
  })
  return Array.from(cats).sort()
})

// 筛选后的商品列表
const filteredProducts = computed(() => {
  let products = productStore.getAllProducts

  // 搜索关键词
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    products = products.filter(p => 
      p.name.toLowerCase().includes(keyword) ||
      (p.code && p.code.toLowerCase().includes(keyword)) ||
      (p.size && p.size.toString().includes(keyword)) ||
      (p.category && p.category.toLowerCase().includes(keyword)) ||
      (p.color && p.color.toLowerCase().includes(keyword))
    )
  }

  // 分类筛选
  if (filterCategory.value) {
    products = products.filter(p => p.category === filterCategory.value)
  }

  // 库存状态筛选
  if (filterStockStatus.value === 'inStock') {
    products = products.filter(p => p.stock > 0)
  } else if (filterStockStatus.value === 'outOfStock') {
    products = products.filter(p => p.stock === 0)
  } else if (filterStockStatus.value === 'lowStock') {
    products = products.filter(p => p.stock > 0 && p.stock <= p.minStock)
  }

  // 按库存排序（有库存的在前）
  return products.sort((a, b) => {
    if (a.stock === 0 && b.stock > 0) return 1
    if (a.stock > 0 && b.stock === 0) return -1
    return 0
  })
})

// 统计信息
const inStockCount = computed(() => {
  return filteredProducts.value.filter(p => p.stock > 0).length
})

const outOfStockCount = computed(() => {
  return filteredProducts.value.filter(p => p.stock === 0).length
})

// 是否有激活的筛选条件
const hasActiveFilters = computed(() => {
  return filterCategory.value || filterStockStatus.value
})

// 搜索（防抖处理）
const debouncedSearch = debounce(() => {
  // 搜索逻辑已在 computed 中处理，这里只是触发响应式更新
}, 300)

const onSearch = () => {
  debouncedSearch()
}

// 下拉刷新
const onRefresh = async () => {
  refreshing.value = true
  try {
    await productStore.loadProducts()
    showToast('刷新成功')
  } catch (error) {
    showToast('刷新失败')
  } finally {
    refreshing.value = false
  }
}

// 应用筛选
const applyFilter = () => {
  filterCategory.value = tempFilterCategory.value
  filterStockStatus.value = tempFilterStockStatus.value
  showFilterPopup.value = false
}

// 清除筛选
const clearFilters = () => {
  filterCategory.value = ''
  filterStockStatus.value = ''
  tempFilterCategory.value = ''
  tempFilterStockStatus.value = ''
}

// 图片加载错误处理
const handleImageError = (event) => {
  event.target.style.display = 'none'
  const placeholder = event.target.nextElementSibling
  if (placeholder) {
    placeholder.style.display = 'flex'
  }
}

// 初始化
onMounted(async () => {
  // 加载商品数据（确保数据同步）
  await productStore.loadProducts()
})
</script>

<style scoped>
.product-query-page {
  background-color: #f7f8fa;
  min-height: 100vh;
}

.search-wrapper {
  background: white;
  padding: 8px 0;
  position: sticky;
  top: 46px;
  z-index: 10;
}

.stats-bar {
  display: flex;
  background: white;
  padding: 12px 16px;
  margin-bottom: 8px;
  box-shadow: 0 2px 4px rgba(91, 143, 249, 0.08);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #969799;
}

.filter-tags {
  padding: 8px 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  background: white;
  margin-bottom: 8px;
}

.content-wrapper {
  padding: 0 16px 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #969799;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-tip {
  font-size: 12px;
  color: #c8c9cc;
}

.product-card {
  background: white;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  display: flex;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(91, 143, 249, 0.08);
  transition: transform 0.2s;
}

.product-card:active {
  transform: scale(0.98);
}

.product-card.out-of-stock {
  opacity: 0.7;
}

.product-image {
  position: relative;
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #f0f2f5;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c8c9cc;
  background: #f0f2f5;
}

.stock-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  color: white;
  font-weight: 500;
}

.out-of-stock-badge {
  background: #ee0a24;
}

.low-stock-badge {
  background: #ff976a;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.product-name {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
}

.product-price {
  font-size: 18px;
  font-weight: 600;
  color: #ee0a24;
  flex-shrink: 0;
}

.product-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.product-spec {
  font-size: 12px;
  color: #969799;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  margin-bottom: 8px;
}

.stock-info,
.price-info {
  font-size: 13px;
}

.stock-label,
.price-label {
  color: #969799;
  margin-right: 4px;
}

.stock-value {
  color: #07c160;
  font-weight: 600;
}

.stock-value.low-stock {
  color: #ff976a;
}

.stock-value.out-of-stock {
  color: #ee0a24;
}

.price-value {
  color: #ee0a24;
  font-weight: 600;
}

.product-code {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #c8c9cc;
  margin-top: 4px;
}

.filter-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebedf0;
}

.popup-title {
  font-size: 16px;
  font-weight: bold;
}

.filter-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
</style>

