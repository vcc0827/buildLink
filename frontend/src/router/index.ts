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
        meta: { title: '首页工作台', icon: 'Odometer' }
      },
      {
        path: 'supplier',
        name: 'Supplier',
        component: () => import('@/views/business/supplier/index.vue'),
        meta: { title: '厂家管理', icon: 'OfficeBuilding' }
      },
      {
        path: 'project',
        name: 'Project',
        component: () => import('@/views/business/project/index.vue'),
        meta: { title: '项目管理', icon: 'Location' }
      },
      {
        path: 'reconciliation-unit',
        name: 'ReconciliationUnit',
        component: () => import('@/views/business/reconciliation-unit/index.vue'),
        meta: { title: '对账单位', icon: 'Wallet' }
      },
      {
        path: 'product',
        name: 'Product',
        component: () => import('@/views/business/product/index.vue'),
        meta: { title: '产品管理', icon: 'Goods' }
      },
      {
        path: 'price-info',
        name: 'PriceInfo',
        component: () => import('@/views/business/price-info/index.vue'),
        meta: { title: '信息价管理', icon: 'TrendingUp' }
      },
      {
        path: 'contract',
        name: 'Contract',
        component: () => import('@/views/business/contract/index.vue'),
        meta: { title: '合同管理', icon: 'Document' }
      },
      {
        path: 'delivery',
        name: 'Delivery',
        component: () => import('@/views/business/delivery/index.vue'),
        meta: { title: '送货单管理', icon: 'Van' }
      },
      {
        path: 'upstream',
        name: 'Upstream',
        component: () => import('@/views/business/upstream/index.vue'),
        meta: { title: '上游对账', icon: 'TopLeft' }
      },
      {
        path: 'downstream',
        name: 'Downstream',
        component: () => import('@/views/business/downstream/index.vue'),
        meta: { title: '下游对账', icon: 'TopRight' }
      },
      {
        path: 'invoice',
        name: 'Invoice',
        component: () => import('@/views/finance/invoice/index.vue'),
        meta: { title: '发票管理', icon: 'Receipt' }
      },
      {
        path: 'stock',
        name: 'Stock',
        component: () => import('@/views/finance/stock/index.vue'),
        meta: { title: '库存管理', icon: 'Package' }
      },
      {
        path: 'payment',
        name: 'Payment',
        component: () => import('@/views/finance/payment/index.vue'),
        meta: { title: '收付款管理', icon: 'Money' }
      },
      {
        path: 'reconciliation',
        name: 'Reconciliation',
        component: () => import('@/views/finance/reconciliation/index.vue'),
        meta: { title: '往来核销', icon: 'Check' }
      },
      {
        path: 'report',
        name: 'Report',
        component: () => import('@/views/report/index.vue'),
        meta: { title: '数据报表', icon: 'DataLine' }
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
  if (to.path !== '/login' && !userStore.token) {
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
