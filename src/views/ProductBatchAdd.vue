<template>
  <div class="batch-add-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="批量添加商品"
      left-arrow
      @click-left="router.back()"
    >
      <template #right>
        <van-icon name="question-o" size="22" @click="showHelp = true" />
      </template>
    </van-nav-bar>

    <div class="content-wrapper">
      <!-- 基本信息卡片 -->
      <div class="card">
        <div class="section-title">📝 基本信息</div>
        
        <van-form>
          <van-field
            v-model="baseInfo.code"
            name="code"
            label="货号"
            placeholder="例如：206731-2"
            :rules="[{ required: true, message: '请输入货号' }]"
          />
          
          <van-field
            v-model="baseInfo.color"
            name="color"
            label="颜色"
            placeholder="请输入颜色"
            :rules="[{ required: true, message: '请输入颜色' }]"
          />
          
          <van-field
            v-model="baseInfo.category"
            name="category"
            label="分类"
            placeholder="请选择分类"
            is-link
            readonly
            @click="showCategoryPicker = true"
            :rules="[{ required: true, message: '请选择分类' }]"
          />
          
          <van-field
            v-model="baseInfo.costPrice"
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
            v-model="baseInfo.salePrice"
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
            v-model="baseInfo.stock"
            name="stock"
            type="number"
            label="每个尺码库存"
            placeholder="请输入库存数量"
            :rules="[{ required: true, message: '请输入库存数量' }]"
          >
            <template #button>
              <span>件</span>
            </template>
          </van-field>
        </van-form>
      </div>

      <!-- 尺码选择卡片 -->
      <div class="card">
        <div class="section-title">👟 选择尺码</div>
        <div class="size-grid">
          <div
            v-for="size in availableSizes"
            :key="size"
            class="size-item"
            :class="{ active: selectedSizes.includes(size) }"
            @click="toggleSize(size)"
          >
            {{ size }}码
          </div>
        </div>
        <div class="size-tip">
          已选择 {{ selectedSizes.length }} 个尺码
        </div>
      </div>

      <!-- 预览卡片 -->
      <div class="card" v-if="previewProducts.length > 0">
        <div class="section-title">👀 预览（将添加 {{ previewProducts.length }} 个商品）</div>
        <div class="preview-list">
          <div
            v-for="(product, index) in previewProducts"
            :key="index"
            class="preview-item"
          >
            <div class="preview-name">{{ product.name }}</div>
            <div class="preview-meta">
              <span>{{ product.size }}码</span>
              <span>库存: {{ product.stock }}件</span>
              <span>¥{{ product.salePrice }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <van-button
          type="primary"
          block
          round
          size="large"
          :disabled="!canSubmit"
          @click="handleBatchAdd"
        >
          批量添加 {{ selectedSizes.length }} 个商品
        </van-button>
      </div>
    </div>

    <!-- 分类选择器 -->
    <van-popup 
      v-model:show="showCategoryPicker" 
      position="bottom" 
      round
      teleport="body"
      :z-index="3000"
      safe-area-inset-bottom
    >
      <van-picker
        :columns="categories"
        title="选择分类"
        @confirm="onCategoryConfirm"
        @cancel="showCategoryPicker = false"
      />
    </van-popup>

    <!-- 帮助说明 -->
    <van-dialog
      v-model:show="showHelp"
      title="使用说明"
      confirm-button-text="知道了"
    >
      <div style="padding: 16px; text-align: left;">
        <p><strong>批量添加功能说明：</strong></p>
        <ol style="padding-left: 20px; margin: 8px 0;">
          <li>填写商品基本信息（货号、颜色、价格等）</li>
          <li>选择需要添加的尺码（可多选）</li>
          <li>系统会自动为每个尺码创建一个商品</li>
          <li>商品名称自动生成：货号-颜色-尺码</li>
        </ol>
        <p style="margin-top: 12px; color: #ff976a;">
          <strong>提示：</strong>批量添加适合同款不同尺码的商品快速录入。
        </p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { showToast, showLoadingToast, closeToast } from 'vant'

const router = useRouter()
const productStore = useProductStore()

const showCategoryPicker = ref(false)
const showHelp = ref(false)

// 基本信息
const baseInfo = ref({
  code: '',
  color: '',
  category: '',
  costPrice: '',
  salePrice: '',
  stock: '10'
})

// 可选尺码（女鞋常用尺码）
const availableSizes = ['34', '35', '36', '37', '38', '39', '40', '41']

// 已选择的尺码
const selectedSizes = ref([])

// 分类列表（女鞋专属）
const categories = [
  '高跟鞋',
  '平底鞋',
  '运动鞋',
  '休闲鞋',
  '凉鞋',
  '拖鞋',
  '靴子',
  '单鞋',
  '帆布鞋',
  '板鞋',
  '厚底鞋',
  '其他'
]

// 切换尺码选择
const toggleSize = (size) => {
  const index = selectedSizes.value.indexOf(size)
  if (index > -1) {
    selectedSizes.value.splice(index, 1)
  } else {
    selectedSizes.value.push(size)
  }
  // 排序
  selectedSizes.value.sort((a, b) => parseInt(a) - parseInt(b))
}

// 分类确认
const onCategoryConfirm = ({ selectedOptions }) => {
  baseInfo.value.category = selectedOptions[0].text || selectedOptions[0]
  showCategoryPicker.value = false
}

// 预览商品列表
const previewProducts = computed(() => {
  if (!baseInfo.value.code || !baseInfo.value.color || selectedSizes.value.length === 0) {
    return []
  }

  return selectedSizes.value.map(size => ({
    name: `${baseInfo.value.code}-${baseInfo.value.color}-${size}码`,
    code: baseInfo.value.code,
    color: baseInfo.value.color,
    size: size,
    category: baseInfo.value.category,
    costPrice: parseFloat(baseInfo.value.costPrice) || 0,
    salePrice: parseFloat(baseInfo.value.salePrice) || 0,
    stock: parseInt(baseInfo.value.stock) || 0,
    minStock: 5
  }))
})

// 是否可以提交
const canSubmit = computed(() => {
  return (
    baseInfo.value.code &&
    baseInfo.value.color &&
    baseInfo.value.category &&
    baseInfo.value.costPrice &&
    baseInfo.value.salePrice &&
    baseInfo.value.stock &&
    selectedSizes.value.length > 0
  )
})

// 批量添加
const handleBatchAdd = async () => {
  if (!canSubmit.value) {
    showToast('请填写完整信息并选择尺码')
    return
  }

  // 验证价格
  const costPrice = parseFloat(baseInfo.value.costPrice)
  const salePrice = parseFloat(baseInfo.value.salePrice)
  const stock = parseInt(baseInfo.value.stock)

  if (isNaN(costPrice) || costPrice <= 0) {
    showToast('请输入有效的成本价')
    return
  }
  if (isNaN(salePrice) || salePrice <= 0) {
    showToast('请输入有效的销售价')
    return
  }
  if (isNaN(stock) || stock < 0) {
    showToast('请输入有效的库存数量')
    return
  }

  showLoadingToast({
    message: '正在添加...',
    forbidClick: true,
    duration: 0
  })

  try {
    let successCount = 0
    let failCount = 0

    for (const product of previewProducts.value) {
      try {
        await productStore.addProduct(product)
        successCount++
      } catch (error) {
        console.error('添加商品失败:', product.name, error)
        failCount++
      }
    }

    closeToast()

    if (failCount === 0) {
      showToast({
        type: 'success',
        message: `成功添加 ${successCount} 个商品！`
      })
      setTimeout(() => {
        router.back()
      }, 1000)
    } else {
      showToast({
        type: 'warning',
        message: `成功 ${successCount} 个，失败 ${failCount} 个`
      })
    }
  } catch (error) {
    closeToast()
    showToast('批量添加失败')
    console.error('批量添加异常:', error)
  }
}
</script>

<style scoped>
.batch-add-page {
  background-color: #f7f8fa;
  min-height: 100vh;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin: 16px;
  box-shadow: 0 2px 12px rgba(91, 143, 249, 0.08);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 16px;
}

.size-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.size-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
  border: 2px solid #ebedf0;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #646566;
  cursor: pointer;
  transition: all 0.3s ease;
}

.size-item:active {
  transform: scale(0.95);
}

.size-item.active {
  background: linear-gradient(135deg, #1989fa 0%, #0e6fd6 100%);
  border-color: #1989fa;
  color: white;
}

.size-tip {
  text-align: center;
  font-size: 13px;
  color: #969799;
  padding: 8px 0;
}

.preview-list {
  max-height: 300px;
  overflow-y: auto;
}

.preview-item {
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
  margin-bottom: 8px;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.preview-name {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 6px;
}

.preview-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #969799;
}

.actions {
  padding: 16px;
  margin-top: 16px;
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

