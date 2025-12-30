import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, TABLES } from '../config/supabase'

export const useProductStore = defineStore('product', () => {
  const products = ref([])
  const loading = ref(false)

  // 将数据库格式转换为前端格式
  const dbToFrontend = (dbProduct) => {
    return {
      id: dbProduct.id,
      name: dbProduct.name,
      code: dbProduct.code,
      size: dbProduct.size || '',
      costPrice: parseFloat(dbProduct.purchase_price) || 0,
      salePrice: parseFloat(dbProduct.sale_price) || 0,
      stock: parseInt(dbProduct.stock) || 0,
      minStock: 0, // 数据库中没有这个字段，默认0
      image: dbProduct.image || '',
      createTime: new Date(dbProduct.created_at).getTime(),
      // 兼容字段
      brand: '',
      category: '',
      color: '',
      supplier: ''
    }
  }

  // 将前端格式转换为数据库格式
  const frontendToDb = (product) => {
    return {
      name: product.name,
      code: product.code || `${product.name}_${product.size || ''}_${Date.now()}`,
      size: product.size || '',
      purchase_price: parseFloat(product.costPrice) || 0,
      sale_price: parseFloat(product.salePrice) || 0,
      stock: parseInt(product.stock) || 0,
      image: product.image || null
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
      // 尝试从localStorage迁移（仅一次）
      await migrateFromLocalStorage()

      // 从云端加载数据
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('加载商品失败:', error)
        // 如果云端加载失败，尝试从localStorage加载
        const stored = localStorage.getItem('products')
        if (stored) {
          products.value = JSON.parse(stored)
        }
        return
      }

      // 转换数据格式
      const cloudProducts = data.map(dbToFrontend)
      products.value = cloudProducts
      
      // 同步更新localStorage，确保与云端一致
      await saveProducts()
    } catch (error) {
      console.error('加载商品异常:', error)
      // 降级到localStorage
      const stored = localStorage.getItem('products')
      if (stored) {
        products.value = JSON.parse(stored)
      }
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

  // 获取低库存商品
  const lowStockProducts = computed(() => {
    return products.value.filter(p => p.stock <= (p.minStock || 0))
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

      if (error) throw error

      const newProduct = dbToFrontend(data)
      products.value.unshift(newProduct)
      await saveProducts()
      
      return newProduct
    } catch (error) {
      console.error('添加商品失败:', error)
      // 降级到localStorage
      const newProduct = {
        ...product,
        id: Date.now().toString(),
        createTime: Date.now()
      }
      products.value.push(newProduct)
      saveProducts()
      return newProduct
    }
  }

  // 更新商品
  const updateProduct = async (id, updates) => {
    try {
      const dbUpdates = {}
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.code !== undefined) dbUpdates.code = updates.code
      if (updates.size !== undefined) dbUpdates.size = updates.size
      if (updates.costPrice !== undefined) dbUpdates.purchase_price = updates.costPrice
      if (updates.salePrice !== undefined) dbUpdates.sale_price = updates.salePrice
      if (updates.stock !== undefined) dbUpdates.stock = updates.stock
      if (updates.image !== undefined) dbUpdates.image = updates.image

      const { error } = await supabase
        .from(TABLES.PRODUCTS)
        .update(dbUpdates)
        .eq('id', id)

      if (error) throw error

      // 更新本地状态
      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) {
        products.value[index] = { ...products.value[index], ...updates }
        await saveProducts()
        return true
      }
      return false
    } catch (error) {
      console.error('更新商品失败:', error)
      // 降级到localStorage
      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) {
        products.value[index] = { ...products.value[index], ...updates }
        saveProducts()
        return true
      }
      return false
    }
  }

  // 删除商品
  const deleteProduct = async (id) => {
    const index = products.value.findIndex(p => p.id === id)
    if (index === -1) {
      return false
    }
    
    // 临时保存，如果删除失败可以恢复
    const tempProduct = products.value[index]
    
    try {
      // 先从本地删除，避免UI延迟
      products.value.splice(index, 1)
      
      // 立即更新localStorage
      await saveProducts()
      
      // 从云端删除
      const { error } = await supabase
        .from(TABLES.PRODUCTS)
        .delete()
        .eq('id', id)

      if (error) {
        // 如果云端删除失败，恢复本地数据
        products.value.splice(index, 0, tempProduct)
        await saveProducts()
        throw error
      }

      return true
    } catch (error) {
      console.error('删除商品失败:', error)
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
