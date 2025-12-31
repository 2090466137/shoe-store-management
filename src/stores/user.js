import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, TABLES } from '@/config/supabase'

// 角色定义
export const ROLES = {
  MANAGER: 'manager',  // 店长 - 所有权限
  STAFF: 'staff'       // 店员 - 基本销售权限
}

// 角色中文名称
export const ROLE_NAMES = {
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
  [ROLES.MANAGER]: Object.values(PERMISSIONS), // 店长拥有所有权限
  
  
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
    // 注意：店员没有 DATA_BACKUP 权限，看不到备份按钮
    // 但云端自动备份功能对所有用户都有效
  ]
}

// 默认用户数据
const DEFAULT_USERS = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    name: '系统管理员',
    role: ROLES.MANAGER,
    phone: '',
    avatar: '',
    status: 'active',
    createTime: Date.now(),
    lastLoginTime: null
  }
]

export const useUserStore = defineStore('user', () => {
  const users = ref([])
  const currentUser = ref(null)
  const isLoggedIn = ref(false)

  // 当前用户信息
  const currentUserId = computed(() => currentUser.value?.id || null)
  const currentUserName = computed(() => currentUser.value?.name || '')
  const currentRole = computed(() => currentUser.value?.role || '')
  const currentPermissions = computed(() => {
    if (!currentUser.value) return []
    return ROLE_PERMISSIONS[currentUser.value.role] || []
  })

  // 检查权限
  const hasPermission = (permission) => {
    return currentPermissions.value.includes(permission)
  }

  // 检查多个权限（任一满足即可）
  const hasAnyPermission = (...permissions) => {
    return permissions.some(p => currentPermissions.value.includes(p))
  }

  // 检查多个权限（全部满足）
  const hasAllPermissions = (...permissions) => {
    return permissions.every(p => currentPermissions.value.includes(p))
  }

  // 加载用户数据
  const loadUsers = async () => {
    try {
      // 先从云端加载
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .order('create_time', { ascending: false })

      if (error) {
        console.error('从云端加载用户失败:', error)
        // 如果云端加载失败，从本地加载
        loadUsersFromLocal()
        return
      }

      if (data && data.length > 0) {
        // 转换数据格式
        users.value = data.map(user => ({
          id: user.id,
          username: user.username,
          password: user.password,
          name: user.name,
          role: user.role,
          phone: user.phone || '',
          avatar: user.avatar || '',
          status: user.status || 'active',
          createTime: user.create_time,
          lastLoginTime: user.last_login_time
        }))
        
        // 同步到本地
        localStorage.setItem('users', JSON.stringify(users.value))
        console.log('✅ 用户数据已从云端加载')
      } else {
        // 云端没有数据，初始化默认用户
        await initializeDefaultUsers()
      }
    } catch (error) {
      console.error('加载用户数据异常:', error)
      loadUsersFromLocal()
    }
  }

  // 从本地加载用户
  const loadUsersFromLocal = () => {
    const savedUsers = localStorage.getItem('users')
    if (savedUsers) {
      users.value = JSON.parse(savedUsers)
      console.log('✅ 用户数据已从本地加载')
    } else {
      users.value = DEFAULT_USERS
      localStorage.setItem('users', JSON.stringify(users.value))
      console.log('✅ 已初始化默认用户')
    }
  }

  // 初始化默认用户到云端
  const initializeDefaultUsers = async () => {
    try {
      const usersToInsert = DEFAULT_USERS.map(user => ({
        id: user.id,
        username: user.username,
        password: user.password,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        status: user.status,
        create_time: user.createTime,
        last_login_time: user.lastLoginTime
      }))

      const { error } = await supabase
        .from(TABLES.USERS)
        .insert(usersToInsert)

      if (error) {
        console.error('初始化默认用户失败:', error)
        loadUsersFromLocal()
        return
      }

      users.value = DEFAULT_USERS
      localStorage.setItem('users', JSON.stringify(users.value))
      console.log('✅ 默认用户已初始化到云端')
    } catch (error) {
      console.error('初始化默认用户异常:', error)
      loadUsersFromLocal()
    }
  }

  // 登录
  const login = async (username, password) => {
    const user = users.value.find(
      u => u.username === username && u.password === password && u.status === 'active'
    )

    if (user) {
      currentUser.value = user
      isLoggedIn.value = true
      
      // 更新最后登录时间
      user.lastLoginTime = Date.now()
      
      // 保存到本地
      localStorage.setItem('currentUser', JSON.stringify(user))
      localStorage.setItem('users', JSON.stringify(users.value))
      
      // 更新到云端
      try {
        await supabase
          .from(TABLES.USERS)
          .update({ last_login_time: user.lastLoginTime })
          .eq('id', user.id)
      } catch (error) {
        console.error('更新登录时间失败:', error)
      }
      
      return { success: true, user }
    }

    return { success: false, message: '用户名或密码错误' }
  }

  // 登出
  const logout = () => {
    currentUser.value = null
    isLoggedIn.value = false
    localStorage.removeItem('currentUser')
  }

  // 恢复登录状态
  const restoreSession = () => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      currentUser.value = JSON.parse(savedUser)
      isLoggedIn.value = true
    }
  }

  // 添加用户
  const addUser = async (userData) => {
    // 检查用户名是否已存在
    if (users.value.some(u => u.username === userData.username)) {
      return { success: false, message: '用户名已存在' }
    }

    const newUser = {
      id: Date.now().toString(),
      ...userData,
      status: 'active',
      createTime: Date.now(),
      lastLoginTime: null
    }

    users.value.push(newUser)
    localStorage.setItem('users', JSON.stringify(users.value))

    // 保存到云端
    try {
      await supabase
        .from(TABLES.USERS)
        .insert([{
          id: newUser.id,
          username: newUser.username,
          password: newUser.password,
          name: newUser.name,
          role: newUser.role,
          phone: newUser.phone || '',
          avatar: newUser.avatar || '',
          status: newUser.status,
          create_time: newUser.createTime,
          last_login_time: newUser.lastLoginTime
        }])
      
      console.log('✅ 用户已保存到云端')
    } catch (error) {
      console.error('保存用户到云端失败:', error)
    }

    return { success: true, user: newUser }
  }

  // 更新用户
  const updateUser = async (userId, userData) => {
    const index = users.value.findIndex(u => u.id === userId)
    if (index === -1) {
      return { success: false, message: '用户不存在' }
    }

    // 检查用户名是否与其他用户重复
    if (users.value.some(u => u.id !== userId && u.username === userData.username)) {
      return { success: false, message: '用户名已存在' }
    }

    users.value[index] = { ...users.value[index], ...userData }
    localStorage.setItem('users', JSON.stringify(users.value))

    // 更新到云端
    try {
      await supabase
        .from(TABLES.USERS)
        .update({
          username: userData.username,
          password: userData.password,
          name: userData.name,
          role: userData.role,
          phone: userData.phone || '',
          avatar: userData.avatar || ''
        })
        .eq('id', userId)
      
      console.log('✅ 用户已更新到云端')
    } catch (error) {
      console.error('更新用户到云端失败:', error)
    }

    // 如果更新的是当前用户，同步更新当前用户信息
    if (currentUser.value && currentUser.value.id === userId) {
      currentUser.value = users.value[index]
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
    }

    return { success: true, user: users.value[index] }
  }

  // 删除用户
  const deleteUser = async (userId) => {
    // 不能删除自己
    if (currentUser.value && currentUser.value.id === userId) {
      return { success: false, message: '不能删除当前登录用户' }
    }

    const index = users.value.findIndex(u => u.id === userId)
    if (index === -1) {
      return { success: false, message: '用户不存在' }
    }

    users.value.splice(index, 1)
    localStorage.setItem('users', JSON.stringify(users.value))

    // 从云端删除
    try {
      await supabase
        .from(TABLES.USERS)
        .delete()
        .eq('id', userId)
      
      console.log('✅ 用户已从云端删除')
    } catch (error) {
      console.error('从云端删除用户失败:', error)
    }

    return { success: true }
  }

  // 切换用户状态
  const toggleUserStatus = async (userId) => {
    const user = users.value.find(u => u.id === userId)
    if (!user) {
      return { success: false, message: '用户不存在' }
    }

    // 不能禁用自己
    if (currentUser.value && currentUser.value.id === userId) {
      return { success: false, message: '不能禁用当前登录用户' }
    }

    user.status = user.status === 'active' ? 'disabled' : 'active'
    localStorage.setItem('users', JSON.stringify(users.value))

    // 更新到云端
    try {
      await supabase
        .from(TABLES.USERS)
        .update({ status: user.status })
        .eq('id', userId)
      
      console.log('✅ 用户状态已更新到云端')
    } catch (error) {
      console.error('更新用户状态到云端失败:', error)
    }

    return { success: true, user }
  }

  // 重置密码
  const resetPassword = async (userId, newPassword) => {
    const user = users.value.find(u => u.id === userId)
    if (!user) {
      return { success: false, message: '用户不存在' }
    }

    user.password = newPassword
    localStorage.setItem('users', JSON.stringify(users.value))

    // 更新到云端
    try {
      await supabase
        .from(TABLES.USERS)
        .update({ password: newPassword })
        .eq('id', userId)
      
      console.log('✅ 密码已更新到云端')
    } catch (error) {
      console.error('更新密码到云端失败:', error)
    }

    return { success: true }
  }

  // 修改密码
  const changePassword = (oldPassword, newPassword) => {
    if (!currentUser.value) {
      return { success: false, message: '未登录' }
    }

    if (currentUser.value.password !== oldPassword) {
      return { success: false, message: '原密码错误' }
    }

    currentUser.value.password = newPassword
    
    const index = users.value.findIndex(u => u.id === currentUser.value.id)
    if (index !== -1) {
      users.value[index].password = newPassword
    }

    localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
    localStorage.setItem('users', JSON.stringify(users.value))

    // 更新到云端
    supabase
      .from(TABLES.USERS)
      .update({ password: newPassword })
      .eq('id', currentUser.value.id)
      .then(() => console.log('✅ 密码已更新到云端'))
      .catch(error => console.error('更新密码到云端失败:', error))

    return { success: true }
  }

  return {
    users,
    currentUser,
    isLoggedIn,
    currentUserId,
    currentUserName,
    currentRole,
    currentPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loadUsers,
    login,
    logout,
    restoreSession,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    resetPassword,
    changePassword
  }
})
