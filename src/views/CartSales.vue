<template>
  <div class="cart-sales-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="收银台"
      left-arrow
      @click-left="router.back()"
    >
      <template #right>
        <van-icon name="delete-o" size="22" @click="clearCart" v-if="cart.length > 0" />
      </template>
    </van-nav-bar>

    <div class="content-wrapper">
      <!-- 搜索商品 -->
      <div class="card search-card">
        <van-search
          v-model="searchKeyword"
          placeholder="搜索货号、颜色、尺码"
          @search="onSearch"
          @clear="onSearch"
          show-action
        >
          <template #action>
            <van-button size="small" type="primary" @click="showProductList = true">
              选择商品
            </van-button>
          </template>
        </van-search>
        
        <!-- 搜索结果 -->
        <div v-if="searchResults.length > 0" class="search-results">
          <div 
            v-for="product in searchResults" 
            :key="product.id"
            class="search-item"
            @click="addToCart(product)"
          >
            <div class="search-item-info">
              <div class="search-item-name">{{ product.name }}</div>
              <div class="search-item-detail">
                {{ product.size }}码 | 库存: {{ product.stock }}
              </div>
            </div>
            <div class="search-item-price">¥{{ product.salePrice }}</div>
          </div>
        </div>
      </div>

      <!-- 🆕 热销商品快捷选择 -->
      <div class="card quick-products-card" v-if="hotProducts.length > 0 && cart.length === 0">
        <div class="section-title">🔥 热销商品</div>
        <div class="quick-products-grid">
          <div 
            v-for="product in hotProducts" 
            :key="product.id"
            class="quick-product-item"
            @click="quickAddToCart(product)"
            :class="{ 'out-of-stock': product.stock === 0 }"
          >
            <div class="quick-product-name">{{ product.name }}</div>
            <div class="quick-product-size">{{ product.size }}码</div>
            <div class="quick-product-price">¥{{ product.salePrice }}</div>
            <div class="quick-product-stock" :class="{ 'low-stock': product.stock <= product.minStock }">
              库存{{ product.stock }}
            </div>
          </div>
        </div>
      </div>

      <!-- 购物车列表 -->
      <div class="card cart-card">
        <div class="section-title">🛒 购物车</div>
        
        <div v-if="cart.length === 0" class="empty-cart">
          <van-icon name="shopping-cart-o" size="64" color="#4A90E2" />
          <p class="empty-title">购物车是空的</p>
          <p class="empty-tip">搜索商品添加到购物车开始销售</p>
        </div>

        <div v-else class="cart-list">
          <div 
            v-for="(item, index) in cart" 
            :key="item.productId"
            class="cart-item"
          >
            <div class="cart-item-info">
              <div class="cart-item-name">{{ item.productName }}</div>
              <div class="cart-item-detail">{{ item.size }}码</div>
              <div class="cart-item-price">
                <span class="unit-price">¥{{ item.salePrice }}</span>
                <span class="item-total">小计: ¥{{ (item.salePrice * item.quantity).toFixed(2) }}</span>
              </div>
            </div>
            <div class="cart-item-actions">
              <van-stepper 
                v-model="item.quantity" 
                :min="1" 
                :max="item.stock"
                theme="round"
                button-size="22"
                :disable-input="false"
                @change="updateCartItem(index)"
                @blur="validateQuantity(index)"
              />
              <van-icon 
                name="delete-o" 
                size="20" 
                color="#ee0a24"
                @click="removeFromCart(index)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 会员选择 -->
      <div class="card member-card">
        <div class="section-title">👤 会员信息</div>
        <van-field
          v-model="memberPhone"
          label="会员手机"
          placeholder="输入手机号查询会员"
          type="tel"
          maxlength="11"
          clearable
          @blur="searchMember"
        >
          <template #button>
            <van-button size="small" type="primary" @click="searchMember">
              查询
            </van-button>
          </template>
        </van-field>
        
        <div v-if="selectedMember" class="member-info">
          <div class="member-row">
            <span class="member-label">会员姓名:</span>
            <span class="member-value">{{ selectedMember.name || '未设置' }}</span>
          </div>
          <div class="member-row">
            <span class="member-label">账户余额:</span>
            <span class="member-value balance">¥{{ selectedMember.balance.toFixed(2) }}</span>
          </div>
          <div class="member-row">
            <span class="member-label">会员折扣:</span>
            <span class="member-value discount">{{ (selectedMember.discount * 10).toFixed(1) }}折</span>
          </div>
        </div>
      </div>

      <!-- 销售员选择 -->
      <div class="card">
        <van-field
          v-model="salesperson"
          label="销售员"
          placeholder="请选择销售员"
          readonly
          is-link
          @click="showSalespersonPicker = true"
        />
      </div>

      <!-- 支付方式 -->
      <div class="card">
        <div class="section-title">💳 支付方式</div>
        <van-radio-group v-model="paymentMethod" direction="horizontal" class="payment-group">
          <van-radio name="现金">现金</van-radio>
          <van-radio name="微信">微信</van-radio>
          <van-radio name="支付宝">支付宝</van-radio>
          <van-radio name="会员余额" :disabled="!selectedMember || selectedMember.balance < actualAmount">
            会员余额
          </van-radio>
        </van-radio-group>
      </div>

      <!-- 备注 -->
      <div class="card">
        <van-field
          v-model="remark"
          label="备注"
          type="textarea"
          placeholder="订单备注（可选）"
          rows="2"
          autosize
        />
      </div>
    </div>

    <!-- 底部结算栏 -->
    <div class="checkout-bar">
      <div class="checkout-info">
        <div class="checkout-row">
          <span>商品数量:</span>
          <span>{{ totalQuantity }}件</span>
        </div>
        <div class="checkout-row">
          <span>商品总额:</span>
          <span>¥{{ totalAmount.toFixed(2) }}</span>
        </div>
        <div class="checkout-row" v-if="selectedMember && selectedMember.discount < 1">
          <span>会员折扣:</span>
          <span class="discount-text">-¥{{ discountAmount.toFixed(2) }}</span>
        </div>
        <div class="checkout-row total">
          <span>应付金额:</span>
          <span class="total-price">¥{{ actualAmount.toFixed(2) }}</span>
        </div>
      </div>
      <van-button 
        type="primary" 
        size="large" 
        :disabled="cart.length === 0"
        @click="handleCheckout"
        class="checkout-btn"
      >
        结算 ({{ cart.length }})
      </van-button>
    </div>

    <!-- 商品选择弹窗 -->
    <van-popup 
      v-model:show="showProductList" 
      position="bottom" 
      :style="{ height: '70%' }"
      round
    >
      <div class="product-popup">
        <div class="popup-header">
          <span class="popup-title">选择商品</span>
          <van-icon name="cross" size="20" @click="showProductList = false" />
        </div>
        <van-search
          v-model="popupSearchKeyword"
          placeholder="搜索商品"
          @search="onPopupSearch"
          @clear="onPopupSearch"
        />
        <div class="product-list">
          <div 
            v-for="product in filteredProducts" 
            :key="product.id"
            class="product-item"
            :class="{ 'out-of-stock': product.stock <= 0 }"
            @click="product.stock > 0 && addToCart(product)"
          >
            <div class="product-item-info">
              <div class="product-item-name">{{ product.name }}</div>
              <div class="product-item-detail">
                {{ product.size }}码 | 库存: {{ product.stock }}
              </div>
            </div>
            <div class="product-item-right">
              <div class="product-item-price">¥{{ product.salePrice }}</div>
              <van-tag v-if="product.stock <= 0" type="danger" size="small">缺货</van-tag>
              <van-tag v-else-if="product.stock <= 3" type="warning" size="small">库存紧张</van-tag>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 销售员选择器 -->
    <van-popup 
      v-model:show="showSalespersonPicker" 
      position="bottom" 
      round
    >
      <div class="popup-header">
        <span></span>
        <span class="popup-title">选择销售员</span>
        <van-icon name="cross" class="popup-close" @click="showSalespersonPicker = false" />
      </div>
      <van-picker
        :columns="salespersonColumns"
        @confirm="onSalespersonConfirm"
        @cancel="showSalespersonPicker = false"
      />
    </van-popup>

    <!-- 收款确认弹窗 -->
    <van-dialog
      v-model:show="showPaymentDialog"
      title="确认收款"
      show-cancel-button
      :before-close="handlePayment"
    >
      <div class="payment-dialog">
        <div class="payment-summary">
          <div class="payment-row">
            <span>应付金额:</span>
            <span class="payment-amount">¥{{ actualAmount.toFixed(2) }}</span>
          </div>
        </div>
        <van-field
          v-if="paymentMethod === '现金'"
          v-model="receivedAmount"
          label="收款金额"
          type="number"
          placeholder="请输入收款金额"
        >
          <template #button>元</template>
        </van-field>
        <div v-if="paymentMethod === '现金' && receivedAmount" class="change-info">
          <span>找零:</span>
          <span class="change-amount">¥{{ changeAmount.toFixed(2) }}</span>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'
