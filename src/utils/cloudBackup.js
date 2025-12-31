// 云端自动备份工具
import { supabase, TABLES } from '@/config/supabase'

/**
 * 云端自动备份 - 将本地数据备份到 Supabase
 */
export async function autoCloudBackup() {
  try {
    console.log('🔄 开始云端自动备份...')
    
    // 获取本地数据
    const products = localStorage.getItem('products')
    const sales = localStorage.getItem('sales')
    const purchases = localStorage.getItem('purchases')
    const members = localStorage.getItem('members')
    const returns = localStorage.getItem('returns')
    
    // 准备备份数据
    const backupData = {
      version: '1.0.0',
      backup_time: new Date().toISOString(),
      device_info: navigator.userAgent,
      data: {
        products: products ? JSON.parse(products) : [],
        sales: sales ? JSON.parse(sales) : [],
        purchases: purchases ? JSON.parse(purchases) : [],
        members: members ? JSON.parse(members) : [],
        returns: returns ? JSON.parse(returns) : []
      },
      stats: {
        products_count: products ? JSON.parse(products).length : 0,
        sales_count: sales ? JSON.parse(sales).length : 0,
        purchases_count: purchases ? JSON.parse(purchases).length : 0,
        members_count: members ? JSON.parse(members).length : 0,
        returns_count: returns ? JSON.parse(returns).length : 0
      }
    }
    
    // 上传到 Supabase
    const { data, error } = await supabase
      .from(TABLES.BACKUPS)
      .insert([{
        backup_data: backupData,
        backup_type: 'auto',
        created_at: new Date().toISOString()
      }])
      .select()
    
    if (error) {
      console.error('❌ 云端备份失败:', error)
      return { success: false, error: error.message }
    }
    
    // 更新最后备份时间
    localStorage.setItem('lastCloudBackupTime', Date.now().toString())
    
    console.log('✅ 云端自动备份成功！', data)
    return { 
      success: true, 
      data: data[0],
      message: '数据已自动备份到云端'
    }
  } catch (error) {
    console.error('❌ 云端备份异常:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 手动云端备份
 */
export async function manualCloudBackup() {
  try {
    console.log('🔄 开始手动云端备份...')
    
    // 获取本地数据
    const products = localStorage.getItem('products')
    const sales = localStorage.getItem('sales')
    const purchases = localStorage.getItem('purchases')
    const members = localStorage.getItem('members')
    const returns = localStorage.getItem('returns')
    
    // 准备备份数据
    const backupData = {
      version: '1.0.0',
      backup_time: new Date().toISOString(),
      device_info: navigator.userAgent,
      data: {
        products: products ? JSON.parse(products) : [],
        sales: sales ? JSON.parse(sales) : [],
        purchases: purchases ? JSON.parse(purchases) : [],
        members: members ? JSON.parse(members) : [],
        returns: returns ? JSON.parse(returns) : []
      },
      stats: {
        products_count: products ? JSON.parse(products).length : 0,
        sales_count: sales ? JSON.parse(sales).length : 0,
        purchases_count: purchases ? JSON.parse(purchases).length : 0,
        members_count: members ? JSON.parse(members).length : 0,
        returns_count: returns ? JSON.parse(returns).length : 0
      }
    }
    
    // 上传到 Supabase
    const { data, error } = await supabase
      .from(TABLES.BACKUPS)
      .insert([{
        backup_data: backupData,
        backup_type: 'manual',
        created_at: new Date().toISOString()
      }])
      .select()
    
    if (error) {
      console.error('❌ 云端备份失败:', error)
      return { success: false, error: error.message }
    }
    
    // 更新最后备份时间
    localStorage.setItem('lastCloudBackupTime', Date.now().toString())
    localStorage.setItem('lastBackupTime', Date.now().toString())
    
    console.log('✅ 手动云端备份成功！', data)
    return { 
      success: true, 
      data: data[0],
      message: '数据已成功备份到云端'
    }
  } catch (error) {
    console.error('❌ 云端备份异常:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 获取云端备份列表
 */
export async function getCloudBackups(limit = 10) {
  try {
    const { data, error } = await supabase
      .from(TABLES.BACKUPS)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('❌ 获取备份列表失败:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('❌ 获取备份列表异常:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 从云端恢复数据
 */
export async function restoreFromCloud(backupId) {
  try {
    console.log('🔄 开始从云端恢复数据...', backupId)
    
    // 获取备份数据
    const { data, error } = await supabase
      .from(TABLES.BACKUPS)
      .select('*')
      .eq('id', backupId)
      .single()
    
    if (error) {
      console.error('❌ 获取备份数据失败:', error)
      return { success: false, error: error.message }
    }
    
    if (!data || !data.backup_data) {
      return { success: false, error: '备份数据不存在' }
    }
    
    const backupData = data.backup_data
    
    // 恢复数据到 LocalStorage
    if (backupData.data.products) {
      localStorage.setItem('products', JSON.stringify(backupData.data.products))
    }
    if (backupData.data.sales) {
      localStorage.setItem('sales', JSON.stringify(backupData.data.sales))
    }
    if (backupData.data.purchases) {
      localStorage.setItem('purchases', JSON.stringify(backupData.data.purchases))
    }
    if (backupData.data.members) {
      localStorage.setItem('members', JSON.stringify(backupData.data.members))
    }
    
    console.log('✅ 数据恢复成功！')
    return { 
      success: true, 
      message: '数据已从云端恢复成功！页面将刷新以加载新数据。',
      stats: backupData.stats
    }
  } catch (error) {
    console.error('❌ 数据恢复异常:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 删除云端备份
 */
export async function deleteCloudBackup(backupId) {
  try {
    const { error } = await supabase
      .from(TABLES.BACKUPS)
      .delete()
      .eq('id', backupId)
    
    if (error) {
      console.error('❌ 删除备份失败:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, message: '备份已删除' }
  } catch (error) {
    console.error('❌ 删除备份异常:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 检查是否需要自动备份
 * 每天自动备份一次
 */
export function shouldAutoBackup() {
  const lastBackup = localStorage.getItem('lastCloudBackupTime')
  const now = Date.now()
  
  // 如果从未备份，或超过 24 小时，则需要备份
  if (!lastBackup || now - parseInt(lastBackup) > 24 * 60 * 60 * 1000) {
    return true
  }
  
  return false
}

/**
 * 设置自动备份定时器
 * 每天检查一次，如果需要则自动备份
 */
export function setupAutoBackup() {
  console.log('⏰ 设置云端自动备份定时器...')
  
  // 立即检查一次
  checkAndBackup()
  
  // 每 6 小时检查一次（更频繁的检查）
  const interval = setInterval(() => {
    checkAndBackup()
  }, 6 * 60 * 60 * 1000) // 6 小时
  
  return interval
}

/**
 * 检查并执行备份
 */
async function checkAndBackup() {
  if (shouldAutoBackup()) {
    console.log('📅 检测到需要自动备份，开始执行...')
    const result = await autoCloudBackup()
    if (result.success) {
      console.log('✅ 自动备份完成')
    } else {
      console.log('⚠️ 自动备份失败，将在下次检查时重试')
    }
  } else {
    console.log('✅ 备份状态正常，无需备份')
  }
}

/**
 * 获取备份统计信息
 */
export function getBackupStats() {
  const lastCloudBackup = localStorage.getItem('lastCloudBackupTime')
  
  return {
    lastCloudBackupTime: lastCloudBackup 
      ? new Date(parseInt(lastCloudBackup)).toLocaleString('zh-CN')
      : '从未备份',
    needBackup: shouldAutoBackup()
  }
}
