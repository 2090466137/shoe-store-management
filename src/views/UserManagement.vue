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
        <van-icon 
          v-if="userStore.hasPermission(PERMISSIONS.USER_ADD)"
          name="plus" 
          size="24" 
          color="#5B8FF9"
          @click="showAddUser = true" 
          style="cursor: pointer; padding: 8px;"
        />
      </template>
    </van-nav-bar>

    <!-- 用户统计 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon manager">💼</div>
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
        <div class="stat-icon disabled">🚫</div>
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
      
      <!-- 添加员工按钮 -->
      <van-button 
        v-if="userStore.hasPermission(PERMISSIONS.USER_ADD)"
        type="primary" 
        block 
        round
        icon="plus"
        @click="showAddUser = true"
        class="add-user-btn"
      >
        添加员工
      </van-button>
      
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
          </div>
          <div class="user-meta">
            <span>账号: {{ user.username }}</span>
            <span v-if="user.phone">· {{ user.phone }}</span>
          </div>
          <div class="user-time">
            <span v-if="user.lastLoginTime">
              最后登录: {{ formatTime(user.lastLoginTime) }}
            </span>
            <span v-else>从未登录</span>
          </div>
        </div>
        
        <div class="user-actions">
          <van-button 
            size="small" 
            type="primary" 
            plain
            @click="editUser(user)"
          >
            编辑
          </van-button>
          <van-button 
            size="small" 
            :type="user.status === 'active' ? 'warning' : 'success'" 
            plain
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
              :disabled="editingUser?.id === '1'"
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
                    :disabled="editingUser?.id === '1'"
                  >
                    店长
                  </van-radio>
                  <van-radio 
                    name="staff"
                    :disabled="editingUser?.id === '1'"
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
              plain
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
            plain 
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
            <div class="role-header manager">
              <span class="role-icon">💼</span>
              <span class="role-title">店长</span>
            </div>
            <ul class="permission-list">
              <li>✅ 所有功能完全访问</li>
              <li>✅ 商品管理（增删改查）</li>
              <li>✅ 进货管理</li>
              <li>✅ 销售管理</li>
              <li>✅ 退换货处理</li>
              <li>✅ 会员管理（含充值）</li>
              <li>✅ 查看所有统计报表和利润</li>
              <li>✅ 库存盘点</li>
              <li>✅ 查看所有员工业绩</li>
              <li>✅ 用户管理（添加/编辑/删除员工）</li>
              <li>✅ 数据管理（备份/恢复/清除）</li>
              <li>✅ 系统设置</li>
            </ul>
          </div>
          
          <div class="role-section">
            <div class="role-header staff">
              <span class="role-icon">👤</span>
              <span class="role-title">店员</span>
            </div>
            <ul class="permission-list">
              <li>✅ 查看商品（不含销售价格）</li>
              <li>✅ 销售开单</li>
              <li>✅ 查看销售记录（不含金额和利润）</li>
              <li>✅ 查看退换货记录</li>
              <li>✅ 会员查看/添加（不含余额信息）</li>
              <li>✅ 查看基本统计（不含销售额和利润）</li>
              <li>✅ 查看个人业绩（不含金额）</li>
              <li>❌ 商品增删改</li>
              <li>❌ 进货管理</li>
              <li>❌ 退换货处理</li>
              <li>❌ 所有利润和金额数据</li>
              <li>❌ 库存盘点</li>
              <li>❌ 会员充值</li>
              <li>❌ 用户管理</li>
              <li>❌ 数据管理</li>
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
import { useUserStore, ROLES, ROLE_NAMES, PERMISSIONS } from '@/stores/user'

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
  users.value.filter(u => u.status === 'disabled').length
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
    
    const result = userStore.toggleUserStatus(user.id)
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
    
    const result = userStore.deleteUser(editingUser.value.id)
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
    
    const result = userStore.resetPassword(editingUser.value.id)
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
  background: linear-gradient(to bottom, #f0f7ff 0%, #ffffff 100%);
  padding-bottom: 80px;
}

/* 统计区域 */
.stats-section {
  display: flex;
  gap: 12px;
  padding: 15px;
}

.stat-card {
  flex: 1;
  background: white;
  border-radius: 16px;
  padding: 18px 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(91, 143, 249, 0.08);
  border: 1px solid rgba(91, 143, 249, 0.1);
  transition: all 0.3s;
}

.stat-card:active {
  transform: scale(0.98);
}

.stat-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.stat-icon.admin {
  background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
}

.stat-icon.manager {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.staff {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.disabled {
  background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%);
}

.stat-value {
  font-size: 22px;
  font-weight: bold;
  color: #4a5568;
}

.stat-label {
  font-size: 13px;
  color: #718096;
  font-weight: 500;
}

/* 用户列表 */
.user-list {
  padding: 0 15px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0 12px;
  font-size: 17px;
  font-weight: 600;
  color: #4a5568;
}

.section-title .count {
  font-size: 14px;
  color: #718096;
  font-weight: 500;
}

/* 添加员工按钮 */
.add-user-btn {
  margin-bottom: 16px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #5B8FF9 0%, #4A7DEB 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(91, 143, 249, 0.3);
  transition: all 0.3s;
}

.add-user-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(91, 143, 249, 0.2);
}

.user-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 4px 12px rgba(91, 143, 249, 0.08);
  border: 1px solid rgba(91, 143, 249, 0.1);
  transition: all 0.3s;
}

.user-card:active {
  transform: scale(0.98);
}

.user-card.disabled {
  opacity: 0.65;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-color: #dee2e6;
}

.user-avatar {
  position: relative;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.avatar-text {
  color: white;
  font-size: 22px;
  font-weight: bold;
}

.status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-dot.online {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
}

.status-dot.offline {
  background: linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-tag {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 10px;
  color: white;
  font-weight: 500;
}

.role-tag.admin {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.role-tag.manager {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.role-tag.staff {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.user-meta {
  font-size: 13px;
  color: #718096;
  margin-top: 5px;
}

.user-time {
  font-size: 12px;
  color: #a0aec0;
  margin-top: 3px;
}

.user-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-actions :deep(.van-button) {
  padding: 0 12px;
  height: 28px;
  font-size: 12px;
}

/* 弹窗 */
.popup-content {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  background: linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 19px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #2d3748;
}

.popup-header .van-icon {
  font-size: 22px;
  color: #a0aec0;
}

/* 表单 */
.user-form :deep(.van-cell-group--inset) {
  margin: 0;
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
  margin-bottom: 24px;
}

.role-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 14px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(91, 143, 249, 0.15);
}

.role-header.admin {
  background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
}

.role-header.manager {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.role-header.staff {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.role-icon {
  font-size: 22px;
}

.role-title {
  font-size: 17px;
  font-weight: 600;
  color: white;
}

.permission-list {
  list-style: none;
  padding: 0 16px;
  margin: 0;
}

.permission-list li {
  padding: 8px 0;
  font-size: 14px;
  color: #4a5568;
  border-bottom: 1px dashed rgba(91, 143, 249, 0.15);
  line-height: 1.5;
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


