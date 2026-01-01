<template>
  <div class="user-management-page">
    <!-- 顶部导航 -->
    <van-nav-bar
      title="用户管理"
      left-arrow
      @click-left="router.back()"
      fixed
      placeholder
    >
      <template #right>
        <van-icon name="notes-o" size="22" @click="router.push('/operation-logs')" />
        <van-icon name="plus" size="22" @click="showAddUser = true" />
      </template>
    </van-nav-bar>

    <!-- 安全提醒 -->
    <div v-if="hasSecurityRisk" class="security-banner">
      <div class="banner-icon">⚠️</div>
      <div class="banner-content">
        <div class="banner-title">账号安全提醒</div>
        <div class="banner-text">
          发现 {{ riskUserCount }} 个账号超过30天未登录，建议及时禁用离职员工账号
        </div>
      </div>
      <van-button size="small" type="warning" @click="showRiskUsers">
        查看
      </van-button>
    </div>

    <!-- 用户统计 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon manager">👑</div>
        <div class="stat-info">
          <div class="stat-value">{{ managerCount }}</div>
          <div class="stat-label">店长</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon staff">👤</div>
        <div class="stat-info">
          <div class="stat-value">{{ staffCount }}</div>
          <div class="stat-label">店员</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon disabled">⏸️</div>
        <div class="stat-info">
          <div class="stat-value">{{ disabledCount }}</div>
          <div class="stat-label">已禁用</div>
        </div>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="user-list">
      <div class="section-title">
        <span>用户列表</span>
        <span class="count">共 {{ users.length }} 人</span>
      </div>
      
      <div 
        v-for="user in users" 
        :key="user.id" 
        class="user-card"
        :class="{ disabled: user.status !== 'active' }"
      >
        <div class="user-avatar">
          <span class="avatar-text">{{ user.name.charAt(0) }}</span>
          <span 
            class="status-dot" 
            :class="user.status === 'active' ? 'online' : 'offline'"
          ></span>
        </div>
        
        <div class="user-info">
          <div class="user-name">
            {{ user.name }}
            <span class="role-tag" :class="user.role">
              {{ getRoleName(user.role) }}
            </span>
            <span v-if="isLongTimeNoLogin(user)" class="warning-tag">
              ⚠️ 长期未登录
            </span>
          </div>
          <div class="user-meta">
            <span>账号: {{ user.username }}</span>
            <span v-if="user.phone">· {{ user.phone }}</span>
          </div>
          <div class="user-time">
            <span v-if="user.lastLoginTime">
              最后登录: {{ formatTime(user.lastLoginTime) }}
            </span>
            <span v-else class="never-login">从未登录</span>
          </div>
          <div v-if="isLongTimeNoLogin(user) && user.status === 'active'" class="security-warning">
            ⚠️ 建议禁用：该账号超过30天未登录，可能存在安全风险
          </div>
        </div>
        
        <div class="user-actions">
          <van-button 
            type="primary" 
            size="small"
            @click="editUser(user)"
          >
            编辑
          </van-button>
          <van-button 
            :type="user.status === 'active' ? 'warning' : 'success'" 
            size="small"
            @click="handleToggleStatus(user)"
            v-if="user.id !== '1'"
          >
            {{ user.status === 'active' ? '禁用' : '启用' }}
          </van-button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑用户弹窗 -->
    <van-popup
      v-model:show="showAddUser"
      position="bottom"
      round
      :style="{ height: '70%' }"
    >
      <div class="popup-content">
        <div class="popup-header">
          <span>{{ editingUser ? '编辑用户' : '添加用户' }}</span>
          <van-icon name="cross" @click="closePopup" />
        </div>
        
        <van-form @submit="handleSubmit" class="user-form">
          <van-cell-group inset>
            <van-field
              v-model="form.username"
              name="username"
              label="账号"
              placeholder="请输入登录账号"
              :rules="[{ required: true, message: '请输入账号' }]"
              :disabled="editingUser?.role === 'admin'"
            />
            <van-field
              v-model="form.name"
              name="name"
              label="姓名"
              placeholder="请输入姓名"
              :rules="[{ required: true, message: '请输入姓名' }]"
            />
            <van-field
              v-model="form.phone"
              name="phone"
              label="手机号"
              placeholder="请输入手机号（选填）"
              type="tel"
            />
            <van-field
              name="role"
              label="角色"
              :rules="[{ required: true, message: '请选择角色' }]"
            >
              <template #input>
                <van-radio-group v-model="form.role" direction="horizontal">
                  <van-radio 
                    name="manager" 
                    icon-size="10px"
                    :disabled="editingUser?.role === 'admin'"
                  >
                    店长
                  </van-radio>
                  <van-radio 
                    name="staff"
                    icon-size="10px"
                    :disabled="editingUser?.role === 'admin'"
                  >
                    店员
                  </van-radio>
                </van-radio-group>
              </template>
            </van-field>
            <van-field
              v-if="!editingUser"
              v-model="form.password"
              name="password"
              label="密码"
              placeholder="默认密码: 123456"
            />
          </van-cell-group>
          
          <div class="form-actions">
            <van-button round block type="primary" native-type="submit">
              {{ editingUser ? '保存修改' : '添加用户' }}
            </van-button>
            <van-button 
              v-if="editingUser && editingUser.role !== 'admin'" 
              round 
              block 
              type="danger" 
              @click="handleDelete"
              style="margin-top: 10px"
            >
              删除用户
            </van-button>
          </div>
        </van-form>
        
        <!-- 重置密码 -->
        <div v-if="editingUser" class="reset-password-section">
          <van-divider>密码管理</van-divider>
          <van-button 
            size="small" 
            type="warning" 
            block
            @click="handleResetPassword"
          >
            重置密码为 123456
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 权限说明弹窗 -->
    <van-popup
      v-model:show="showPermissionInfo"
      position="bottom"
      round
      :style="{ height: '60%' }"
    >
      <div class="popup-content">
        <div class="popup-header">
          <span>权限说明</span>
          <van-icon name="cross" @click="showPermissionInfo = false" />
        </div>
        
        <div class="permission-info">
          <div class="role-section">
            <div class="role-header admin">
              <span class="role-icon">👑</span>
              <span class="role-title">管理员</span>
            </div>
            <ul class="permission-list">
              <li>✅ 所有功能完全访问</li>
              <li>✅ 用户管理（添加/编辑/删除）</li>
              <li>✅ 数据管理（备份/恢复/清除）</li>
              <li>✅ 系统设置</li>
            </ul>
          </div>
          
          <div class="role-section">
            <div class="role-header manager">
              <span class="role-icon">💼</span>
              <span class="role-title">店长</span>
            </div>
            <ul class="permission-list">
              <li>✅ 商品管理（增删改查）</li>
              <li>✅ 进货管理</li>
              <li>✅ 销售管理</li>
              <li>✅ 退换货处理</li>
              <li>✅ 会员管理</li>
              <li>✅ 查看所有统计报表</li>
              <li>✅ 库存盘点</li>
              <li>✅ 查看所有员工业绩</li>
              <li>✅ 数据备份/恢复</li>
              <li>❌ 用户管理</li>
              <li>❌ 数据清除</li>
            </ul>
          </div>
          
          <div class="role-section">
            <div class="role-header staff">
              <span class="role-icon">👤</span>
              <span class="role-title">店员</span>
            </div>
            <ul class="permission-list">
              <li>✅ 查看商品</li>
              <li>✅ 销售开单</li>
              <li>✅ 查看销售记录</li>
              <li>✅ 查看退换货记录</li>
              <li>✅ 会员查看/添加/充值</li>
              <li>✅ 查看基本统计</li>
              <li>✅ 查看个人业绩</li>
              <li>❌ 商品增删改</li>
              <li>❌ 进货管理</li>
              <li>❌ 退换货处理</li>
              <li>❌ 利润数据</li>
              <li>❌ 库存盘点</li>
            </ul>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 底部权限说明按钮 -->
    <div class="bottom-action">
      <van-button 
        type="default" 
        size="small" 
        icon="question-o"
        @click="showPermissionInfo = true"
      >
        查看权限说明
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'
import { useUserStore, ROLES, ROLE_NAMES } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const showAddUser = ref(false)
const showPermissionInfo = ref(false)
const editingUser = ref(null)

