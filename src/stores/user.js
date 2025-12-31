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
    id: '2',
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
  
  // 检查是否是店长
  const isManager = computed(() => currentRole.value === ROLES.MANAGER)
  
  // 检查是否是店长（向后兼容）
  const isManagerOrAbove = computed(() => currentRole.value === ROLES.MANAGER)
  
  // 从 localStorage 迁移到云端（仅执行一次）
  const migrateFromLocalStorage = async () => {
    const migrated = localStorage.getItem('users_migrated_to_cloud')
    if (migrated) return // 已经迁移过了
    
    const stored = localStorage.getItem('users')
    if (!stored) {
      // 没有本地数据，初始化默认用户到云端
      await initializeDefaultUsers()
      localStorage.setItem('users_migrated_to_cloud', 'true')
      return
    }
    
    try {
      const localUsers = JSON.parse(stored)
      console.log('开始迁移用户数据到云端...', localUsers.length, '个用户')
      
      // 将本地用户上传到云端
      for (const user of localUsers) {
        await supabase
          .from(TABLES.USERS)
          .upsert({
            id: user.id,
            username: user.username,
            password: user.password,
            name: user.name,
            role: user.role,
            phone: user.phone || '',
            avatar: user.avatar || '',
            status: user.status || 'active',
            create_time: user.createTime || Date.now(),
            last_login_time: user.lastLoginTime || null
          }, { onConflict: 'id' })
      }
      
      console.log('用户数据迁移完成！')
      localStorage.setItem('users_migrated_to_cloud', 'true')
    } catch (error) {
      console.error('迁移用户数据失败:', error)
    }
  }
  
  // 初始化默认用户到云端
  const initializeDefaultUsers = async () => {
    try {
      // 检查云端是否已有用户
      const { data: existingUsers } = await supabase
        .from(TABLES.USERS)
        .select('id')
        .limit(1)
      
      if (existingUsers && existingUsers.length > 0) {
        console.log('云端已有用户数据，跳过初始化')
        return
      }
      
      // 上传默认用户
      for (const user of DEFAULT_USERS) {
        await supabase
          .from(TABLES.USERS)
          .insert({
            id: user.id,
            username: user.username,
            password: user.password,
            name: user.name,
            role: user.role,
            phone: user.phone || '',
            avatar: user.avatar || '',
            status: user.status || 'active',
            create_time: user.createTime || Date.now(),
            last_login_time: user.lastLoginTime || null
          })
      }
      
      console.log('默认用户初始化完成')
    } catch (error) {
      console.error('初始化默认用户失败:', error)
    }
  }
  
  // 从云端加载用户数据
  const loadUsers = async () => {
    try {
      // 先执行迁移（如果需要）
      await migrateFromLocalStorage()
      
      // 从云端加载数据
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .order('create_time', { ascending: true })
      
      if (error) {
        console.error('从云端加载用户失败:', error)
        // 降级到 localStorage
        const stored = localStorage.getItem('users')
        if (stored) {
          users.value = JSON.parse(stored)
        } else {
          users.value = DEFAULT_USERS
        }
        return
      }
      
      // 转换数据格式（云端 -> 前端）
      users.value = data.map(u => ({
        id: u.id,
        username: u.username,
        password: u.password,
        name: u.name,
        role: u.role,
        phone: u.phone || '',
        avatar: u.avatar || '',
        createTime: u.create_time,
        lastLoginTime: u.last_login_time,
        status: u.status || 'active'
      }))
      
      // 同步到 localStorage 作为备份
      localStorage.setItem('users', JSON.stringify(users.value))
      
      console.log('从云端加载用户成功:', users.value.length, '个用户')
    } catch (error) {
      console.error('加载用户异常:', error)
      // 降级到 localStorage
      const stored = localStorage.getItem('users')
      if (stored) {
        users.value = JSON.parse(stored)
      } else {
        users.value = DEFAULT_USERS
      }
    }
    
    // 恢复当前登录用户
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser && !currentUser.value) {
      try {
        const userData = JSON.parse(savedUser)
        // 从用户列表中找到对应的用户（确保数据是最新的且状态正常）
        const user = users.value.find(u => u.id === userData.id && u.status === 'active')
        if (user) {
          currentUser.value = user
          console.log('✅ 恢复登录状态:', user.name, '角色:', user.role)
        } else {
          // 用户不存在或已被禁用，清除登录状态
          localStorage.removeItem('currentUser')
          console.warn('⚠️ 登录用户不存在或已被禁用，已清除登录状态')
        }
      } catch (error) {
        console.error('❌ 恢复登录状态失败:', error)
        localStorage.removeItem('currentUser')
      }
    }
  }
  
  // 保存用户数据（同时保存到云端和本地）
  const saveUsers = async () => {
    try {
      // 保存到 localStorage 作为备份
      localStorage.setItem('users', JSON.stringify(users.value))
    } catch (error) {
      console.error('保存到 localStorage 失败:', error)
    }
  }
  
  // 保存单个用户到云端
  const saveUserToCloud = async (user) => {
    try {
      const { error } = await supabase
        .from(TABLES.USERS)
        .upsert({
          id: user.id,
          username: user.username,
          password: user.password,
          name: user.name,
          role: user.role,
          phone: user.phone || '',
          avatar: user.avatar || '',
          status: user.status || 'active',
          create_time: user.createTime || Date.now(),
          last_login_time: user.lastLoginTime || null
        }, { onConflict: 'id' })
      
      if (error) {
        console.error('保存用户到云端失败:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('保存用户到云端异常:', error)
      return false
    }
  }
  
  // 从云端删除用户
  const deleteUserFromCloud = async (userId) => {
    try {
      const { error } = await supabase
        .from(TABLES.USERS)
        .delete()
        .eq('id', userId)
      
      if (error) {
        console.error('从云端删除用户失败:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('从云端删除用户异常:', error)
      return false
    }
  }
  
  // 登录
  const login = async (username, password) => {
    const user = users.value.find(
      u => u.username === username && u.password === password
    )
    
    if (!user) {
      return { success: false, message: '用户名或密码错误' }
    }
    
    if (user.status !== 'active') {
      return { success: false, message: '账号已被禁用，请联系店长' }
    }
    
    // 更新最后登录时间
    user.lastLoginTime = Date.now()
    
    // 保存到云端（异步，不阻塞登录）
    saveUserToCloud(user).catch(err => {
      console.warn('更新登录时间到云端失败:', err)
    })
    
    await saveUsers()
    
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
  const addUser = async (userData) => {
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
    
    // 保存到云端
    const cloudSuccess = await saveUserToCloud(newUser)
    if (!cloudSuccess) {
      console.warn('保存到云端失败，仅保存到本地')
    }
    
    users.value.push(newUser)
    await saveUsers()
    
    return { success: true, message: '添加成功', user: newUser }
  }
  
  // 更新用户
  const updateUser = async (id, updates) => {
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
    
    // 不允许修改店长的角色（如果是第一个用户）
    if (users.value[index].id === '1' && updates.role && updates.role !== ROLES.MANAGER) {
      return { success: false, message: '不能修改主店长的角色' }
    }
    
    users.value[index] = { ...users.value[index], ...updates }
    
    // 保存到云端
    const cloudSuccess = await saveUserToCloud(users.value[index])
    if (!cloudSuccess) {
      console.warn('保存到云端失败，仅保存到本地')
    }
    
    await saveUsers()
    
    // 如果修改的是当前用户，更新当前用户信息
    if (currentUser.value && currentUser.value.id === id) {
      currentUser.value = users.value[index]
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
    }
    
    return { success: true, message: '更新成功' }
  }
  
  // 删除用户
  const deleteUser = async (id) => {
    const user = users.value.find(u => u.id === id)
    if (!user) {
      return { success: false, message: '用户不存在' }
    }
    
    // 不允许删除主店长
    if (user.id === '1') {
      return { success: false, message: '不能删除主店长账号' }
    }
    
    // 不允许删除自己
    if (currentUser.value && currentUser.value.id === id) {
      return { success: false, message: '不能删除当前登录的账号' }
    }
    
    // 从云端删除
    const cloudSuccess = await deleteUserFromCloud(id)
    if (!cloudSuccess) {
      console.warn('从云端删除失败，仅从本地删除')
    }
    
    const index = users.value.findIndex(u => u.id === id)
    users.value.splice(index, 1)
    await saveUsers()
    
    return { success: true, message: '删除成功' }
  }
  
  // 禁用/启用用户
  const toggleUserStatus = async (id) => {
    const user = users.value.find(u => u.id === id)
    if (!user) {
      return { success: false, message: '用户不存在' }
    }
    
    // 不允许禁用主店长
    if (user.id === '1') {
      return { success: false, message: '不能禁用主店长账号' }
    }
    
    // 不允许禁用自己
    if (currentUser.value && currentUser.value.id === id) {
      return { success: false, message: '不能禁用当前登录的账号' }
    }
    
    user.status = user.status === 'active' ? 'disabled' : 'active'
    
    // 保存到云端
    const cloudSuccess = await saveUserToCloud(user)
    if (!cloudSuccess) {
      console.warn('保存到云端失败，仅保存到本地')
    }
    
    await saveUsers()
    
    return { 
      success: true, 
      message: user.status === 'active' ? '已启用' : '已禁用' 
    }
  }
  
  // 修改密码
  const changePassword = async (oldPassword, newPassword) => {
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
      
      // 保存到云端
      const cloudSuccess = await saveUserToCloud(users.value[index])
      if (!cloudSuccess) {
        console.warn('保存到云端失败，仅保存到本地')
      }
      
      await saveUsers()
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
    }
    
    return { success: true, message: '密码修改成功' }
  }
  
  // 重置用户密码（店长功能）
  const resetPassword = async (id, newPassword = '123456') => {
    const index = users.value.findIndex(u => u.id === id)
    if (index === -1) {
      return { success: false, message: '用户不存在' }
    }
    
    users.value[index].password = newPassword
    
    // 保存到云端
    const cloudSuccess = await saveUserToCloud(users.value[index])
    if (!cloudSuccess) {
      console.warn('保存到云端失败，仅保存到本地')
    }
    
    await saveUsers()
    
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
    isManager,
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

