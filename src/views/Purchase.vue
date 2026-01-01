<template>
  <div class="purchase-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="进货管理"
      left-arrow
      @click-left="router.back()"
    />

    <!-- 进货表单 -->
    <div class="content-wrapper">
      <div class="card">
        <div class="section-title">📦 商品进货</div>
        <van-form @submit="onSubmit">
          <van-field
            v-model="productName"
            name="product"
            label="选择商品"
            placeholder="请选择商品"
            readonly
            is-link
            @click="showProductPicker = true"
            :rules="[{ required: true, message: '请选择商品' }]"
          />
          
          <van-field
            v-model="form.quantity"
            name="quantity"
            type="number"
            label="进货数量"
            placeholder="请输入进货数量"
            :rules="[
              { required: true, message: '请输入进货数量' },
              { validator: validatePositiveInteger, message: '数量必须为正整数' }
            ]"
            @blur="validateQuantity"
          >
            <template #button>
              <span>件</span>
            </template>
          </van-field>
          
          <van-field
            v-model="form.costPrice"
            name="costPrice"
            type="number"
            label="进货单价"
            placeholder="请输入进货单价"
            :rules="[
              { required: true, message: '请输入进货单价' },
              { validator: validatePositiveNumber, message: '单价必须大于0' }
            ]"
            @blur="validateCostPrice"
          >
            <template #button>
              <span>元</span>
            </template>
          </van-field>
          
          <van-field
            v-model="totalAmount"
            name="totalAmount"
            label="进货总额"
            readonly
            :value="totalAmount"
          >
            <template #button>
              <span>元</span>
            </template>
          </van-field>
          
          <van-field
            v-model="form.supplier"
            name="supplier"
            label="供应商"
            placeholder="请输入供应商名称"
          />

          <div style="margin: 16px;">
            <van-button 
              round 
              block 
              type="success" 
              native-type="submit"
              size="large"
            >
              确认进货
            </van-button>
          </div>
        </van-form>
      </div>

      <!-- 进货记录 -->
      <div class="card">
        <div class="section-title">📋 进货记录</div>
        
        <div v-if="salesStore.purchases.length === 0" class="empty-state">
          <div class="empty-state-icon">📦</div>
          <div class="empty-state-text">暂无进货记录</div>
        </div>

        <div 
          v-for="purchase in salesStore.purchases" 
          :key="purchase.id"
          class="record-item"
        >
          <div class="record-header">
            <div class="record-product">{{ purchase.productName }}</div>
            <div class="record-header-right">
              <div class="record-amount">¥{{ purchase.totalAmount.toFixed(2) }}</div>
              <van-icon 
                name="delete-o" 
                class="delete-btn"
                @click.stop="handleDeletePurchase(purchase)"
              />
            </div>
          </div>
          <div class="record-info">
            <span>数量: {{ purchase.quantity }}件</span>
            <span>单价: ¥{{ purchase.costPrice }}</span>
          </div>
          <div class="record-footer">
            <span class="record-supplier">{{ purchase.supplier }}</span>
            <span class="record-date">{{ formatDate(purchase.date) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 商品选择器 -->
    <van-popup 
      v-model:show="showProductPicker" 
      position="bottom"
      round
      teleport="body"
      :z-index="3000"
      safe-area-inset-bottom
    >
      <div class="popup-header">
        <span></span>
        <span class="popup-title">选择商品</span>
        <van-icon name="cross" class="popup-close" @click="showProductPicker = false" />
      </div>
      <van-picker
        :columns="productColumns"
        @confirm="onProductConfirm"
        @cancel="showProductPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { useSalesStore } from '@/stores/sales'
import { showToast, showConfirmDialog } from 'vant'

const router = useRouter()
const productStore = useProductStore()
const salesStore = useSalesStore()

const showProductPicker = ref(false)
const productName = ref('')
const selectedProduct = ref(null)

const form = ref({
  productId: '',
  quantity: '',
  costPrice: '',
  supplier: ''
})

const productColumns = computed(() => {
  return productStore.getAllProducts.map(p => ({
    text: `${p.name} (货号: ${p.code} | ${p.size}码)`,
    value: p.id
  }))
})

const totalAmount = computed(() => {
  const quantity = parseFloat(form.value.quantity) || 0
  const price = parseFloat(form.value.costPrice) || 0
  return (quantity * price).toFixed(2)
})

const onProductConfirm = ({ selectedOptions }) => {
  const productId = selectedOptions[0].value
  selectedProduct.value = productStore.getProductById(productId)
  
  if (selectedProduct.value) {
    form.value.productId = productId
    productName.value = selectedOptions[0].text
    form.value.costPrice = selectedProduct.value.costPrice.toString()
    form.value.supplier = selectedProduct.value.supplier || ''
  }
  
  showProductPicker.value = false
}

// 验证正数（价格）
const validatePositiveNumber = (value) => {
  const num = parseFloat(value)
  return !isNaN(num) && num > 0
}

// 验证正整数（数量）
const validatePositiveInteger = (value) => {
  const num = parseInt(value)
  return !isNaN(num) && num > 0 && Number.isInteger(parseFloat(value))
}

// 进货数量验证
const validateQuantity = () => {
  const quantity = parseInt(form.value.quantity)
  if (isNaN(quantity) || quantity < 0) {
    form.value.quantity = '1'
    showToast('进货数量不能为负数，已调整为1')
  } else if (quantity === 0) {
    form.value.quantity = '1'
    showToast('进货数量不能为0，已调整为1')
  } else if (!Number.isInteger(parseFloat(form.value.quantity))) {
    form.value.quantity = Math.floor(quantity).toString()
    showToast('进货数量必须为整数')
  } else if (quantity > 999999) {
    form.value.quantity = '999999'
    showToast('进货数量过大，已调整为999999')
  }
}

// 进货单价验证
const validateCostPrice = () => {
  const price = parseFloat(form.value.costPrice)
  if (isNaN(price) || price < 0) {
    form.value.costPrice = '0'
    showToast('进货单价不能为负数')
  } else if (price < 0.01 && price !== 0) {
    form.value.costPrice = '0.01'
    showToast('进货单价过小，已调整为0.01元')
  } else if (price > 999999) {
    form.value.costPrice = '999999'
    showToast('进货单价过大，已调整为999999元')
  }
}

const onSubmit = () => {
  if (!form.value.productId) {
    showToast({
      type: 'fail',
      message: '请选择商品'
    })
    return
  }

  // 最终验证
  const quantity = parseInt(form.value.quantity)
  const costPrice = parseFloat(form.value.costPrice)

  if (isNaN(quantity) || quantity <= 0) {
    showToast('请输入有效的进货数量（必须大于0）')
    return
  }

  if (!Number.isInteger(quantity)) {
    showToast('进货数量必须为整数')
    return
  }

  if (isNaN(costPrice) || costPrice <= 0) {
    showToast('请输入有效的进货单价（必须大于0）')
    return
  }

  if (costPrice > 999999) {
    showToast('进货单价过大，请检查输入')
    return
  }

  const purchaseData = {
    productId: form.value.productId,
    quantity: quantity,
    costPrice: costPrice,
    supplier: form.value.supplier
  }

  const result = salesStore.addPurchase(purchaseData)
  
  if (result.success) {
    showToast({
      type: 'success',
      message: '进货成功'
    })
    
    // 重置表单
    form.value = {
      productId: '',
      quantity: '',
      costPrice: '',
      supplier: ''
    }
    productName.value = ''
    selectedProduct.value = null
  } else {
    showToast({
      type: 'fail',
      message: result.message
    })
  }
}

const handleDeletePurchase = async (purchase) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要删除这条进货记录吗？\n\n商品：${purchase.productName}\n数量：${purchase.quantity}件\n金额：¥${purchase.totalAmount.toFixed(2)}\n\n删除后将减少对应的库存。`,
      confirmButtonText: '确认删除',
      confirmButtonColor: '#ee0a24'
    })
    
    const success = await salesStore.deletePurchase(purchase.id)
    
    if (success) {
      showToast({
        type: 'success',
        message: '已删除进货记录'
      })
    } else {
      showToast({
        type: 'fail',
        message: '删除失败'
      })
    }
  } catch {
    // 用户取消
  }
}

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.purchase-page {
  background-color: #f7f8fa;
}

.record-item {
  padding: 16px;
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(91, 143, 249, 0.08);
  border: 1px solid #e5e7eb;
}

.record-item:last-child {
  margin-bottom: 0;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.record-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.record-product {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}

.record-amount {
  font-size: 16px;
  font-weight: 600;
  color: #07c160;
}

.delete-btn {
  font-size: 18px;
  color: #ee0a24;
  cursor: pointer;
  padding: 4px;
}

.delete-btn:active {
  opacity: 0.6;
}

.record-info {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #646566;
  margin-bottom: 8px;
}

.record-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #969799;
}

.record-supplier {
  color: #1989fa;
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
