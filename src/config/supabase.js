import { createClient } from '@supabase/supabase-js'

// Supabase配置信息
// 支持环境变量配置，方便在不同环境使用不同配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xmuyxqfukqqvyoyyeypb.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdXl4cWZ1a3FxdnlveXlleXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODA5ODYsImV4cCI6MjA4MjY1Njk4Nn0.PKSLwORB81xqhn-8-ANDFrjwvNoU8wZesXShcvEHMmI'

// 验证配置
const validateConfig = () => {
  const warnings = []
  
  // 检查 Anon Key 格式
  if (supabaseAnonKey === 'PLEASE_SET_YOUR_ANON_KEY_HERE') {
    warnings.push('⚠️ Supabase Anon Key 未设置！')
    warnings.push('请按照以下步骤获取正确的密钥：')
    warnings.push('1. 访问 https://app.supabase.com/')
    warnings.push('2. 选择项目 xmuyxqfukqqvyoyyeypb')
    warnings.push('3. Settings → API → 复制 anon public key')
    warnings.push('4. 更新 src/config/supabase.js 或创建 .env 文件')
    warnings.push('详细步骤请查看：获取Supabase密钥指南.md')
  } else if (!supabaseAnonKey.startsWith('eyJ')) {
    warnings.push('⚠️ Supabase Anon Key 格式错误！')
    warnings.push('正确的 Anon Key 应该：')
    warnings.push('- 以 eyJ 开头')
    warnings.push('- 包含两个点号 .')
    warnings.push('- 长度约 200-300 字符')
    warnings.push('当前的 key: ' + supabaseAnonKey)
  }
  
  if (warnings.length > 0) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ Supabase 配置错误')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    warnings.forEach(w => console.error(w))
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('⚠️ 系统将使用 localStorage 模式运行')
    console.error('⚠️ 数据不会同步到云端，仅保存在本地')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return false
  }
  
  console.log('✅ Supabase 配置验证通过')
  return true
}

// 执行验证
const isConfigValid = validateConfig()

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 导出配置状态
export const isSupabaseConfigured = isConfigValid

// 数据库表名常量
export const TABLES = {
  PRODUCTS: 'products',
  SALES: 'sales',
  PURCHASES: 'purchases',
  MEMBERS: 'members',
  MEMBER_RECHARGES: 'member_recharges',
  USERS: 'users',
  BACKUPS: 'backups',
  RETURNS: 'returns',  // 退换货记录表
  OPERATION_LOGS: 'operation_logs'  // 操作日志表
}

