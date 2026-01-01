<template>
  <div class="product-form-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      :title="isEdit ? '编辑商品' : '添加商品'"
      left-arrow
      @click-left="router.back()"
    />

    <!-- 表单 -->
    <div class="content-wrapper">
      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <!-- 商品图片上传 -->
          <van-field name="image" label="商品图片">
            <template #input>
              <van-uploader
                v-model="fileList"
                :max-count="1"
                :after-read="afterRead"
                :before-delete="beforeDelete"
              >
                <div class="upload-placeholder">
                  <van-icon name="photograph" size="40" />
                  <div class="upload-text">点击上传图片</div>
                </div>
              </van-uploader>
            </template>
          </van-field>
          
          <van-field
            v-model="form.code"
            name="code"
            label="货号"
            placeholder="例如：206731-2 或 AYL505610-1"
            :rules="[{ required: true, message: '请输入货号' }]"
          >
            <template #extra>
              <span class="code-hint">支持字母数字组合</span>
            </template>
          </van-field>
          
          <van-field
            v-model="form.color"
            name="color"
            label="颜色"
            placeholder="请输入颜色"
            :rules="[{ required: true, message: '请输入颜色' }]"
          />
          
          <van-field
            v-model="form.size"
            name="size"
            label="尺码"
            placeholder="请选择尺码"
            readonly
            is-link
            @click="showSizePicker = true"
            :rules="[{ required: true, message: '请选择尺码' }]"
          />
          
          <van-field
            v-model="form.category"
            name="category"
            label="分类"
            placeholder="请输入或选择分类（可选）"
            is-link
            @click="showCategoryPicker = true"
          >
            <template #extra>
              <span style="font-size: 12px; color: #969799;">可自定义</span>
            </template>
          </van-field>
          
          <van-field
            v-model="displayName"
            name="displayName"
            label="显示名称"
            placeholder="自动生成"
            readonly
            disabled
          />
          
          <van-field
            v-model="form.costPrice"
            name="costPrice"
            type="number"
            label="成本价"
            placeholder="请输入成本价"
            :rules="[
              { required: true, message: '请输入成本价' },
              { validator: validatePositiveNumber, message: '成本价必须大于0' }
            ]"
            @blur="validateCostPrice"
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
            :rules="[
              { required: true, message: '请输入销售价' },
              { validator: validatePositiveNumber, message: '销售价必须大于0' }
            ]"
            @blur="validateSalePrice"
          >
            <template #button>
              <span>元</span>
            </template>
          </van-field>
          
          <van-field
            v-model="form.stock"
            name="stock"
            type="number"
            label="库存数量"
            placeholder="请输入库存数量"
            :rules="[
              { required: true, message: '请输入库存数量' },
              { validator: validateNonNegativeInteger, message: '库存必须为非负整数' }
            ]"
            @blur="validateStock"
          >
            <template #button>
              <span>件</span>
            </template>
          </van-field>
          
          <van-field
            v-model="form.minStock"
            name="minStock"
            type="number"
            label="最低库存"
            placeholder="请输入最低库存预警值"
            :rules="[
              { required: true, message: '请输入最低库存' },
              { validator: validateNonNegativeInteger, message: '最低库存必须为非负整数' }
            ]"
            @blur="validateMinStock"
          >
            <template #button>
              <span>件</span>
            </template>
          </van-field>
          
          <van-field
            v-model="form.supplier"
            name="supplier"
            label="供应商"
            placeholder="请输入供应商"
          />
        </van-cell-group>

        <div class="form-actions">
          <van-button 
            round 
            block 
            type="primary" 
            native-type="submit"
            size="large"
          >
            {{ isEdit ? '保存修改' : '添加商品' }}
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 分类选择器 -->
    <van-popup v-model:show="showCategoryPicker" position="bottom" round closeable>
      <div style="padding: 16px; padding-top: 40px;">
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 12px; text-align: center;">
          选择或输入分类
        </div>
        
        <!-- 自定义输入 -->
        <van-field
          v-model="customCategory"
          placeholder="输入自定义分类"
          clearable
          style="margin-bottom: 12px;"
        />
        
        <van-button 
          type="primary" 
          block 
          size="small"
          style="margin-bottom: 16px;"
          @click="onCustomCategoryConfirm"
        >
          使用自定义分类
        </van-button>
        
        <van-divider style="margin: 12px 0;">或选择常用分类</van-divider>
      </div>
      
      <van-picker
        :columns="categories"
        @confirm="onCategoryConfirm"
        @cancel="showCategoryPicker = false"
      />
    </van-popup>

    <!-- 尺码选择器 -->
    <van-popup v-model:show="showSizePicker" position="bottom">
      <van-picker
        :columns="sizes"
        @confirm="onSizeConfirm"
        @cancel="showSizePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()
