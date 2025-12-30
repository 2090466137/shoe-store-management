<template>
  <div class="cart-sales-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="收银台"
      left-arrow
      @click-left="handleBack"
    >
      <template #right>
        <van-icon name="delete-o" @click="clearCart" v-if="cart.length > 0" />
      </template>
    </van-nav-bar>

    <div class="content-wrapper">
      <!-- 常用商品快捷选择 -->
      <div class="quick-products" v-if="quickProducts.length > 0">
        <div class="quick-header">
          <span class="quick-title">🔥 {{ quickTabActive === 'hot' ? '热销商品' : '最近销售' }}</span>
          <van-tabs v-model:active="quickTabActive" shrink>
            <van-tab title="热销" name="hot"></van-tab>
            <van-tab title="最近" name="recent"></van-tab>
          </van-tabs>
        </div>
        <div class="quick-list">
          <div 
            v-for="product in quickProducts" 
            :key="product.id"
            class="quick-item"
            @click="addToCart(product)"
          >
            <div class="quick-item-name">{{ product.name }}</div>
            <div class="quick-item-info">
              <span class="quick-item-size">{{ product.size }}码</span>
              <span class="quick-item-stock">库存{{ product.stock }}</span>
            </div>
            <div class="quick-item-price">¥{{ product.salePrice }}</div>
          </div>
        </div>
      </div>

      <!-- 购物车列表 -->
      <div class="cart-section">
        <div v-if="cart.length === 0" class="empty-cart">
          <div class="empty-icon">🛒</div>
          <div class="empty-text">购物车是空的</div>
          <div class="empty-hint">点击下方添加商品</div>
        </div>

        <div v-else class="cart-list">
          <div 
            v-for="(item, index) in cart" 
            :key="index"
            class="cart-item"
          >
            <div class="item-info">
              <div class="item-name">{{ item.productName }}</div>
              <div class="item-spec">{{ item.brand }} | {{ item.size }}码</div>
              <div class="item-price-row">
                <span class="original-price" v-if="item.discount < 1">
                  ¥{{ item.originalPrice }}
                </span>
                <span class="current-price">¥{{ item.salePrice }}</span>
                <span class="discount-tag" v-if="item.discount < 1">
                  {{ (item.discount * 10).toFixed(1) }}折
                </span>
              </div>
            </div>
            
            <div class="item-actions">
              <van-stepper 
                v-model="item.quantity" 
                :min="1"
                :max="item.maxStock"
                @change="updateItemTotal(index)"
              />
              <div class="item-total">¥{{ item.total.toFixed(2) }}</div>
              <van-icon 
                name="delete-o" 
                class="delete-icon"
                @click="removeItem(index)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 添加商品 -->
      <div class="add-product-section">
        <van-button 
          type="primary" 
          block 
          icon="plus"
          @click="showProductPicker = true"
        >
          添加商品
        </van-button>
      </div>

      <!-- 结算信息 -->
      <div class="checkout-section" v-if="cart.length > 0">
        <div class="card">
          <div class="checkout-row">
            <span class="label">商品数量</span>
            <span class="value">{{ totalQuantity }} 件</span>
          </div>
          
          <div class="checkout-row">
            <span class="label">原价合计</span>
            <span class="value">¥{{ originalTotal.toFixed(2) }}</span>
          </div>
          
          <div class="checkout-row discount-row" v-if="totalDiscount > 0">
            <span class="label">优惠金额</span>
            <span class="value discount">-¥{{ totalDiscount.toFixed(2) }}</span>
          </div>

          <!-- 整单折扣 -->
          <div class="checkout-row">
            <span class="label">整单折扣</span>
            <div class="discount-buttons">
              <van-button 
                size="small" 
                :type="orderDiscount === 1 ? 'default' : 'primary'"
                @click="orderDiscount = 1"
              >
                无折扣
              </van-button>
              <van-button 
                size="small" 
                :type="orderDiscount === 0.9 ? 'primary' : 'default'"
                @click="orderDiscount = 0.9"
              >
                9折
              </van-button>
              <van-button 
                size="small" 
                :type="orderDiscount === 0.8 ? 'primary' : 'default'"
                @click="orderDiscount = 0.8"
              >
                8折
              </van-button>
              <van-button 
                size="small" 
                @click="showCustomDiscount = true"
              >
                自定义
              </van-button>
            </div>
          </div>

          <van-divider />

          <!-- 应收金额 -->
          <div class="checkout-row total-row">
            <span class="label">应收金额</span>
            <span class="value total">¥{{ finalTotal.toFixed(2) }}</span>
          </div>

          <!-- 实收金额 -->
          <div class="checkout-row" v-if="paymentMethod === 'cash'">
            <span class="label">实收金额</span>
            <van-field
              v-model="receivedAmount"
              type="number"
              placeholder="请输入实收金额"
              class="received-input"
            />
          </div>

          <!-- 快捷金额 -->
          <div class="quick-amount" v-if="paymentMethod === 'cash'">
            <van-button 
              size="small" 
              v-for="amount in quickAmounts" 
              :key="amount"
              @click="receivedAmount = amount.toString()"
            >
              {{ amount }}
            </van-button>
          </div>

          <!-- 找零 -->
          <div class="checkout-row change-row" v-if="paymentMethod === 'cash' && changeAmount !== null">
            <span class="label">找零</span>
            <span class="value change" :class="{ negative: changeAmount < 0 }">
              {{ changeAmount >= 0 ? '¥' : '-¥' }}{{ Math.abs(changeAmount).toFixed(2) }}
            </span>
          </div>

          <!-- 会员选择 -->
          <div class="checkout-row">
            <span class="label">会员</span>
            <van-field
              v-model="selectedMemberText"
              placeholder="选择会员（可选）"
              readonly
              is-link
              @click="showMemberPicker = true"
              class="member-input"
            />
            <van-icon 
              v-if="selectedMember" 
              name="cross" 
              class="clear-member"
              @click="clearMember"
            />
          </div>

          <!-- 会员信息 -->
          <div class="member-info-card" v-if="selectedMember">
            <div class="member-info-row">
              <span>会员：{{ selectedMember.name || selectedMember.phone }}</span>
              <span class="member-balance">余额：¥{{ selectedMember.balance.toFixed(2) }}</span>
            </div>
            <div class="member-info-row" v-if="selectedMember.discount < 1">
              <span>会员折扣：{{ (selectedMember.discount * 10).toFixed(1) }}折</span>
            </div>
            <div class="payment-method-row">
              <span class="label">支付方式：</span>
              <van-radio-group v-model="paymentMethod" direction="horizontal">
                <van-radio name="cash">现金</van-radio>
                <van-radio name="member" :disabled="!canUseMemberBalance">会员余额</van-radio>
              </van-radio-group>
            </div>
          </div>

          <!-- 销售员 -->
          <div class="checkout-row">
            <span class="label">销售员</span>
            <van-field
              v-model="salesperson"
              placeholder="选择销售员"
              readonly
              is-link
              @click="showSalespersonPicker = true"
              class="salesperson-input"
            />
          </div>

          <!-- 备注 -->
          <div class="checkout-row">
            <van-field
              v-model="remark"
              placeholder="备注信息（选填）"
              type="textarea"
              rows="2"
              maxlength="100"
              show-word-limit
            />
          </div>
        </div>

        <!-- 结算按钮 -->
        <van-button 
          type="primary" 
          size="large" 
          block
          class="checkout-button"
          @click="handleCheckout"
        >
          确认收款
        </van-button>
      </div>
    </div>

    <!-- 商品选择器 -->
    <van-popup v-model:show="showProductPicker" position="bottom" :style="{ height: '70%' }">
      <div class="product-picker">
        <div class="picker-header">
          <van-search
            v-model="searchKeyword"
            placeholder="搜索商品"
            @search="onSearch"
          />
        </div>
        <div class="picker-content">
          <div 
            v-for="product in filteredProducts" 
            :key="product.id"
            class="picker-item"
            @click="addToCart(product)"
          >
            <div class="picker-item-image">
              <img :src="product.image || 'https://via.placeholder.com/60'" :alt="product.name" />
            </div>
            <div class="picker-item-info">
              <div class="picker-item-name">{{ product.name }}</div>
              <div class="picker-item-spec">
                {{ product.brand }} | {{ product.size }}码 | 库存: {{ product.stock }}
              </div>
            </div>
            <div class="picker-item-price">¥{{ product.salePrice }}</div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 会员选择器 -->
    <van-popup v-model:show="showMemberPicker" position="bottom" :style="{ height: '60%' }">
      <div class="member-picker">
        <div class="picker-header">
          <van-search
            v-model="memberSearchKeyword"
            placeholder="搜索会员手机号或姓名"
            @search="onMemberSearch"
          />
        </div>
        <div class="picker-content">
          <div 
            v-for="member in filteredMembers" 
            :key="member.id"
            class="picker-item"
            @click="selectMember(member)"
          >
            <div class="picker-item-info">
              <div class="picker-item-name">{{ member.name || '未设置姓名' }}</div>
              <div class="picker-item-spec">{{ member.phone }}</div>
            </div>
            <div class="picker-item-price">
              <div>余额: ¥{{ member.balance.toFixed(2) }}</div>
              <div v-if="member.discount < 1" class="member-discount">
                {{ (member.discount * 10).toFixed(1) }}折
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 销售员选择器 -->
    <van-popup v-model:show="showSalespersonPicker" position="bottom">
      <van-picker
        :columns="salespersons"
        @confirm="onSalespersonConfirm"
        @cancel="showSalespersonPicker = false"
      />
    </van-popup>

    <!-- 自定义折扣 -->
    <van-dialog
      v-model:show="showCustomDiscount"
      title="自定义折扣"
      show-cancel-button
      @confirm="applyCustomDiscount"
    >
      <van-field
        v-model="customDiscountValue"
        type="number"
        placeholder="输入折扣（如：8.5 表示8.5折）"
        :rules="[{ pattern: /^([1-9]|10)(\.\d)?$/, message: '请输入1-10之间的数字' }]"
      />
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { useSalesStore } from '@/stores/sales'
import { useMemberStore } from '@/stores/member'
import { showToast, showDialog, showConfirmDialog } from 'vant'
import { smartSearch } from '@/utils/search'

