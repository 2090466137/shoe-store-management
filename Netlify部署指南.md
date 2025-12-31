# Netlify 部署指南 - 双平台高可用方案

**目标：** 实现 Vercel（主） + Netlify（备）双平台部署  
**方案：** 主备切换  
**成本：** 免费  
**时间：** 30 分钟

---

## 🎯 部署目标

### 架构设计
```
阿里云域名 (lhp.wang)
        ↓
   Cloudflare DNS
   ↙          ↘
Vercel (主)   Netlify (备)
正常使用      故障切换
```

### 实现效果
- ✅ Vercel 崩溃时，切换到 Netlify
- ✅ 流量用完时，切换到另一个平台
- ✅ 总带宽：200 GB/月（100 + 100）
- ✅ 双重保障，高可用性

---

## 📋 准备工作

### 1. 确认 GitHub 仓库
- ✅ 仓库名：`shoe-store-management`
- ✅ 代码已推送到 GitHub
- ✅ 包含 `netlify.toml` 配置文件

### 2. 注册 Netlify 账号
- 访问：https://www.netlify.com
- 使用 GitHub 账号登录（推荐）

---

## 🚀 部署步骤

### 第一步：连接 GitHub 仓库

1. **登录 Netlify**
   ```
   访问：https://app.netlify.com
   点击：Add new site → Import an existing project
   ```

2. **选择 GitHub**
   ```
   点击：GitHub
   授权 Netlify 访问你的 GitHub
   ```

3. **选择仓库**
   ```
   搜索：shoe-store-management
   点击：选择该仓库
   ```

---

### 第二步：配置构建设置

**Netlify 会自动读取 `netlify.toml` 配置，无需手动设置！**

如果需要确认，检查以下设置：

```
Base directory:     (留空)
Build command:      npm run build
Publish directory:  dist
```

**环境变量（如果需要）：**
```
NODE_VERSION = 20
NPM_FLAGS = --legacy-peer-deps
```

---

### 第三步：部署

1. **点击 "Deploy site"**
   ```
   Netlify 开始构建和部署
   预计时间：2-3 分钟
   ```

2. **等待部署完成**
   ```
   状态：Building → Published
   显示：✅ Site is live
   ```

3. **获取 Netlify 域名**
   ```
   例如：random-name-123456.netlify.app
   ```

---

### 第四步：自定义域名（可选）

1. **修改站点名称**
   ```
   Site settings → Site details → Change site name
   改为：shoe-store-lhp
   新域名：shoe-store-lhp.netlify.app
   ```

2. **测试访问**
   ```
   访问：https://shoe-store-lhp.netlify.app
   确认：网站正常显示
   测试：登录、添加商品等功能
   ```

---

## 🔄 切换流程

### 场景 1：Vercel 崩溃

**检测方法：**
```
访问 https://lhp.wang
显示：502 Bad Gateway 或无法访问
```

**切换步骤：**

1. **登录 Cloudflare**
   ```
   访问：https://dash.cloudflare.com
   选择域名：lhp.wang
   ```

2. **修改 DNS 记录**
   ```
   DNS → Records
   找到：A 记录 @ → 216.198.79.1
   点击：Edit
   ```

3. **获取 Netlify IP**
   ```
   方法 1：使用 CNAME（推荐）
   - 类型：CNAME
   - 名称：@
   - 目标：shoe-store-lhp.netlify.app
   - 代理状态：已代理
   
   方法 2：使用 A 记录
   - 在终端运行：ping shoe-store-lhp.netlify.app
   - 获取 IP 地址（例如：75.2.60.5）
   - 修改 A 记录为该 IP
   ```

4. **保存并等待**
   ```
   点击：Save
   等待：2-5 分钟（DNS 生效）
   ```

5. **验证切换**
   ```
   访问：https://lhp.wang
   确认：网站恢复正常
   检查：功能是否正常
   ```

---

### 场景 2：Vercel 流量用完

**检测方法：**
```
Vercel 仪表板显示：Bandwidth limit exceeded
或网站显示：Bandwidth limit exceeded
```

**切换步骤：**
```
同上，切换到 Netlify
等待下个月 Vercel 流量重置
```

---

### 场景 3：切换回 Vercel

**时机：**
- Vercel 恢复正常
- Vercel 流量重置（每月1号）

**步骤：**
```
1. 登录 Cloudflare
2. 修改 DNS 记录
3. 改回 Vercel IP：216.198.79.1
4. 保存并等待生效
```

---

## 📊 平台对比

### Vercel（主平台）
| 指标 | 免费版 |
|------|--------|
| 带宽 | 100 GB/月 |
| 构建时间 | 6000 分钟/月 |
| 部署速度 | 快 ⚡⚡⚡ |
| 国内访问 | 需要 CDN |
| 稳定性 | ⭐⭐⭐⭐⭐ |

### Netlify（备用平台）
| 指标 | 免费版 |
|------|--------|
| 带宽 | 100 GB/月 |
| 构建时间 | 300 分钟/月 |
| 部署速度 | 快 ⚡⚡⚡ |
| 国内访问 | 需要 CDN |
| 稳定性 | ⭐⭐⭐⭐⭐ |

### 双平台总计
- 🎉 总带宽：200 GB/月
- 🎉 总构建时间：6300 分钟/月
- 🎉 双重保障
- 🎉 互为备份

---

## 🔧 自动部署配置

### GitHub 推送自动部署

**Vercel：**
```
✅ 已配置
推送到 main 分支 → 自动部署
```

