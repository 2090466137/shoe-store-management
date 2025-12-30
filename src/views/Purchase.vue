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
            :rules="[{ required: true, message: '请输入进货数量' }]"
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
            :rules="[{ required: true, message: '请输入进货单价' }]"
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
            <div class="record-amount">¥{{ purchase.totalAmount.toFixed(2) }}</div>
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
    <van-popup v-model:show="showProductPicker" position="bottom">
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
import { showToast } from 'vant'

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
    text: `${p.name} (${p.brand} | ${p.size}码)`,
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

const onSubmit = () => {
  if (!form.value.productId) {
    showToast({
      type: 'fail',
      message: '请选择商品'
    })
    return
  }

  const purchaseData = {
    productId: form.value.productId,
    quantity: parseInt(form.value.quantity),
    costPrice: parseFloat(form.value.costPrice),
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
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
  margin-bottom: 8px;
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
</style>

