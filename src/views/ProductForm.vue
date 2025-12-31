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
            v-model="form.name"
            name="name"
            label="商品名称"
            placeholder="请输入商品名称"
            :rules="[{ required: true, message: '请输入商品名称' }]"
          />
          
          <van-field
            v-model="form.brand"
            name="brand"
            label="品牌"
            placeholder="请输入品牌"
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
            placeholder="请输入颜色"
            :rules="[{ required: true, message: '请输入颜色' }]"
          />
          
          <van-field
            v-model="form.size"
            name="size"
            label="尺码"
            placeholder="请输入尺码"
            :rules="[{ required: true, message: '请输入尺码' }]"
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()
const productStore = useProductStore()

const isEdit = ref(false)
const showCategoryPicker = ref(false)
const fileList = ref([])

const categories = [
  '运动鞋',
  '休闲鞋',
  '皮鞋',
  '帆布鞋',
  '滑板鞋',
  '凉鞋',
  '靴子',
  '其他'
]

const form = ref({
  name: '',
  brand: '',
  category: '',
  color: '',
  size: '',
  costPrice: '',
  salePrice: '',
  stock: '',
  minStock: '5',
  supplier: '',
  image: ''
})

onMounted(() => {
  const productId = route.params.id
  if (productId) {
    isEdit.value = true
    const product = productStore.getProductById(productId)
    if (product) {
      form.value = {
        ...product,
        costPrice: product.costPrice.toString(),
        salePrice: product.salePrice.toString(),
        stock: product.stock.toString(),
        minStock: product.minStock.toString()
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

const onCategoryConfirm = ({ selectedOptions }) => {
  form.value.category = selectedOptions[0].text
  showCategoryPicker.value = false
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

  const productData = {
    ...form.value,
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
  padding: 20px;
  color: #969799;
}

.upload-text {
  margin-top: 8px;
  font-size: 14px;
}
</style>

