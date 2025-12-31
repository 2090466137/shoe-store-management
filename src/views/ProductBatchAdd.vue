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
          <div class="tips-text" style="margin-bottom: 16px;">
            <van-icon name="info-o" />
            直接在下方输入框中设置每个尺码的库存数量
          </div>

          <!-- 快捷操作按钮 -->
          <div class="quick-actions-top">
            <van-button 
              size="small" 
              type="primary" 
              plain
              @click="quickBatchSet"
            >
              <van-icon name="edit" /> 全部设为
            </van-button>
            <van-button 
              size="small" 
              type="success" 
              plain
              @click="smartFill"
            >
              <van-icon name="star-o" /> 智能填充
            </van-button>
          </div>

          <!-- 内联输入框列表 -->
          <div class="inline-stock-list">
            <div 
              v-for="size in selectedSizes" 
              :key="size"
              class="inline-stock-item"
            >
              <div class="size-label">{{ size }}码</div>
              <div class="stock-input-wrapper">
                <van-stepper 
                  v-model="sizeStocks[size]" 
                  :min="0" 
                  :max="999"
                  :default-value="10"
                  input-width="60px"
                  button-size="28px"
                />
                <span class="unit">件</span>
              </div>
              <div class="quick-buttons">
                <span class="quick-btn" @click="sizeStocks[size] = 5">5</span>
                <span class="quick-btn" @click="sizeStocks[size] = 10">10</span>
                <span class="quick-btn" @click="sizeStocks[size] = 15">15</span>
                <span class="quick-btn" @click="sizeStocks[size] = 20">20</span>
              </div>
            </div>
          </div>

          <van-field
            v-model="form.minStock"
            type="number"
            label="预警值"
            placeholder="库存预警值"
            style="margin-top: 16px;"
          >
            <template #button>
              <span>件</span>
            </template>
          </van-field>
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
    // 如果没有设置，返回默认值
    if (!(size in sizeStocks.value)) {
      sizeStocks.value[size] = parseInt(form.value.defaultStock) || 10
    }
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

// 快速批量设置
const quickBatchSet = () => {
  if (selectedSizes.value.length === 0) {
    showToast('请先选择尺码')
    return
  }
  
  showDialog({
    title: '批量设置所有尺码',
    message: ' ', // 必须有内容，否则 message 元素不会渲染
    showCancelButton: true,
    closeOnClickOverlay: false,
    confirmButtonText: '确认',
    cancelButtonText: '取消',
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
            showToast('请输入0-999之间的数量')
            resolve(false)
            return
          }
          
          selectedSizes.value.forEach(size => {
            sizeStocks.value[size] = value
          })
          
          showToast(`已将 ${selectedSizes.value.length} 个尺码设置为 ${value} 件`)
          resolve(true)
        } else {
          resolve(true)
        }
      })
    }
  })
  
  // 添加输入框 - 增加延迟时间并添加重试机制
  const addInputField = (retryCount = 0) => {
    const messageEl = document.querySelector('.van-dialog__message')
    
    if (!messageEl && retryCount < 5) {
      // 如果找不到元素，重试
      setTimeout(() => addInputField(retryCount + 1), 100)
      return
    }
    
    if (messageEl && !messageEl.querySelector('.batch-stock-input')) {
      messageEl.innerHTML = `
        <div style="padding: 16px 0;">
          <input 
            type="number" 
            class="batch-stock-input"
            value="10"
            min="0"
            max="999"
            placeholder="输入数量"
            style="width: 100%; padding: 12px; border: 2px solid #1989fa; border-radius: 8px; font-size: 18px; text-align: center; font-weight: 600;"
          />
          <div style="margin-top: 12px; font-size: 12px; color: #969799;">
            常用数量：
            <span onclick="document.querySelector('.batch-stock-input').value=5" style="display: inline-block; padding: 4px 12px; margin: 4px; background: #f7f8fa; border-radius: 4px; cursor: pointer;">5</span>
            <span onclick="document.querySelector('.batch-stock-input').value=10" style="display: inline-block; padding: 4px 12px; margin: 4px; background: #f7f8fa; border-radius: 4px; cursor: pointer;">10</span>
            <span onclick="document.querySelector('.batch-stock-input').value=15" style="display: inline-block; padding: 4px 12px; margin: 4px; background: #f7f8fa; border-radius: 4px; cursor: pointer;">15</span>
            <span onclick="document.querySelector('.batch-stock-input').value=20" style="display: inline-block; padding: 4px 12px; margin: 4px; background: #f7f8fa; border-radius: 4px; cursor: pointer;">20</span>
            <span onclick="document.querySelector('.batch-stock-input').value=30" style="display: inline-block; padding: 4px 12px; margin: 4px; background: #f7f8fa; border-radius: 4px; cursor: pointer;">30</span>
          </div>
        </div>
      `
      
      // 聚焦输入框
      setTimeout(() => {
        const input = document.querySelector('.batch-stock-input')
        if (input) {
          input.focus()
          input.select()
        }
      }, 100)
    }
  }
  
  // 延迟 150ms 后添加输入框
  setTimeout(() => addInputField(), 150)
}