import { useProductStore } from '@/stores/product'
import { useSalesStore } from '@/stores/sales'
import { useMemberStore } from '@/stores/member'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const productStore = useProductStore()
const salesStore = useSalesStore()
const memberStore = useMemberStore()
const userStore = useUserStore()

// 搜索相关
const searchKeyword = ref('')
const searchResults = ref([])
const popupSearchKeyword = ref('')
const showProductList = ref(false)

// 购物车
const cart = ref([])

// 会员相关
const memberPhone = ref('')
const selectedMember = ref(null)

// 销售员
const salesperson = ref('')
const showSalespersonPicker = ref(false)

// 支付相关
const paymentMethod = ref('现金')
const remark = ref('')
const showPaymentDialog = ref(false)
const receivedAmount = ref('')

// 销售员列表
const salespersonColumns = computed(() => {
  return userStore.activeUsers.map(u => ({
    text: u.name,
    value: u.name
  }))
})

// 过滤后的商品列表
const filteredProducts = computed(() => {
  let products = productStore.getAllProducts
  if (popupSearchKeyword.value) {
    const keyword = popupSearchKeyword.value.toLowerCase()
    products = products.filter(p => 
      p.name.toLowerCase().includes(keyword) ||
      (p.code && p.code.toLowerCase().includes(keyword)) ||
      (p.size && p.size.toString().includes(keyword))
    )
  }
  return products
})

