<template>
  <div class="products-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="商品管理"
      left-arrow
      @click-left="router.back()"
    >
      <template #right>
        <van-icon 
          v-if="canAddProduct"
          name="plus" 
          size="20" 
          @click="router.push('/product/add')" 
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
      />
    </div>

    <!-- 筛选标签 -->
    <div class="filter-tabs">
      <van-tabs v-model:active="activeTab" @change="onTabChange">
        <van-tab title="全部" name="all"></van-tab>
        <van-tab title="低库存" name="low"></van-tab>
        <van-tab 
          v-for="category in availableCategories" 
          :key="category"
          :title="category" 
          :name="category"
        ></van-tab>
      </van-tabs>
    </div>

    <!-- 商品列表 -->
    <div class="content-wrapper">
      <div v-if="filteredProducts.length === 0" class="empty-state">
        <div class="empty-state-icon">📦</div>
        <div class="empty-state-text">暂无商品数据</div>
        <van-button 
          v-if="canAddProduct"
          type="primary" 
          size="small" 
          style="margin-top: 16px"
          @click="router.push('/product/add')"
        >
          添加商品
        </van-button>
      </div>

      <div 
        v-for="product in filteredProducts" 
        :key="product.id"
        class="product-card"
        @click="viewProduct(product)"
      >
        <div class="product-image">
          <img :src="product.image" :alt="product.name" />
          <div 
            v-if="product.stock <= product.minStock" 
            class="stock-warning-badge"
          >
            库存预警
          </div>
        </div>
        
        <div class="product-info">
          <div class="product-header">
            <h3 class="product-name">{{ product.name }}</h3>
            <div class="product-price" v-if="userStore.hasPermission(PERMISSIONS.STATS_PROFIT)">
              ¥{{ product.salePrice }}
            </div>
          </div>
          
          <div class="product-meta">
            <van-tag type="primary" size="medium">货号: {{ product.code }}</van-tag>
            <van-tag plain size="medium" v-if="product.category">{{ product.category }}</van-tag>
            <span class="product-spec">{{ product.size }}码 | {{ product.color }}</span>
          </div>
          
          <div class="product-footer">
            <div class="stock-info">
              <span class="stock-label">库存:</span>
              <span 
                class="stock-value"
                :class="{ 'low-stock': product.stock <= product.minStock }"
              >
                {{ product.stock }}
              </span>
            </div>
            <div class="product-actions">
              <van-button 
                v-if="canEditProduct"
                size="small" 
                type="primary" 
                plain
                @click.stop="editProduct(product)"
              >
                编辑
              </van-button>
              <van-button 
                v-if="canDeleteProduct"
                size="small" 
                type="danger" 
                plain
                @click.stop="deleteProduct(product)"
              >
                删除
              </van-button>
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { useUserStore, PERMISSIONS } from '@/stores/user'
import { showConfirmDialog, showToast } from 'vant'
import { smartSearch } from '@/utils/search'

const router = useRouter()
const productStore = useProductStore()
const userStore = useUserStore()
const active = ref(1)
const searchKeyword = ref('')
const activeTab = ref('all')

// 权限检查
const canAddProduct = computed(() => userStore.hasPermission(PERMISSIONS.PRODUCT_ADD))
const canEditProduct = computed(() => userStore.hasPermission(PERMISSIONS.PRODUCT_EDIT))
const canDeleteProduct = computed(() => userStore.hasPermission(PERMISSIONS.PRODUCT_DELETE))

// 动态获取所有存在的分类
const availableCategories = computed(() => {
  const categories = new Set()
  productStore.getAllProducts.forEach(product => {
    if (product.category && product.category !== '其他') {
      categories.add(product.category)
    }
  })
  return Array.from(categories).sort()
})

const filteredProducts = computed(() => {
  let products = productStore.getAllProducts
  
  // 使用智能搜索
  if (searchKeyword.value) {
    products = smartSearch(products, searchKeyword.value)
  }
  
  // 分类筛选
  if (activeTab.value === 'low') {
    products = products.filter(p => p.stock <= p.minStock)
  } else if (activeTab.value !== 'all') {
    products = products.filter(p => p.category === activeTab.value)
  }
  
  return products
})

const onSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

const onTabChange = () => {
  // 标签切换逻辑已在 computed 中处理
}

const viewProduct = (product) => {
  // 如果有编辑权限才跳转到编辑页面，否则只是查看
  if (canEditProduct.value) {
    router.push(`/product/edit/${product.id}`)
  }
}

const editProduct = (product) => {
  router.push(`/product/edit/${product.id}`)
}

const deleteProduct = async (product) => {
  if (!canDeleteProduct.value) {
    showToast('您没有删除商品的权限')
    return
  }
  
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要删除商品"${product.name}"吗？`,
    })
    
    // 删除商品
    const result = await productStore.deleteProduct(product.id)
    
    if (result !== false) {
      showToast({
        type: 'success',
        message: '删除成功'
      })
    } else {
      showToast({
        type: 'fail',
        message: '删除失败'
      })
    }
  } catch (error) {
    // 用户取消删除
  }
}
</script>

<style scoped>
.products-page {
  background-color: #f7f8fa;
}

.search-wrapper {
  background: white;
  padding: 8px 0;
}

.filter-tabs {
  background: white;
  margin-bottom: 12px;
}

.product-card {
  background: white;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  display: flex;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(91, 143, 249, 0.08);
  cursor: pointer;
  transition: transform 0.2s;
}

.product-card:active {
  transform: scale(0.98);
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

.stock-warning-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  background: #ff4d4f;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
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
  font-size: 16px;
  font-weight: 600;
  color: #ff4d4f;
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
}

.stock-info {
  font-size: 13px;
}

.stock-label {
  color: #969799;
  margin-right: 4px;
}

.stock-value {
  color: #07c160;
  font-weight: 600;
}

.stock-value.low-stock {
  color: #ff4d4f;
}

.product-actions {
  display: flex;
  gap: 8px;
}
</style>
