import { createRouter, createWebHistory } from 'vue-router'
import { PERMISSIONS } from '@/stores/user'

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
    meta: { title: '数据统计', permission: PERMISSIONS.STATS_VIEW }
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
    path: '/data-visualization',
    name: 'DataVisualization',
    component: () => import('@/views/DataVisualization.vue'),
    meta: { title: '数据分析', permission: PERMISSIONS.STATS_VIEW }
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
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '鞋店仓库管理系统'
  
  // 公开页面直接放行
  if (to.meta.public) {
    next()
    return
  }
  
  // 检查是否已登录
  const currentUser = localStorage.getItem('currentUser')
  if (!currentUser) {
    // 未登录，跳转到登录页
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  
  // 检查权限
  if (to.meta.permission) {
    const user = JSON.parse(currentUser)
    const userPermissions = getUserPermissions(user.role)
    
    if (!userPermissions.includes(to.meta.permission)) {
      // 无权限，提示并返回首页
      next({ path: '/home' })
      return
    }
  }
  
  next()
})

// 获取用户权限列表
function getUserPermissions(role) {
  const ROLE_PERMISSIONS = {
    admin: Object.values(PERMISSIONS),
    manager: [
      PERMISSIONS.PRODUCT_VIEW,
      PERMISSIONS.PRODUCT_ADD,
      PERMISSIONS.PRODUCT_EDIT,
      PERMISSIONS.PRODUCT_DELETE,
      PERMISSIONS.PURCHASE_VIEW,
      PERMISSIONS.PURCHASE_ADD,
      PERMISSIONS.SALES_VIEW,
      PERMISSIONS.SALES_ADD,
      PERMISSIONS.SALES_DELETE,
      PERMISSIONS.RETURNS_VIEW,
      PERMISSIONS.RETURNS_ADD,
      PERMISSIONS.MEMBER_VIEW,
      PERMISSIONS.MEMBER_ADD,
      PERMISSIONS.MEMBER_EDIT,
      PERMISSIONS.MEMBER_RECHARGE,
      PERMISSIONS.STATS_VIEW,
      PERMISSIONS.STATS_PROFIT,
      PERMISSIONS.STATS_REPORT,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.INVENTORY_CHECK,
      PERMISSIONS.STAFF_STATS_VIEW,
      PERMISSIONS.STAFF_STATS_ALL,
      PERMISSIONS.DATA_BACKUP,
      PERMISSIONS.DATA_RESTORE
    ],
    staff: [
      PERMISSIONS.PRODUCT_VIEW,
      PERMISSIONS.SALES_VIEW,
      PERMISSIONS.SALES_ADD,
      PERMISSIONS.RETURNS_VIEW,
      PERMISSIONS.MEMBER_VIEW,
      PERMISSIONS.MEMBER_ADD,
      PERMISSIONS.MEMBER_RECHARGE,
      PERMISSIONS.STATS_VIEW,
      PERMISSIONS.STAFF_STATS_VIEW
    ]
  }
  
  return ROLE_PERMISSIONS[role] || []
}

export default router
