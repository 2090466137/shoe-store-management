/**
 * 版本管理工具
 * 用于检测应用更新并提示用户刷新
 */

// 当前版本号（每次更新时修改此版本号）
export const APP_VERSION = '1.0.4'

// 版本存储键
const VERSION_KEY = 'app_version'

/**
 * 检查是否有新版本
 */
export function checkVersion() {
  const savedVersion = localStorage.getItem(VERSION_KEY)
  
  if (savedVersion && savedVersion !== APP_VERSION) {
    // 发现新版本
    return {
      hasUpdate: true,
      oldVersion: savedVersion,
      newVersion: APP_VERSION
    }
  }
  
  return {
    hasUpdate: false,
    currentVersion: APP_VERSION
  }
}

/**
 * 保存当前版本号
 */
export function saveVersion() {
  localStorage.setItem(VERSION_KEY, APP_VERSION)
}

/**
 * 清除所有缓存并刷新
 */
export async function clearCacheAndReload() {
  try {
    // 清除 localStorage（保留登录信息）
    const userInfo = localStorage.getItem('userInfo')
    const token = localStorage.getItem('token')
    
    localStorage.clear()
    
    if (userInfo) localStorage.setItem('userInfo', userInfo)
    if (token) localStorage.setItem('token', token)
    
    // 清除 Service Worker 缓存
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        await registration.unregister()
      }
    }
    
    // 清除所有 Cache Storage
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
    }
    
    // 保存新版本号
    saveVersion()
    
    // 强制刷新页面
    window.location.reload(true)
  } catch (error) {
    console.error('清除缓存失败:', error)
    // 即使失败也尝试刷新
    window.location.reload(true)
  }
}

/**
 * 初始化版本检查
 */
export function initVersionCheck() {
  const versionInfo = checkVersion()
  
  if (versionInfo.hasUpdate) {
    // 发现新版本，提示用户
    const message = `发现新版本 ${versionInfo.newVersion}（当前版本 ${versionInfo.oldVersion}），是否立即更新？`
    
    if (confirm(message)) {
      clearCacheAndReload()
    } else {
      // 用户选择稍后更新，保存新版本号避免重复提示
      saveVersion()
    }
  } else {
    // 首次访问或版本一致，保存版本号
    saveVersion()
  }
}

