<template>
  <div class="product-batch-add-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="批量添加商品"
      left-arrow
      @click-left="router.back()"
    />

    <div class="content-wrapper">
      <!-- 说明 -->
      <div class="tips-card">
        <van-icon name="info-o" color="#1989fa" />
        <span>一次录入商品信息，批量生成多个尺码的商品</span>
      </div>

      <!-- 基本信息 -->
      <div class="card">
        <div class="section-title">📝 基本信息</div>
        <van-form ref="formRef">
          <van-field
            v-model="form.name"
            name="name"
            label="商品名称"
            placeholder="例如：耐克 Air Max 270"
            :rules="[{ required: true, message: '请输入商品名称' }]"
          />
          
          <van-field
            v-model="form.brand"
            name="brand"
            label="品牌"
            placeholder="例如：耐克"
            :rules="[{ required: true, message: '请输入品牌' }]"
          />
          
          <van-field
            v-model="form.category"
            name="category"
            label="分类"
            placeholder="请选择分类"
            readonly
            is-link
            @click="showCategoryPicker = true"
            :rules="[{ required: true, message: '请选择分类' }]"
          />
          
          <van-field
            v-model="form.color"
            name="color"
            label="颜色"
            placeholder="例如：黑白"
            :rules="[{ required: true, message: '请输入颜色' }]"
          />
          
          <van-field
            v-model="form.costPrice"
            name="costPrice"
            type="number"
            label="成本价"
            placeholder="请输入成本价"
            :rules="[{ required: true, message: '请输入成本价' }]"
          >
            <template #button>
              <span>元</span>
            </template>
          </van-field>
          
          <van-field
            v-model="form.salePrice"
            name="salePrice"
            type="number"
            label="销售价"
            placeholder="请输入销售价"
            :rules="[{ required: true, message: '请输入销售价' }]"
          >
            <template #button>
              <span>元</span>
            </template>
          </van-field>
          
          <van-field
            v-model="form.supplier"
            name="supplier"
            label="供应商"
            placeholder="请输入供应商（选填）"
          />
        </van-form>
      </div>

      <!-- 尺码选择 -->
      <div class="card">
        <div class="section-title">👟 选择尺码</div>
        
        <!-- 快捷选择 -->
        <div class="quick-select">
          <van-button size="small" @click="selectCommonSizes('adult')">
            成人常用码（38-44）
          </van-button>
          <van-button size="small" @click="selectCommonSizes('child')">
            儿童常用码（28-37）
          </van-button>
          <van-button size="small" @click="selectAllSizes">
            全选
          </van-button>
          <van-button size="small" @click="clearSizes">
            清空
          </van-button>
        </div>

        <!-- 尺码网格 -->
        <div class="size-grid">
          <div 
            v-for="size in availableSizes" 
            :key="size"
            class="size-item"
            :class="{ selected: selectedSizes.includes(size) }"
            @click="toggleSize(size)"
          >
            {{ size }}
          </div>
        </div>

        <!-- 已选尺码 -->
        <div class="selected-info">
          <span class="label">已选择：</span>
          <span class="value">{{ selectedSizes.length }} 个尺码</span>
        </div>
      </div>

      <!-- 库存和预警设置 -->
      <div class="card">
        <div class="section-title">📦 库存设置</div>
        
        <!-- 库存设置模式切换 -->
        <div class="stock-mode-switch">
          <van-radio-group v-model="stockMode" direction="horizontal">
            <van-radio name="unified">统一库存</van-radio>
            <van-radio name="individual">单独设置</van-radio>
          </van-radio-group>
        </div>

        <!-- 统一库存模式 -->
        <template v-if="stockMode === 'unified'">
          <van-field
            v-model="form.defaultStock"
            type="number"
            label="默认库存"
            placeholder="每个尺码的默认库存"
          >
            <template #button>
              <span>件</span>
            </template>
          </van-field>
          
          <van-field
            v-model="form.minStock"
            type="number"
            label="最低库存"
            placeholder="库存预警值"
          >
            <template #button>
              <span>件</span>
            </template>
          </van-field>

          <div class="tips-text">
            <van-icon name="info-o" />
            所有尺码将使用相同的库存和预警设置
          </div>
        </template>

        <!-- 单独设置模式 -->
        <template v-else>
          <div class="tips-text" style="margin-bottom: 12px;">
            <van-icon name="info-o" />
            为每个尺码单独设置进货数量，减少工作量
          </div>

          <!-- 快捷批量设置 -->
          <div class="batch-stock-actions">
            <van-button size="small" @click="batchSetStock">
              批量设置库存
            </van-button>
            <van-button size="small" @click="copyFirstStock">
              复制首个尺码
            </van-button>
          </div>

          <!-- 每个尺码的库存设置 -->
          <div class="individual-stock-list">
            <div 
              v-for="size in selectedSizes" 
              :key="size"
              class="stock-item"
            >
              <div class="stock-item-label">
                <span class="size-badge">{{ size }}码</span>
              </div>
              <div class="stock-item-inputs">
                <van-stepper 
                  v-model="sizeStocks[size]" 
                  :min="0"
                  :max="999"
                  theme="round"
                  button-size="22"
                  input-width="50px"
                />
                <span class="unit">件</span>
              </div>
            </div>
          </div>

          <div class="tips-text" style="margin-top: 12px;">
            <van-icon name="info-o" />
            预警值统一设置为：
            <van-stepper 
              v-model="form.minStock" 
              :min="0"
              :max="50"
              theme="round"
              button-size="18"
              input-width="40px"
              style="display: inline-flex; margin-left: 8px;"
            />
            件
          </div>
        </template>
      </div>

      <!-- 预览 -->
      <div class="card" v-if="selectedSizes.length > 0">
        <div class="section-title">
          👀 预览（将生成 {{ selectedSizes.length }} 个商品，共 {{ totalStock }} 件）
        </div>
        
        <div class="preview-list">
          <div 
            v-for="size in selectedSizes.slice(0, 3)" 
            :key="size"
            class="preview-item"
          >
            <div class="preview-name">{{ form.name }} - {{ size }}码</div>
            <div class="preview-detail">
              {{ form.brand }} | {{ form.color }} | 库存{{ getStockForSize(size) }}件
            </div>
            <div class="preview-price">
              成本¥{{ form.costPrice }} / 售价¥{{ form.salePrice }}
            </div>
          </div>
          
          <div v-if="selectedSizes.length > 3" class="preview-more">
            还有 {{ selectedSizes.length - 3 }} 个...
          </div>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="form-actions">
        <van-button 
          round 
          block 
          type="primary" 
          size="large"
          @click="handleSubmit"
          :disabled="selectedSizes.length === 0"
        >
          批量添加 {{ selectedSizes.length }} 个商品
        </van-button>
      </div>
    </div>

    <!-- 分类选择器 -->
    <van-popup v-model:show="showCategoryPicker" position="bottom">
      <van-picker
        :columns="categories"
        @confirm="onCategoryConfirm"
        @cancel="showCategoryPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { showToast, showDialog } from 'vant'

