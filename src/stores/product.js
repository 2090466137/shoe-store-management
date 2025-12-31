import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, TABLES } from '../config/supabase'
import { checkLowStockAndNotify, checkZeroStockAndNotify } from '../utils/notification'

export const useProductStore = defineStore('product', () => {
  const products = ref([])
  const loading = ref(false)

  // 将数据库格式转换为前端格式
  const dbToFrontend = (dbProduct) => {
    // 从 code 中解析品牌、分类、颜色信息（如果有的话）
    // code 格式可能是: 品牌_款式_尺码_颜色 或者自定义格式
    const codeParts = (dbProduct.code || '').split('_')
    
    return {
      id: dbProduct.id,
      name: dbProduct.name,
      code: dbProduct.code,
      size: dbProduct.size || '',
      costPrice: parseFloat(dbProduct.purchase_price) || 0,
      salePrice: parseFloat(dbProduct.sale_price) || 0,
      stock: parseInt(dbProduct.stock) || 0,
      minStock: parseInt(dbProduct.min_stock) || 5, // 默认最低库存为5
      image: dbProduct.image || '',
      createTime: new Date(dbProduct.created_at).getTime(),
      // 扩展字段 - 从数据库读取或使用默认值
      brand: dbProduct.brand || '',
      category: dbProduct.category || '其他',
      color: dbProduct.color || '',
      supplier: dbProduct.supplier || ''
    }
  }

  // 生成商品代码（提高可读性）
  const generateProductCode = (product) => {
    if (product.code) return product.code
    
    // 使用 UUID v4 的简化版本（8位随机字符）
    const randomId = Math.random().toString(36).substring(2, 10).toUpperCase()
    const brand = (product.brand || 'UNKNOWN').substring(0, 4).toUpperCase()
    const size = product.size || 'NA'
    
    return `${brand}_${product.name.substring(0, 6)}_${size}_${randomId}`
  }

  // 将前端格式转换为数据库格式
  const frontendToDb = (product) => {
    return {
      name: product.name,
      code: generateProductCode(product),
      size: product.size || '',
      purchase_price: parseFloat(product.costPrice) || 0,
      sale_price: parseFloat(product.salePrice) || 0,
      stock: parseInt(product.stock) || 0,
      min_stock: parseInt(product.minStock) || 5,
      image: product.image || null,
      // 扩展字段
      brand: product.brand || null,
      category: product.category || '其他',
      color: product.color || null,
      supplier: product.supplier || null
    }
  }

  // 从localStorage迁移到云端（一次性操作）
  const migrateFromLocalStorage = async () => {
    const stored = localStorage.getItem('products')
    if (!stored) return

    try {
      const localProducts = JSON.parse(stored)
      console.log(`🔄 发现本地商品数据 ${localProducts.length} 条，准备迁移...`)

      for (const product of localProducts) {
        const dbProduct = frontendToDb(product)
        const { error } = await supabase
          .from(TABLES.PRODUCTS)
          .upsert([{ ...dbProduct, id: product.id }])

        if (error) {
          console.error('迁移商品失败:', product.name, error)
        }
      }

      console.log('✅ 商品数据迁移完成')
      // 迁移成功后可以选择删除本地数据
      // localStorage.removeItem('products')
    } catch (error) {
      console.error('❌ 商品数据迁移失败:', error)
    }
  }

  // 智能合并云端和本地数据
  const smartMergeProducts = (cloudProducts, localProducts) => {
    const merged = new Map()

    // 先添加云端数据（优先级高）
    cloudProducts.forEach(product => {
      merged.set(product.id, product)
    })

    // 再添加本地独有的数据
    localProducts.forEach(product => {
      if (!merged.has(product.id)) {
        merged.set(product.id, product)
      }
    })

    return Array.from(merged.values())
  }

  // 从云端加载商品
  const loadProducts = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ 从云端加载商品失败:', error)
        // 降级到本地存储
        const stored = localStorage.getItem('products')
        if (stored) {
          products.value = JSON.parse(stored)
          console.log('✅ 已从本地加载商品数据')
        }
        return false
      }

      const cloudProducts = data.map(dbToFrontend)
      
      // 获取本地数据
      const stored = localStorage.getItem('products')
      const localProducts = stored ? JSON.parse(stored) : []

      // 智能合并
      products.value = smartMergeProducts(cloudProducts, localProducts)
      
      // 保存合并后的数据到本地
      saveProducts()

      console.log(`✅ 已加载 ${products.value.length} 个商品`)
      return true
    } catch (error) {
      console.error('❌ 加载商品失败:', error)
      // 降级到本地存储
      const stored = localStorage.getItem('products')
      if (stored) {
        products.value = JSON.parse(stored)
      }
      return false
    } finally {
      loading.value = false
    }
  }

  const saveProducts = () => {
    try {
      localStorage.setItem('products', JSON.stringify(products.value))
    } catch (error) {
      console.error('❌ 保存商品到本地失败:', error)
    }
  }

  // 保存单个商品到云端
  const saveProductToCloud = async (product) => {
    try {
      const dbProduct = frontendToDb(product)
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .upsert([{ ...dbProduct, id: product.id }])
        .select()

      if (error) {
        console.error('❌ 保存商品到云端失败:', error)
        return false
      }

      console.log('✅ 商品已同步到云端:', product.name)
      return true
    } catch (error) {
      console.error('❌ 保存商品到云端异常:', error)
      return false
    }
  }

  // 添加商品
  const addProduct = async (product) => {
    const newProduct = {
      id: Date.now().toString(),
      ...product,
      createTime: Date.now()
    }

    // 先保存到云端
    const cloudSuccess = await saveProductToCloud(newProduct)
    if (!cloudSuccess) {
      console.warn('⚠️ 云端保存失败，仅保存到本地')
    }

    // 添加到本地
    products.value.unshift(newProduct)
    saveProducts()

    // 检查库存预警
    checkLowStockAndNotify(newProduct)
    checkZeroStockAndNotify(newProduct)

    return newProduct
  }

  // 更新商品
  const updateProduct = async (id, updates) => {
    const index = products.value.findIndex(p => p.id === id)
    if (index === -1) return false

    const oldProduct = { ...products.value[index] }
    const updatedProduct = { ...oldProduct, ...updates }

    // 先更新云端
    const cloudSuccess = await saveProductToCloud(updatedProduct)
    if (!cloudSuccess) {
      console.warn('⚠️ 云端更新失败，仅更新本地')
    }

    // 更新本地
    products.value[index] = updatedProduct
    saveProducts()

    // 检查库存预警
    checkLowStockAndNotify(updatedProduct)
    checkZeroStockAndNotify(updatedProduct)

    return true
  }

  // 删除商品
  const deleteProduct = async (id) => {
    const index = products.value.findIndex(p => p.id === id)
    if (index === -1) return false

    // 先从云端删除
    try {
      const { error } = await supabase
        .from(TABLES.PRODUCTS)
        .delete()
        .eq('id', id)

      if (error) {
        console.error('❌ 从云端删除商品失败:', error)
      } else {
        console.log('✅ 商品已从云端删除')
      }
    } catch (error) {
      console.error('❌ 删除商品异常:', error)
    }

    // 从本地删除
    products.value.splice(index, 1)
    saveProducts()
    return true
  }

  // 更新库存
  const updateStock = async (productId, quantity, type = 'add') => {
    const product = products.value.find(p => p.id === productId)
    if (!product) {
      console.error('❌ 商品不存在:', productId)
      return false
    }

    const oldStock = product.stock
    
    if (type === 'add') {
      product.stock += quantity
    } else if (type === 'subtract') {
      if (product.stock < quantity) {
        console.error('❌ 库存不足:', product.name)
        return false
      }
      product.stock -= quantity
    }

    // 同步到云端
    await saveProductToCloud(product)
    
    // 保存到本地
    saveProducts()

    console.log(`✅ 商品 ${product.name} 库存已更新: ${oldStock} → ${product.stock}`)

    // 检查库存预警
    checkLowStockAndNotify(product)
    checkZeroStockAndNotify(product)

    return true
  }

  // Getters
  const getAllProducts = computed(() => products.value)
  
  const getProductById = (id) => {
    return products.value.find(p => p.id === id)
  }

  const getLowStockProducts = computed(() => {
    return products.value.filter(p => p.stock <= p.minStock && p.stock > 0)
  })

  const getOutOfStockProducts = computed(() => {
    return products.value.filter(p => p.stock === 0)
  })

  const getTotalValue = computed(() => {
    return products.value.reduce((sum, p) => sum + (p.costPrice * p.stock), 0)
  })

  const searchProducts = (keyword) => {
    if (!keyword) return products.value
    
    const lowerKeyword = keyword.toLowerCase()
    return products.value.filter(p => 
      p.name.toLowerCase().includes(lowerKeyword) ||
      (p.code && p.code.toLowerCase().includes(lowerKeyword)) ||
      (p.brand && p.brand.toLowerCase().includes(lowerKeyword)) ||
      (p.category && p.category.toLowerCase().includes(lowerKeyword))
    )
  }

  return {
    products,
    loading,
    loadProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    getAllProducts,
    getProductById,
    getLowStockProducts,
    getOutOfStockProducts,
    getTotalValue,
    searchProducts,
    migrateFromLocalStorage
  }
})
