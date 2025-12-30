import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 角色定义
export const ROLES = {
  ADMIN: 'admin',      // 管理员 - 所有权限
  MANAGER: 'manager',  // 店长 - 大部分权限，不能管理用户
  STAFF: 'staff'       // 店员 - 基本销售权限
}

// 角色中文名称
export const ROLE_NAMES = {
  [ROLES.ADMIN]: '管理员',
  [ROLES.MANAGER]: '店长',
  [ROLES.STAFF]: '店员'
}

// 权限定义
export const PERMISSIONS = {
  // 商品管理
  PRODUCT_VIEW: 'product:view',       // 查看商品
  PRODUCT_ADD: 'product:add',         // 添加商品
  PRODUCT_EDIT: 'product:edit',       // 编辑商品
  PRODUCT_DELETE: 'product:delete',   // 删除商品
  
  // 进货管理
  PURCHASE_VIEW: 'purchase:view',     // 查看进货记录
  PURCHASE_ADD: 'purchase:add',       // 添加进货
  
  // 销售管理
  SALES_VIEW: 'sales:view',           // 查看销售记录
  SALES_ADD: 'sales:add',             // 销售开单
  SALES_DELETE: 'sales:delete',       // 删除销售记录
  
  // 退换货
  RETURNS_VIEW: 'returns:view',       // 查看退换货
  RETURNS_ADD: 'returns:add',         // 处理退换货
  
  // 会员管理
  MEMBER_VIEW: 'member:view',         // 查看会员
  MEMBER_ADD: 'member:add',           // 添加会员
  MEMBER_EDIT: 'member:edit',         // 编辑会员
  MEMBER_RECHARGE: 'member:recharge', // 会员充值
  
  // 统计报表
  STATS_VIEW: 'stats:view',           // 查看基本统计
  STATS_PROFIT: 'stats:profit',       // 查看利润数据
  STATS_REPORT: 'stats:report',       // 查看详细报表
  
  // 库存盘点
  INVENTORY_VIEW: 'inventory:view',   // 查看库存
  INVENTORY_CHECK: 'inventory:check', // 库存盘点
  
  // 员工业绩
  STAFF_STATS_VIEW: 'staff_stats:view',     // 查看自己业绩
  STAFF_STATS_ALL: 'staff_stats:all',       // 查看所有员工业绩
  
  // 数据管理
  DATA_BACKUP: 'data:backup',         // 数据备份
  DATA_RESTORE: 'data:restore',       // 数据恢复
  DATA_CLEAR: 'data:clear',           // 清除数据
  
  // 用户管理
  USER_VIEW: 'user:view',             // 查看用户列表
  USER_ADD: 'user:add',               // 添加用户
  USER_EDIT: 'user:edit',             // 编辑用户
  USER_DELETE: 'user:delete',         // 删除用户
  
  // 系统设置
  SETTINGS_VIEW: 'settings:view',     // 查看设置
  SETTINGS_EDIT: 'settings:edit'      // 修改设置
}

// 角色权限映射
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // 管理员拥有所有权限
  
  [ROLES.MANAGER]: [
    // 商品管理
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_ADD,
    PERMISSIONS.PRODUCT_EDIT,
    PERMISSIONS.PRODUCT_DELETE,
    // 进货管理
    PERMISSIONS.PURCHASE_VIEW,
    PERMISSIONS.PURCHASE_ADD,
    // 销售管理
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_ADD,
    PERMISSIONS.SALES_DELETE,
    // 退换货
    PERMISSIONS.RETURNS_VIEW,
    PERMISSIONS.RETURNS_ADD,
    // 会员管理
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MEMBER_ADD,
    PERMISSIONS.MEMBER_EDIT,
    PERMISSIONS.MEMBER_RECHARGE,
    // 统计报表
    PERMISSIONS.STATS_VIEW,
    PERMISSIONS.STATS_PROFIT,
    PERMISSIONS.STATS_REPORT,
    // 库存盘点
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_CHECK,
    // 员工业绩
    PERMISSIONS.STAFF_STATS_VIEW,
    PERMISSIONS.STAFF_STATS_ALL,
    // 数据管理
    PERMISSIONS.DATA_BACKUP,
    PERMISSIONS.DATA_RESTORE
  ],
  
  [ROLES.STAFF]: [
    // 商品管理 - 只能查看
    PERMISSIONS.PRODUCT_VIEW,
    // 销售管理
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_ADD,
    // 退换货 - 只能查看
    PERMISSIONS.RETURNS_VIEW,
    // 会员管理
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MEMBER_ADD,
    PERMISSIONS.MEMBER_RECHARGE,
    // 统计 - 只能看基本统计
    PERMISSIONS.STATS_VIEW,
    // 员工业绩 - 只能看自己
    PERMISSIONS.STAFF_STATS_VIEW
  ]
}

