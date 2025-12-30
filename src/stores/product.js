import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useProductStore = defineStore('product', () => {
  const products = ref([])
  
  // 初始化示例数据
  const initProducts = () => {
    return [
      {
        id: '1',
        name: '耐克 Air Max 270',
        brand: '耐克',
        category: '运动鞋',
        color: '黑白',
        size: '42',
        costPrice: 450,
        salePrice: 899,
        stock: 15,
        minStock: 5,
        supplier: '耐克官方供应商',
        image: 'https://via.placeholder.com/150',
        createTime: new Date('2024-01-15').getTime()
      },
      {
        id: '2',
        name: '阿迪达斯 Ultraboost',
        brand: '阿迪达斯',
        category: '运动鞋',
        color: '白色',
        size: '41',
        costPrice: 520,
        salePrice: 999,
        stock: 8,
        minStock: 5,
        supplier: '阿迪达斯官方',
        image: 'https://via.placeholder.com/150',
        createTime: new Date('2024-01-20').getTime()
      },
      {
        id: '3',
        name: '新百伦 574',
        brand: '新百伦',
        category: '休闲鞋',
        color: '灰色',
        size: '43',
        costPrice: 280,
        salePrice: 599,
        stock: 3,
        minStock: 5,
        supplier: '新百伦代理商',
        image: 'https://via.placeholder.com/150',
        createTime: new Date('2024-02-01').getTime()
      },
      {
        id: '4',
        name: '匡威 Chuck 70',
        brand: '匡威',
        category: '帆布鞋',
        color: '黑色',
        size: '40',
        costPrice: 180,
        salePrice: 459,
        stock: 20,
        minStock: 8,
        supplier: '匡威专卖',
        image: 'https://via.placeholder.com/150',
        createTime: new Date('2024-02-10').getTime()
      },
      {
        id: '5',
        name: 'Vans Old Skool',
        brand: 'Vans',
        category: '滑板鞋',
        color: '黑白',
        size: '42',
        costPrice: 200,
        salePrice: 499,
        stock: 12,
        minStock: 6,
        supplier: 'Vans官方',
        image: 'https://via.placeholder.com/150',
        createTime: new Date('2024-02-15').getTime()
      }
    ]
  }

  // 加载商品数据
  const loadProducts = () => {
    const stored = localStorage.getItem('products')
    if (stored) {
      products.value = JSON.parse(stored)
    } else {
      products.value = initProducts()
      saveProducts()
    }
  }

  // 保存商品数据
  const saveProducts = () => {
    localStorage.setItem('products', JSON.stringify(products.value))
  }

  // 获取所有商品
  const getAllProducts = computed(() => products.value)

  // 获取低库存商品
  const lowStockProducts = computed(() => {
    return products.value.filter(p => p.stock <= p.minStock)
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
  const addProduct = (product) => {
    const newProduct = {
      ...product,
      id: Date.now().toString(),
      createTime: Date.now()
    }
    products.value.push(newProduct)
    saveProducts()
    return newProduct
  }

  // 更新商品
  const updateProduct = (id, updates) => {
    const index = products.value.findIndex(p => p.id === id)
    if (index !== -1) {
      products.value[index] = { ...products.value[index], ...updates }
      saveProducts()
      return true
    }
    return false
  }

  // 删除商品
  const deleteProduct = (id) => {
    const index = products.value.findIndex(p => p.id === id)
    if (index !== -1) {
      products.value.splice(index, 1)
      saveProducts()
      return true
    }
    return false
  }

  // 更新库存
  const updateStock = (id, quantity, type = 'add') => {
    const product = products.value.find(p => p.id === id)
    if (product) {
      if (type === 'add') {
        product.stock += quantity
      } else if (type === 'subtract') {
        product.stock -= quantity
      }
      saveProducts()
      return true
    }
    return false
  }

  // 搜索商品
  const searchProducts = (keyword) => {
    if (!keyword) return products.value
    const lowerKeyword = keyword.toLowerCase()
    return products.value.filter(p => 
      p.name.toLowerCase().includes(lowerKeyword) ||
      p.brand.toLowerCase().includes(lowerKeyword) ||
      p.category.toLowerCase().includes(lowerKeyword)
    )
  }

  return {
    products,
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