const router = useRouter()
const productStore = useProductStore()
const salesStore = useSalesStore()
const memberStore = useMemberStore()

// 购物车
const cart = ref([])
const searchKeyword = ref('')
const showProductPicker = ref(false)
const showSalespersonPicker = ref(false)
const showCustomDiscount = ref(false)
const quickTabActive = ref('hot')

// 收银信息
const receivedAmount = ref('')
const salesperson = ref('老板')
const remark = ref('')
const orderDiscount = ref(1) // 整单折扣
const customDiscountValue = ref('')

// 会员相关
const selectedMember = ref(null)
const showMemberPicker = ref(false)
const paymentMethod = ref('cash') // 'cash' 或 'member'
const memberSearchKeyword = ref('')

// 销售员列表
const salespersons = ['老板', '老婆', '小王']

// 快捷金额
const quickAmounts = computed(() => {
  const total = finalTotal.value
  return [
    Math.ceil(total / 100) * 100, // 向上取整到百
    Math.ceil(total / 50) * 50,   // 向上取整到50
    Math.ceil(total / 10) * 10,   // 向上取整到10
    Math.ceil(total)               // 向上取整
  ].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b)
})

// 快捷商品列表
const quickProducts = computed(() => {
  if (quickTabActive.value === 'hot') {
    // 热销商品：根据销售记录统计
    const productSales = {}
    salesStore.sales.forEach(sale => {
      // 处理多商品订单
      if (sale.products && Array.isArray(sale.products)) {
        sale.products.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = 0
          }
          productSales[item.productId] += item.quantity
        })
      } else if (sale.productId) {
        // 单商品订单
        if (!productSales[sale.productId]) {
          productSales[sale.productId] = 0
        }
        productSales[sale.productId] += sale.quantity || 0
      }
    })
    
    // 获取销量前6的商品
    const topProductIds = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => id)
    
    return topProductIds
      .map(id => productStore.getProductById(id))
      .filter(p => p && p.stock > 0)
  } else {
    // 最近销售：最近6条销售记录的商品
    const recentProductIds = []
    const seen = new Set()
    
    for (const sale of salesStore.sales) {
      // 处理多商品订单
      if (sale.products && Array.isArray(sale.products)) {
        sale.products.forEach(item => {
          if (!seen.has(item.productId) && recentProductIds.length < 6) {
            const product = productStore.getProductById(item.productId)
            if (product && product.stock > 0) {
              recentProductIds.push(item.productId)
              seen.add(item.productId)
            }
          }
        })
      } else if (sale.productId) {
        // 单商品订单
        if (!seen.has(sale.productId) && recentProductIds.length < 6) {
          const product = productStore.getProductById(sale.productId)
          if (product && product.stock > 0) {
            recentProductIds.push(sale.productId)
            seen.add(sale.productId)
          }
        }
      }
      if (recentProductIds.length >= 6) break
    }
    
    return recentProductIds
      .map(id => productStore.getProductById(id))
      .filter(p => p)
  }
})

