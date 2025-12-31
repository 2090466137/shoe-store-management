import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase, TABLES } from '@/config/supabase'
import { useProductStore } from './product'

export const useReturnsStore = defineStore('returns', () => {
  const returns = ref([])
  const loading = ref(false)

  // ==================== 数据转换 ====================
  
  // 前端格式转数据库格式
  const frontendToDb = (returnRecord) => {
    return {
      id: returnRecord.id,
      type: returnRecord.type,
      time: new Date(returnRecord.time).toISOString(),
      original_sale_id: returnRecord.originalSaleId,
      original_product: returnRecord.originalProduct,
      new_product: returnRecord.newProduct,
      reason: returnRecord.reason || '',
      amount: returnRecord.amount,
      created_at: new Date(returnRecord.time).toISOString()
    }
  }

  // 数据库格式转前端格式
  const dbToFrontend = (dbRecord) => {
    return {
      id: dbRecord.id,
      type: dbRecord.type,
      time: new Date(dbRecord.time).getTime(),
      originalSaleId: dbRecord.original_sale_id,
      originalProduct: dbRecord.original_product,
      newProduct: dbRecord.new_product,
      reason: dbRecord.reason || '',
      amount: dbRecord.amount
    }
  }

  // ==================== 数据加载 ====================
  
  const loadReturns = async () => {
    loading.value = true
    try {
      // 1. 先从 localStorage 加载（防止数据丢失）
      const stored = localStorage.getItem('returns')
      if (stored) {
        returns.value = JSON.parse(stored)
        console.log('✅ 从 localStorage 加载了', returns.value.length, '条退换货记录')
      }

      // 2. 从云端加载数据
      const { data, error } = await supabase
        .from(TABLES.RETURNS)
        .select('*')
        .order('time', { ascending: false })

      if (error) {
        console.error('❌ 云端加载退换货记录失败:', error)
        console.log('⚠️ 使用 localStorage 数据')
        return
      }

      // 3. 转换数据格式
      const cloudReturns = data.map(dbToFrontend)
      
      // 4. 智能合并策略
      if (cloudReturns.length > 0) {
        // 如果本地有数据，进行智能合并
        if (returns.value.length > 0) {
          const mergedReturns = smartMergeReturns(returns.value, cloudReturns)
          returns.value = mergedReturns
          console.log('✅ 智能合并了本地和云端的退换货记录')
        } else {
          // 本地无数据，直接使用云端数据
          returns.value = cloudReturns
          console.log('✅ 从云端加载了', cloudReturns.length, '条退换货记录')
        }
        
        // 同步更新 localStorage
        saveReturns()
      } else {
        console.log('⚠️ 云端无退换货数据，保持 localStorage 数据')
      }
    } catch (error) {
      console.error('❌ 加载退换货记录异常:', error)
      console.log('⚠️ 使用 localStorage 数据')
    } finally {
      loading.value = false
    }
  }

  // 智能合并本地和云端数据
  const smartMergeReturns = (localReturns, cloudReturns) => {
    const merged = new Map()
    
    // 先添加所有云端数据
    cloudReturns.forEach(item => {
      merged.set(item.id, item)
    })
    
    // 合并本地数据（本地数据优先，因为可能是最新的）
    localReturns.forEach(localItem => {
      const cloudItem = merged.get(localItem.id)
      
      if (!cloudItem) {
        // 云端没有，是新增的本地数据
        merged.set(localItem.id, localItem)
      } else {
        // 云端有，比较时间戳，使用较新的
        if (localItem.time > cloudItem.time) {
          merged.set(localItem.id, localItem)
        }
      }
    })
    
    // 转换为数组并按时间排序
    return Array.from(merged.values()).sort((a, b) => b.time - a.time)
  }

  // ==================== 数据保存 ====================
  
  const saveReturns = () => {
    localStorage.setItem('returns', JSON.stringify(returns.value))
  }

  // ==================== 添加退换货记录 ====================
  
  const addReturn = async (returnRecord) => {
    const productStore = useProductStore()
    
    try {
      // 1. 尝试保存到云端
      const dbReturn = frontendToDb(returnRecord)
      const { data, error } = await supabase
        .from(TABLES.RETURNS)
        .insert([dbReturn])
        .select()
        .single()

      if (error) throw error

      // 云端保存成功
      const savedReturn = dbToFrontend(data)
      returns.value.unshift(savedReturn)
      
      // 2. 更新库存
      await productStore.updateStock(
        returnRecord.originalProduct.productId, 
        returnRecord.originalProduct.quantity, 
        'add'
      )
      
      if (returnRecord.type === 'exchange' && returnRecord.newProduct) {
        await productStore.updateStock(
          returnRecord.newProduct.productId, 
          returnRecord.newProduct.quantity, 
          'subtract'
        )
      }
      
      // 3. 保存到 localStorage
      saveReturns()
      
      console.log('✅ 退换货记录已保存到云端')
      return { success: true, data: savedReturn }
    } catch (error) {
      console.error('❌ 保存退换货记录到云端失败:', error)
      
      // 降级到本地存储
      returns.value.unshift(returnRecord)
      
      // 更新库存（本地）
      await productStore.updateStock(
        returnRecord.originalProduct.productId, 
        returnRecord.originalProduct.quantity, 
        'add'
      )
      
      if (returnRecord.type === 'exchange' && returnRecord.newProduct) {
        await productStore.updateStock(
          returnRecord.newProduct.productId, 
          returnRecord.newProduct.quantity, 
          'subtract'
        )
      }
      
      saveReturns()
      
      console.log('⚠️ 退换货记录已保存到本地')
      return { success: true, data: returnRecord }
    }
  }

  // ==================== 删除退换货记录（撤销） ====================
  
  const deleteReturn = async (returnId) => {
    const productStore = useProductStore()
    const returnItem = returns.value.find(r => r.id === returnId)
    
    if (!returnItem) {
      return { success: false, message: '记录不存在' }
    }

    try {
      // 1. 检查是否是本地记录（时间戳ID）还是云端记录（UUID）
      const isLocalOnly = !returnId.includes('-') // 简单判断：UUID包含-，时间戳不包含
      
      if (!isLocalOnly) {
        // 2. 尝试从云端删除
        const { error } = await supabase
          .from(TABLES.RETURNS)
          .delete()
          .eq('id', returnId)

        if (error) throw error
        console.log('✅ 已从云端删除退换货记录')
      }

      // 3. 从本地删除
      const index = returns.value.findIndex(r => r.id === returnId)
      if (index !== -1) {
        returns.value.splice(index, 1)
      }

      // 4. 恢复库存
      await productStore.updateStock(
        returnItem.originalProduct.productId, 
        returnItem.originalProduct.quantity, 
        'subtract'
      )
      
      if (returnItem.type === 'exchange' && returnItem.newProduct) {
        await productStore.updateStock(
          returnItem.newProduct.productId, 
          returnItem.newProduct.quantity, 
          'add'
        )
      }

      // 5. 保存到 localStorage
      saveReturns()

      return { success: true }
    } catch (error) {
      console.error('❌ 删除退换货记录失败:', error)
      
      // 降级：只删除本地
      const index = returns.value.findIndex(r => r.id === returnId)
      if (index !== -1) {
        returns.value.splice(index, 1)
        
        // 恢复库存
        await productStore.updateStock(
          returnItem.originalProduct.productId, 
          returnItem.originalProduct.quantity, 
          'subtract'
        )
        
        if (returnItem.type === 'exchange' && returnItem.newProduct) {
          await productStore.updateStock(
            returnItem.newProduct.productId, 
            returnItem.newProduct.quantity, 
            'add'
          )
        }
        
        saveReturns()
        console.log('⚠️ 已从本地删除退换货记录')
        return { success: true }
      }
      
      return { success: false, message: error.message }
    }
  }

  // ==================== 计算属性 ====================
  
  // 获取所有退换货记录
  const getAllReturns = computed(() => {
    return returns.value.sort((a, b) => b.time - a.time)
  })

  // 今日退货统计
  const todayReturns = computed(() => {
    const today = new Date().setHours(0, 0, 0, 0)
    return returns.value.filter(r => r.type === 'return' && r.time >= today)
  })

  // 今日换货统计
  const todayExchanges = computed(() => {
    const today = new Date().setHours(0, 0, 0, 0)
    return returns.value.filter(r => r.type === 'exchange' && r.time >= today)
  })

  // 今日退货金额
  const todayReturnAmount = computed(() => {
    return todayReturns.value.reduce((sum, r) => sum + r.amount, 0)
  })

  // 今日换货金额
  const todayExchangeAmount = computed(() => {
    return todayExchanges.value.reduce((sum, r) => sum + Math.abs(r.amount), 0)
  })

  // 获取某个订单某个商品的已退数量
  const getReturnedQuantity = (saleId, productId) => {
    return returns.value
      .filter(r => r.originalSaleId === saleId && r.originalProduct.productId === productId)
      .reduce((sum, r) => sum + r.originalProduct.quantity, 0)
  }

  return {
    // 状态
    returns,
    loading,
    
    // 计算属性
    getAllReturns,
    todayReturns,
    todayExchanges,
    todayReturnAmount,
    todayExchangeAmount,
    
    // 方法
    loadReturns,
    addReturn,
    deleteReturn,
    getReturnedQuantity
  }
})

