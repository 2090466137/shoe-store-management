/**
 * 操作日志 Store
 * 记录所有关键操作，用于审计和追踪
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, TABLES } from '../config/supabase'

export const useOperationLogStore = defineStore('operationLog', () => {
  const logs = ref([])
  const loading = ref(false)

  // 操作类型枚举
  const OPERATION_TYPES = {
    // 商品操作
    PRODUCT_ADD: 'product_add',
    PRODUCT_UPDATE: 'product_update',
    PRODUCT_DELETE: 'product_delete',
    PRODUCT_STOCK_IN: 'product_stock_in',
    PRODUCT_STOCK_OUT: 'product_stock_out',
    
    // 销售操作
    SALE_ADD: 'sale_add',
    SALE_DELETE: 'sale_delete',
    
    // 进货操作
    PURCHASE_ADD: 'purchase_add',
    PURCHASE_DELETE: 'purchase_delete',
    
    // 退换货操作
    RETURN_ADD: 'return_add',
    RETURN_DELETE: 'return_delete',
    EXCHANGE_ADD: 'exchange_add',
    
    // 会员操作
    MEMBER_ADD: 'member_add',
    MEMBER_UPDATE: 'member_update',
    MEMBER_DELETE: 'member_delete',
    MEMBER_RECHARGE: 'member_recharge',
    MEMBER_CONSUME: 'member_consume',
    
    // 用户操作
    USER_LOGIN: 'user_login',
    USER_LOGOUT: 'user_logout',
    USER_ADD: 'user_add',
    USER_UPDATE: 'user_update',
    USER_DELETE: 'user_delete',
    USER_PASSWORD_CHANGE: 'user_password_change',
    
    // 系统操作
    SYSTEM_BACKUP: 'system_backup',
    SYSTEM_RESTORE: 'system_restore',
    SYSTEM_EXPORT: 'system_export'
  }

  // 操作类型中文描述
  const OPERATION_TYPE_LABELS = {
    product_add: '添加商品',
    product_update: '修改商品',
    product_delete: '删除商品',
    product_stock_in: '商品入库',
    product_stock_out: '商品出库',
    sale_add: '新增销售',
    sale_delete: '删除销售',
    purchase_add: '新增进货',
    purchase_delete: '删除进货',
    return_add: '新增退货',
    return_delete: '删除退货',
    exchange_add: '新增换货',
    member_add: '添加会员',
    member_update: '修改会员',
    member_delete: '删除会员',
    member_recharge: '会员充值',
    member_consume: '会员消费',
    user_login: '用户登录',
    user_logout: '用户登出',
    user_add: '添加用户',
    user_update: '修改用户',
    user_delete: '删除用户',
    user_password_change: '修改密码',
    system_backup: '系统备份',
    system_restore: '系统恢复',
    system_export: '数据导出'
  }

  // 将数据库格式转换为前端格式
  const dbToFrontend = (dbLog) => {
    return {
      id: dbLog.id,
      operationType: dbLog.operation_type,
      operationLabel: OPERATION_TYPE_LABELS[dbLog.operation_type] || '未知操作',
      userId: dbLog.user_id,
      username: dbLog.username,
      targetType: dbLog.target_type,
      targetId: dbLog.target_id,
      targetName: dbLog.target_name,
      details: dbLog.details,
      oldValue: dbLog.old_value,
      newValue: dbLog.new_value,
      ipAddress: dbLog.ip_address,
      userAgent: dbLog.user_agent,
      createTime: new Date(dbLog.created_at).getTime()
    }
  }

  // 将前端格式转换为数据库格式
  const frontendToDb = (log) => {
    return {
      operation_type: log.operationType,
      user_id: log.userId,
      username: log.username,
      target_type: log.targetType || null,
      target_id: log.targetId || null,
      target_name: log.targetName || null,
      details: log.details || null,
      old_value: log.oldValue || null,
      new_value: log.newValue || null,
      ip_address: log.ipAddress || null,
      user_agent: log.userAgent || null
    }
  }

  // 保存到本地存储
  const saveLogs = () => {
    try {
      localStorage.setItem('operationLogs', JSON.stringify(logs.value))
    } catch (error) {
      console.error('❌ 保存操作日志到本地失败:', error)
    }
  }

  // 从本地存储加载
  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem('operationLogs')
      if (stored) {
        const parsed = JSON.parse(stored)
        return Array.isArray(parsed) ? parsed : []
      }
    } catch (error) {
      console.error('❌ 从本地加载操作日志失败:', error)
    }
    return []
  }

  // 从云端加载日志
  const loadLogs = async (options = {}) => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from(TABLES.OPERATION_LOGS)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(options.limit || 1000)

      if (error) {
        console.error('❌ 从云端加载操作日志失败:', error)
        // 从本地加载
        logs.value = loadFromLocalStorage()
        return false
      }

      const cloudLogs = data.map(dbToFrontend)
      const localLogs = loadFromLocalStorage()

      // 智能合并：云端优先，本地补充
      const mergedLogs = [...cloudLogs]
      const cloudIds = new Set(cloudLogs.map(log => log.id))

      localLogs.forEach(localLog => {
        if (!cloudIds.has(localLog.id)) {
          mergedLogs.push(localLog)
        }
      })

      // 按时间倒序排序
      logs.value = mergedLogs.sort((a, b) => b.createTime - a.createTime)
      saveLogs()

      console.log(`✅ 已加载 ${logs.value.length} 条操作日志`)
      return true
    } catch (error) {
      console.error('❌ 加载操作日志失败:', error)
      logs.value = loadFromLocalStorage()
      return false
    } finally {
      loading.value = false
    }
  }

  // 添加操作日志
  const addLog = async (logData) => {
    try {
      // 获取当前用户信息
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      
      // 获取浏览器信息
      const userAgent = navigator.userAgent
      
      const newLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        operationType: logData.operationType,
        userId: currentUser.id || 'unknown',
        username: currentUser.username || '未知用户',
        targetType: logData.targetType || null,
        targetId: logData.targetId || null,
        targetName: logData.targetName || null,
        details: logData.details || null,
        oldValue: logData.oldValue || null,
        newValue: logData.newValue || null,
        ipAddress: null, // 前端无法获取真实IP
        userAgent: userAgent,
        createTime: Date.now()
      }

      // 添加到本地
      logs.value.unshift(newLog)
      saveLogs()

      // 尝试保存到云端
      try {
        const dbLog = frontendToDb(newLog)
        const { data, error } = await supabase
          .from(TABLES.OPERATION_LOGS)
          .insert([{ ...dbLog, id: newLog.id }])
          .select()

        if (error) {
          console.warn('⚠️ 保存操作日志到云端失败:', error)
        } else {
          console.log('✅ 操作日志已同步到云端')
        }
      } catch (cloudError) {
        console.warn('⚠️ 云端保存失败，仅保存到本地:', cloudError)
      }

      return true
    } catch (error) {
      console.error('❌ 添加操作日志失败:', error)
      return false
    }
  }

  // 批量删除日志（清理旧日志）
  const clearOldLogs = async (daysToKeep = 90) => {
    try {
      const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)
      
      // 删除本地旧日志
      logs.value = logs.value.filter(log => log.createTime >= cutoffTime)
      saveLogs()

      // 删除云端旧日志
      const cutoffDate = new Date(cutoffTime).toISOString()
      const { error } = await supabase
        .from(TABLES.OPERATION_LOGS)
        .delete()
        .lt('created_at', cutoffDate)

      if (error) {
        console.error('❌ 清理云端旧日志失败:', error)
        return false
      }

      console.log(`✅ 已清理 ${daysToKeep} 天前的操作日志`)
      return true
    } catch (error) {
      console.error('❌ 清理旧日志失败:', error)
      return false
    }
  }

  // Computed 属性
  const getAllLogs = computed(() => logs.value)

  // 按操作类型筛选
  const getLogsByType = computed(() => (type) => {
    return logs.value.filter(log => log.operationType === type)
  })

  // 按用户筛选
  const getLogsByUser = computed(() => (userId) => {
    return logs.value.filter(log => log.userId === userId)
  })

  // 按日期范围筛选
  const getLogsByDateRange = computed(() => (startTime, endTime) => {
    return logs.value.filter(log => 
      log.createTime >= startTime && log.createTime <= endTime
    )
  })

  // 今日日志
  const todayLogs = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = today.getTime()
    return logs.value.filter(log => log.createTime >= todayStart)
  })

  // 统计数据
  const stats = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = today.getTime()

    return {
      total: logs.value.length,
      today: logs.value.filter(log => log.createTime >= todayStart).length,
      byType: logs.value.reduce((acc, log) => {
        acc[log.operationType] = (acc[log.operationType] || 0) + 1
        return acc
      }, {})
    }
  })

  return {
    // State
    logs,
    loading,
    
    // Constants
    OPERATION_TYPES,
    OPERATION_TYPE_LABELS,
    
    // Actions
    loadLogs,
    addLog,
    clearOldLogs,
    
    // Getters
    getAllLogs,
    getLogsByType,
    getLogsByUser,
    getLogsByDateRange,
    todayLogs,
    stats
  }
})