const router = useRouter()
const productStore = useProductStore()

const showCategoryPicker = ref(false)
const formRef = ref(null)

const categories = [
  { text: '运动鞋', value: '运动鞋' },
  { text: '休闲鞋', value: '休闲鞋' },
  { text: '皮鞋', value: '皮鞋' },
  { text: '帆布鞋', value: '帆布鞋' },
  { text: '滑板鞋', value: '滑板鞋' },
  { text: '凉鞋', value: '凉鞋' },
  { text: '靴子', value: '靴子' },
  { text: '其他', value: '其他' }
]

// 可选尺码（28-48）
const availableSizes = Array.from({ length: 21 }, (_, i) => (28 + i).toString())

const form = ref({
  name: '',
  brand: '',
  category: '',
  color: '',
  costPrice: '',
  salePrice: '',
  supplier: '',
  defaultStock: '10',
  minStock: '5'
})

const selectedSizes = ref([])

// 库存设置模式：unified（统一）或 individual（单独）
const stockMode = ref('unified')

// 每个尺码的库存设置（单独模式）
const sizeStocks = ref({})

// 监听选中的尺码变化，初始化库存
watch(selectedSizes, (newSizes) => {
  newSizes.forEach(size => {
    if (!(size in sizeStocks.value)) {
      sizeStocks.value[size] = parseInt(form.value.defaultStock) || 10
    }
  })
}, { deep: true })