const form = ref({
  username: '',
  name: '',
  phone: '',
  role: 'staff',
  password: ''
})

// 用户列表
const users = computed(() => userStore.getAllUsers)

// 统计
const managerCount = computed(() => 
  users.value.filter(u => u.role === ROLES.MANAGER && u.status === 'active').length
)
const staffCount = computed(() => 
  users.value.filter(u => u.role === ROLES.STAFF && u.status === 'active').length
)
const disabledCount = computed(() => 
  users.value.filter(u => u.status !== 'active').length
)

// 获取角色名称
const getRoleName = (role) => ROLE_NAMES[role] || role

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 判断是否长期未登录（超过30天）
const isLongTimeNoLogin = (user) => {
  // 主店长账号不检查
  if (user.id === '1') return false
  
  // 从未登录
  if (!user.lastLoginTime) return true
  
  const now = Date.now()
  const daysSinceLogin = (now - user.lastLoginTime) / (1000 * 60 * 60 * 24)
  
  // 超过30天未登录
  return daysSinceLogin > 30
}

// 安全风险检查
const riskUsers = computed(() => 
  users.value.filter(u => u.status === 'active' && isLongTimeNoLogin(u))
)
const riskUserCount = computed(() => riskUsers.value.length)
const hasSecurityRisk = computed(() => riskUserCount.value > 0)

