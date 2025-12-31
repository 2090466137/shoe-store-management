# 获取 Supabase 密钥 - 详细指南

## 🎯 目标

获取正确的 Supabase Anon Key，修复云端同步问题。

---

## 📋 **步骤 1：登录 Supabase 控制台**

### **访问地址**
```
https://app.supabase.com/
或
https://supabase.com/dashboard
```

### **登录信息**
- 使用您创建 Supabase 项目时的账号登录
- 如果忘记密码，点击"Forgot password"重置

---

## 📋 **步骤 2：选择项目**

### **项目信息**
- **项目 ID**: `xmuyxqfukqqvyoyyeypb`
- **项目 URL**: `https://xmuyxqfukqqvyoyyeypb.supabase.co`

### **操作**
1. 登录后，您会看到项目列表
2. 找到并点击项目（可能显示为项目名称或 ID）
3. 进入项目控制台

---

## 📋 **步骤 3：获取 API Keys**

### **导航路径**
```
左侧菜单 → Settings ⚙️ → API
```

### **详细步骤**
1. 在左侧菜单栏，点击最下方的 **"Settings"** ⚙️
2. 在设置页面，点击 **"API"** 选项卡
3. 找到 **"Project API keys"** 部分

### **您会看到两个密钥**

#### **1. anon public key** ⭐（这是我们需要的）
```
标签：anon public
用途：客户端应用程序
特征：
- 以 eyJ 开头
- 包含两个点号 .
- 长度约 200-300 字符
- 示例：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdXl4cWZ1a3FxdnlveXlleXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk1NzI4MDAsImV4cCI6MjAwNTE0ODgwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### **2. service_role key** ⚠️（不要使用这个）
```
标签：service_role secret
用途：服务器端应用程序（权限太高）
注意：不要在客户端使用！
```

### **复制 anon public key**
1. 找到 **"anon public"** 标签的密钥
2. 点击右侧的 **复制图标** 📋
3. 密钥已复制到剪贴板

---

## 📋 **步骤 4：更新配置文件**

### **方法 1：直接修改配置文件（快速）**

**打开文件**: `src/config/supabase.js`

**修改前**:
```javascript
const supabaseUrl = 'https://xmuyxqfukqqvyoyyeypb.supabase.co'
const supabaseAnonKey = 'sb_publishable_JJ7cHB3XLGawgUYM80vYSQ_vF2DlZ9K'  // ❌ 错误
```

**修改后**:
```javascript
const supabaseUrl = 'https://xmuyxqfukqqvyoyyeypb.supabase.co'
const supabaseAnonKey = '这里粘贴您刚才复制的 anon public key'  // ✅ 正确
```

**完整代码**:
```javascript
import { createClient } from '@supabase/supabase-js'

// Supabase配置信息
const supabaseUrl = 'https://xmuyxqfukqqvyoyyeypb.supabase.co'
const supabaseAnonKey = '这里粘贴您的 anon public key'

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库表名常量
export const TABLES = {
  PRODUCTS: 'products',
  SALES: 'sales',
  PURCHASES: 'purchases',
  MEMBERS: 'members',
  MEMBER_RECHARGES: 'member_recharges',
  USERS: 'users',
  BACKUPS: 'backups'
}
```

---

### **方法 2：使用 .env 文件（推荐，更安全）**

#### **创建 `.env` 文件**

**位置**: 项目根目录（与 `package.json` 同级）

**内容**:
```env
VITE_SUPABASE_URL=https://xmuyxqfukqqvyoyyeypb.supabase.co
VITE_SUPABASE_ANON_KEY=这里粘贴您的 anon public key
```

#### **修改 `src/config/supabase.js`**

```javascript
import { createClient } from '@supabase/supabase-js'

// 从环境变量读取配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 验证配置
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少 Supabase 配置！')
  console.error('请检查 .env 文件是否存在，并包含以下变量：')
  console.error('- VITE_SUPABASE_URL')
  console.error('- VITE_SUPABASE_ANON_KEY')
  throw new Error('缺少 Supabase 配置')
}

// 验证 Anon Key 格式
if (!supabaseAnonKey.startsWith('eyJ')) {
  console.error('❌ Supabase Anon Key 格式错误！')
  console.error('正确的 Anon Key 应该以 eyJ 开头')
  throw new Error('Supabase Anon Key 格式错误')
}

console.log('✅ Supabase 配置已加载')

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库表名常量
export const TABLES = {
  PRODUCTS: 'products',
  SALES: 'sales',
  PURCHASES: 'purchases',
  MEMBERS: 'members',
  MEMBER_RECHARGES: 'member_recharges',
  USERS: 'users',
  BACKUPS: 'backups'
}
```

#### **创建 `.env.example` 文件（提交到 Git）**

**位置**: 项目根目录

**内容**:
```env
# Supabase 配置
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

