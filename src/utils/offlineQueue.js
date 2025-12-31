// 离线操作队列管理
const QUEUE_KEY = 'offline_operation_queue'

// 操作类型
export const OperationType = {
  ADD_PRODUCT: 'ADD_PRODUCT',
  UPDATE_PRODUCT: 'UPDATE_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',
  ADD_SALE: 'ADD_SALE',
  ADD_PURCHASE: 'ADD_PURCHASE',
  ADD_MEMBER: 'ADD_MEMBER',
  UPDATE_MEMBER: 'UPDATE_MEMBER',
  RECHARGE_MEMBER: 'RECHARGE_MEMBER',
  ADD_USER: 'ADD_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER'
}

// 获取队列
export function getQueue() {
  try {
    const queue = localStorage.getItem(QUEUE_KEY)
    return queue ? JSON.parse(queue) : []
  } catch (error) {
    console.error('获取离线队列失败:', error)
    return []
  }
}

// 保存队列
function saveQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch (error) {
    console.error('保存离线队列失败:', error)
  }
}

// 添加操作到队列
export function addToQueue(operation) {
  const queue = getQueue()
  const newOperation = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    ...operation
  }
  queue.push(newOperation)
  saveQueue(queue)
  console.log('📝 操作已加入离线队列:', newOperation.type)
  return newOperation
}

// 从队列中移除操作
export function removeFromQueue(operationId) {
  const queue = getQueue()
  const newQueue = queue.filter(op => op.id !== operationId)
  saveQueue(newQueue)
}

// 清空队列
export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY)
  console.log('🗑️ 离线队列已清空')
}

// 获取队列大小
export function getQueueSize() {
  return getQueue().length
}

// 处理队列中的操作（恢复网络后调用）
export async function processQueue(stores) {
  const queue = getQueue()
  
  if (queue.length === 0) {
    console.log('✅ 离线队列为空，无需同步')
    return { success: true, processed: 0, failed: 0 }
  }
  
  console.log(`🔄 开始处理离线队列，共 ${queue.length} 个操作`)
  
  let processed = 0
  let failed = 0
  const failedOperations = []
  
  for (const operation of queue) {
    try {
      await processOperation(operation, stores)
      removeFromQueue(operation.id)
      processed++
      console.log(`✅ 操作已同步: ${operation.type}`)
    } catch (error) {
      console.error(`❌ 操作同步失败: ${operation.type}`, error)
      failed++
      failedOperations.push(operation)
    }
  }
  
  // 保存失败的操作
  if (failedOperations.length > 0) {
    saveQueue(failedOperations)
  }
  
  console.log(`🎉 队列处理完成: 成功 ${processed}, 失败 ${failed}`)
  
  return {
    success: failed === 0,
    processed,
    failed,
    failedOperations
  }
}

// 处理单个操作
async function processOperation(operation, stores) {
  const { type, data } = operation
  const { productStore, salesStore, memberStore, userStore } = stores
  
  switch (type) {
    case OperationType.ADD_PRODUCT:
      await productStore.addProduct(data)
      break
      
    case OperationType.UPDATE_PRODUCT:
      await productStore.updateProduct(data.id, data.updates)
      break
      
    case OperationType.DELETE_PRODUCT:
      await productStore.deleteProduct(data.id)
      break
      
    case OperationType.ADD_SALE:
      await salesStore.addSale(data)
      break
      
    case OperationType.ADD_PURCHASE:
      await salesStore.addPurchase(data)
      break
      
    case OperationType.ADD_MEMBER:
      await memberStore.addMember(data)
      break
      
    case OperationType.UPDATE_MEMBER:
      await memberStore.updateMember(data.id, data.updates)
      break
      
    case OperationType.RECHARGE_MEMBER:
      await memberStore.rechargeMember(data.id, data.amount, data.paymentMethod, data.notes)
      break
      
    case OperationType.ADD_USER:
      await userStore.addUser(data)
      break
      
    case OperationType.UPDATE_USER:
      await userStore.updateUser(data.id, data.updates)
      break
      
    case OperationType.DELETE_USER:
      await userStore.deleteUser(data.id)
      break
      
    default:
      console.warn('未知的操作类型:', type)
  }
}

// 监听网络状态，自动同步
export function setupAutoSync(stores) {
  window.addEventListener('online', async () => {
    console.log('🌐 网络已恢复，开始自动同步...')
    
    // 延迟1秒，确保网络稳定
    setTimeout(async () => {
      const result = await processQueue(stores)
      
      if (result.processed > 0) {
        // 显示同步结果通知
        if (window.showNotification) {
          window.showNotification({
            title: '数据同步完成',
            message: `成功同步 ${result.processed} 个操作`,
            type: 'success'
          })
        }
      }
    }, 1000)
  })
  
  console.log('✅ 自动同步已启用')
}