const productStore = useProductStore()

const isEdit = ref(false)
const showCategoryPicker = ref(false)
const showSizePicker = ref(false)
const fileList = ref([])
const customCategory = ref('')

// 常用分类建议（女鞋专卖店）
const categorySuggestions = [
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

// 动态获取已有分类
const existingCategories = computed(() => {
  const categories = new Set()
  productStore.getAllProducts.forEach(product => {
    if (product.category && product.category.trim()) {
      categories.add(product.category)
    }
  })
  return Array.from(categories).sort()
})

// 合并建议分类和已有分类
const categories = computed(() => {
  const allCategories = new Set([...categorySuggestions, ...existingCategories.value])
  return Array.from(allCategories).sort()
})

// 鞋码范围（30-42码，整数）
const sizes = [
  '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42'
]

const form = ref({
  code: '',        // 货号
  color: '',       // 颜色
  size: '',        // 尺码
  category: '',    // 分类（可选）
  costPrice: '',   // 成本价
  salePrice: '',   // 销售价
  stock: '',       // 库存
  minStock: '5',   // 最低库存
  supplier: '',    // 供应商
  image: ''        // 图片
})

// 自动生成显示名称：货号-颜色-尺码
const displayName = computed(() => {
  const parts = []
  if (form.value.code) parts.push(form.value.code)
  if (form.value.color) parts.push(form.value.color)
  if (form.value.size) parts.push(form.value.size + '码')
  return parts.length > 0 ? parts.join('-') : '（自动生成）'
})

onMounted(() => {
  const productId = route.params.id
  if (productId) {
    isEdit.value = true
    const product = productStore.getProductById(productId)
    if (product) {
      form.value = {
        code: product.code || product.brand || '',  // 兼容旧数据：如果没有货号，使用品牌
        color: product.color || '',
        size: product.size || '',
        category: product.category || '',
        costPrice: product.costPrice.toString(),
        salePrice: product.salePrice.toString(),
        stock: product.stock.toString(),
        minStock: product.minStock.toString(),
        supplier: product.supplier || '',
        image: product.image || ''
      }
      
      // 加载已有图片
      if (product.image) {
        fileList.value = [{
          url: product.image,
          isImage: true
        }]
      }
    }
  }
})

// 图片上传后的处理
const afterRead = (file) => {
  // 将图片转换为base64格式存储
  const reader = new FileReader()
  reader.onload = (e) => {
    form.value.image = e.target.result
    fileList.value = [{
      url: e.target.result,
      isImage: true
    }]
  }
  reader.readAsDataURL(file.file)
}

// 删除图片前的处理
const beforeDelete = () => {
  form.value.image = ''
  return true
}

// 自定义分类确认
const onCustomCategoryConfirm = () => {
  if (customCategory.value && customCategory.value.trim()) {
    form.value.category = customCategory.value.trim()
    showCategoryPicker.value = false
    customCategory.value = ''
    showToast('已使用自定义分类')
  } else {
    showToast('请输入分类名称')
  }
}

const onCategoryConfirm = ({ selectedOptions }) => {
  form.value.category = selectedOptions[0].text || selectedOptions[0]
  showCategoryPicker.value = false
  customCategory.value = ''
}

const onSizeConfirm = ({ selectedOptions }) => {
  form.value.size = selectedOptions[0].text || selectedOptions[0]
  showSizePicker.value = false
}

// 验证正数（价格）
const validatePositiveNumber = (value) => {
  const num = parseFloat(value)
  return !isNaN(num) && num > 0
}

// 验证非负整数（库存）
const validateNonNegativeInteger = (value) => {
  const num = parseInt(value)
  return !isNaN(num) && num >= 0 && Number.isInteger(parseFloat(value))
}

// 成本价验证
const validateCostPrice = () => {
  const price = parseFloat(form.value.costPrice)
  if (isNaN(price) || price < 0) {
    form.value.costPrice = '0'
    showToast('成本价不能为负数')
  } else if (price < 0.01 && price !== 0) {
    form.value.costPrice = '0.01'
    showToast('成本价过小，已调整为0.01元')
  } else if (price > 999999) {
    form.value.costPrice = '999999'
    showToast('成本价过大，已调整为999999元')
  }
}

// 销售价验证
const validateSalePrice = () => {
  const price = parseFloat(form.value.salePrice)
  if (isNaN(price) || price < 0) {
    form.value.salePrice = '0'
    showToast('销售价不能为负数')
  } else if (price < 0.01 && price !== 0) {
    form.value.salePrice = '0.01'
    showToast('销售价过小，已调整为0.01元')
  } else if (price > 999999) {
    form.value.salePrice = '999999'
    showToast('销售价过大，已调整为999999元')
  }
}

// 库存验证
const validateStock = () => {
  const stock = parseInt(form.value.stock)
  if (isNaN(stock) || stock < 0) {
    form.value.stock = '0'
    showToast('库存不能为负数')
  } else if (!Number.isInteger(parseFloat(form.value.stock))) {
    form.value.stock = Math.floor(stock).toString()
    showToast('库存必须为整数')
  } else if (stock > 9999999) {
    form.value.stock = '9999999'
    showToast('库存数量过大')
  }
}

// 最低库存验证
const validateMinStock = () => {
  const minStock = parseInt(form.value.minStock)
  if (isNaN(minStock) || minStock < 0) {
    form.value.minStock = '0'
    showToast('最低库存不能为负数')
  } else if (!Number.isInteger(parseFloat(form.value.minStock))) {
    form.value.minStock = Math.floor(minStock).toString()
    showToast('最低库存必须为整数')
  } else if (minStock > 9999) {
    form.value.minStock = '9999'
    showToast('最低库存预警值过大')
  }
}

const onSubmit = () => {
  // 最终验证
  const costPrice = parseFloat(form.value.costPrice)
  const salePrice = parseFloat(form.value.salePrice)
  const stock = parseInt(form.value.stock)
  const minStock = parseInt(form.value.minStock)

  if (isNaN(costPrice) || costPrice < 0) {
    showToast('请输入有效的成本价')
    return
  }
  if (isNaN(salePrice) || salePrice < 0) {
    showToast('请输入有效的销售价')
    return
  }
  if (isNaN(stock) || stock < 0) {
    showToast('请输入有效的库存数量')
    return
  }
  if (isNaN(minStock) || minStock < 0) {
    showToast('请输入有效的最低库存')
    return
  }

  // 自动生成商品名称和品牌
  const autoName = displayName.value === '（自动生成）' ? '未命名商品' : displayName.value
  const autoBrand = form.value.code || '无品牌'  // 使用货号作为品牌标识
  
  const productData = {
    ...form.value,
    name: autoName,      // 自动生成的名称
    brand: autoBrand,    // 使用货号作为品牌
    costPrice,
    salePrice,
    stock,
    minStock
  }

  if (isEdit.value) {
    productStore.updateProduct(route.params.id, productData)
    showToast({
      type: 'success',
      message: '修改成功'
    })
  } else {
    productStore.addProduct(productData)
    showToast({
      type: 'success',
      message: '添加成功'
    })
  }

  router.back()
}
</script>

<style scoped>
.product-form-page {
  background-color: #f7f8fa;
}

.form-actions {
  padding: 16px;
  margin-top: 16px;
}

:deep(.van-cell-group) {
  margin: 16px;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px; /* 增加垂直内边距，扩大触摸区域 */
  min-height: 120px; /* 确保足够的触摸区域 */
  color: #969799;
  cursor: pointer;
  transition: background 0.2s;
}

.upload-placeholder:active {
  background: #f0f1f3;
}

.upload-text {
  margin-top: 8px;
  font-size: 14px;
}

.code-hint {
  font-size: 12px;
  color: #969799;
}
</style>