// 计算总库存
const totalStock = computed(() => {
  if (stockMode.value === 'unified') {
    return selectedSizes.value.length * (parseInt(form.value.defaultStock) || 0)
  } else {
    return selectedSizes.value.reduce((sum, size) => {
      return sum + (parseInt(sizeStocks.value[size]) || 0)
    }, 0)
  }
})

// 获取指定尺码的库存
const getStockForSize = (size) => {
  if (stockMode.value === 'unified') {
    return form.value.defaultStock || 0
  } else {
    return sizeStocks.value[size] || 0
  }
}

// 切换尺码选择
const toggleSize = (size) => {
  const index = selectedSizes.value.indexOf(size)
  if (index > -1) {
    selectedSizes.value.splice(index, 1)
    // 删除对应的库存设置
    delete sizeStocks.value[size]
  } else {
    selectedSizes.value.push(size)
    selectedSizes.value.sort((a, b) => parseInt(a) - parseInt(b))
    // 初始化库存
    sizeStocks.value[size] = parseInt(form.value.defaultStock) || 10
  }
}

// 批量设置库存
const batchSetStock = async () => {
  if (selectedSizes.value.length === 0) {
    showToast('请先选择尺码')
    return
  }
  
  try {
    await showDialog({
      title: '批量设置库存',
      message: '请输入要设置的库存数量（0-999）',
      showCancelButton: true,
      closeOnClickOverlay: false,
    })
    
    // 用户点击确认后，再弹出输入框
    const result = await showDialog({
      title: '输入库存数量',
      message: '',
      showCancelButton: true,
      closeOnClickOverlay: false,
    })
    
  } catch (error) {
    // 用户取消
    return
  }
  
  // 使用 Vant 的 Dialog 组件配合 Field
  let inputValue = '10'
  
  showDialog({
    title: '批量设置库存',
    message: '请输入库存数量',
    showCancelButton: true,
    closeOnClickOverlay: false,
    beforeClose: (action) => {
      return new Promise((resolve) => {
        if (action === 'confirm') {
          const input = document.querySelector('.batch-stock-input')
          const value = input ? parseInt(input.value) : 10
          
          if (!input || input.value === '') {
            showToast('请输入库存数量')
            resolve(false)
            return
          }
          
          if (isNaN(value) || value < 0 || value > 999) {
            showToast('请输入有效的数量（0-999）')
            resolve(false)
            return
          }
          
          // 设置所有尺码的库存
          selectedSizes.value.forEach(size => {
            sizeStocks.value[size] = value
          })
          
          showToast(`已将所有尺码库存设置为 ${value} 件`)
          resolve(true)
        } else {
          resolve(true)
        }
      })
    }
  })
  
  // 添加输入框
  setTimeout(() => {
    const messageEl = document.querySelector('.van-dialog__message')
    if (messageEl && !messageEl.querySelector('.batch-stock-input')) {
      messageEl.innerHTML = `
        <div style="padding: 12px 0;">
          <input 
            type="number" 
            class="batch-stock-input"
            value="10"
            min="0"
            max="999"
            placeholder="请输入库存数量"
            style="width: 100%; padding: 10px; border: 1px solid #ebedf0; border-radius: 4px; font-size: 14px; text-align: center;"
          />
        </div>
      `
      const input = messageEl.querySelector('.batch-stock-input')
      if (input) {
        input.focus()
        input.select()
      }
    }
  }, 50)
}

// 复制首个尺码的库存到所有尺码
const copyFirstStock = () => {
  if (selectedSizes.value.length === 0) {
    showToast('请先选择尺码')
    return
  }
  
  const firstSize = selectedSizes.value[0]
  const firstStock = sizeStocks.value[firstSize] || 10
  
  selectedSizes.value.forEach(size => {
    sizeStocks.value[size] = firstStock
  })
  
  showToast(`已将所有尺码库存设置为 ${firstStock} 件`)
}

// 快捷选择成人常用码
const selectCommonSizes = (type) => {
  if (type === 'adult') {
    selectedSizes.value = ['38', '39', '40', '41', '42', '43', '44']
  } else if (type === 'child') {
    selectedSizes.value = ['28', '29', '30', '31', '32', '33', '34', '35', '36', '37']
  }
}

// 全选
const selectAllSizes = () => {
  selectedSizes.value = [...availableSizes]
}

// 清空
const clearSizes = () => {
  selectedSizes.value = []
}

