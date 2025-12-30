import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useProductStore } from './product'

export const useSalesStore = defineStore('sales', () => {
  const sales = ref([])
  const purchases = ref([])

  // 初始化示例销售数据
  const initSales = () => {
    return [
      {
        id: '1',
        productId: '1',
        productName: '耐克 Air Max 270',
        quantity: 2,
        costPrice: 450,
        salePrice: 899,
        totalAmount: 1798,
        profit: 898,
        date: new Date('2024-02-20').getTime(),
        type: 'sale'
      },
      {
        id: '2',
        productId: '2',
        productName: '阿迪达斯 Ultraboost',
        quantity: 1,
        costPrice: 520,
        salePrice: 999,
        totalAmount: 999,
        profit: 479,
        date: new Date('2024-02-21').getTime(),
        type: 'sale'
      },
      {
        id: '3',
        productId: '4',
        productName: '匡威 Chuck 70',
        quantity: 3,
        costPrice: 180,
        salePrice: 459,
        totalAmount: 1377,
        profit: 837,
        date: new Date('2024-02-22').getTime(),
        type: 'sale'
      }
    ]
  }

  // 初始化示例进货数据
  const initPurchases = () => {
    return [
      {
        id: '1',
        productId: '1',
        productName: '耐克 Air Max 270',
        quantity: 10,
        costPrice: 450,
        totalAmount: 4500,
        supplier: '耐克官方供应商',
        date: new Date('2024-02-15').getTime(),
        type: 'purchase'
      },
      {
        id: '2',
        productId: '2',
        productName: '阿迪达斯 Ultraboost',
        quantity: 8,
        costPrice: 520,
        totalAmount: 4160,
        supplier: '阿迪达斯官方',
        date: new Date('2024-02-16').getTime(),
        type: 'purchase'
      }
    ]
  }

  // 加载数据
  const loadSales = () => {
    const storedSales = localStorage.getItem('sales')
    const storedPurchases = localStorage.getItem('purchases')
    
    if (storedSales) {
      sales.value = JSON.parse(storedSales)
    } else {
      sales.value = initSales()
      saveSales()
    }

    if (storedPurchases) {
      purchases.value = JSON.parse(storedPurchases)
    } else {
      purchases.value = initPurchases()
      savePurchases()
    }
  }

  // 保存数据
  const saveSales = () => {
    localStorage.setItem('sales', JSON.stringify(sales.value))
  }

  const savePurchases = () => {
    localStorage.setItem('purchases', JSON.stringify(purchases.value))
  }

  // 添加销售记录（支持单商品和多商品订单）
  const addSale = (sale) => {
    const productStore = useProductStore()
    
    // 如果是多商品订单（购物车模式）
    if (sale.products && Array.isArray(sale.products)) {
      // 检查所有商品库存
      for (const item of sale.products) {
        const product = productStore.getProductById(item.productId)
        if (!product || product.stock < item.quantity) {
          return { success: false, message: `${item.productName || '商品'}库存不足` }
        }
      }

      // 计算总金额和利润
      let totalAmount = 0
      let totalProfit = 0
      
      const productsWithDetails = sale.products.map(item => {
        const product = productStore.getProductById(item.productId)
        const itemTotal = item.salePrice * item.quantity
        const itemProfit = (item.salePrice - product.costPrice) * item.quantity
        
        totalAmount += itemTotal
        totalProfit += itemProfit
        
        return {
          ...item,
          costPrice: product.costPrice
        }
      })

      const newSale = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        products: productsWithDetails,
        totalAmount,
        profit: totalProfit,
        time: Date.now(),
        date: Date.now(), // 兼容旧字段
        type: 'sale',
        salesperson: sale.salesperson || '老板',
        remark: sale.remark || '',
        discount: sale.discount || 1,
        receivedAmount: sale.receivedAmount || totalAmount,
        changeAmount: sale.changeAmount || 0
      }

      sales.value.unshift(newSale)
      
      // 更新所有商品库存
      productsWithDetails.forEach(item => {
        productStore.updateStock(item.productId, item.quantity, 'subtract')
      })
      
      saveSales()
      
      return { success: true, data: newSale }
    }
    
    // 单商品模式（兼容旧版本）
    const product = productStore.getProductById(sale.productId)
    
    if (!product || product.stock < sale.quantity) {
      return { success: false, message: '库存不足' }
    }

    const newSale = {
      ...sale,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      productId: sale.productId,
      productName: product.name,
      brand: product.brand,
      size: product.size,
      costPrice: product.costPrice,
      totalAmount: sale.salePrice * sale.quantity,
      profit: (sale.salePrice - product.costPrice) * sale.quantity,
      date: Date.now(),
      time: Date.now(),
      type: 'sale',
      salesperson: sale.salesperson || '老板',
      remark: sale.remark || '',
      discount: sale.discount || 1
    }

    sales.value.unshift(newSale)
    productStore.updateStock(sale.productId, sale.quantity, 'subtract')
    saveSales()
    
    return { success: true, data: newSale }
  }

  // 删除销售记录
  const deleteSale = (id) => {
    const index = sales.value.findIndex(s => s.id === id)
    if (index !== -1) {
      sales.value.splice(index, 1)
      saveSales()
      return true
    }
    return false
  }

  // 添加进货记录
  const addPurchase = (purchase) => {
    const productStore = useProductStore()
    const product = productStore.getProductById(purchase.productId)
    
    if (!product) {
      return { success: false, message: '商品不存在' }
    }

    const newPurchase = {
      ...purchase,
      id: Date.now().toString(),
      productName: product.name,
      totalAmount: purchase.costPrice * purchase.quantity,
      date: Date.now(),
      type: 'purchase'
    }

    purchases.value.unshift(newPurchase)
    productStore.updateStock(purchase.productId, purchase.quantity, 'add')
    
    // 更新商品成本价
    productStore.updateProduct(purchase.productId, { 
      costPrice: purchase.costPrice 
    })
    
    savePurchases()
    
    return { success: true, data: newPurchase }
  }

  // 获取所有销售记录
  const getAllSales = computed(() => sales.value)

  // 获取今日销售额
  const todaySales = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTime = today.getTime()
    
    return sales.value
      .filter(s => (s.time || s.date) >= todayTime)
      .reduce((sum, s) => sum + s.totalAmount, 0)
  })

  // 获取今日利润
  const todayProfit = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTime = today.getTime()
    
    return sales.value
      .filter(s => (s.time || s.date) >= todayTime)
      .reduce((sum, s) => sum + s.profit, 0)
  })

  // 获取本月销售额
  const monthSales = computed(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayTime = firstDay.getTime()
    
    return sales.value
      .filter(s => (s.time || s.date) >= firstDayTime)
      .reduce((sum, s) => sum + s.totalAmount, 0)
  })

  // 获取本月利润
  const monthProfit = computed(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayTime = firstDay.getTime()
    
    return sales.value
      .filter(s => (s.time || s.date) >= firstDayTime)
      .reduce((sum, s) => sum + s.profit, 0)
  })

  // 获取总销售额
  const totalSales = computed(() => {
    return sales.value.reduce((sum, s) => sum + s.totalAmount, 0)
  })

  // 获取总利润
  const totalProfit = computed(() => {
    return sales.value.reduce((sum, s) => sum + s.profit, 0)
  })

  // 获取销售趋势数据（最近7天）
  const salesTrend = computed(() => {
    const days = []
    const amounts = []
    const profits = []
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const dayStart = date.getTime()
      
      date.setHours(23, 59, 59, 999)
      const dayEnd = date.getTime()
      
      const dayLabel = `${date.getMonth() + 1}/${date.getDate()}`
      days.push(dayLabel)
      
      const daySales = sales.value.filter(s => {
        const saleTime = s.time || s.date
        return saleTime >= dayStart && saleTime <= dayEnd
      })
      const dayAmount = daySales.reduce((sum, s) => sum + s.totalAmount, 0)
      const dayProfit = daySales.reduce((sum, s) => sum + s.profit, 0)
      
      amounts.push(dayAmount)
      profits.push(dayProfit)
    }
    
    return { days, amounts, profits }
  })

  // 获取热销商品排行
  const topProducts = computed(() => {
    const productSales = {}
    
    sales.value.forEach(sale => {
      // 处理多商品订单
      if (sale.products && Array.isArray(sale.products)) {
        sale.products.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              productId: item.productId,
              productName: item.productName,
              quantity: 0,
              amount: 0
            }
          }
          productSales[item.productId].quantity += item.quantity
          productSales[item.productId].amount += item.salePrice * item.quantity
        })
      } else {
        // 处理单商品记录
        if (sale.productId) {
          if (!productSales[sale.productId]) {
            productSales[sale.productId] = {
              productId: sale.productId,
              productName: sale.productName,
              quantity: 0,
              amount: 0
            }
          }
          productSales[sale.productId].quantity += sale.quantity
          productSales[sale.productId].amount += sale.totalAmount
        }
      }
    })
    
    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  })

  // 获取员工业绩统计
  const salespersonStats = computed(() => {
    const stats = {}
    
    sales.value.forEach(sale => {
      const person = sale.salesperson || '老板'
      if (!stats[person]) {
        stats[person] = {
          name: person,
          salesCount: 0,
          totalAmount: 0,
          totalProfit: 0,
          quantity: 0
        }
      }
      stats[person].salesCount++
      stats[person].totalAmount += sale.totalAmount
      stats[person].totalProfit += sale.profit
      
      // 计算商品数量
      if (sale.products && Array.isArray(sale.products)) {
        stats[person].quantity += sale.products.reduce((sum, p) => sum + p.quantity, 0)
      } else {
        stats[person].quantity += sale.quantity || 0
      }
    })
    
    return Object.values(stats).sort((a, b) => b.totalAmount - a.totalAmount)
  })

  // 获取今日员工业绩
  const todaySalespersonStats = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTime = today.getTime()
    
    const stats = {}
    
    sales.value
      .filter(s => (s.time || s.date) >= todayTime)
      .forEach(sale => {
        const person = sale.salesperson || '老板'
        if (!stats[person]) {
          stats[person] = {
            name: person,
            salesCount: 0,
            totalAmount: 0,
            totalProfit: 0,
            quantity: 0
          }
        }
        stats[person].salesCount++
        stats[person].totalAmount += sale.totalAmount
        stats[person].totalProfit += sale.profit
        
        // 计算商品数量
        if (sale.products && Array.isArray(sale.products)) {
          stats[person].quantity += sale.products.reduce((sum, p) => sum + p.quantity, 0)
        } else {
          stats[person].quantity += sale.quantity || 0
        }
      })
    
    return Object.values(stats).sort((a, b) => b.totalAmount - a.totalAmount)
  })

  // 获取本月员工业绩
  const monthSalespersonStats = computed(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayTime = firstDay.getTime()
    
    const stats = {}
    
    sales.value
      .filter(s => (s.time || s.date) >= firstDayTime)
      .forEach(sale => {
        const person = sale.salesperson || '老板'
        if (!stats[person]) {
          stats[person] = {
            name: person,
            salesCount: 0,
            totalAmount: 0,
            totalProfit: 0,
            quantity: 0
          }
        }
        stats[person].salesCount++
        stats[person].totalAmount += sale.totalAmount
        stats[person].totalProfit += sale.profit
        
        // 计算商品数量
        if (sale.products && Array.isArray(sale.products)) {
          stats[person].quantity += sale.products.reduce((sum, p) => sum + p.quantity, 0)
        } else {
          stats[person].quantity += sale.quantity || 0
        }
      })
    
    return Object.values(stats).sort((a, b) => b.totalAmount - a.totalAmount)
  })

  return {
    sales,
    purchases,
    getAllSales,
    loadSales,
    addSale,
    deleteSale,
    addPurchase,
    todaySales,
    todayProfit,
    monthSales,
    monthProfit,
    totalSales,
    totalProfit,
    salesTrend,
    topProducts,
    salespersonStats,
    todaySalespersonStats,
    monthSalespersonStats
  }
})

