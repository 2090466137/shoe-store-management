<template>
  <div class="home-page">
    <!-- 头部 -->
    <div class="header">
      <div class="header-content">
        <div class="header-top">
          <div class="user-info" @click="showUserMenu = true">
            <div class="user-avatar">
              {{ userStore.currentUserName?.charAt(0) || '?' }}
            </div>
            <div class="user-detail">
              <div class="user-name">{{ userStore.currentUserName || '未登录' }}</div>
              <div class="user-role">{{ getRoleName(userStore.currentRole) }}</div>
            </div>
          </div>
          <div class="header-actions">
            <van-icon 
              v-if="userStore.hasPermission(PERMISSIONS.USER_VIEW)" 
              name="manager-o" 
              size="22" 
              @click="router.push('/user-management')"
            />
            <van-icon name="setting-o" size="22" @click="showUserMenu = true" />
          </div>
        </div>
        <h1 class="title">鞋店管理系统</h1>
        <p class="subtitle">{{ currentDate }}</p>
      </div>
    </div>

    <!-- 数据概览 -->
    <div class="content-wrapper">
      <div class="stats-grid">
        <div 
          class="stat-card" 
          @click="router.push('/statistics')"
          v-if="userStore.hasPermission(PERMISSIONS.STATS_PROFIT)"
        >
          <div class="stat-icon stat-icon-primary">
            💰
          </div>
          <div class="stat-info">
            <div class="stat-label">今日销售额</div>
            <div class="stat-value stat-value-primary">¥{{ salesStore.todaySales.toFixed(2) }}</div>
          </div>
        </div>

        <div 
          class="stat-card" 
          @click="router.push('/statistics')"
          v-if="userStore.hasPermission(PERMISSIONS.STATS_PROFIT)"
        >
          <div class="stat-icon stat-icon-success">
            📈
          </div>
          <div class="stat-info">
            <div class="stat-label">今日利润</div>
            <div class="stat-value stat-value-success">¥{{ salesStore.todayProfit.toFixed(2) }}</div>
          </div>
        </div>

        <div class="stat-card" @click="router.push('/products')">
          <div class="stat-icon stat-icon-info">
            👟
          </div>
          <div class="stat-info">
            <div class="stat-label">商品总数</div>
            <div class="stat-value">{{ productStore.totalProducts }}</div>
          </div>
        </div>

        <div 
          class="stat-card" 
          @click="router.push('/products')"
          v-if="userStore.hasPermission(PERMISSIONS.STATS_PROFIT)"
        >
          <div class="stat-icon stat-icon-warning">
            📦
          </div>
          <div class="stat-info">
            <div class="stat-label">库存总值</div>
            <div class="stat-value">¥{{ productStore.totalStockValue.toFixed(0) }}</div>
          </div>
        </div>
      </div>

      <!-- 低库存预警 -->
      <div 
        class="card" 
        v-if="productStore.lowStockProducts.length > 0 && userStore.hasPermission(PERMISSIONS.INVENTORY_VIEW)"
      >
        <div class="section-title">⚠️ 低库存预警</div>
        <div class="warning-list">
          <div 
            v-for="product in productStore.lowStockProducts" 
            :key="product.id"
            class="warning-item"
            @click="userStore.hasPermission(PERMISSIONS.PRODUCT_EDIT) && router.push(`/product/edit/${product.id}`)"
          >
            <div class="warning-info">
              <div class="warning-name">{{ product.name }}</div>
              <div class="warning-detail">
                {{ product.brand }} | {{ product.size }}码 | {{ product.color }}
              </div>
            </div>
            <div class="warning-stock">
              <span class="stock-badge low">剩余 {{ product.stock }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 今日员工业绩 -->
      <div 
        class="card" 
        v-if="salesStore.todaySalespersonStats.length > 0 && userStore.hasPermission(PERMISSIONS.STAFF_STATS_ALL)"
      >
        <div class="section-title">👥 今日业绩</div>
        <div class="staff-stats">
          <div 
            v-for="staff in salesStore.todaySalespersonStats" 
            :key="staff.name"
            class="staff-item"
          >
            <div class="staff-info">
              <div class="staff-name">{{ staff.name }}</div>
              <div class="staff-detail">{{ staff.salesCount }}单 | {{ staff.quantity }}件</div>
            </div>
            <div class="staff-amount">
              <div class="staff-sales" v-if="userStore.hasPermission(PERMISSIONS.STATS_PROFIT)">
                ¥{{ staff.totalAmount.toFixed(0) }}
              </div>
              <div class="staff-profit" v-if="userStore.hasPermission(PERMISSIONS.STATS_PROFIT)">
                利润 ¥{{ staff.totalProfit.toFixed(0) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 会员管理 -->
      <div 
        class="card" 
        v-if="userStore.hasPermission(PERMISSIONS.MEMBER_VIEW)"
      >
        <div class="section-title">👥 会员管理</div>
        <div class="quick-action" @click="router.push('/members')">
          <div class="action-icon">💳</div>
          <div class="action-text">查看和管理会员信息</div>
          <van-icon name="arrow" class="action-arrow" />
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="card">
        <div class="section-title">🚀 快捷操作</div>
        <div class="quick-actions">
          <van-button 
            v-if="userStore.hasPermission(PERMISSIONS.SALES_ADD)"
            type="primary" 
            size="large" 
            block
            class="action-btn"
            @click="router.push('/sales/add')"
          >
            <van-icon name="shopping-cart-o" />
            收银台
          </van-button>
          
          <van-button 
            v-if="userStore.hasPermission(PERMISSIONS.PURCHASE_ADD)"
            type="success" 
            size="large" 
            block
            class="action-btn"
            @click="router.push('/purchase')"
          >
            <van-icon name="add-o" />
            进货
          </van-button>
          
          <div class="action-row" v-if="userStore.hasPermission(PERMISSIONS.STATS_REPORT) || userStore.hasPermission(PERMISSIONS.STAFF_STATS_VIEW)">
            <van-button 
              v-if="userStore.hasPermission(PERMISSIONS.STATS_REPORT)"
              type="default" 
              size="large" 
              class="action-btn half backup-btn"
              @click="router.push('/daily-report')"
            >
              <van-icon name="description" />
              每日报表
            </van-button>
            
            <van-button 
              v-if="userStore.hasPermission(PERMISSIONS.STAFF_STATS_VIEW)"
              type="default" 
              size="large" 
              class="action-btn half stats-btn"
              @click="router.push('/staff-stats')"
            >
              <van-icon name="friends-o" />
              员工业绩
            </van-button>
          </div>
          
          <van-button 
            v-if="userStore.hasPermission(PERMISSIONS.DATA_BACKUP)"
            type="default" 
            size="large" 
            block
            class="action-btn backup-btn"
            @click="router.push('/data-management')"
          >
            <van-icon name="records" />
            数据备份
          </van-button>
        </div>
      </div>

      <!-- 本月数据 -->
      <div class="card" v-if="userStore.hasPermission(PERMISSIONS.STATS_PROFIT)">
        <div class="section-title">📊 本月数据</div>
        <div class="month-stats">
          <div class="month-stat-item">
            <div class="month-stat-label">销售额</div>
            <div class="month-stat-value primary">¥{{ salesStore.monthSales.toFixed(2) }}</div>
          </div>
          <div class="month-stat-divider"></div>
          <div class="month-stat-item">
            <div class="month-stat-label">利润</div>
            <div class="month-stat-value success">¥{{ salesStore.monthProfit.toFixed(2) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户菜单弹窗 -->
    <van-action-sheet
      v-model:show="showUserMenu"
      :actions="userMenuActions"
      cancel-text="取消"
      close-on-click-action
      @select="onUserMenuSelect"
    >
      <template #description>
        <div class="user-menu-header">
          <div class="menu-avatar">
            {{ userStore.currentUserName?.charAt(0) || '?' }}
          </div>
          <div class="menu-info">
            <div class="menu-name">{{ userStore.currentUserName }}</div>
            <div class="menu-role">{{ getRoleName(userStore.currentRole) }}</div>
          </div>
        </div>
      </template>
    </van-action-sheet>

    <!-- 修改密码弹窗 -->
    <van-dialog
      v-model:show="showChangePassword"
      title="修改密码"
      show-cancel-button
      :before-close="handleChangePassword"
    >
      <van-form ref="passwordForm">
        <van-cell-group inset>
          <van-field
            v-model="passwordData.oldPassword"
            type="password"
            label="原密码"
            placeholder="请输入原密码"
            :rules="[{ required: true, message: '请输入原密码' }]"
          />
          <van-field
            v-model="passwordData.newPassword"
            type="password"
            label="新密码"
            placeholder="请输入新密码"
            :rules="[{ required: true, message: '请输入新密码' }]"
          />
          <van-field
            v-model="passwordData.confirmPassword"
            type="password"
            label="确认密码"
            placeholder="请再次输入新密码"
            :rules="[{ required: true, message: '请确认新密码' }]"
          />
        </van-cell-group>
      </van-form>
    </van-dialog>

    <!-- 底部导航 -->
    <van-tabbar v-model="active" active-color="#1989fa" inactive-color="#7d7e80">
      <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="bag-o" to="/products">商品</van-tabbar-item>
      <van-tabbar-item icon="shopping-cart-o" to="/sales">销售</van-tabbar-item>
      <van-tabbar-item 
        v-if="userStore.hasPermission(PERMISSIONS.STATS_PROFIT)"
        icon="bar-chart-o" 
        to="/statistics"
      >
        统计
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'
import { useProductStore } from '@/stores/product'
import { useSalesStore } from '@/stores/sales'
import { useUserStore, PERMISSIONS, ROLE_NAMES } from '@/stores/user'

const router = useRouter()
const productStore = useProductStore()
const salesStore = useSalesStore()
const userStore = useUserStore()
const active = ref(0)

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

const showUserMenu = ref(false)
const showChangePassword = ref(false)

const passwordData = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 获取角色名称
const getRoleName = (role) => ROLE_NAMES[role] || '未知'

// 用户菜单选项
const userMenuActions = computed(() => {
  const actions = [
    { name: '修改密码', value: 'changePassword' }
  ]
  
  if (userStore.hasPermission(PERMISSIONS.USER_VIEW)) {
    actions.push({ name: '用户管理', value: 'userManagement' })
    actions.push({ name: '操作日志', value: 'operationLogs' })
  }
  
  actions.push({ name: '退出登录', value: 'logout', color: '#ee0a24' })
  
  return actions
})

// 用户菜单选择
const onUserMenuSelect = async (action) => {
  switch (action.value) {
    case 'changePassword':
      passwordData.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
      showChangePassword.value = true
      break
    case 'userManagement':
      router.push('/user-management')
      break
    case 'operationLogs':
      router.push('/operation-logs')
      break
    case 'logout':
      try {
        await showConfirmDialog({
          title: '退出登录',
          message: '确定要退出登录吗？'
        })
        userStore.logout()
        router.replace('/login')
      } catch {
        // 用户取消
      }
      break
  }
}

// 修改密码
const handleChangePassword = (action) => {
  return new Promise((resolve) => {
    if (action === 'confirm') {
      const { oldPassword, newPassword, confirmPassword } = passwordData.value
      
      if (!oldPassword || !newPassword || !confirmPassword) {
        showToast('请填写完整信息')
        resolve(false)
        return
      }
      
      if (newPassword !== confirmPassword) {
        showToast('两次输入的密码不一致')
        resolve(false)
        return
      }
      
      if (newPassword.length < 6) {
        showToast('密码长度不能少于6位')
        resolve(false)
        return
      }
      
      const result = userStore.changePassword(oldPassword, newPassword)
      if (result.success) {
        showSuccessToast('密码修改成功')
        resolve(true)
      } else {
        showToast(result.message)
        resolve(false)
      }
    } else {
      resolve(true)
    }
  })
}

const currentDate = computed(() => {
  const date = new Date()
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
  return date.toLocaleDateString('zh-CN', options)
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #5B8FF9 0%, #5B8FF9 200px, #F5F7FA 200px);
  padding-bottom: 60px;
}

.header {
  padding: 15px 16px 30px;
  color: white;
}

.header-content {
  text-align: center;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
}

.user-detail {
  text-align: left;
}

.user-name {
  font-size: 15px;
  font-weight: 600;
}

.user-role {
  font-size: 12px;
  opacity: 0.8;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.header-actions .van-icon {
  cursor: pointer;
  opacity: 0.9;
}

.header-actions .van-icon:active {
  opacity: 0.6;
}

.title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 13px;
  opacity: 0.9;
}

.content-wrapper {
  padding: 0 16px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: -20px;
  padding-bottom: 16px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  min-height: 88px; /* 确保足够的触摸区域 */
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:active {
  transform: scale(0.98);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 12px;
  flex-shrink: 0;
}

.stat-icon-primary {
  background: #E8F4FF;
}

.stat-icon-success {
  background: #E8FFF3;
}

.stat-icon-info {
  background: #F0F5FF;
}

.stat-icon-warning {
  background: #FFF7E8;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 12px;
  color: #969799;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-value-primary {
  color: #5B8FF9;
}

.stat-value-success {
  color: #5AD8A6;
}

.warning-list {
  margin-top: 12px;
}

.warning-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fff7e6;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.warning-item:last-child {
  margin-bottom: 0;
}

.warning-item:active {
  background: #ffe7ba;
}

.warning-info {
  flex: 1;
}

.warning-name {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 4px;
}

.warning-detail {
  font-size: 12px;
  color: #969799;
}

.stock-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.stock-badge.low {
  background: #ff4d4f;
  color: white;
}

.quick-action {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #5B8FF9;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: transform 0.2s;
  margin-top: 12px;
}

.quick-action:active {
  transform: scale(0.98);
}

.action-icon {
  font-size: 32px;
  margin-right: 12px;
}

.action-text {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
}

.action-arrow {
  font-size: 18px;
  opacity: 0.8;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.action-btn {
  min-height: 52px; /* 增加到52px，更容易点击 */
  height: 52px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 12px; /* 增大圆角，更现代 */
  padding: 0 20px;
}

.action-btn :deep(.van-icon) {
  margin-right: 8px;
  font-size: 18px;
}

.action-row {
  display: flex;
  gap: 16px; /* 增加间距，防止误触 */
}

.action-btn.half {
  flex: 1;
}

.backup-btn {
  background: #5B8FF9;
  color: white;
  border: none;
}

.stats-btn {
  background: #FF9845;
  color: white;
  border: none;
}

.staff-stats {
  margin-top: 12px;
}

.staff-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
  margin-bottom: 8px;
}

.staff-item:last-child {
  margin-bottom: 0;
}

.staff-info {
  flex: 1;
}

.staff-name {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.staff-detail {
  font-size: 12px;
  color: #969799;
}

.staff-amount {
  text-align: right;
}

.staff-sales {
  font-size: 16px;
  font-weight: 600;
  color: #5B8FF9;
  margin-bottom: 4px;
}

.staff-profit {
  font-size: 12px;
  color: #5AD8A6;
}

.month-stats {
  display: flex;
  align-items: center;
  margin-top: 12px;
}

.month-stat-item {
  flex: 1;
  text-align: center;
}

.month-stat-label {
  font-size: 13px;
  color: #969799;
  margin-bottom: 8px;
}

.month-stat-value {
  font-size: 22px;
  font-weight: 600;
}

.month-stat-value.primary {
  color: #5B8FF9;
}

.month-stat-value.success {
  color: #5AD8A6;
}

.month-stat-divider {
  width: 1px;
  height: 40px;
  background: #ebedf0;
}

/* 用户菜单样式 */
.user-menu-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: #5B8FF9;
  margin: -10px -16px 10px;
  border-radius: 16px 16px 0 0;
}

.menu-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: bold;
  color: white;
}

.menu-info {
  color: white;
}

.menu-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.menu-role {
  font-size: 13px;
  opacity: 0.9;
}
</style>