#### **更新 `.gitignore`**

确保 `.env` 文件不会被提交到 Git：

```
# 环境变量
.env
.env.local
.env.*.local
```

---

## 📋 **步骤 5：Vercel 部署配置**

### **在 Vercel 控制台配置环境变量**

1. 访问：https://vercel.com/dashboard
2. 选择您的项目
3. 点击 **"Settings"** → **"Environment Variables"**
4. 添加以下变量：

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://xmuyxqfukqqvyoyyeypb.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `您的 anon public key` |

5. 点击 **"Save"**
6. 重新部署项目

---

## 📋 **步骤 6：测试验证**

### **本地测试**

1. **重启开发服务器**
```bash
npm run dev
```

2. **打开浏览器控制台**
   - 按 F12 打开开发者工具
   - 切换到 **Console** 标签

3. **查看日志**
   - 应该看到：`✅ Supabase 配置已加载`
   - 添加商品时应该看到：`✅ 商品已保存到云端和 localStorage`

4. **测试添加商品**
   - 添加一个测试商品
   - 刷新页面
   - 商品应该还在

### **线上测试**

1. **提交代码到 GitHub**
2. **Vercel 自动部署**
3. **访问 https://lhp.wang**
4. **测试添加商品和刷新**

---

## ✅ **验证成功标志**

### **控制台日志**

**成功的日志**:
```
✅ Supabase 配置已加载
✅ 从 localStorage 加载了 X 个商品
✅ 从云端加载了 X 个商品
✅ 商品已保存到云端和 localStorage
```

**失败的日志**:
```
❌ 云端加载失败: {...}
⚠️ 使用 localStorage 数据
⚠️ 商品已保存到 localStorage（云端失败）
```

### **功能测试**

- ✅ 添加商品成功
- ✅ 刷新页面后商品还在
- ✅ 控制台显示"保存到云端"
- ✅ 其他设备也能看到数据

---

## 🔍 **常见问题**

### **问题 1：找不到项目**

**原因**: 可能使用了错误的账号登录

**解决**:
1. 检查是否使用了正确的 Supabase 账号
2. 如果有多个账号，尝试切换账号
3. 联系项目创建者获取访问权限

---

### **问题 2：复制的 Key 格式不对**

**检查清单**:
- ✅ 是否复制了 **anon public** key（不是 service_role）
- ✅ 是否完整复制（没有多余空格或换行）
- ✅ Key 是否以 `eyJ` 开头
- ✅ Key 长度是否足够（200+ 字符）

**正确格式示例**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdXl4cWZ1a3FxdnlveXlleXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk1NzI4MDAsImV4cCI6MjAwNTE0ODgwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### **问题 3：更新后还是连接失败**

**排查步骤**:
1. 检查 Supabase 项目是否暂停（免费版长期不用会暂停）
2. 检查网络连接（国内访问 Supabase 可能较慢）
3. 检查浏览器控制台的错误信息
4. 尝试在 Supabase 控制台的 SQL Editor 中执行简单查询测试

---

### **问题 4：Vercel 部署后还是失败**

**检查清单**:
- ✅ 是否在 Vercel 控制台配置了环境变量
- ✅ 环境变量名称是否正确（`VITE_` 前缀）
- ✅ 是否重新部署了项目
- ✅ 是否清除了浏览器缓存

---

## 📞 **需要帮助？**

如果您在获取密钥过程中遇到问题：

1. **检查 Supabase 项目状态**
   - 登录控制台查看项目是否正常运行
   - 免费版项目长期不用会自动暂停

2. **查看错误日志**
   - 浏览器控制台（F12）
   - Vercel 部署日志

3. **联系项目管理员**
   - 如果您不是项目创建者
   - 请联系创建者获取访问权限

---

## 🎯 **快速检查清单**

完成以下所有项，云端同步就能正常工作：

- [ ] 登录 Supabase 控制台
- [ ] 找到项目 `xmuyxqfukqqvyoyyeypb`
- [ ] 进入 Settings → API
- [ ] 复制 **anon public** key
- [ ] 更新 `src/config/supabase.js` 或创建 `.env` 文件
- [ ] 重启开发服务器
- [ ] 测试添加商品
- [ ] 查看控制台日志（应该显示"保存到云端"）
- [ ] 刷新页面验证数据不丢失
- [ ] 提交代码到 GitHub
- [ ] 在 Vercel 配置环境变量
- [ ] 重新部署并测试

---

**更新日期**: 2025-12-31  
**状态**: 📝 **待执行**  
**预计时间**: 5-10 分钟