// 显示风险账号列表
const showRiskUsers = () => {
  const userList = riskUsers.value.map(u => {
    const days = u.lastLoginTime 
      ? Math.floor((Date.now() - u.lastLoginTime) / (1000 * 60 * 60 * 24))
      : '从未'
    return `${u.name}（${u.username}）- ${days === '从未' ? '从未登录' : days + '天未登录'}`
  }).join('\n')
  
  showConfirmDialog({
    title: '⚠️ 风险账号列表',
    message: userList,
    confirmButtonText: '知道了',
    showCancelButton: false
  })
}

// 编辑用户
const editUser = (user) => {
  editingUser.value = user
  form.value = {
    username: user.username,
    name: user.name,
    phone: user.phone || '',
    role: user.role,
    password: ''
  }
  showAddUser.value = true
}

// 关闭弹窗
const closePopup = () => {
  showAddUser.value = false
  editingUser.value = null
  form.value = {
    username: '',
    name: '',
    phone: '',
    role: 'staff',
    password: ''
  }
}

// 提交表单
const handleSubmit = async () => {
  if (editingUser.value) {
    // 更新用户
    const result = await userStore.updateUser(editingUser.value.id, {
      username: form.value.username,
      name: form.value.name,
      phone: form.value.phone,
      role: form.value.role
    })
    
    if (result.success) {
      showSuccessToast('更新成功')
      closePopup()
    } else {
      showToast(result.message)
    }
  } else {
    // 添加用户
    const result = await userStore.addUser({
      username: form.value.username,
      name: form.value.name,
      phone: form.value.phone,
      role: form.value.role,
      password: form.value.password || '123456'
    })
    
    if (result.success) {
      showSuccessToast('添加成功')
      closePopup()
    } else {
      showToast(result.message)
    }
  }
}

// 切换用户状态
const handleToggleStatus = async (user) => {
  const action = user.status === 'active' ? '禁用' : '启用'
  
  try {
    await showConfirmDialog({
      title: '确认操作',
      message: `确定要${action}用户 "${user.name}" 吗？`
    })
    
    const result = await userStore.toggleUserStatus(user.id)
    if (result.success) {
      showSuccessToast(result.message)
    } else {
      showToast(result.message)
    }
  } catch {
    // 用户取消
  }
}