// 筛选商品
const filteredProducts = computed(() => {
  let products = productStore.getAllProducts.filter(p => p.stock > 0)
  
  // 使用智能搜索
  if (searchKeyword.value) {
    products = smartSearch(products, searchKeyword.value)
  }
  
  return products
})

// 计算总数量
const totalQuantity = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.quantity, 0)
})

// 计算原价合计
const originalTotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0)
})

// 计算优惠金额
const totalDiscount = computed(() => {
  const itemDiscount = cart.value.reduce((sum, item) => {
    return sum + ((item.originalPrice - item.salePrice) * item.quantity)
  }, 0)
  
  const orderDiscountAmount = originalTotal.value * (1 - orderDiscount.value)
  
  return itemDiscount + orderDiscountAmount
})

// 计算最终金额（应用会员折扣）
const finalTotal = computed(() => {
  const subtotal = cart.value.reduce((sum, item) => sum + item.total, 0)
  let total = subtotal * orderDiscount.value
  
  // 如果选择了会员，应用会员折扣
  if (selectedMember.value && selectedMember.value.discount < 1) {
    total = total * selectedMember.value.discount
  }
  
  return total
})

// 会员显示文本
const selectedMemberText = computed(() => {
  if (!selectedMember.value) return ''
  return `${selectedMember.value.name || selectedMember.value.phone} (余额: ¥${selectedMember.value.balance.toFixed(2)})`
})