// 计算属性
const totalQuantity = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.quantity, 0)
})

const totalAmount = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.salePrice * item.quantity, 0)
})

const discountAmount = computed(() => {
  if (!selectedMember.value || selectedMember.value.discount >= 1) return 0
  return totalAmount.value * (1 - selectedMember.value.discount)
})

const actualAmount = computed(() => {
  return totalAmount.value - discountAmount.value
})

const changeAmount = computed(() => {
  const received = parseFloat(receivedAmount.value) || 0
  return Math.max(0, received - actualAmount.value)
})

// 🆕 热销商品（根据销售记录统计）
const hotProducts = computed(() => {
  // 统计每个商品的销售次数
  const productSales = {}
  salesStore.sales.forEach(sale => {
    if (sale.products && Array.isArray(sale.products)) {
      sale.products.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = 0
        }
        productSales[item.productId] += item.quantity
      })
    }
  })
  
  // 获取销量前6的商品
  const topProductIds = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id]) => id)
  
  return topProductIds
    .map(id => productStore.getProductById(id))
    .filter(p => p && p.stock > 0) // 只显示有库存的商品
})

// 搜索商品
const onSearch = () => {
  if (!searchKeyword.value) {
    searchResults.value = []
    return
  }
  const keyword = searchKeyword.value.toLowerCase()
  searchResults.value = productStore.getAllProducts
    .filter(p => 
      p.name.toLowerCase().includes(keyword) ||
      (p.code && p.code.toLowerCase().includes(keyword)) ||
      (p.size && p.size.toString().includes(keyword))
    )
    .slice(0, 5)
}

