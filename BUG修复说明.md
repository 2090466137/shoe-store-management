# 🐛 Bug 修复说明

## 问题描述
用户管理页面打不开，所有功能跳转都会显示"未登录"界面。

## 根本原因
1. **`Home.vue` 缺少 `onMounted` 钩子**：当用户刷新页面或直接访问 `/home` 时，虽然 `localStorage` 中有 `currentUser`，但 `userStore.currentUser` 还是 `null`，导致页面显示"未登录"。

2. **`UserManagement.vue` 异步函数缺少 `await`**：在切换用户状态、删除用户、重置密码等操作中，调用异步函数时没有使用 `await`，导致操作可能不完整。

3. **路由守卫权限映射不一致**：`router/index.js` 中的权限映射使用了硬编码的 `'admin'`、`'manager'`、`'staff'` 字符串，而不是从 `user.js` 导入的 `ROLES` 常量。

## 修复内容

### 1. `src/views/Home.vue`
**添加 `onMounted` 钩子**，确保用户数据已加载：

```javascript
import { ref, computed, onMounted } from 'vue'

// 确保用户数据已加载
onMounted(async () => {
  // 如果 userStore 中没有当前用户，但 localStorage 有，重新加载
  if (!userStore.currentUser) {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      console.log('检测到未同步的登录状态，重新加载用户数据...')
      await userStore.loadUsers()
      
      // 再次检查，如果还是没有，说明登录已过期
      if (!userStore.currentUser) {
        console.warn('登录状态已过期，跳转到登录页')
        router.replace('/login')
      }
    } else {
      // 没有登录信息，跳转到登录页
      router.replace('/login')
    }
  }
})
```

### 2. `src/views/UserManagement.vue`
**修复异步调用**，在以下函数中添加 `await`：

- **`handleToggleStatus` (第474行)**：
```javascript
const result = await userStore.toggleUserStatus(user.id)
```

- **`handleDelete` (第495行)**：
```javascript
const result = await userStore.deleteUser(editingUser.value.id)
```

- **`handleResetPassword` (第517行)**：
```javascript
const result = await userStore.resetPassword(editingUser.value.id)
```

### 3. `src/router/index.js`
**统一权限映射**，使用 `ROLES` 常量：

```javascript
import { PERMISSIONS, ROLES } from '@/stores/user'

function getUserPermissions(role) {
  const ROLE_PERMISSIONS = {
    [ROLES.MANAGER]: Object.values(PERMISSIONS), // 店长拥有所有权限
    [ROLES.STAFF]: [
      PERMISSIONS.PRODUCT_VIEW,
      PERMISSIONS.SALES_VIEW,
      // ... 其他权限
    ]
  }
  
  return ROLE_PERMISSIONS[role] || []
}
```

## 测试建议

1. **刷新页面测试**：在首页按 `F5` 刷新，确认不会跳转到登录页
2. **直接访问测试**：在浏览器地址栏直接输入 `/home`，确认能正常显示
3. **用户管理测试**：
   - 禁用/启用用户
   - 删除用户
   - 重置密码
4. **权限测试**：用店长和店员账号分别登录，测试权限是否正确

## 提交信息
```
fix: 修复用户管理页面打不开的问题

- 在 Home.vue 添加 onMounted 钩子，确保用户数据已加载
- 修复 UserManagement.vue 中异步函数缺少 await 的问题
- 统一路由守卫中的权限映射，使用 ROLES 常量
```

---
**修复时间**: 2025-12-31
**修复人员**: AI Assistant

