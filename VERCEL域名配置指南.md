# Vercel 域名配置指南 - 让国内也能访问

## 📋 方案概览

要让国内用户也能访问Vercel部署的网站，有以下几种方案：

### 方案1：使用Vercel默认域名（最简单，但可能较慢）
- 优点：无需配置，直接可用
- 缺点：国内访问可能较慢或不稳定

### 方案2：添加自定义域名 + Cloudflare CDN（推荐）
- 优点：速度快，稳定性好，免费
- 缺点：需要域名

### 方案3：使用国内备案域名
- 优点：国内访问最快
- 缺点：需要备案，流程复杂

---

## 🚀 方案2详细步骤（推荐）

### 第一步：在Vercel添加自定义域名

1. **登录Vercel控制台**
   - 访问：https://vercel.com
   - 登录你的账号

2. **进入项目设置**
   - 选择你的项目（shoe-store-management）
   - 点击顶部菜单的 **Settings**
   - 左侧菜单选择 **Domains**

3. **添加域名**
   - 在输入框中输入你的域名（例如：`yourdomain.com` 或 `www.yourdomain.com`）
   - 点击 **Add** 按钮
   - Vercel会显示需要配置的DNS记录

### 第二步：配置DNS解析

#### 如果使用Cloudflare（推荐，免费且速度快）

1. **在Cloudflare添加域名**
   - 访问：https://cloudflare.com
   - 注册/登录账号
   - 添加你的域名到Cloudflare
   - 按照提示修改域名的DNS服务器

2. **配置DNS记录**
   在Cloudflare的DNS设置中添加以下记录：

   ```
   类型：CNAME
   名称：@ 或 www
   目标：cname.vercel-dns.com
   TTL：自动
   代理状态：已代理（橙色云朵）✅
   ```

   或者使用A记录：
   ```
   类型：A
   名称：@
   目标：76.76.21.21（Vercel的IP，可能变化，以Vercel提示为准）
   TTL：自动
   代理状态：已代理（橙色云朵）✅
   ```

3. **启用Cloudflare加速**
   - 在Cloudflare控制台，确保代理状态是 **已代理**（橙色云朵图标）
   - 这样可以通过Cloudflare的全球CDN加速访问

#### 如果使用其他DNS服务商（如阿里云、腾讯云）

1. **添加CNAME记录**
   ```
   主机记录：@ 或 www
   记录类型：CNAME
   记录值：cname.vercel-dns.com
   TTL：600
   ```

2. **等待DNS生效**
   - 通常需要几分钟到几小时
   - 可以使用 `nslookup yourdomain.com` 检查

### 第三步：验证域名配置

1. **在Vercel验证**
   - 回到Vercel的Domains页面
   - 等待域名状态变为 **Valid**（绿色对勾）
   - 如果显示错误，检查DNS配置是否正确

2. **测试访问**
   - 在浏览器访问你的域名
   - 应该能看到网站正常加载

---

## 🌐 方案3：使用国内备案域名（最佳性能）

### 前提条件
- 域名已备案
- 有国内服务器或CDN服务

### 配置步骤

1. **在Vercel添加域名**（同方案2第一步）

2. **使用国内CDN加速**
   - 推荐：阿里云CDN、腾讯云CDN、又拍云
   - 配置CDN回源到Vercel的域名
   - 这样国内用户访问CDN节点，速度更快

3. **配置DNS**
   - 将域名DNS解析到CDN提供的CNAME地址
   - 而不是直接解析到Vercel

---

## ⚙️ Vercel环境变量配置（如果需要）

如果你的应用需要配置环境变量（如API地址），可以在Vercel控制台设置：

1. 进入项目 **Settings** > **Environment Variables**
2. 添加需要的环境变量
3. 重新部署项目

---

## 🔧 常见问题解决

### 问题1：域名验证失败
- **检查DNS配置**：确保CNAME或A记录正确
- **等待DNS传播**：可能需要24-48小时
- **检查域名状态**：确保域名未被封禁

### 问题2：国内访问慢
- **使用Cloudflare CDN**：免费且有效
- **使用国内CDN**：如阿里云、腾讯云（需备案）
- **检查Vercel区域**：确保选择合适的地域

### 问题3：HTTPS证书问题
- Vercel会自动为自定义域名配置SSL证书
- 通常需要等待几分钟到几小时
- 如果证书未生效，检查DNS配置是否正确

### 问题4：Supabase连接问题
- 确保Supabase的URL和密钥配置正确
- 检查Supabase是否允许你的域名访问
- 如果Supabase在国内访问慢，考虑使用代理或CDN

---

## 📝 当前项目配置检查清单

✅ **已完成：**
- [x] vercel.json 配置文件已创建
- [x] 支持Vue Router的history模式
- [x] PWA配置已设置

⏳ **待完成：**
- [ ] 在Vercel控制台添加自定义域名
- [ ] 配置DNS解析
- [ ] 验证域名访问
- [ ] 测试国内访问速度

---

## 🎯 快速开始命令

```bash
# 1. 安装Vercel CLI（如果还没安装）
npm i -g vercel

# 2. 登录Vercel
vercel login

# 3. 部署项目
vercel

# 4. 添加域名（在Vercel控制台操作更方便）
# 或使用命令行：
vercel domains add yourdomain.com
```

---

## 💡 推荐配置

**最佳实践组合：**
1. 域名：使用 `.com` 或 `.cn` 域名（已备案）
2. DNS：使用Cloudflare（免费CDN加速）
3. 部署：Vercel（自动HTTPS、全球CDN）
4. 数据库：Supabase（如果慢，考虑国内替代方案）

这样配置后，国内用户访问速度会明显提升！

---

## 📞 需要帮助？

如果遇到问题，可以：
1. 查看Vercel官方文档：https://vercel.com/docs
2. 查看Cloudflare文档：https://developers.cloudflare.com
3. 检查DNS解析工具：https://dnschecker.org

