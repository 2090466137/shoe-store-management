/**
 * 操作日志辅助函数
 * 简化各个 Store 中的日志记录代码
 */

/**
 * 记录操作日志
 * @param {Object} logData - 日志数据
 * @returns {Promise<boolean>} - 是否记录成功
 */
export async function recordLog(logData) {
  try {
    const { useOperationLogStore } = await import('@/stores/operationLog')
    const logStore = useOperationLogStore()
    await logStore.addLog(logData)
    return true
  } catch (error) {
    console.warn('⚠️ 记录操作日志失败:', error)
    return false
  }
}

/**
 * 获取操作类型枚举
 * @returns {Object} - 操作类型枚举
 */
export function getOperationTypes() {
  try {
    const { useOperationLogStore } = require('@/stores/operationLog')
    const logStore = useOperationLogStore()
    return logStore.OPERATION_TYPES
  } catch (error) {
    console.warn('⚠️ 获取操作类型失败:', error)
    return {}
  }
}