// 删除用户
const handleDelete = async () => {
  if (!editingUser.value) return
  
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要删除用户 "${editingUser.value.name}" 吗？此操作不可恢复。`
    })
    
    const result = await userStore.deleteUser(editingUser.value.id)
    if (result.success) {
      showSuccessToast('删除成功')
      closePopup()
    } else {
      showToast(result.message)
    }
  } catch {
    // 用户取消
  }
}

// 重置密码
const handleResetPassword = async () => {
  if (!editingUser.value) return
  
  try {
    await showConfirmDialog({
      title: '重置密码',
      message: `确定要将用户 "${editingUser.value.name}" 的密码重置为 123456 吗？`
    })
    
    const result = await userStore.resetPassword(editingUser.value.id)
    if (result.success) {
      showSuccessToast(result.message)
    } else {
      showToast(result.message)
    }
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  userStore.loadUsers()
})
</script>

<style scoped>
.user-management-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px;
}

/* 安全提醒横幅 */
.security-banner {
  margin: 15px;
  padding: 12px;
  background: linear-gradient(135deg, #fff3cd 0%, #ffe8a1 100%);
  border-radius: 12px;
  border-left: 4px solid #ff6b6b;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.2);
}

.banner-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.banner-content {
  flex: 1;
  min-width: 0;
}

.banner-title {
  font-size: 14px;
  font-weight: 600;
  color: #856404;
  margin-bottom: 2px;
}

.banner-text {
  font-size: 12px;
  color: #856404;
  line-height: 1.4;
}

/* 统计区域 */
.stats-section {
  display: flex;
  gap: 10px;
  padding: 15px;
}

.stat-card {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(91, 143, 249, 0.08);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.stat-icon.admin {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
}

.stat-icon.manager {
  background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
}

.stat-icon.staff {
  background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%);
}

.stat-icon.disabled {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

/* 用户列表 */
.user-list {
  padding: 0 15px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0 10px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.section-title .count {
  font-size: 13px;
  color: #999;
  font-weight: normal;
}

.user-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(91, 143, 249, 0.08);
  transition: all 0.3s;
}

.user-card.disabled {
  opacity: 0.6;
  background: #f5f5f5;
}

.user-avatar {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-text {
  color: white;
  font-size: 20px;
  font-weight: bold;
}

.status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 8px;
  border: 2px solid white;
}

.status-dot.online {
  background: #07c160;
}

.status-dot.offline {
  background: #ccc;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  color: white;
}

.role-tag.admin {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.role-tag.manager {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.role-tag.staff {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.user-meta {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.user-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.user-time .never-login {
  color: #ff6b6b;
  font-weight: 500;
}

.warning-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  background: #fff3cd;
  color: #856404;
  font-weight: normal;
}

.security-warning {
  font-size: 11px;
  color: #ff6b6b;
  margin-top: 4px;
  padding: 4px 8px;
  background: #fff1f0;
  border-radius: 4px;
  border-left: 2px solid #ff6b6b;
}

.user-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.user-actions :deep(.van-button) {
  padding: 0 14px !important;
  height: 34px !important;
  font-size: 13px !important;
  border-radius: 8px !important;
}

.user-actions :deep(.van-button--primary) {
  background: #4A90E2 !important;
  border-color: #4A90E2 !important;
  color: #fff !important;
}

.user-actions :deep(.van-button--warning) {
  background: #FF9F43 !important;
  border-color: #FF9F43 !important;
  color: #fff !important;
}

.user-actions :deep(.van-button--success) {
  background: #26C281 !important;
  border-color: #26C281 !important;
  color: #fff !important;
}

/* 弹窗 */
.popup-content {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
}

.popup-header .van-icon {
  font-size: 20px;
  color: #999;
}

/* 表单 */
.user-form :deep(.van-cell-group--inset) {
  margin: 0;
}

/* 角色选择样式 */
.user-form :deep(.van-radio-group) {
  display: flex;
  gap: 16px;
}

.user-form :deep(.van-radio) {
  display: flex;
  align-items: center;
}

.user-form :deep(.van-radio__icon) {
  width: 16px !important;
  height: 16px !important;
  font-size: 10px !important;
  line-height: 1;
  flex-shrink: 0;
}

.user-form :deep(.van-radio__icon .van-icon) {
  font-size: 10px !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-form :deep(.van-radio__label) {
  margin-left: 6px;
  white-space: nowrap;
}

.form-actions {
  margin-top: 30px;
  padding: 0 10px;
}

/* 重置密码 */
.reset-password-section {
  margin-top: 20px;
  padding: 0 10px;
}

/* 权限说明 */
.permission-info {
  padding: 10px 0;
}

.role-section {
  margin-bottom: 20px;
}

.role-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border-radius: 10px;
  margin-bottom: 10px;
}

.role-header.admin {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
}

.role-header.manager {
  background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
}

.role-header.staff {
  background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%);
}

.role-icon {
  font-size: 20px;
}

.role-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.permission-list {
  list-style: none;
  padding: 0 15px;
  margin: 0;
}

.permission-list li {
  padding: 6px 0;
  font-size: 14px;
  color: #666;
  border-bottom: 1px dashed #eee;
}

.permission-list li:last-child {
  border-bottom: none;
}

/* 底部按钮 */
.bottom-action {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}
</style>


