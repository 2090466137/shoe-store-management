-- 鞋店管理系统 - Supabase数据库表结构
-- 创建时间：2025-12-30

-- ========================================
-- 1. 商品表 (products)
-- ========================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  size TEXT NOT NULL,
  purchase_price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  image TEXT,
  -- 扩展字段
  brand TEXT,
  category TEXT DEFAULT '其他',
  color TEXT,
  supplier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 如果表已存在，添加新字段（ALTER TABLE 语句）
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 5;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '其他';
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS color TEXT;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier TEXT;

-- 商品表索引
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- ========================================
-- 2. 销售表 (sales)
-- ========================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL,
  products JSONB NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  profit DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(5, 2) DEFAULT 0,
  actual_amount DECIMAL(10, 2) NOT NULL,
  salesperson TEXT,
  payment_method TEXT DEFAULT '现金',
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 销售表索引
CREATE INDEX IF NOT EXISTS idx_sales_order_id ON sales(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_salesperson ON sales(salesperson);
CREATE INDEX IF NOT EXISTS idx_sales_member_id ON sales(member_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);

-- ========================================
-- 3. 会员表 (members)
-- ========================================
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  name TEXT,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_recharge DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_consumption DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(5, 2) DEFAULT 1.0,
  level TEXT DEFAULT '普通会员',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 会员表索引
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_members_name ON members(name);
CREATE INDEX IF NOT EXISTS idx_members_created_at ON members(created_at DESC);

-- ========================================
-- 4. 会员充值记录表 (member_recharges)
-- ========================================
CREATE TABLE IF NOT EXISTS member_recharges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT DEFAULT '现金',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 会员充值记录表索引
CREATE INDEX IF NOT EXISTS idx_member_recharges_member_id ON member_recharges(member_id);
CREATE INDEX IF NOT EXISTS idx_member_recharges_created_at ON member_recharges(created_at DESC);

-- ========================================
-- 5. 采购表 (purchases)
-- ========================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_code TEXT NOT NULL,
  product_size TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  purchase_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 采购表索引
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at DESC);

-- ========================================
-- 6. 用户表 (users)
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  status TEXT DEFAULT 'active',
  create_time BIGINT NOT NULL,
  last_login_time BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ========================================
-- 7. 启用行级安全策略 (RLS)
-- ========================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_recharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 8. 创建公开访问策略（允许所有操作）
-- ========================================

-- 商品表策略（如果已存在则删除后重新创建）
DROP POLICY IF EXISTS "Enable all access for products" ON products;
CREATE POLICY "Enable all access for products" ON products
  FOR ALL USING (true) WITH CHECK (true);

-- 销售表策略（如果已存在则删除后重新创建）
DROP POLICY IF EXISTS "Enable all access for sales" ON sales;
CREATE POLICY "Enable all access for sales" ON sales
  FOR ALL USING (true) WITH CHECK (true);

-- 采购表策略（如果已存在则删除后重新创建）
DROP POLICY IF EXISTS "Enable all access for purchases" ON purchases;
CREATE POLICY "Enable all access for purchases" ON purchases
  FOR ALL USING (true) WITH CHECK (true);

-- 会员表策略
DROP POLICY IF EXISTS "Enable all access for members" ON members;
CREATE POLICY "Enable all access for members" ON members
  FOR ALL USING (true) WITH CHECK (true);

-- 会员充值记录表策略
DROP POLICY IF EXISTS "Enable all access for member_recharges" ON member_recharges;
CREATE POLICY "Enable all access for member_recharges" ON member_recharges
  FOR ALL USING (true) WITH CHECK (true);

-- 用户表策略
DROP POLICY IF EXISTS "Enable all access for users" ON users;
CREATE POLICY "Enable all access for users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- 9. 创建更新时间触发器
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 删除已存在的触发器（如果存在）
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 完成！
-- ========================================
-- 所有表创建完成
-- 可以开始使用了
