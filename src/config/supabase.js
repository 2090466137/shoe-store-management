import { createClient } from '@supabase/supabase-js'

// Supabase配置信息
const supabaseUrl = 'https://xmuyxqfukqqvyoyyeypb.supabase.co'
const supabaseAnonKey = 'sb_publishable_JJ7cHB3XLGawgUYM80vYSQ_vF2DlZ9K'

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库表名常量
export const TABLES = {
  PRODUCTS: 'products',
  SALES: 'sales',
  PURCHASES: 'purchases'
}