// 默认用户数据
const DEFAULT_USERS = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    name: '系统管理员',
    role: ROLES.ADMIN,
    phone: '',
    avatar: '',
    createTime: Date.now(),
    lastLoginTime: null,
    status: 'active'
  },
  {
    id: '2',
    username: 'luhongpeng',
    password: 'lu17303838326',
    name: '店长',
    role: ROLES.MANAGER,
    phone: '17303838326',
    avatar: '',
    createTime: Date.now(),
    lastLoginTime: null,
    status: 'active'
  },
  {
    id: '3',
    username: 'lhp',
    password: '123456',
    name: '店员',
    role: ROLES.STAFF,
    phone: '',
    avatar: '',
    createTime: Date.now(),
    lastLoginTime: null,
    status: 'active'
  }
]

export const useUserStore = defineStore('user', () => {
  // 所有用户列表
  const users = ref([])
  
  // 当前登录用户
  const currentUser = ref(null)
  
  // 是否已登录
  const isLoggedIn = computed(() => !!currentUser.value)
  
  // 当前用户角色
  const currentRole = computed(() => currentUser.value?.role || null)
  
  // 当前用户名称
  const currentUserName = computed(() => currentUser.value?.name || '')
  
  // 当前用户权限列表
  const currentPermissions = computed(() => {
    if (!currentUser.value) return []
    return ROLE_PERMISSIONS[currentUser.value.role] || []
  })
  
  // 检查是否有某个权限
  const hasPermission = (permission) => {
    if (!currentUser.value) return false
    return currentPermissions.value.includes(permission)
  }
  
  // 检查是否有多个权限中的任意一个
  const hasAnyPermission = (permissions) => {
    return permissions.some(p => hasPermission(p))
  }
  
  // 检查是否有所有指定权限
  const hasAllPermissions = (permissions) => {
    return permissions.every(p => hasPermission(p))
  }
  
  // 检查是否是管理员
  const isAdmin = computed(() => currentRole.value === ROLES.ADMIN)
  
  // 检查是否是店长或以上
  const isManagerOrAbove = computed(() => 
    [ROLES.ADMIN, ROLES.MANAGER].includes(currentRole.value)
  )
  
  // 加载用户数据
  const loadUsers = () => {
    const stored = localStorage.getItem('users')
    if (stored) {
      const storedUsers = JSON.parse(stored)
      // 检查是否需要更新默认用户（比如店长账号变更）
      const hasNewDefaults = DEFAULT_USERS.some(defaultUser => {
        const existingUser = storedUsers.find(u => u.id === defaultUser.id)
        return !existingUser || 
          (existingUser.username !== defaultUser.username && defaultUser.id !== '1')
      })
      
      if (hasNewDefaults) {
        // 合并：保留已有用户，更新默认用户
        const customUsers = storedUsers.filter(u => 
          !DEFAULT_USERS.some(d => d.id === u.id)
        )
        users.value = [...DEFAULT_USERS, ...customUsers]
        saveUsers()
      } else {
        users.value = storedUsers
      }
    } else {
      // 初始化默认用户
      users.value = DEFAULT_USERS
      saveUsers()
    }
    
    // 检查是否有已登录的用户
    const loggedInUser = localStorage.getItem('currentUser')
    if (loggedInUser) {
      const userData = JSON.parse(loggedInUser)
      // 验证用户是否仍然存在且状态正常
      const user = users.value.find(u => u.id === userData.id && u.status === 'active')
      if (user) {
        currentUser.value = user
      } else {
        localStorage.removeItem('currentUser')
      }
    }
  }
  
  // 保存用户数据
  const saveUsers = () => {
    localStorage.setItem('users', JSON.stringify(users.value))
  }
  
  // 登录
  const login = (username, password) => {
    const user = users.value.find(
      u => u.username === username && u.password === password
    )
    
    if (!user) {
      return { success: false, message: '用户名或密码错误' }
    }
    
    if (user.status !== 'active') {
      return { success: false, message: '账号已被禁用，请联系管理员' }
    }
    
    // 更新最后登录时间
    user.lastLoginTime = Date.now()
    saveUsers()
    
    // 设置当前用户
    currentUser.value = user
    localStorage.setItem('currentUser', JSON.stringify(user))
    
    return { success: true, message: '登录成功', user }
  }
  
  // 退出登录
  const logout = () => {
    currentUser.value = null
    localStorage.removeItem('currentUser')
  }
  
  // 添加用户
  const addUser = (userData) => {
    // 检查用户名是否已存在
    if (users.value.some(u => u.username === userData.username)) {
      return { success: false, message: '用户名已存在' }
    }
    
    const newUser = {
      id: Date.now().toString(),
      username: userData.username,
      password: userData.password || '123456',
      name: userData.name,
      role: userData.role || ROLES.STAFF,
      phone: userData.phone || '',
      avatar: userData.avatar || '',
      createTime: Date.now(),
      lastLoginTime: null,
      status: 'active'
    }
    
    users.value.push(newUser)
    saveUsers()
    
    return { success: true, message: '添加成功', user: newUser }
  }
  
  // 更新用户
  const updateUser = (id, updates) => {
    const index = users.value.findIndex(u => u.id === id)
    if (index === -1) {
      return { success: false, message: '用户不存在' }
    }
    
    // 检查用户名是否与其他用户重复
    if (updates.username) {
      const duplicate = users.value.find(
        u => u.username === updates.username && u.id !== id
      )
      if (duplicate) {
        return { success: false, message: '用户名已存在' }
      }
    }
    
    // 不允许修改管理员的角色
    if (users.value[index].role === ROLES.ADMIN && updates.role && updates.role !== ROLES.ADMIN) {
      return { success: false, message: '不能修改管理员的角色' }
    }
    
    users.value[index] = { ...users.value[index], ...updates }
    saveUsers()
    
    // 如果修改的是当前用户，更新当前用户信息
    if (currentUser.value && currentUser.value.id === id) {
      currentUser.value = users.value[index]
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
    }
    
    return { success: true, message: '更新成功' }
  }
  
  // 删除用户
  const deleteUser = (id) => {
    const user = users.value.find(u => u.id === id)
    if (!user) {
      return { success: false, message: '用户不存在' }
    }
    
    // 不允许删除管理员
    if (user.role === ROLES.ADMIN) {
      return { success: false, message: '不能删除管理员账号' }
    }
    
    // 不允许删除自己
    if (currentUser.value && currentUser.value.id === id) {
      return { success: false, message: '不能删除当前登录的账号' }
    }
    
    const index = users.value.findIndex(u => u.id === id)
    users.value.splice(index, 1)
    saveUsers()
    
    return { success: true, message: '删除成功' }
  }
  
  // 禁用/启用用户
  const toggleUserStatus = (id) => {
    const user = users.value.find(u => u.id === id)
    if (!user) {
      return { success: false, message: '用户不存在' }
    }
    
    // 不允许禁用管理员
    if (user.role === ROLES.ADMIN) {
      return { success: false, message: '不能禁用管理员账号' }
    }
    
    // 不允许禁用自己
    if (currentUser.value && currentUser.value.id === id) {
      return { success: false, message: '不能禁用当前登录的账号' }
    }
    
    user.status = user.status === 'active' ? 'disabled' : 'active'
    saveUsers()
    
    return { 
      success: true, 
      message: user.status === 'active' ? '已启用' : '已禁用' 
    }
  }
  
  // 修改密码
  const changePassword = (oldPassword, newPassword) => {
    if (!currentUser.value) {
      return { success: false, message: '请先登录' }
    }
    
    if (currentUser.value.password !== oldPassword) {
      return { success: false, message: '原密码错误' }
    }
    
    const index = users.value.findIndex(u => u.id === currentUser.value.id)
    if (index !== -1) {
      users.value[index].password = newPassword
      currentUser.value.password = newPassword
      saveUsers()
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
    }
    
    return { success: true, message: '密码修改成功' }
  }
  
  // 重置用户密码（管理员功能）
  const resetPassword = (id, newPassword = '123456') => {
    const index = users.value.findIndex(u => u.id === id)
    if (index === -1) {
      return { success: false, message: '用户不存在' }
    }
    
    users.value[index].password = newPassword
    saveUsers()
    
    return { success: true, message: `密码已重置为: ${newPassword}` }
  }
  
  // 获取所有用户（不包含密码）
  const getAllUsers = computed(() => {
    return users.value.map(u => ({
      ...u,
      password: undefined
    }))
  })
  
  // 获取活跃用户列表（用于销售员选择等）
  const activeUsers = computed(() => {
    return users.value.filter(u => u.status === 'active')
  })
  
  // 根据ID获取用户名称
  const getUserNameById = (id) => {
    const user = users.value.find(u => u.id === id)
    return user?.name || '未知'
  }
  
  return {
    // 状态
    users,
    currentUser,
    isLoggedIn,
    currentRole,
    currentUserName,
    currentPermissions,
    isAdmin,
    isManagerOrAbove,
    getAllUsers,
    activeUsers,
    
    // 方法
    loadUsers,
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    changePassword,
    resetPassword,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserNameById
  }
})

