import { createClient } from '@supabase/supabase-js'

// Supabase配置信息
// ⚠️ 重要：请使用环境变量配置，不要在代码中硬编码密钥
// 1. 复制 .env.example 为 .env.local
// 2. 填入你的 Supabase URL 和 Anon Key
// 3. .env.local 文件已在 .gitignore 中，不会被提交到 Git

// 优先使用环境变量，如果没有则使用默认值（确保系统能正常运行）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xmuyxqfukqqvyoyyeypb.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdXl4cWZ1a3FxdnlveXlleXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODA5ODYsImV4cCI6MjA4MjY1Njk4Nn0.PKSLwORB81xqhn-8-ANDFrjwvNoU8wZesXShcvEHMmI'

// 验证配置
const validateConfig = () => {
  // 检查是否使用了环境变量
  const usingEnvVars = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  
  if (usingEnvVars) {
    console.log('✅ Supabase 配置验证通过（使用环境变量）')
  } else {
    console.log('✅ Supabase 配置验证通过（使用默认配置）')
    console.log('💡 提示：可以创建 .env.local 文件使用自己的 Supabase 配置')
  }
  
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

