# 🔄 Netlify 和 Vercel 路由配置对比

**问题**: Vue Router history 模式在 Netlify 和 Vercel 上的配置  
**解决**: 两个平台都需要配置重定向规则

---

## 📊 配置对比

### Netlify 配置 (`netlify.toml`)

```toml
# 重定向规则（支持Vue Router的history模式）
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**说明**:
- `from = "/*"`: 匹配所有路径
- `to = "/index.html"`: 重定向到 index.html
- `status = 200`: 使用 200 状态码（SPA 重定向）

### Vercel 配置 (`vercel.json`)

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**说明**:
- `source: "/(.*)"`: 匹配所有路径
- `destination: "/index.html"`: 重定向到 index.html
- `rewrites`: Vercel 使用 rewrites（不是 redirects）

---

## ✅ 两个配置都已正确设置

### Netlify (`netlify.toml`)
- ✅ 重定向规则已配置
- ✅ 状态码 200（正确）
- ✅ 匹配所有路径

### Vercel (`vercel.json`)
- ✅ 重定向规则已配置
- ✅ 使用 rewrites（正确）
- ✅ 匹配所有路径

---

## 🔍 如果 Netlify 仍然有问题

### 可能的原因

1. **配置未生效**
   - 需要重新部署
   - 清除 Netlify 缓存

2. **浏览器缓存**
   - 清除浏览器缓存
   - 使用无痕模式测试

3. **部署设置问题**
   - 检查 Netlify 部署设置
   - 确认 `netlify.toml` 在根目录

### 解决步骤

1. **重新部署 Netlify**
   ```
   1. 进入 Netlify Dashboard
   2. 找到您的项目
   3. 点击 "Trigger deploy" → "Clear cache and deploy site"
   ```

2. **清除浏览器缓存**
   ```
   - 使用 Ctrl+Shift+Delete
   - 或使用无痕模式
   ```

3. **检查配置**
   ```
   - 确认 netlify.toml 在项目根目录
   - 确认文件已提交到 GitHub
   ```

---

## 📋 完整配置对比

### Netlify (`netlify.toml`)

```toml
[build]
  command = "rm -f package-lock.json && npm install --legacy-peer-deps && npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    Service-Worker-Allowed = "/"
```

### Vercel (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install --legacy-peer-deps",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

---

## 🎯 关键区别

| 配置项 | Netlify | Vercel |
|--------|---------|--------|
| 配置文件 | `netlify.toml` | `vercel.json` |
| 重定向语法 | `[[redirects]]` | `rewrites` |
| 状态码 | `status = 200` | 不需要（rewrites 默认 200） |
| 匹配模式 | `from = "/*"` | `source: "/(.*)"` |
| 目标文件 | `to = "/index.html"` | `destination: "/index.html"` |

---

## 💡 最佳实践

### 同时支持两个平台

您的项目现在同时配置了：
- ✅ `netlify.toml` - Netlify 使用
- ✅ `vercel.json` - Vercel 使用

**好处**:
- 可以在两个平台之间切换
- 不需要修改代码
- 配置独立，互不影响

### 推荐方案

**对于小鞋店**:
- ✅ **推荐使用 Vercel**（免费，性能更好）
- ✅ 保留 `netlify.toml` 作为备份
- ✅ 如果 Vercel 有问题，可以随时切换回 Netlify

---

## 🧪 测试步骤

### Netlify 测试

1. **重新部署**
   - 进入 Netlify Dashboard
   - 触发重新部署（清除缓存）

2. **测试路由**
   - 访问网站
   - 登录
   - 测试路由跳转

### Vercel 测试

1. **等待自动部署**
   - 提交 `vercel.json` 后自动部署

2. **测试路由**
   - 访问网站
   - 登录
   - 测试路由跳转

---

## 🎉 总结

**两个平台的配置都已正确设置！**

- ✅ Netlify: `netlify.toml` 已配置
- ✅ Vercel: `vercel.json` 已配置
- ✅ 两个配置都支持 Vue Router history 模式

**如果还有问题**:
1. 重新部署（清除缓存）
2. 清除浏览器缓存
3. 检查控制台错误

---

**创建日期**: 2025-12-31  
**适用平台**: Netlify 和 Vercel  
**配置状态**: ✅ 已正确配置