// 是否可以使用会员余额支付
const canUseMemberBalance = computed(() => {
  if (!selectedMember.value) return false
  return selectedMember.value.balance >= finalTotal.value
})

// 计算找零
const changeAmount = computed(() => {
  if (!receivedAmount.value || paymentMethod.value === 'member') return null
  return parseFloat(receivedAmount.value) - finalTotal.value
})

// 添加到购物车
const addToCart = (product) => {
  // 检查是否已在购物车
  const existingItem = cart.value.find(item => item.productId === product.id)
  
  if (existingItem) {
    if (existingItem.quantity < product.stock) {
      existingItem.quantity++
      updateItemTotal(cart.value.indexOf(existingItem))
      showToast('数量+1')
    } else {
      showToast('库存不足')
    }
  } else {
    cart.value.push({
      productId: product.id,
      productName: product.name,
      brand: product.brand || '',
      size: product.size,
      costPrice: product.costPrice,
      originalPrice: product.salePrice,
      salePrice: product.salePrice,
      discount: 1,
      quantity: 1,
      maxStock: product.stock,
      total: product.salePrice
    })
    showToast('已添加')
  }
  
  showProductPicker.value = false
  searchKeyword.value = ''
}

// 更新商品小计
const updateItemTotal = (index) => {
  const item = cart.value[index]
  item.total = item.salePrice * item.quantity
}

// 移除商品
const removeItem = (index) => {
  cart.value.splice(index, 1)
  showToast('已移除')
}

// 清空购物车
const clearCart = () => {
  showConfirmDialog({
    title: '确认清空',
    message: '确定要清空购物车吗？',
  }).then(() => {
    cart.value = []
    receivedAmount.value = ''
    orderDiscount.value = 1
    remark.value = ''
    selectedMember.value = null
    paymentMethod.value = 'cash'
    showToast('已清空')
  }).catch(() => {})
}

// 搜索
const onSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

