import { createClient } from '@supabase/supabase-js'

// Supabase配置信息
// ⚠️ 重要：请使用环境变量配置，不要在代码中硬编码密钥
// 1. 复制 .env.example 为 .env.local
// 2. 填入你的 Supabase URL 和 Anon Key
// 3. .env.local 文件已在 .gitignore 中，不会被提交到 Git

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// 验证配置
const validateConfig = () => {
  const warnings = []
  
  // 检查 URL
  if (!supabaseUrl) {
    warnings.push('⚠️ Supabase URL 未设置！')
    warnings.push('请按照以下步骤配置：')
    warnings.push('1. 复制 env.example 为 .env.local')
    warnings.push('2. 访问 https://app.supabase.com/')
    warnings.push('3. 选择你的项目')
    warnings.push('4. Settings → API → 复制 Project URL')
    warnings.push('5. 粘贴到 .env.local 的 VITE_SUPABASE_URL')
  }
  
  // 检查 Anon Key
  if (!supabaseAnonKey) {
    warnings.push('⚠️ Supabase Anon Key 未设置！')
    warnings.push('请按照以下步骤配置：')
    warnings.push('1. 访问 https://app.supabase.com/')
    warnings.push('2. 选择你的项目')
    warnings.push('3. Settings → API → 复制 anon public key')
    warnings.push('4. 粘贴到 .env.local 的 VITE_SUPABASE_ANON_KEY')
  } else if (!supabaseAnonKey.startsWith('eyJ')) {
    warnings.push('⚠️ Supabase Anon Key 格式错误！')
    warnings.push('正确的 Anon Key 应该：')
    warnings.push('- 以 eyJ 开头')
    warnings.push('- 包含两个点号 .')
    warnings.push('- 长度约 200-300 字符')
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

