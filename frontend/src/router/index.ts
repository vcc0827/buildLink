import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/system/login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页工作台', icon: 'Odometer', roles: ['admin', 'sales', 'finance', 'statistician'] }
      },
      {
        path: 'supplier',
        name: 'Supplier',
        component: () => import('@/views/business/supplier/index.vue'),
        meta: { title: '厂家管理', icon: 'OfficeBuilding', roles: ['admin'] }
      },
      {
        path: 'reconciliation-unit',
        name: 'ReconciliationUnit',
        component: () => import('@/views/business/reconciliation-unit/index.vue'),
        meta: { title: '对账单位/项目管理', icon: 'Wallet', roles: ['admin'] }
      },
      {
        path: 'product',
        name: 'Product',
        component: () => import('@/views/business/product/index.vue'),
        meta: { title: '产品管理', icon: 'Goods', roles: ['admin'] }
      },
      {
        path: 'price-info',
        name: 'PriceInfo',
        component: () => import('@/views/business/price-info/index.vue'),
        meta: { title: '月度信息价管理', icon: 'TrendingUp', roles: ['admin'] }
      },
      {
        path: 'contract',
        name: 'Contract',
        component: () => import('@/views/business/contract/index.vue'),
        meta: { title: '合同管理', icon: 'Document', roles: ['admin'] }
      },
      {
        path: 'order',
        name: 'Order',
        component: () => import('@/views/business/order/index.vue'),
        meta: { title: '报货管理', icon: 'ClipboardList', roles: ['admin', 'statistician'] }
      },
      {
        path: 'delivery',
        name: 'Delivery',
        component: () => import('@/views/business/delivery/index.vue'),
        meta: { title: '送货单管理', icon: 'Van', roles: ['admin', 'statistician'] }
      },
      {
        path: 'period-config',
        name: 'PeriodConfig',
        component: () => import('@/views/business/period-config/index.vue'),
        meta: { title: '周期配置', icon: 'Calendar', roles: ['admin'] }
      },
      {
        path: 'period-reconciliation',
        name: 'PeriodReconciliation',
        component: () => import('@/views/business/period-reconciliation/index.vue'),
        meta: { title: '周期对账', icon: 'FileCheck', roles: ['admin', 'finance'] }
      },
      {
        path: 'invoice',
        name: 'Invoice',
        component: () => import('@/views/finance/invoice/index.vue'),
        meta: { title: '发票管理', icon: 'Receipt', roles: ['admin', 'finance'] }
      },
      {
        path: 'receivable-payable',
        name: 'ReceivablePayable',
        component: () => import('@/views/finance/receivable-payable/index.vue'),
        meta: { title: '应收应付台账', icon: 'Bookkeeping', roles: ['admin', 'finance', 'sales'] }
      },
      {
        path: 'payment',
        name: 'Payment',
        component: () => import('@/views/finance/payment/index.vue'),
        meta: { title: '收付款核销', icon: 'Money', roles: ['admin', 'finance'] }
      },
      {
        path: 'stock',
        name: 'Stock',
        component: () => import('@/views/finance/stock/index.vue'),
        meta: { title: '库存管理', icon: 'Package', roles: ['admin', 'finance'] }
      },
      {
        path: 'report-diff',
        name: 'ReportDiff',
        component: () => import('@/views/report/diff/index.vue'),
        meta: { title: '报货/送货差异表', icon: 'BarChart3', roles: ['admin', 'finance', 'sales'] }
      },
      {
        path: 'report-receivable',
        name: 'ReportReceivable',
        component: () => import('@/views/report/receivable/index.vue'),
        meta: { title: '应收应付报表', icon: 'PieChart', roles: ['admin', 'finance', 'sales'] }
      },
      {
        path: 'report-invoice',
        name: 'ReportInvoice',
        component: () => import('@/views/report/invoice/index.vue'),
        meta: { title: '开票报表', icon: 'FileText', roles: ['admin', 'finance'] }
      },
      {
        path: 'system-user',
        name: 'SystemUser',
        component: () => import('@/views/system/user/index.vue'),
        meta: { title: '用户管理', icon: 'User', roles: ['admin'] }
      },
      {
        path: 'system-role',
        name: 'SystemRole',
        component: () => import('@/views/system/role/index.vue'),
        meta: { title: '角色权限', icon: 'Key', roles: ['admin'] }
      },
      {
        path: 'system-log',
        name: 'SystemLog',
        component: () => import('@/views/system/log/index.vue'),
        meta: { title: '操作日志', icon: 'History', roles: ['admin'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  
  // 未登录跳转到登录页
  if (to.path !== '/login' && !userStore.token) {
    next('/login')
    return
  }
  
  // 已登录直接进入登录页则跳转到 dashboard
  if (to.path === '/login' && userStore.token) {
    next('/dashboard')
    return
  }
  
  // 权限检查
  if (to.meta.roles && Array.isArray(to.meta.roles) && to.meta.roles.length > 0) {
    const currentRole = userStore.role
    
    // 如果没有角色信息，先放行（等待页面加载完成后再处理）
    if (!currentRole) {
      next()
      return
    }
    
    const hasPermission = to.meta.roles.includes(currentRole)
    if (!hasPermission) {
      // dashboard 是所有角色都应该能访问的，如果没权限则留在 dashboard
      if (to.path !== '/dashboard') {
        next('/dashboard')
        return
      }
    }
  }
  
  next()
})

export default router