**Netlify：**
```
✅ 自动配置
推送到 main 分支 → 自动部署
```

**效果：**
```
你推送代码到 GitHub
    ↓
Vercel 自动部署（2-3 分钟）
    ↓
Netlify 自动部署（2-3 分钟）
    ↓
两个平台代码同步
```

---

## 📱 测试清单

### 部署后必测项目

#### 1. 基础访问测试
- [ ] Netlify 域名可以访问
- [ ] 显示登录页面
- [ ] 样式正常加载
- [ ] 图标正常显示

#### 2. 功能测试
- [ ] 登录功能正常
- [ ] 商品管理正常
- [ ] 销售开单正常
- [ ] 数据同步正常（Supabase）

#### 3. PWA 测试
- [ ] 可以添加到主屏幕
- [ ] 离线模式正常
- [ ] Service Worker 正常

#### 4. 性能测试
- [ ] 首屏加载速度 < 3 秒
- [ ] 页面切换流畅
- [ ] 无明显卡顿

---

## ⚠️ 注意事项

### 1. 数据库共享
```
✅ Vercel 和 Netlify 使用同一个 Supabase 数据库
✅ 数据自动同步，无需额外配置
✅ 切换平台不影响数据
```

### 2. 环境变量
```
如果你的项目使用了环境变量（.env）：
1. 在 Netlify 中配置相同的环境变量
2. Site settings → Environment variables
3. 添加所有必要的变量
```

### 3. 构建时间
```
⚠️ Netlify 免费版构建时间较少（300 分钟/月）
💡 建议：
  - 只在必要时触发 Netlify 构建
  - 或升级到 Pro 版（$19/月）
```

### 4. 域名切换时间
```
DNS 生效时间：2-5 分钟
如果使用 Cloudflare 代理：更快（< 1 分钟）
```

---

## 🎯 最佳实践

### 1. 日常使用
```
✅ 主要使用 Vercel
✅ 定期检查 Vercel 流量使用情况
✅ 每月测试一次 Netlify 是否正常
```

### 2. 故障切换
```
✅ 发现 Vercel 故障，立即切换
✅ 切换后通知用户（如有必要）
✅ Vercel 恢复后切换回去
```

### 3. 流量管理
```
✅ 监控 Vercel 流量
✅ 接近 100 GB 时提前切换
✅ 下月初切换回 Vercel
```

### 4. 代码部署
```
✅ 推送代码前先测试
✅ 确保两个平台都能正常构建
✅ 部署后测试两个平台
```

---

## 📞 故障排查

### 问题 1：Netlify 构建失败

**可能原因：**
- Node 版本不匹配
- 依赖安装失败
- 构建命令错误

**解决方法：**
```
1. 检查 netlify.toml 配置
2. 确认 Node 版本为 20
3. 使用 --legacy-peer-deps 标志
4. 查看构建日志找出具体错误
```

---

### 问题 2：切换后网站无法访问

**可能原因：**
- DNS 未生效
- Netlify 站点未运行
- SSL 证书问题

**解决方法：**
```
1. 等待 5-10 分钟（DNS 生效）
2. 检查 Netlify 站点状态
3. 清除浏览器缓存
4. 使用无痕模式测试
```

---

### 问题 3：数据不同步

**可能原因：**
- 这不应该发生（共享数据库）

**解决方法：**
```
1. 检查 Supabase 连接
2. 确认两个平台使用相同的数据库配置
3. 刷新页面重新加载数据
```

---

## 🏆 部署完成检查清单

### 部署阶段
- [ ] Netlify 账号已注册
- [ ] GitHub 仓库已连接
- [ ] 构建配置正确
- [ ] 首次部署成功
- [ ] 获取 Netlify 域名

### 测试阶段
- [ ] Netlify 站点可以访问
- [ ] 登录功能正常
- [ ] 所有功能正常
- [ ] PWA 功能正常
- [ ] 数据同步正常

### 文档阶段
- [ ] 记录 Netlify 域名
- [ ] 记录 Netlify IP（如需要）
- [ ] 保存切换步骤
- [ ] 团队成员知晓切换流程

---

## 📊 监控建议

### 1. Vercel 监控
```
定期检查：
- 带宽使用情况
- 构建次数
- 错误日志
```

### 2. Netlify 监控
```
定期检查：
- 站点状态
- 构建是否成功
- 功能是否正常
```

### 3. Cloudflare 监控
```
定期检查：
- DNS 记录正确性
- CDN 缓存状态
- 流量统计
```

---

## 🎉 总结

### 实现效果

**高可用性：**
- ✅ 单点故障不影响服务
- ✅ 5 分钟内完成切换
- ✅ 用户几乎无感知

**流量扩展：**
- ✅ 总带宽翻倍（200 GB）
- ✅ 流量用完可切换
- ✅ 成本为零

**维护简单：**
- ✅ 自动部署
- ✅ 手动切换
- ✅ 无需额外配置

---

## 📞 技术支持

### 遇到问题？

1. **查看构建日志**
   - Netlify → Deploys → 点击构建
   - 查看详细日志

2. **测试 Netlify 站点**
   - 直接访问 .netlify.app 域名
   - 确认功能是否正常

3. **检查 DNS 设置**
   - Cloudflare → DNS
   - 确认记录正确

---

**部署完成后，你将拥有一个高可用、零成本的双平台架构！** 🎉

---

**最后更新：** 2025-12-31  
**文档版本：** v1.0