// 分类确认
const onCategoryConfirm = ({ selectedOptions }) => {
  form.value.category = selectedOptions[0].text
  showCategoryPicker.value = false
}

// 提交
const handleSubmit = async () => {
  // 验证基本信息
  if (!form.value.name || !form.value.brand || !form.value.category || 
      !form.value.color || !form.value.costPrice || !form.value.salePrice) {
    showToast('请填写完整的商品信息')
    return
  }

  if (selectedSizes.value.length === 0) {
    showToast('请至少选择一个尺码')
    return
  }

  // 确认对话框
  const stockInfo = stockMode.value === 'unified' 
    ? `统一库存：${form.value.defaultStock}件/尺码`
    : `总库存：${totalStock.value}件`
  
  showDialog({
    title: '确认批量添加',
    message: `将添加 ${selectedSizes.value.length} 个商品\n\n${form.value.name}\n尺码：${selectedSizes.value.join(', ')}\n${stockInfo}`,
    showCancelButton: true,
  }).then(async () => {
    // 批量添加商品
    let successCount = 0
    let failCount = 0
    
    for (const size of selectedSizes.value) {
      try {
        // 根据模式获取库存
        const stock = stockMode.value === 'unified' 
          ? parseInt(form.value.defaultStock) || 0
          : parseInt(sizeStocks.value[size]) || 0
        
        const productData = {
          name: `${form.value.name} - ${size}码`,
          code: `${form.value.name}_${size}_${Date.now()}`,
          brand: form.value.brand,
          category: form.value.category,
          color: form.value.color,
          size: size,
          costPrice: parseFloat(form.value.costPrice),
          salePrice: parseFloat(form.value.salePrice),
          stock: stock,
          minStock: parseInt(form.value.minStock) || 0,
          supplier: form.value.supplier,
          image: ''
        }
        
        await productStore.addProduct(productData)
        successCount++
      } catch (error) {
        console.error('添加商品失败:', error)
        failCount++
      }
    }

    // 成功提示
    const message = failCount > 0 
      ? `成功添加 ${successCount} 个商品，失败 ${failCount} 个\n总库存：${totalStock.value}件`
      : `成功添加 ${successCount} 个商品！\n总库存：${totalStock.value}件`
    
    showDialog({
      title: failCount > 0 ? '部分成功' : '添加成功',
      message: message,
    }).then(() => {
      router.push('/products')
    })
  }).catch(() => {
    // 取消
  })
}
</script>

<style scoped>
.product-batch-add-page {
  background-color: #f7f8fa;
}

.tips-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  margin: 16px;
  background: #e6f7ff;
  border-radius: 8px;
  font-size: 13px;
  color: #1989fa;
}

.quick-select {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.size-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.size-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
  border: 2px solid #ebedf0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #646566;
  cursor: pointer;
  transition: all 0.2s;
}

.size-item:active {
  transform: scale(0.95);
}

.size-item.selected {
  background: #1989fa;
  border-color: #1989fa;
  color: white;
}

.selected-info {
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
  text-align: center;
}

.selected-info .label {
  font-size: 14px;
  color: #646566;
  margin-right: 8px;
}

.selected-info .value {
  font-size: 16px;
  font-weight: 600;
  color: #1989fa;
}

.tips-text {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px;
  font-size: 12px;
  color: #969799;
}

.preview-list {
  margin-top: 12px;
}

.preview-item {
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
  margin-bottom: 8px;
}

.preview-name {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.preview-detail {
  font-size: 13px;
  color: #646566;
  margin-bottom: 4px;
}

.preview-price {
  font-size: 13px;
  color: #969799;
}

.preview-more {
  text-align: center;
  padding: 8px;
  font-size: 13px;
  color: #969799;
}

.form-actions {
  padding: 16px;
  margin-top: 16px;
}

.stock-mode-switch {
  padding: 12px 16px;
  margin-bottom: 12px;
}

.stock-mode-switch :deep(.van-radio-group) {
  display: flex;
  gap: 24px;
}

.batch-stock-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding: 0 16px;
}

.individual-stock-list {
  max-height: 400px;
  overflow-y: auto;
}

.stock-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #ebedf0;
}

.stock-item:last-child {
  border-bottom: none;
}

.stock-item-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.size-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

.stock-item-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stock-item-inputs .unit {
  font-size: 13px;
  color: #969799;
  min-width: 24px;
}
</style>

