<template>
  <div class="sales-form-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="销售开单"
      left-arrow
      @click-left="router.back()"
    />

    <!-- 销售表单 -->
    <div class="content-wrapper">
      <div class="card">
        <div class="section-title">🛒 销售开单</div>
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
          
          <!-- 商品信息展示 -->
          <div v-if="selectedProduct" class="product-detail">
            <div class="detail-row">
              <span class="detail-label">库存:</span>
              <span class="detail-value" :class="{ 'low-stock': selectedProduct.stock <= selectedProduct.minStock }">
                {{ selectedProduct.stock }}件
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">成本价:</span>
              <span class="detail-value">¥{{ selectedProduct.costPrice }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">建议售价:</span>
              <span class="detail-value primary">¥{{ selectedProduct.salePrice }}</span>
            </div>
          </div>
          
          <van-field
            v-model="form.quantity"
            name="quantity"
            type="number"
            label="销售数量"
            placeholder="请输入销售数量"
            :rules="[{ required: true, message: '请输入销售数量' }]"
            @input="calculateTotal"
          >
            <template #button>
              <span>件</span>
            </template>
          </van-field>
          
          <van-field
            v-model="form.salePrice"
            name="salePrice"
            type="number"
            label="销售单价"
            placeholder="请输入销售单价"
            :rules="[{ required: true, message: '请输入销售单价' }]"
            @input="calculateTotal"
          >
            <template #button>
              <span>元</span>
            </template>
          </van-field>
          
          <van-field
            v-model="totalAmount"
            name="totalAmount"
            label="销售总额"
            readonly
          >
            <template #button>
              <span>元</span>
            </template>
          </van-field>
          
          <van-field
            v-model="estimatedProfit"
            name="estimatedProfit"
            label="预计利润"
            readonly
          >
            <template #button>
              <span>元</span>
            </template>
          </van-field>

          <div style="margin: 16px;">
            <van-button 
              round 
              block 
              type="primary" 
              native-type="submit"
              size="large"
            >
              确认销售
            </van-button>
          </div>
        </van-form>
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
import { showToast, showDialog } from 'vant'

const router = useRouter()
const productStore = useProductStore()
const salesStore = useSalesStore()

const showProductPicker = ref(false)
const productName = ref('')
const selectedProduct = ref(null)

const form = ref({
  productId: '',
  quantity: '',
  salePrice: ''
})

const productColumns = computed(() => {
  return productStore.getAllProducts.map(p => ({
    text: `${p.name} (库存:${p.stock})`,
    value: p.id
  }))
})

const totalAmount = computed(() => {
  const quantity = parseFloat(form.value.quantity) || 0
  const price = parseFloat(form.value.salePrice) || 0
  return (quantity * price).toFixed(2)
})

const estimatedProfit = computed(() => {
  if (!selectedProduct.value) return '0.00'
  
  const quantity = parseFloat(form.value.quantity) || 0
  const salePrice = parseFloat(form.value.salePrice) || 0
  const costPrice = selectedProduct.value.costPrice
  
  return ((salePrice - costPrice) * quantity).toFixed(2)
})

const onProductConfirm = ({ selectedOptions }) => {
  const productId = selectedOptions[0].value
  selectedProduct.value = productStore.getProductById(productId)
  
  if (selectedProduct.value) {
    form.value.productId = productId
    productName.value = selectedOptions[0].text
    form.value.salePrice = selectedProduct.value.salePrice.toString()
  }
  
  showProductPicker.value = false
}

const calculateTotal = () => {
  // 自动计算总额和利润（通过 computed 实现）
}

const onSubmit = async () => {
  if (!form.value.productId) {
    showToast({
      type: 'fail',
      message: '请选择商品'
    })
    return
  }

  const quantity = parseInt(form.value.quantity)
  
  if (!selectedProduct.value || selectedProduct.value.stock < quantity) {
    showDialog({
      title: '库存不足',
      message: `当前库存仅剩 ${selectedProduct.value?.stock || 0} 件，无法完成销售`,
    })
    return
  }

  const saleData = {
    productId: form.value.productId,
    quantity: quantity,
    salePrice: parseFloat(form.value.salePrice)
  }

  const result = await salesStore.addSale(saleData)
  
  if (result.success) {
    showDialog({
      title: '销售成功',
      message: `销售金额: ¥${result.data.totalAmount.toFixed(2)}\n利润: ¥${result.data.profit.toFixed(2)}`,
    }).then(() => {
      router.back()
    })
  } else {
    showToast({
      type: 'fail',
      message: result.message
    })
  }
}
</script>

<style scoped>
.sales-form-page {
  background-color: #f7f8fa;
}

.product-detail {
  padding: 16px;
  background: white;
  margin: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.detail-label {
  font-size: 14px;
  color: #646566;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}

.detail-value.low-stock {
  color: #ff4d4f;
}

.detail-value.primary {
  color: #1989fa;
}
</style>