// 选择销售员
const onSalespersonConfirm = ({ selectedOptions }) => {
  salesperson.value = selectedOptions[0]
  showSalespersonPicker.value = false
}

// 应用自定义折扣
const applyCustomDiscount = () => {
  const discount = parseFloat(customDiscountValue.value) / 10
  if (discount >= 0.1 && discount <= 1) {
    orderDiscount.value = discount
    customDiscountValue.value = ''
  } else {
    showToast('请输入1-10之间的数字')
  }
}

// 会员相关函数
const filteredMembers = computed(() => {
  if (memberSearchKeyword.value) {
    return memberStore.searchMembers(memberSearchKeyword.value)
  }
  return memberStore.getAllMembers
})

const selectMember = (member) => {
  selectedMember.value = member
  showMemberPicker.value = false
  memberSearchKeyword.value = ''
  
  // 如果会员余额足够，默认使用会员余额支付
  if (member.balance >= finalTotal.value) {
    paymentMethod.value = 'member'
  }
}

const clearMember = () => {
  selectedMember.value = null
  paymentMethod.value = 'cash'
}

const onMemberSearch = () => {
  // 搜索逻辑已在computed中处理
}

// 结算
const handleCheckout = () => {
  if (cart.value.length === 0) {
    showToast('购物车是空的')
    return
  }

  // 会员余额支付检查
  if (paymentMethod.value === 'member') {
    if (!selectedMember.value) {
      showToast('请选择会员')
      return
    }
    if (selectedMember.value.balance < finalTotal.value) {
      showToast('会员余额不足')
      return
    }
  } else {
    // 现金支付检查
    if (!receivedAmount.value) {
      showToast('请输入实收金额')
      return
    }

    if (changeAmount.value < 0) {
      showToast('实收金额不足')
      return
    }
  }

  // 检查库存
  for (const item of cart.value) {
    const product = productStore.getProductById(item.productId)
    if (!product || product.stock < item.quantity) {
      showToast(`${item.productName} 库存不足`)
      return
    }
  }

  // 确认对话框
  const paymentInfo = paymentMethod.value === 'member' 
    ? `会员余额支付：¥${finalTotal.value.toFixed(2)}`
    : `实收：¥${parseFloat(receivedAmount.value).toFixed(2)}\n找零：¥${changeAmount.value.toFixed(2)}`
  
  showDialog({
    title: '确认收款',
    message: `
      应收：¥${finalTotal.value.toFixed(2)}
      ${paymentInfo}
      ${selectedMember.value ? `会员：${selectedMember.value.name || selectedMember.value.phone}` : ''}
      
      确认收款吗？
    `,
    showCancelButton: true,
  }).then(async () => {
    // 如果是会员支付，先扣减余额
    if (paymentMethod.value === 'member' && selectedMember.value) {
      const consumeResult = await memberStore.consumeMember(selectedMember.value.id, finalTotal.value)
      if (!consumeResult.success) {
        showToast(consumeResult.message || '扣减余额失败')
        return
      }
    }
    // 创建多商品订单
    const saleData = {
      products: cart.value.map(item => ({
        productId: item.productId,
        productName: item.productName,
        brand: item.brand,
        size: item.size,
        quantity: item.quantity,
        salePrice: item.salePrice,
        discount: item.discount
      })),
      salesperson: salesperson.value,
      remark: remark.value,
      discount: orderDiscount.value,
      receivedAmount: paymentMethod.value === 'member' ? finalTotal.value : parseFloat(receivedAmount.value),
      changeAmount: paymentMethod.value === 'member' ? 0 : changeAmount.value,
      memberId: selectedMember.value?.id,
      paymentMethod: paymentMethod.value === 'member' ? '会员余额' : '现金'
    }
    
    const result = salesStore.addSale(saleData)
    
    if (result.success) {
      // 显示成功信息
      showDialog({
        title: '收款成功',
        message: `
          销售金额：¥${finalTotal.value.toFixed(2)}
          本单利润：¥${result.data.profit.toFixed(2)}
          销售员：${salesperson.value}
          
          感谢惠顾！
        `,
      }).then(() => {
        // 清空购物车并返回
        cart.value = []
        receivedAmount.value = ''
        orderDiscount.value = 1
        remark.value = ''
        selectedMember.value = null
        paymentMethod.value = 'cash'
        router.back()
      })
    } else {
      showToast(result.message || '销售失败')
    }
  }).catch(() => {})
}

