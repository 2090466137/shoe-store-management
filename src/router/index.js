import { createRouter, createWebHistory } from 'vue-router'
import { PERMISSIONS, ROLES } from '@/stores/user'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('@/views/Products.vue'),
    meta: { title: '商品管理', permission: PERMISSIONS.PRODUCT_VIEW }
  },
  {
    path: '/product/add',
    name: 'ProductAdd',
    component: () => import('@/views/ProductForm.vue'),
    meta: { title: '添加商品', permission: PERMISSIONS.PRODUCT_ADD }
  },
  {
    path: '/product/batch-add',
    name: 'ProductBatchAdd',
    component: () => import('@/views/ProductBatchAdd.vue'),
    meta: { title: '批量添加商品', permission: PERMISSIONS.PRODUCT_ADD }
  },
  {
    path: '/product/edit/:id',
    name: 'ProductEdit',
    component: () => import('@/views/ProductForm.vue'),
    meta: { title: '编辑商品', permission: PERMISSIONS.PRODUCT_EDIT }
  },
  {
    path: '/purchase',
    name: 'Purchase',
    component: () => import('@/views/Purchase.vue'),
    meta: { title: '进货管理', permission: PERMISSIONS.PURCHASE_VIEW }
  },
  {
    path: '/sales',
    name: 'Sales',
    component: () => import('@/views/Sales.vue'),
    meta: { title: '销售管理', permission: PERMISSIONS.SALES_VIEW }
  },
  {
    path: '/sales/add',
    name: 'SalesAdd',
    component: () => import('@/views/CartSales.vue'),
    meta: { title: '收银台', permission: PERMISSIONS.SALES_ADD }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('@/views/Statistics.vue'),
    meta: { title: '数据统计', permission: PERMISSIONS.STATS_PROFIT }
  },
  {
    path: '/data-management',
    name: 'DataManagement',
    component: () => import('@/views/DataManagement.vue'),
    meta: { title: '数据管理', permission: PERMISSIONS.DATA_BACKUP }
  },
  {
    path: '/staff-stats',
    name: 'StaffStats',
    component: () => import('@/views/StaffStats.vue'),
    meta: { title: '员工业绩', permission: PERMISSIONS.STAFF_STATS_VIEW }
  },
  {
    path: '/daily-report',
    name: 'DailyReport',
    component: () => import('@/views/DailyReport.vue'),
    meta: { title: '每日营业报表', permission: PERMISSIONS.STATS_REPORT }
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: () => import('@/views/Inventory.vue'),
    meta: { title: '库存盘点', permission: PERMISSIONS.INVENTORY_VIEW }
  },
  {
    path: '/returns',
    name: 'Returns',
    component: () => import('@/views/Returns.vue'),
    meta: { title: '退换货管理', permission: PERMISSIONS.RETURNS_VIEW }
  },
  {
    path: '/members',
    name: 'Members',
    component: () => import('@/views/Members.vue'),
    meta: { title: '会员管理', permission: PERMISSIONS.MEMBER_VIEW }
  },
  {
    path: '/member/recharge/:memberId',
    name: 'MemberRecharge',
    component: () => import('@/views/MemberRecharge.vue'),
    meta: { title: '会员充值', permission: PERMISSIONS.MEMBER_RECHARGE }
  },
  {
    path: '/user-management',
    name: 'UserManagement',
    component: () => import('@/views/UserManagement.vue'),
    meta: { title: '用户管理', permission: PERMISSIONS.USER_VIEW }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title || '鞋店仓库管理系统'
  
  // 公开页面直接放行
  if (to.meta.public) {
    next()
    return
  }
  
  // 动态导入 userStore
  const { useUserStore } = await import('@/stores/user')
  const userStore = useUserStore()
  
  // 🔧 优先从 localStorage 恢复登录状态（同步操作，避免闪烁）
  if (!userStore.currentUser) {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        // 临时设置 currentUser，避免跳转到登录页
        userStore.currentUser = userData // Pinia 的 ref 可以直接赋值
        console.log('🔧 路由守卫：从 localStorage 恢复登录状态')
      } catch (error) {
        console.error('❌ 恢复登录状态失败:', error)
        localStorage.removeItem('currentUser')
      }
    }
  }
  
  // 确保用户数据已加载（异步操作，但不阻塞路由）
  if (!userStore.users.length) {
    // 不使用 await，让加载在后台进行
    userStore.loadUsers().catch(err => {
      console.error('加载用户数据失败:', err)
    })
  }
  
  // 检查是否已登录
  if (!userStore.isLoggedIn) {
    // 未登录，跳转到登录页
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  
  // 检查权限
  if (to.meta.permission) {
    if (!userStore.hasPermission(to.meta.permission)) {
      // 无权限，提示并返回首页
      next({ path: '/home' })
      return
    }
  }
  
  next()
})

export default router

