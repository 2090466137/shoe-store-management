/**
 * 防抖函数工具
 * 用于优化搜索、输入等高频操作的性能
 */

/**
 * 防抖函数
 * @param {Function} func - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} - 防抖后的函数
 */
export function debounce(func, delay = 300) {
  let timeoutId = null
  
  return function (...args) {
    // 清除之前的定时器
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    // 设置新的定时器
    timeoutId = setTimeout(() => {
      func.apply(this, args)
      timeoutId = null
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} func - 需要节流的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} - 节流后的函数
 */
export function throttle(func, delay = 300) {
  let lastTime = 0
  
  return function (...args) {
    const now = Date.now()
    
    if (now - lastTime >= delay) {
      func.apply(this, args)
      lastTime = now
    }
  }
}

/**
 * 异步防抖（支持 Promise）
 * @param {Function} func - 需要防抖的异步函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} - 防抖后的函数
 */
export function debounceAsync(func, delay = 300) {
  let timeoutId = null
  let pendingPromise = null
  
  return function (...args) {
    // 如果有待处理的 Promise，返回它
    if (pendingPromise) {
      return pendingPromise
    }
    
    return new Promise((resolve, reject) => {
      // 清除之前的定时器
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      // 设置新的定时器
      timeoutId = setTimeout(async () => {
        try {
          pendingPromise = func.apply(this, args)
          const result = await pendingPromise
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          pendingPromise = null
          timeoutId = null
        }
      }, delay)
    })
  }
}

