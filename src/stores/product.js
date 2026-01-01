import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, TABLES } from '../config/supabase'
import { checkLowStockAndNotify, checkZeroStockAndNotify } from '../utils/notification'

export const useProductStore = defineStore('product', () => {
  const products = ref([])
  const loading = ref(false)
  
  // 获取操作日志 Store（延迟导入避免循环依赖）
  const getLogStore = () => {
    const { useOperationLogStore } = require('./operationLog')
    return useOperationLogStore()
  }

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
      if (localProducts.length === 0) return

      // 检查云端是否已有数据
      const { data: cloudProducts } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .limit(1)

      if (cloudProducts && cloudProducts.length > 0) {
        // 云端已有数据，不迁移
        return
      }

      // 批量插入本地数据到云端
      const dbProducts = localProducts.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code || `${p.name}_${p.size || ''}_${p.id}`,
        size: p.size || '',
        purchase_price: parseFloat(p.costPrice) || 0,
        sale_price: parseFloat(p.salePrice) || 0,
        stock: parseInt(p.stock) || 0,
        image: p.image || null
      }))

      const { error } = await supabase
        .from(TABLES.PRODUCTS)
        .insert(dbProducts)

      if (!error) {
        console.log('数据已从localStorage迁移到云端')
        // 迁移成功后可以清除localStorage
        // localStorage.removeItem('products')
      }
    } catch (error) {
      console.error('迁移数据失败:', error)
    }
  }

  // 从云端加载商品数据
  const loadProducts = async () => {
    loading.value = true
    try {
      // 先从 localStorage 加载（作为初始数据，防止数据丢失）
      const stored = localStorage.getItem('products')
      if (stored) {
        products.value = JSON.parse(stored)
        console.log('✅ 从 localStorage 加载了', products.value.length, '个商品')
      }

      // 尝试从localStorage迁移（仅一次）
      await migrateFromLocalStorage()

      // 从云端加载数据
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ 云端加载失败:', error)
        console.log('⚠️ 使用 localStorage 数据')
        // 不清空 products.value，继续使用 localStorage 数据
        return
      }

      // 转换数据格式
      const cloudProducts = data.map(dbToFrontend)
      
      // 只有在云端有数据时才更新
      if (cloudProducts.length > 0) {
        products.value = cloudProducts
        console.log('✅ 从云端加载了', cloudProducts.length, '个商品')
        
        // 同步更新localStorage
        await saveProducts()
      } else {
        console.log('⚠️ 云端无数据，保持 localStorage 数据')
      }
      
      // 检查库存并发送通知
      checkLowStockAndNotify(products.value, 5)
      checkZeroStockAndNotify(products.value)
    } catch (error) {
      console.error('❌ 加载商品异常:', error)
      // 不清空数据，继续使用 localStorage
      console.log('⚠️ 使用 localStorage 数据')
    } finally {
      loading.value = false
    }
  }

  // 保存到云端（也保存到localStorage作为备份）
  const saveProducts = async () => {
    try {
      // 同步到localStorage作为备份
      localStorage.setItem('products', JSON.stringify(products.value))
    } catch (error) {
      console.error('保存到localStorage失败:', error)
    }
  }

  // 获取所有商品
  const getAllProducts = computed(() => products.value)

  // 获取低库存商品（库存 <= 最低库存阈值，默认阈值为5）
  const lowStockProducts = computed(() => {
    return products.value.filter(p => {
      const minStock = p.minStock || 5 // 默认最低库存为5
      return p.stock <= minStock
    })
  })

  // 获取商品总数
  const totalProducts = computed(() => products.value.length)

  // 获取库存总值
  const totalStockValue = computed(() => {
    return products.value.reduce((sum, p) => sum + (p.costPrice * p.stock), 0)
  })

  // 根据ID获取商品
  const getProductById = (id) => {
    return products.value.find(p => p.id === id)
  }

  // 添加商品
  const addProduct = async (product) => {
    try {
      const dbProduct = frontendToDb(product)
      
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .insert([dbProduct])
        .select()
        .single()

      if (error) {
        console.error('❌ 云端保存失败:', error)
        // 降级到 localStorage
        const newProduct = {
          ...product,
          id: `local_${Date.now()}`,
          createTime: Date.now()
        }
        products.value.unshift(newProduct)
        await saveProducts()
        console.log('⚠️ 商品已保存到 localStorage（云端失败）')
        
        // 记录操作日志
        try {
          const logStore = getLogStore()
          await logStore.addLog({
            operationType: logStore.OPERATION_TYPES.PRODUCT_ADD,
            targetType: 'product',
            targetId: newProduct.id,
            targetName: `${newProduct.name} (${newProduct.size}码)`,
            details: `添加商品：货号 ${newProduct.code}，${newProduct.name}，库存${newProduct.stock}件`,
            newValue: JSON.stringify(newProduct)
          })
        } catch (logError) {
          console.warn('⚠️ 记录日志失败:', logError)
        }
        
        return newProduct
      }

      const newProduct = dbToFrontend(data)
      products.value.unshift(newProduct)
      await saveProducts()
      console.log('✅ 商品已保存到云端和 localStorage')
      
      // 记录操作日志
      try {
        const logStore = getLogStore()
        await logStore.addLog({
          operationType: logStore.OPERATION_TYPES.PRODUCT_ADD,
          targetType: 'product',
          targetId: newProduct.id,
          targetName: `${newProduct.name} (${newProduct.size}码)`,
          details: `添加商品：货号 ${newProduct.code}，${newProduct.name}，库存${newProduct.stock}件`,
          newValue: JSON.stringify(newProduct)
        })
      } catch (logError) {
        console.warn('⚠️ 记录日志失败:', logError)
      }
      
      return newProduct
    } catch (error) {
      console.error('❌ 添加商品异常:', error)
      // 降级到 localStorage
      const newProduct = {
        ...product,
        id: `local_${Date.now()}`,
        createTime: Date.now()
      }
      products.value.unshift(newProduct)
      await saveProducts()
      console.log('⚠️ 商品已保存到 localStorage（异常降级）')
      
      // 记录操作日志
      try {
        const logStore = getLogStore()
        await logStore.addLog({
          operationType: logStore.OPERATION_TYPES.PRODUCT_ADD,
          targetType: 'product',
          targetId: newProduct.id,
          targetName: `${newProduct.name} (${newProduct.size}码)`,
          details: `添加商品：货号 ${newProduct.code}，${newProduct.name}，库存${newProduct.stock}件`,
          newValue: JSON.stringify(newProduct)
        })
      } catch (logError) {
        console.warn('⚠️ 记录日志失败:', logError)
      }
      
      return newProduct
    }
  }

  // 更新商品
  const updateProduct = async (id, updates) => {
    try {
      // 保存旧值用于日志
      const index = products.value.findIndex(p => p.id === id)
      const oldProduct = index !== -1 ? { ...products.value[index] } : null
      
      const dbUpdates = {}
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.code !== undefined) dbUpdates.code = updates.code
      if (updates.size !== undefined) dbUpdates.size = updates.size
      if (updates.costPrice !== undefined) dbUpdates.purchase_price = updates.costPrice
      if (updates.salePrice !== undefined) dbUpdates.sale_price = updates.salePrice
      if (updates.stock !== undefined) dbUpdates.stock = updates.stock
      if (updates.minStock !== undefined) dbUpdates.min_stock = updates.minStock
      if (updates.image !== undefined) dbUpdates.image = updates.image
      // 扩展字段
      if (updates.brand !== undefined) dbUpdates.brand = updates.brand
      if (updates.category !== undefined) dbUpdates.category = updates.category
      if (updates.color !== undefined) dbUpdates.color = updates.color
      if (updates.supplier !== undefined) dbUpdates.supplier = updates.supplier

      const { error } = await supabase
        .from(TABLES.PRODUCTS)
        .update(dbUpdates)
        .eq('id', id)

      if (error) throw error

      // 更新本地状态
      if (index !== -1) {
        products.value[index] = { ...products.value[index], ...updates }
        await saveProducts()
        
        // 记录操作日志
        try {
          const logStore = getLogStore()
          const newProduct = products.value[index]
          await logStore.addLog({
            operationType: logStore.OPERATION_TYPES.PRODUCT_UPDATE,
            targetType: 'product',
            targetId: id,
            targetName: `${newProduct.name} (${newProduct.size}码)`,
            details: `修改商品信息`,
            oldValue: JSON.stringify(oldProduct),
            newValue: JSON.stringify(newProduct)
          })
        } catch (logError) {
          console.warn('⚠️ 记录日志失败:', logError)
        }
        
        return true
      }
      return false
    } catch (error) {
      console.error('更新商品失败:', error)
      // 降级到localStorage
      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) {
        const oldProduct = { ...products.value[index] }
        products.value[index] = { ...products.value[index], ...updates }
        saveProducts()
        
        // 记录操作日志
        try {
          const logStore = getLogStore()
          const newProduct = products.value[index]
          await logStore.addLog({
            operationType: logStore.OPERATION_TYPES.PRODUCT_UPDATE,
            targetType: 'product',
            targetId: id,
            targetName: `${newProduct.name} (${newProduct.size}码)`,
            details: `修改商品信息`,
            oldValue: JSON.stringify(oldProduct),
            newValue: JSON.stringify(newProduct)
          })
        } catch (logError) {
          console.warn('⚠️ 记录日志失败:', logError)
        }
        
        return true
      }
      return false
    }
  }

  // 删除商品
  const deleteProduct = async (id) => {
    const index = products.value.findIndex(p => p.id === id)
    if (index === -1) {
      console.error('❌ 商品不存在:', id)
      return false
    }
    
    // 临时保存，如果删除失败可以恢复
    const tempProduct = products.value[index]
    
    try {
      // 先从本地删除，避免UI延迟
      products.value.splice(index, 1)
      
      // 立即更新localStorage
      await saveProducts()
      
      // 判断是否是本地商品（ID 以 'local_' 开头）
      const isLocalProduct = String(id).startsWith('local_')
      
      if (isLocalProduct) {
        // 本地商品，只需要从 localStorage 删除即可
        console.log('✅ 本地商品已删除:', id)
        
        // 记录操作日志
        try {
          const logStore = getLogStore()
          await logStore.addLog({
            operationType: logStore.OPERATION_TYPES.PRODUCT_DELETE,
            targetType: 'product',
            targetId: id,
            targetName: `${tempProduct.name} (${tempProduct.size}码)`,
            details: `删除商品：货号 ${tempProduct.code}，${tempProduct.name}`,
            oldValue: JSON.stringify(tempProduct)
          })
        } catch (logError) {
          console.warn('⚠️ 记录日志失败:', logError)
        }
        
        return true
      }
      
      // 云端商品，需要从 Supabase 删除
      const { error } = await supabase
        .from(TABLES.PRODUCTS)
        .delete()
        .eq('id', id)

      if (error) {
        console.error('❌ 云端删除失败:', error)
        // 如果云端删除失败，恢复本地数据
        products.value.splice(index, 0, tempProduct)
        await saveProducts()
        throw error
      }

      console.log('✅ 云端商品已删除:', id)
      
      // 记录操作日志
      try {
        const logStore = getLogStore()
        await logStore.addLog({
          operationType: logStore.OPERATION_TYPES.PRODUCT_DELETE,
          targetType: 'product',
          targetId: id,
          targetName: `${tempProduct.name} (${tempProduct.size}码)`,
          details: `删除商品：货号 ${tempProduct.code}，${tempProduct.name}`,
          oldValue: JSON.stringify(tempProduct)
        })
      } catch (logError) {
        console.warn('⚠️ 记录日志失败:', logError)
      }
      
      return true
    } catch (error) {
      console.error('❌ 删除商品失败:', error)
      // 如果云端删除失败，检查是否需要恢复
      const currentIndex = products.value.findIndex(p => p.id === id)
      if (currentIndex === -1 && tempProduct) {
        // 如果商品不在列表中，说明已经被删除了，恢复它
        products.value.splice(index, 0, tempProduct)
        await saveProducts()
      }
      return false
    }
  }

  // 更新库存
  const updateStock = async (id, quantity, type = 'add') => {
    const product = products.value.find(p => p.id === id)
    if (!product) return false

    const newStock = type === 'add' 
      ? product.stock + quantity 
      : product.stock - quantity

    return await updateProduct(id, { stock: newStock })
  }

  // 搜索商品
  const searchProducts = (keyword) => {
    if (!keyword) return products.value
    const lowerKeyword = keyword.toLowerCase()
    return products.value.filter(p => 
      p.name.toLowerCase().includes(lowerKeyword) ||
      (p.code && p.code.toLowerCase().includes(lowerKeyword)) ||
      (p.size && p.size.toLowerCase().includes(lowerKeyword))
    )
  }

  return {
    products,
    loading,
    getAllProducts,
    lowStockProducts,
    totalProducts,
    totalStockValue,
    loadProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    searchProducts
  }
})