const onPopupSearch = () => {
  // 搜索逻辑通过 computed 处理
}

// 添加到购物车
const addToCart = (product) => {
  if (product.stock <= 0) {
    showToast('该商品已售罄')
    return
  }

  const existingIndex = cart.value.findIndex(item => item.productId === product.id)
  
  if (existingIndex !== -1) {
    // 已存在，增加数量
    if (cart.value[existingIndex].quantity >= product.stock) {
      showToast('库存不足')
      return
    }
    cart.value[existingIndex].quantity++
  } else {
    // 新增
    cart.value.push({
      productId: product.id,
      productName: product.name,
      size: product.size,
      salePrice: product.salePrice,
      costPrice: product.costPrice,
      quantity: 1,
      stock: product.stock
    })
  }

  // 清空搜索
  searchKeyword.value = ''
  searchResults.value = []
  showProductList.value = false
  
  showToast({
    message: '已添加到购物车',
    icon: 'cart-o'
  })
}

// 🆕 快捷添加到购物车
const quickAddToCart = (product) => {
  addToCart(product)
}

// 更新购物车商品
const updateCartItem = (index) => {
  // 数量变化时自动更新（通过 v-model 绑定）
}

// 验证数量输入（防止负数、0、超出库存等）
const validateQuantity = (index) => {
  const item = cart.value[index]
  if (!item) return
  
  // 确保数量是正整数
  if (!item.quantity || item.quantity < 1) {
    item.quantity = 1
    showToast('数量不能小于1')
  } else if (item.quantity > item.stock) {
    item.quantity = item.stock
    showToast(`库存不足，最多只能购买${item.stock}件`)
  } else if (!Number.isInteger(item.quantity)) {
    item.quantity = Math.floor(item.quantity)
    showToast('数量必须为整数')
  }
}

// 从购物车移除
const removeFromCart = (index) => {
  cart.value.splice(index, 1)
}

// 清空购物车
const clearCart = () => {
  showConfirmDialog({
    title: '清空购物车',
    message: '确定要清空购物车吗？'
  }).then(() => {
    cart.value = []
    showToast('购物车已清空')
  }).catch(() => {})
}

// 搜索会员
const searchMember = () => {
  if (!memberPhone.value || memberPhone.value.length < 11) {
    selectedMember.value = null
    return
  }
  
  const member = memberStore.getMemberByPhone(memberPhone.value)
  if (member) {
    selectedMember.value = member
    showToast({
      message: `欢迎会员 ${member.name || member.phone}`,
      icon: 'user-o'
    })
  } else {
    selectedMember.value = null
    showToast('未找到该会员')
  }
}

// 选择销售员
const onSalespersonConfirm = ({ selectedOptions }) => {
  salesperson.value = selectedOptions[0].text
  showSalespersonPicker.value = false
}

// 结算
const handleCheckout = () => {
  if (cart.value.length === 0) {
    showToast('购物车是空的')
    return
  }

  if (!salesperson.value) {
    showToast('请选择销售员')
    return
  }

  // 检查会员余额支付
  if (paymentMethod.value === '会员余额') {
    if (!selectedMember.value) {
      showToast('请先选择会员')
      return
    }
    if (selectedMember.value.balance < actualAmount.value) {
      showToast('会员余额不足')
      return
    }
  }

  // 显示收款确认
  receivedAmount.value = ''
  showPaymentDialog.value = true
}