// 智能填充（中间尺码多，两端少）
const smartFill = () => {
  if (selectedSizes.value.length === 0) {
    showToast('请先选择尺码')
    return
  }
  
  if (stockMode.value !== 'individual') {
    showToast('请先切换到"单独设置"模式')
    return
  }
  
  const sizes = selectedSizes.value
  const len = sizes.length
  
  let previewText = '预览分配结果：\n\n'
  
  if (len <= 2) {
    // 尺码太少，统一设置为10
    previewText += sizes.map(size => `${size}码：10件`).join('\n')
  } else {
    // 智能分配：两端少，中间多
    const preview = sizes.map((size, index) => {
      const position = index / (len - 1) // 0 到 1
      // 使用抛物线函数：中间高，两端低
      const ratio = 1 - Math.pow(2 * position - 1, 2)
      const stock = Math.round(5 + ratio * 15) // 5-20之间
      return `${size}码：${stock}件`
    })
    previewText += preview.join('\n')
  }
  
  showDialog({
    title: '智能填充',
    message: previewText + '\n\n中间尺码多，两端尺码少\n适合热门尺码进货多的情况',
    showCancelButton: true,
    confirmButtonText: '确认填充',
  }).then(() => {
    if (len <= 2) {
      // 尺码太少，统一设置为10
      sizes.forEach(size => {
        sizeStocks.value[size] = 10
      })
    } else {
      // 智能分配：两端少，中间多
      sizes.forEach((size, index) => {
        const position = index / (len - 1) // 0 到 1
        // 使用抛物线函数：中间高，两端低
        const ratio = 1 - Math.pow(2 * position - 1, 2)
        const stock = Math.round(5 + ratio * 15) // 5-20之间
        sizeStocks.value[size] = stock
      })
    }
    
    showToast('智能填充完成！')
  }).catch(() => {})
}

// 快捷选择成人常用码
const selectCommonSizes = (type) => {
  let newSizes = []
  if (type === 'adult') {
    newSizes = ['38', '39', '40', '41', '42', '43', '44']
  } else if (type === 'child') {
    newSizes = ['28', '29', '30', '31', '32', '33', '34', '35', '36', '37']
  }
  
  selectedSizes.value = newSizes
  
  // 初始化新尺码的库存
  newSizes.forEach(size => {
    if (!(size in sizeStocks.value)) {
      sizeStocks.value[size] = parseInt(form.value.defaultStock) || 10
    }
  })
}

// 全选
const selectAllSizes = () => {
  selectedSizes.value = [...availableSizes]
  
  // 初始化所有尺码的库存
  availableSizes.forEach(size => {
    if (!(size in sizeStocks.value)) {
      sizeStocks.value[size] = parseInt(form.value.defaultStock) || 10
    }
  })
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
  
  // 在单独设置模式下，确保所有尺码都有库存设置
  if (stockMode.value === 'individual') {
    for (const size of selectedSizes.value) {
      if (!(size in sizeStocks.value) || sizeStocks.value[size] === undefined) {
        sizeStocks.value[size] = parseInt(form.value.defaultStock) || 10
      }
    }
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


/* 快捷操作按钮 - 顶部 */
.quick-actions-top {
  display: flex;
  gap: 8px;
  padding: 0 16px;
  margin-bottom: 16px;
}

/* 内联输入框列表 */
.inline-stock-list {
  padding: 0 16px;
  margin-bottom: 16px;
}

.inline-stock-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #ebedf0;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.inline-stock-item:hover {
  border-color: #1989fa;
  box-shadow: 0 2px 8px rgba(25, 137, 250, 0.1);
}

.inline-stock-item .size-label {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  min-width: 50px;
}

.stock-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.stock-input-wrapper .unit {
  font-size: 14px;
  color: #969799;
}

.quick-buttons {
  display: flex;
  gap: 4px;
}

.quick-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 28px;
  padding: 0 8px;
  background: #f7f8fa;
  border: 1px solid #ebedf0;
  border-radius: 4px;
  font-size: 12px;
  color: #646566;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.quick-btn:active {
  transform: scale(0.95);
  background: #1989fa;
  border-color: #1989fa;
  color: white;
}

/* 快捷操作按钮 */
.quick-actions {
  display: flex;
  gap: 8px;
  padding: 0 16px;
  margin-bottom: 8px;
}

.quick-actions .van-button {
  flex: 1;
}
</style>

