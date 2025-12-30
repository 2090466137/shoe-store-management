import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home'
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
    meta: { title: '商品管理' }
  },
  {
    path: '/product/add',
    name: 'ProductAdd',
    component: () => import('@/views/ProductForm.vue'),
    meta: { title: '添加商品' }
  },
  {
    path: '/product/batch-add',
    name: 'ProductBatchAdd',
    component: () => import('@/views/ProductBatchAdd.vue'),
    meta: { title: '批量添加商品' }
  },
  {
    path: '/product/edit/:id',
    name: 'ProductEdit',
    component: () => import('@/views/ProductForm.vue'),
    meta: { title: '编辑商品' }
  },
  {
    path: '/purchase',
    name: 'Purchase',
    component: () => import('@/views/Purchase.vue'),
    meta: { title: '进货管理' }
  },
  {
    path: '/sales',
    name: 'Sales',
    component: () => import('@/views/Sales.vue'),
    meta: { title: '销售管理' }
  },
  {
    path: '/sales/add',
    name: 'SalesAdd',
    component: () => import('@/views/CartSales.vue'),
    meta: { title: '收银台' }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('@/views/Statistics.vue'),
    meta: { title: '数据统计' }
  },
  {
    path: '/data-management',
    name: 'DataManagement',
    component: () => import('@/views/DataManagement.vue'),
    meta: { title: '数据管理' }
  },
  {
    path: '/staff-stats',
    name: 'StaffStats',
    component: () => import('@/views/StaffStats.vue'),
    meta: { title: '员工业绩' }
  },
  {
    path: '/daily-report',
    name: 'DailyReport',
    component: () => import('@/views/DailyReport.vue'),
    meta: { title: '每日营业报表' }
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: () => import('@/views/Inventory.vue'),
    meta: { title: '库存盘点' }
  },
  {
    path: '/returns',
    name: 'Returns',
    component: () => import('@/views/Returns.vue'),
    meta: { title: '退换货管理' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '鞋店仓库管理系统'
  next()
})

export default router

