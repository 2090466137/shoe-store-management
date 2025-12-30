import { createClient } from '@supabase/supabase-js'

// Supabase配置信息
// 支持环境变量配置，方便在不同环境使用不同配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xmuyxqfukqqvyoyyeypb.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_JJ7cHB3XLGawgUYM80vYSQ_vF2DlZ9K'

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库表名常量
export const TABLES = {
  PRODUCTS: 'products',
  SALES: 'sales',
  PURCHASES: 'purchases',
  MEMBERS: 'members',
  MEMBER_RECHARGES: 'member_recharges',
  USERS: 'users'
}
