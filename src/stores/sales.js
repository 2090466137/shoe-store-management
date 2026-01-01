import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useProductStore } from './product'
import { supabase, TABLES } from '../config/supabase'

export const useSalesStore = defineStore('sales', () => {
  const sales = ref([])
  const purchases = ref([])
  const loading = ref(false)

  // 生成订单号
  const generateOrderId = () => {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '')
    const random = Math.random().toString(36).substr(2, 4).toUpperCase()
    return `SO${dateStr}${timeStr}${random}`
  }

  // 将数据库格式转换为前端格式（销售）
  const dbToFrontendSale = (dbSale) => {
    return {
      id: dbSale.id,
      orderId: dbSale.order_id,
      products: dbSale.products || [],
      totalAmount: parseFloat(dbSale.total_amount) || 0,
      totalCost: parseFloat(dbSale.total_cost) || 0,
      profit: parseFloat(dbSale.profit) || 0,
      discount: parseFloat(dbSale.discount) || 0,
      actualAmount: parseFloat(dbSale.actual_amount) || 0,
      salesperson: dbSale.salesperson || '',
      paymentMethod: dbSale.payment_method || '现金',
      memberId: dbSale.member_id,
      time: new Date(dbSale.created_at).getTime(),
      date: new Date(dbSale.created_at).getTime(), // 兼容旧字段
      type: 'sale',
      createTime: new Date(dbSale.created_at).getTime()
    }
  }

  // 将前端格式转换为数据库格式（销售）
  const frontendToDbSale = (sale) => {
    return {
      order_id: sale.orderId || generateOrderId(),
      products: sale.products,
      total_amount: parseFloat(sale.totalAmount) || 0,
      total_cost: parseFloat(sale.totalCost) || 0,
      profit: parseFloat(sale.profit) || 0,
      discount: parseFloat(sale.discount) || 0,
      actual_amount: parseFloat(sale.actualAmount) || 0,
      salesperson: sale.salesperson || null,
      payment_method: sale.paymentMethod || '现金',
      member_id: sale.memberId || null
    }
  }

  // 将数据库格式转换为前端格式（进货）
  const dbToFrontendPurchase = (dbPurchase) => {
    return {
      id: dbPurchase.id,
      productId: dbPurchase.product_id,
      productName: dbPurchase.product_name,
      productCode: dbPurchase.product_code,
      productSize: dbPurchase.product_size,
      quantity: parseInt(dbPurchase.quantity) || 0,
      costPrice: parseFloat(dbPurchase.purchase_price) || 0,
      totalAmount: parseFloat(dbPurchase.total_amount) || 0,
      supplier: dbPurchase.supplier || '',
      notes: dbPurchase.notes || '',
      date: new Date(dbPurchase.created_at).getTime(),
      time: new Date(dbPurchase.created_at).getTime(),
      type: 'purchase'
    }
  }

  // 将前端格式转换为数据库格式（进货）
  const frontendToDbPurchase = (purchase, product) => {
    return {
      product_id: purchase.productId,
      product_name: product?.name || purchase.productName || '',
      product_code: product?.code || purchase.productCode || '',
      product_size: product?.size || purchase.productSize || '',
      quantity: parseInt(purchase.quantity) || 0,
      purchase_price: parseFloat(purchase.costPrice) || 0,
      total_amount: parseFloat(purchase.costPrice * purchase.quantity) || 0,
      supplier: purchase.supplier || null,
      notes: purchase.notes || null
    }
  }

  // 从云端加载销售数据
  const loadSales = async () => {
    loading.value = true
    try {
      // 加载销售数据
      const { data: salesData, error: salesError } = await supabase
        .from(TABLES.SALES)
        .select('*')
        .order('created_at', { ascending: false })

      if (salesError) {
        console.error('加载销售数据失败:', salesError)
        // 降级到 localStorage
        const stored = localStorage.getItem('sales')
        if (stored) {
          sales.value = JSON.parse(stored)
        }
      } else {
        sales.value = salesData.map(dbToFrontendSale)
        // 同步到 localStorage 作为备份
        localStorage.setItem('sales', JSON.stringify(sales.value))
      }

      // 加载进货数据
      const { data: purchasesData, error: purchasesError } = await supabase
        .from(TABLES.PURCHASES)
        .select('*')
        .order('created_at', { ascending: false })

      if (purchasesError) {
        console.error('加载进货数据失败:', purchasesError)
        // 降级到 localStorage
        const stored = localStorage.getItem('purchases')
        if (stored) {
          purchases.value = JSON.parse(stored)
        }
      } else {
        purchases.value = purchasesData.map(dbToFrontendPurchase)
        // 同步到 localStorage 作为备份
        localStorage.setItem('purchases', JSON.stringify(purchases.value))
      }
    } catch (error) {
      console.error('加载数据异常:', error)
      // 降级到 localStorage
      const storedSales = localStorage.getItem('sales')
      const storedPurchases = localStorage.getItem('purchases')
      if (storedSales) sales.value = JSON.parse(storedSales)
      if (storedPurchases) purchases.value = JSON.parse(storedPurchases)
    } finally {
      loading.value = false
    }
  }

  // 保存数据到 localStorage（作为备份）
  const saveSales = () => {
    localStorage.setItem('sales', JSON.stringify(sales.value))
  }

  const savePurchases = () => {
    localStorage.setItem('purchases', JSON.stringify(purchases.value))
  }

  // 添加销售记录（支持单商品和多商品订单）
  const addSale = async (sale) => {
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
      let totalCost = 0
      
      const productsWithDetails = sale.products.map(item => {
        const product = productStore.getProductById(item.productId)
        const itemTotal = item.salePrice * item.quantity
        const itemCost = (item.costPrice || product.costPrice) * item.quantity
        
        totalAmount += itemTotal
        totalCost += itemCost
        
        return {
          productId: item.productId,
          productName: item.productName,
          size: item.size,
          salePrice: item.salePrice,
          costPrice: item.costPrice || product.costPrice,
          quantity: item.quantity
        }
      })

      const discount = sale.discount || 1
      const actualAmount = totalAmount * discount
      const profit = actualAmount - totalCost

      const newSale = {
        orderId: generateOrderId(),
        products: productsWithDetails,
        totalAmount,
        totalCost,
        profit,
        discount: totalAmount - actualAmount,
        actualAmount,
        salesperson: sale.salesperson || '老板',
        paymentMethod: sale.paymentMethod || '现金',
        memberId: sale.memberId || null,
        remark: sale.remark || ''
      }

      try {
        // 保存到云端
        const dbSale = frontendToDbSale(newSale)
        const { data, error } = await supabase
          .from(TABLES.SALES)
          .insert([dbSale])
          .select()
          .single()

        if (error) throw error

        const savedSale = dbToFrontendSale(data)
        sales.value.unshift(savedSale)
        
        // 更新所有商品库存
        for (const item of productsWithDetails) {
          await productStore.updateStock(item.productId, item.quantity, 'subtract')
        }
        
        saveSales()
        
        return { success: true, data: savedSale }
      } catch (error) {
        console.error('保存销售记录失败:', error)
        // 降级到本地存储
        const localSale = {
          ...newSale,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          time: Date.now(),
          date: Date.now(),
          type: 'sale'
        }
        sales.value.unshift(localSale)
        
        // 更新库存（本地）
        for (const item of productsWithDetails) {
          await productStore.updateStock(item.productId, item.quantity, 'subtract')
        }
        
        saveSales()
        return { success: true, data: localSale }
      }
    }
    
    // 单商品模式（兼容旧版本）
    const product = productStore.getProductById(sale.productId)
    
    if (!product || product.stock < sale.quantity) {
      return { success: false, message: '库存不足' }
    }

    const totalAmount = sale.salePrice * sale.quantity
    const totalCost = product.costPrice * sale.quantity
    const profit = totalAmount - totalCost

    const newSale = {
      orderId: generateOrderId(),
      products: [{
        productId: sale.productId,
        productName: product.name,
        size: product.size,
        salePrice: sale.salePrice,
        costPrice: product.costPrice,
        quantity: sale.quantity
      }],
      totalAmount,
      totalCost,
      profit,
      discount: 0,
      actualAmount: totalAmount,
      salesperson: sale.salesperson || '老板',
      paymentMethod: sale.paymentMethod || '现金',
      memberId: sale.memberId || null,
      remark: sale.remark || ''
    }

    try {
      const dbSale = frontendToDbSale(newSale)
      const { data, error } = await supabase
        .from(TABLES.SALES)
        .insert([dbSale])
        .select()
        .single()

      if (error) throw error

      const savedSale = dbToFrontendSale(data)
      sales.value.unshift(savedSale)
      await productStore.updateStock(sale.productId, sale.quantity, 'subtract')
      saveSales()
      
      return { success: true, data: savedSale }
    } catch (error) {
      console.error('保存销售记录失败:', error)
      // 降级处理
      const localSale = {
        ...newSale,
        id: Date.now().toString(),
        time: Date.now(),
        date: Date.now(),
        type: 'sale'
      }
      sales.value.unshift(localSale)
      productStore.updateStock(sale.productId, sale.quantity, 'subtract')
      saveSales()
      
      return { success: true, data: localSale }
    }
  }

  // 删除销售记录
  const deleteSale = async (id) => {
    const productStore = useProductStore()
    const index = sales.value.findIndex(s => s.id === id)
    if (index === -1) {
      console.error('❌ 销售记录不存在:', id)
      return false
    }
    
    const tempSale = sales.value[index]
    
    try {
      // 1. 恢复库存（销售记录删除 = 库存增加）
      if (tempSale.products && Array.isArray(tempSale.products)) {
        // 多商品模式
        for (const item of tempSale.products) {
          await productStore.updateStock(item.productId, item.quantity, 'add')
          console.log(`✅ 已恢复商品 ${item.productName} 库存 +${item.quantity}`)
        }
      } else if (tempSale.productId) {
        // 单商品模式（兼容旧版本）
        await productStore.updateStock(tempSale.productId, tempSale.quantity, 'add')
        console.log(`✅ 已恢复商品库存 +${tempSale.quantity}`)
      }
      
      // 🆕 2. 如果是会员余额支付，退回余额
      if (tempSale.paymentMethod === '会员余额' && tempSale.memberId) {
        const { useMemberStore } = await import('./member')
        const memberStore = useMemberStore()
        const refundResult = await memberStore.rechargeMember(
          tempSale.memberId,
          tempSale.actualAmount || tempSale.totalAmount,
          '删除订单退款',
          `订单号：${tempSale.orderId}`
        )
        
        if (refundResult.success) {
          console.log('✅ 会员余额已退回:', tempSale.actualAmount || tempSale.totalAmount, '元')
        } else {
          console.error('❌ 会员余额退回失败:', refundResult.message)
        }
      }
      
      // 3. 从本地删除
      sales.value.splice(index, 1)
      saveSales()

      // 3. 判断是否是本地记录（UUID 格式: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx）
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const isCloudRecord = uuidRegex.test(id)
      
      if (!isCloudRecord) {
        // 本地记录，只需要从 localStorage 删除即可
        console.log('✅ 本地销售记录已删除:', id)
        return true
      }

      // 4. 云端记录，需要从 Supabase 删除
      const { error } = await supabase
        .from(TABLES.SALES)
        .delete()
        .eq('id', id)

      if (error) {
        console.error('❌ 云端删除失败:', error)
        // 恢复本地数据和库存
        sales.value.splice(index, 0, tempSale)
        saveSales()
        
        // 回滚库存
        if (tempSale.products && Array.isArray(tempSale.products)) {
          for (const item of tempSale.products) {
            await productStore.updateStock(item.productId, item.quantity, 'subtract')
          }
        } else if (tempSale.productId) {
          await productStore.updateStock(tempSale.productId, tempSale.quantity, 'subtract')
        }
        
        throw error
      }

      console.log('✅ 云端销售记录已删除:', id)
      return true
    } catch (error) {
      console.error('❌ 删除销售记录失败:', error)
      return false
    }
  }

  // 添加进货记录
  const addPurchase = async (purchase) => {
    const productStore = useProductStore()
    const product = productStore.getProductById(purchase.productId)
    
    if (!product) {
      return { success: false, message: '商品不存在' }
    }

    try {
      const dbPurchase = frontendToDbPurchase(purchase, product)
      
      const { data, error } = await supabase
        .from(TABLES.PURCHASES)
        .insert([dbPurchase])
        .select()
        .single()

      if (error) throw error

      const savedPurchase = dbToFrontendPurchase(data)
      purchases.value.unshift(savedPurchase)
      
      // 更新商品库存
      await productStore.updateStock(purchase.productId, purchase.quantity, 'add')
      
      // 使用加权平均法更新成本价
      const currentProduct = productStore.getProductById(purchase.productId)
      if (currentProduct) {
        const oldStock = currentProduct.stock - purchase.quantity  // 进货前的库存
        const oldCost = currentProduct.costPrice
        const newCost = purchase.costPrice
        const newQuantity = purchase.quantity
        
        // 加权平均成本价 = (原库存 × 原成本价 + 新进货量 × 新成本价) / (原库存 + 新进货量)
        let weightedAvgCost
        if (oldStock <= 0) {
          // 如果原库存为0或负数，直接使用新成本价
          weightedAvgCost = newCost
        } else {
          weightedAvgCost = (oldStock * oldCost + newQuantity * newCost) / (oldStock + newQuantity)
        }
        
        await productStore.updateProduct(purchase.productId, { 
          costPrice: Math.round(weightedAvgCost * 100) / 100  // 保留两位小数
        })
        
        console.log(`✅ 成本价更新: ${oldCost} → ${Math.round(weightedAvgCost * 100) / 100} (加权平均)`)
      }
      
      savePurchases()
      
      return { success: true, data: savedPurchase }
    } catch (error) {
      console.error('保存进货记录失败:', error)
      // 降级处理
      const localPurchase = {
        id: Date.now().toString(),
        productId: purchase.productId,
        productName: product.name,
        productCode: product.code,
        productSize: product.size,
        quantity: purchase.quantity,
        costPrice: purchase.costPrice,
        totalAmount: purchase.costPrice * purchase.quantity,
        supplier: purchase.supplier || '',
        notes: purchase.notes || '',
        date: Date.now(),
        time: Date.now(),
        type: 'purchase'
      }

      purchases.value.unshift(localPurchase)
      
      // 更新库存和成本价（使用加权平均）
      await productStore.updateStock(purchase.productId, purchase.quantity, 'add')
      
      const currentProduct = productStore.getProductById(purchase.productId)
      if (currentProduct) {
        const oldStock = currentProduct.stock - purchase.quantity
        const oldCost = currentProduct.costPrice
        const newCost = purchase.costPrice
        const newQuantity = purchase.quantity
        
        let weightedAvgCost
        if (oldStock <= 0) {
          weightedAvgCost = newCost
        } else {
          weightedAvgCost = (oldStock * oldCost + newQuantity * newCost) / (oldStock + newQuantity)
        }
        
        await productStore.updateProduct(purchase.productId, { 
          costPrice: Math.round(weightedAvgCost * 100) / 100
        })
      }
      
      savePurchases()
      
      return { success: true, data: localPurchase }
    }
  }

  // 删除进货记录
  const deletePurchase = async (id) => {
    const productStore = useProductStore()
    const index = purchases.value.findIndex(p => p.id === id)
    if (index === -1) {
      console.error('❌ 进货记录不存在:', id)
      return false
    }
    
    const tempPurchase = purchases.value[index]
    
    try {
      // 1. 恢复库存（进货记录删除 = 库存减少）
      await productStore.updateStock(tempPurchase.productId, tempPurchase.quantity, 'subtract')
      console.log(`✅ 已恢复商品 ${tempPurchase.productName} 库存 -${tempPurchase.quantity}`)
      
      // 2. 从本地删除
      purchases.value.splice(index, 1)
      savePurchases()

      // 3. 判断是否是本地记录（UUID 格式: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx）
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const isCloudRecord = uuidRegex.test(id)
      
      if (!isCloudRecord) {
        // 本地记录，只需要从 localStorage 删除即可
        console.log('✅ 本地进货记录已删除:', id)
        return true
      }

      // 4. 云端记录，需要从 Supabase 删除
      const { error } = await supabase
        .from(TABLES.PURCHASES)
        .delete()
        .eq('id', id)

      if (error) {
        console.error('❌ 云端删除失败:', error)
        // 恢复本地数据和库存
        purchases.value.splice(index, 0, tempPurchase)
        savePurchases()
        
        // 回滚库存
        await productStore.updateStock(tempPurchase.productId, tempPurchase.quantity, 'add')
        
        throw error
      }

      console.log('✅ 云端进货记录已删除:', id)
      return true
    } catch (error) {
      console.error('❌ 删除进货记录失败:', error)
      return false
    }
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
      .reduce((sum, s) => sum + (s.actualAmount || s.totalAmount), 0)
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
      .reduce((sum, s) => sum + (s.actualAmount || s.totalAmount), 0)
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
    return sales.value.reduce((sum, s) => sum + (s.actualAmount || s.totalAmount), 0)
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
      const dayAmount = daySales.reduce((sum, s) => sum + (s.actualAmount || s.totalAmount), 0)
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
      } else if (sale.productId) {
        // 处理单商品记录（兼容旧数据）
        if (!productSales[sale.productId]) {
          productSales[sale.productId] = {
            productId: sale.productId,
            productName: sale.productName,
            quantity: 0,
            amount: 0
          }
        }
        productSales[sale.productId].quantity += sale.quantity || 0
        productSales[sale.productId].amount += sale.totalAmount || 0
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
      stats[person].totalAmount += sale.actualAmount || sale.totalAmount
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
        stats[person].totalAmount += sale.actualAmount || sale.totalAmount
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
        stats[person].totalAmount += sale.actualAmount || sale.totalAmount
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
    loading,
    getAllSales,
    loadSales,
    addSale,
    deleteSale,
    addPurchase,
    deletePurchase,
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