// 加载会员数据
onMounted(() => {
  memberStore.loadMembers()
})

// 返回
const handleBack = () => {
  if (cart.value.length > 0) {
    showConfirmDialog({
      title: '确认返回',
      message: '购物车中还有商品，确定要返回吗？',
    }).then(() => {
      router.back()
    }).catch(() => {})
  } else {
    router.back()
  }
}
</script>

<style scoped>
.cart-sales-page {
  background-color: #f7f8fa;
  padding-bottom: 80px;
}

.quick-products {
  background: white;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.quick-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.quick-title {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}

.quick-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.quick-item {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.quick-item:active {
  transform: scale(0.95);
  border-color: #1989fa;
}

.quick-item-name {
  font-size: 13px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-item-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #969799;
  margin-bottom: 4px;
}

.quick-item-size {
  color: #1989fa;
}

.quick-item-stock {
  color: #07c160;
}

.quick-item-price {
  font-size: 14px;
  font-weight: 600;
  color: #ff4d4f;
}

.cart-section {
  min-height: 200px;
}

.empty-cart {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #323233;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 14px;
  color: #969799;
}

.cart-list {
  padding: 0 16px;
}

.cart-item {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-info {
  flex: 1;
  margin-right: 12px;
}

.item-name {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.item-spec {
  font-size: 12px;
  color: #969799;
  margin-bottom: 6px;
}

.item-price-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.original-price {
  font-size: 13px;
  color: #969799;
  text-decoration: line-through;
}

.current-price {
  font-size: 16px;
  font-weight: 600;
  color: #ff4d4f;
}

.discount-tag {
  font-size: 11px;
  padding: 2px 6px;
  background: #ff4d4f;
  color: white;
  border-radius: 4px;
}

.item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.item-total {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.delete-icon {
  font-size: 18px;
  color: #969799;
  cursor: pointer;
}

.add-product-section {
  padding: 0 16px 16px;
}

.checkout-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 16px;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  max-height: 60vh;
  overflow-y: auto;
}

.checkout-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.checkout-row .label {
  font-size: 14px;
  color: #646566;
}

.checkout-row .value {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}

.discount-row .value.discount {
  color: #ff4d4f;
}

.total-row {
  padding: 12px 0;
}

.total-row .label {
  font-size: 16px;
  font-weight: 600;
}

.total-row .value.total {
  font-size: 24px;
  color: #ff4d4f;
}

.change-row .value.change {
  font-size: 20px;
  color: #07c160;
}

.change-row .value.negative {
  color: #ff4d4f;
}

.received-input {
  flex: 1;
  text-align: right;
  padding: 0;
}

.salesperson-input {
  flex: 1;
  padding: 0;
}

.discount-buttons {
  display: flex;
  gap: 8px;
}

.quick-amount {
  display: flex;
  gap: 8px;
  padding: 8px 0;
  flex-wrap: wrap;
}

.checkout-button {
  margin-top: 12px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
}

.product-picker {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.picker-header {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #ebedf0;
}

.picker-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
}

.picker-item {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  display: flex;
  gap: 12px;
  align-items: center;
  cursor: pointer;
}

.picker-item:active {
  background: #f7f8fa;
}

.picker-item-image {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: #f7f8fa;
}

.picker-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.picker-item-info {
  flex: 1;
  min-width: 0;
}

.picker-item-name {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.picker-item-spec {
  font-size: 12px;
  color: #969799;
}

.picker-item-price {
  font-size: 16px;
  font-weight: 600;
  color: #ff4d4f;
}

.member-input {
  flex: 1;
  padding: 0;
}

.clear-member {
  margin-left: 8px;
  color: #969799;
  cursor: pointer;
}

.member-info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 12px;
  margin: 12px 0;
  color: white;
}

.member-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.member-balance {
  font-size: 16px;
  font-weight: 600;
}

.payment-method-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}

.payment-method-row .label {
  font-size: 14px;
}

.member-picker {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.member-discount {
  font-size: 12px;
  color: #ff976a;
  margin-top: 4px;
}
</style>