// 处理支付
const handlePayment = (action) => {
  return new Promise((resolve) => {
    if (action === 'confirm') {
      // 🆕 1. 检查购物车中的商品是否都存在
      const invalidItems = []
      for (const item of cart.value) {
        const product = productStore.getProductById(item.productId)
        if (!product) {
          invalidItems.push(item)
        } else if (product.stock < item.quantity) {
          showToast(`${item.productName} 库存不足，当前库存：${product.stock}`)
          resolve(false)
          return
        }
      }

      // 如果有不存在的商品，自动移除
      if (invalidItems.length > 0) {
        for (const item of invalidItems) {
          const index = cart.value.findIndex(c => c.productId === item.productId)
          if (index !== -1) {
            cart.value.splice(index, 1)
          }
        }
        
        showDialog({
          title: '商品已下架',
          message: `以下商品已不存在，已自动移除：\n${invalidItems.map(i => i.productName).join('、')}`,
          confirmButtonText: '知道了'
        })
        resolve(false)
        return
      }
      
      // 现金支付需要检查收款金额
      if (paymentMethod.value === '现金') {
        const received = parseFloat(receivedAmount.value) || 0
        if (received < actualAmount.value) {
          showToast('收款金额不足')
          resolve(false)
          return
        }
      }

      // 构建销售数据
      const saleData = {
        products: cart.value.map(item => ({
          productId: item.productId,
          productName: item.productName,
          size: item.size,
          salePrice: item.salePrice,
          costPrice: item.costPrice,
          quantity: item.quantity
        })),
        salesperson: salesperson.value,
        remark: remark.value,
        discount: selectedMember.value?.discount || 1,
        receivedAmount: parseFloat(receivedAmount.value) || actualAmount.value,
        changeAmount: changeAmount.value,
        paymentMethod: paymentMethod.value,
        memberId: selectedMember.value?.id || null
      }

      // 提交销售
      const result = salesStore.addSale(saleData)
      
      if (result.success) {
        // 如果是会员余额支付，扣减余额
        if (paymentMethod.value === '会员余额' && selectedMember.value) {
          memberStore.consumeMember(selectedMember.value.id, actualAmount.value)
        }

        showSuccessToast({
          message: '收款成功',
          duration: 2000
        })

        // 清空购物车和表单
        cart.value = []
        memberPhone.value = ''
        selectedMember.value = null
        remark.value = ''
        receivedAmount.value = ''

        resolve(true)
      } else {
        showToast(result.message || '销售失败')
        resolve(false)
      }
    } else {
      resolve(true)
    }
  })
}

onMounted(() => {
  productStore.loadProducts()
  memberStore.loadMembers()
  userStore.loadUsers()
  
  // 默认选择当前登录用户作为销售员
  if (userStore.currentUserName) {
    salesperson.value = userStore.currentUserName
  }
})
</script>

<style scoped>
.cart-sales-page {
  background-color: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 140px;
}

.content-wrapper {
  padding: 12px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(91, 143, 249, 0.08);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 12px;
}

/* 搜索卡片 */
.search-card {
  padding: 8px;
}

.search-card :deep(.van-search) {
  padding: 0;
}

.search-results {
  margin-top: 8px;
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
}

.search-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(91, 143, 249, 0.08);
  border: 1px solid #e5e7eb;
}

.search-item:active {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(91, 143, 249, 0.12);
}

.search-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
}

.search-item-detail {
  font-size: 12px;
  color: #969799;
  margin-top: 4px;
}

.search-item-price {
  font-size: 16px;
  font-weight: 600;
  color: #ee0a24;
}

