// 数据备份和恢复工具

/**
 * 导出所有数据为JSON文件
 */
export function exportDataAsJSON() {
  try {
    // 获取所有数据
    const products = localStorage.getItem('products')
    const sales = localStorage.getItem('sales')
    const purchases = localStorage.getItem('purchases')
    
    const backupData = {
      version: '1.0.0',
      exportTime: new Date().toISOString(),
      data: {
        products: products ? JSON.parse(products) : [],
        sales: sales ? JSON.parse(sales) : [],
        purchases: purchases ? JSON.parse(purchases) : []
      }
    }
    
    // 创建下载链接
    const dataStr = JSON.stringify(backupData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    // 生成文件名（包含日期时间）
    const now = new Date()
    const fileName = `鞋店数据备份_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.json`
    
    // 触发下载
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    
    // 清理
    URL.revokeObjectURL(url)
    
    return { success: true, fileName }
  } catch (error) {
    console.error('导出数据失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 导入JSON备份数据
 */
export function importDataFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target.result)
        
        // 验证数据格式
        if (!backupData.data || !backupData.data.products) {
          throw new Error('备份文件格式不正确')
        }
        
        // 恢复数据到LocalStorage
        localStorage.setItem('products', JSON.stringify(backupData.data.products))
        localStorage.setItem('sales', JSON.stringify(backupData.data.sales || []))
        localStorage.setItem('purchases', JSON.stringify(backupData.data.purchases || []))
        
        resolve({ 
          success: true, 
          data: backupData,
          message: '数据导入成功！页面将刷新以加载新数据。'
        })
      } catch (error) {
        reject({ success: false, error: error.message })
      }
    }
    
    reader.onerror = () => {
      reject({ success: false, error: '文件读取失败' })
    }
    
    reader.readAsText(file)
  })
}

/**
 * 导出数据为CSV格式（商品列表）
 */
export function exportProductsAsCSV() {
  try {
    const products = localStorage.getItem('products')
    if (!products) {
      return { success: false, error: '没有商品数据' }
    }
    
    const productList = JSON.parse(products)
    
    // CSV表头
    const headers = ['商品名称', '品牌', '分类', '颜色', '尺码', '成本价', '销售价', '库存', '最低库存', '供应商']
    
    // CSV数据行
    const rows = productList.map(p => [
      p.name,
      p.brand,
      p.category,
      p.color,
      p.size,
      p.costPrice,
      p.salePrice,
      p.stock,
      p.minStock,
      p.supplier || ''
    ])
    
    // 组合CSV内容
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    // 添加BOM以支持中文
    const BOM = '\uFEFF'
    const dataBlob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(dataBlob)
    
    // 生成文件名
    const now = new Date()
    const fileName = `商品列表_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.csv`
    
    // 触发下载
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    
    // 清理
    URL.revokeObjectURL(url)
    
    return { success: true, fileName }
  } catch (error) {
    console.error('导出CSV失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 导出销售记录为CSV
 */
export function exportSalesAsCSV() {
  try {
    const sales = localStorage.getItem('sales')
    if (!sales) {
      return { success: false, error: '没有销售数据' }
    }
    
    const salesList = JSON.parse(sales)
    
    // CSV表头
    const headers = ['日期', '商品名称', '数量', '单价', '总额', '成本价', '利润']
    
    // CSV数据行
    const rows = salesList.map(s => [
      new Date(s.date).toLocaleString('zh-CN'),
      s.productName,
      s.quantity,
      s.salePrice,
      s.totalAmount,
      s.costPrice,
      s.profit
    ])
    
    // 组合CSV内容
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    // 添加BOM以支持中文
    const BOM = '\uFEFF'
    const dataBlob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(dataBlob)
    
    // 生成文件名
    const now = new Date()
    const fileName = `销售记录_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.csv`
    
    // 触发下载
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    
    // 清理
    URL.revokeObjectURL(url)
    
    return { success: true, fileName }
  } catch (error) {
    console.error('导出销售记录失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 自动备份（可定时调用）
 */
export function autoBackup() {
  const lastBackup = localStorage.getItem('lastBackupTime')
  const now = Date.now()
  
  // 如果超过24小时未备份，提示用户
  if (!lastBackup || now - parseInt(lastBackup) > 24 * 60 * 60 * 1000) {
    return {
      needBackup: true,
      message: '建议备份数据，距离上次备份已超过24小时'
    }
  }
  
  return { needBackup: false }
}

/**
 * 更新最后备份时间
 */
export function updateBackupTime() {
  localStorage.setItem('lastBackupTime', Date.now().toString())
}

/**
 * 清空所有数据（慎用）
 */
export function clearAllData() {
  localStorage.removeItem('products')
  localStorage.removeItem('sales')
  localStorage.removeItem('purchases')
  localStorage.removeItem('lastBackupTime')
  return { success: true, message: '所有数据已清空' }
}

/**
 * 获取数据统计信息
 */
export function getDataStats() {
  const products = localStorage.getItem('products')
  const sales = localStorage.getItem('sales')
  const purchases = localStorage.getItem('purchases')
  
  return {
    productsCount: products ? JSON.parse(products).length : 0,
    salesCount: sales ? JSON.parse(sales).length : 0,
    purchasesCount: purchases ? JSON.parse(purchases).length : 0,
    lastBackupTime: localStorage.getItem('lastBackupTime') 
      ? new Date(parseInt(localStorage.getItem('lastBackupTime'))).toLocaleString('zh-CN')
      : '从未备份'
  }
}

