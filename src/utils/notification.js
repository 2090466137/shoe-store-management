// 通知工具类
import { showNotify } from 'vant'

// 请求通知权限
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return false
}

// 显示浏览器通知
export const showBrowserNotification = (title, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options
    })
  }
}

// 显示应用内通知
export const showAppNotification = (message, type = 'warning') => {
  showNotify({
    type,
    message,
    duration: 5000
  })
}

// 检查低库存并发送通知
export const checkLowStockAndNotify = (products, threshold = 5) => {
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= threshold)
  
  if (lowStockProducts.length > 0) {
    const message = `有 ${lowStockProducts.length} 个商品库存不足，请及时补货！`
    
    // 应用内通知
    showAppNotification(message)
    
    // 浏览器通知
    if (Notification.permission === 'granted') {
      showBrowserNotification('库存预警', {
        body: message,
        tag: 'low-stock-alert',
        requireInteraction: true
      })
    }
    
    return lowStockProducts
  }
  
  return []
}

// 检查零库存并发送通知
export const checkZeroStockAndNotify = (products) => {
  const zeroStockProducts = products.filter(p => p.stock === 0)
  
  if (zeroStockProducts.length > 0) {
    const message = `有 ${zeroStockProducts.length} 个商品已售罄，请尽快补货！`
    
    // 应用内通知
    showAppNotification(message, 'danger')
    
    // 浏览器通知
    if (Notification.permission === 'granted') {
      showBrowserNotification('库存告急', {
        body: message,
        tag: 'zero-stock-alert',
        requireInteraction: true
      })
    }
    
    return zeroStockProducts
  }
  
  return []
}

// 每日营业提醒
export const sendDailyBusinessReminder = () => {
  const hour = new Date().getHours()
  
  if (hour >= 9 && hour <= 10) {
    showAppNotification('新的一天开始了，祝您生意兴隆！', 'primary')
    
    if (Notification.permission === 'granted') {
      showBrowserNotification('营业提醒', {
        body: '新的一天开始了，祝您生意兴隆！',
        tag: 'daily-reminder'
      })
    }
  }
}

// 销售目标提醒
export const checkSalesGoalAndNotify = (todaySales, goal = 1000) => {
  const progress = (todaySales / goal * 100).toFixed(0)
  
  if (todaySales >= goal) {
    showAppNotification(`恭喜！今日销售已达成目标 ¥${goal}，当前 ¥${todaySales.toFixed(2)}`, 'success')
  } else if (progress >= 80) {
    showAppNotification(`今日销售已完成 ${progress}%，加油冲刺！`, 'primary')
  }
}