/* 🆕 热销商品快捷选择 */
.quick-products-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.quick-product-item {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 12px 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.quick-product-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.quick-product-item:active::before {
  opacity: 1;
}

.quick-product-item:active {
  transform: scale(0.95);
}

.quick-product-item.out-of-stock {
  background: linear-gradient(135deg, #bbb 0%, #999 100%);
  opacity: 0.6;
  cursor: not-allowed;
}

.quick-product-name {
  font-size: 13px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-product-size {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 6px;
}

.quick-product-price {
  font-size: 15px;
  font-weight: 700;
  color: #FFD700;
  margin-bottom: 4px;
}

.quick-product-stock {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: inline-block;
}

.quick-product-stock.low-stock {
  background: rgba(255, 165, 0, 0.3);
  color: #FFD700;
}

/* 购物车 */
.empty-cart {
  text-align: center;
  padding: 60px 20px;
}

.empty-title {
  font-size: 16px;
  color: #646566;
  margin: 16px 0 8px;
  font-weight: 500;
}

.empty-tip {
  font-size: 14px;
  color: #969799;
  margin: 0;
}

.cart-list {
  margin-top: 12px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(91, 143, 249, 0.08);
  border: 1px solid #e5e7eb;
}

.cart-item:last-child {
  margin-bottom: 0;
}

.cart-item-info {
  flex: 1;
}

.cart-item-name {
  font-size: 15px;
  font-weight: 500;
  color: #323233;
}

.cart-item-detail {
  font-size: 12px;
  color: #969799;
  margin-top: 4px;
}

.cart-item-price {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.unit-price {
  font-size: 14px;
  color: #646566;
}

.item-total {
  font-size: 14px;
  font-weight: 600;
  color: #ee0a24;
}

.cart-item-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 会员信息 */
.member-info {
  margin-top: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.member-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.member-label {
  font-size: 13px;
  opacity: 0.9;
}

.member-value {
  font-size: 14px;
  font-weight: 500;
}

.member-value.balance {
  font-size: 18px;
  font-weight: 600;
}

.member-value.discount {
  color: #ffd700;
}

/* 支付方式 */
.payment-group {
  padding: 12px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.payment-group :deep(.van-radio) {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
}

.payment-group :deep(.van-radio__icon) {
  width: 16px !important;
  height: 16px !important;
  font-size: 10px !important;
  line-height: 1;
  flex-shrink: 0;
}

.payment-group :deep(.van-radio__icon .van-icon) {
  font-size: 10px !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.payment-group :deep(.van-radio__label) {
  margin-left: 6px;
  white-space: nowrap;
  font-size: 14px;
}

/* 底部结算栏 */
.checkout-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 12px 16px;
  box-shadow: 0 -2px 12px rgba(91, 143, 249, 0.12);
  display: flex;
  align-items: flex-end;
  gap: 16px;
  z-index: 100;
}

.checkout-info {
  flex: 1;
}

.checkout-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #646566;
  margin-bottom: 4px;
}

.checkout-row.total {
  font-size: 14px;
  color: #323233;
  font-weight: 500;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.total-price {
  font-size: 20px;
  font-weight: 600;
  color: #ee0a24;
}

.discount-text {
  color: #07c160;
}

.checkout-btn {
  width: 120px;
  height: 44px;
  border-radius: 22px;
}

/* 商品选择弹窗 */
.product-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
}

.product-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(91, 143, 249, 0.08);
  border: 1px solid #e5e7eb;
}

.product-item:active {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(91, 143, 249, 0.12);
}

.product-item.out-of-stock {
  opacity: 0.5;
  cursor: not-allowed;
}

.product-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
}

.product-item-detail {
  font-size: 12px;
  color: #969799;
  margin-top: 4px;
}

.product-item-right {
  text-align: right;
}

.product-item-price {
  font-size: 16px;
  font-weight: 600;
  color: #ee0a24;
  margin-bottom: 4px;
}

/* 支付确认弹窗 */
.payment-dialog {
  padding: 16px;
}

.payment-summary {
  background: #f0f9ff;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-amount {
  font-size: 24px;
  font-weight: 600;
  color: #ee0a24;
}

.change-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #e8f7e8;
  border-radius: 8px;
  margin-top: 12px;
}

.change-amount {
  font-size: 18px;
  font-weight: 600;
  color: #07c160;
}

/* 弹窗头部 */
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.popup-close {
  font-size: 20px;
  color: #969799;
  cursor: pointer;
  padding: 4px;
}

.popup-close:active {
  opacity: 0.7;
}
</style>
