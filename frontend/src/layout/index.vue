<template>
  <div class="layout-container">
    <aside class="sidebar">
      <div class="logo">
        <h1>BuildLink</h1>
      </div>
      <el-tree
        :data="menuData"
        :props="treeProps"
        :expanded-keys="expandedKeys"
        :active-id="activeMenu"
        class="sidebar-tree"
        @node-click="handleNodeClick"
        @expand-change="handleExpandChange"
      />
    </aside>

    <div class="main-wrapper">
      <header class="header">
        <div class="header-left">
          <h2 class="page-title">{{ route.meta.title || '首页' }}</h2>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" style="background-color: #409eff">
                {{ userStore.userInfo?.nickname?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="username">{{ userStore.userInfo?.nickname || userStore.userInfo?.username }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const allMenuData = [
  {
    id: '/dashboard',
    label: '首页 Dashboard',
    children: [],
    roles: ['admin', 'sales', 'finance', 'statistician']
  },
  {
    id: 'base',
    label: '基础档案',
    children: [
      { id: '/supplier', label: '厂家管理', roles: ['admin'] },
      { id: '/reconciliation-unit', label: '对账单位/项目管理', roles: ['admin'] },
      { id: '/product', label: '产品管理', roles: ['admin'] },
      { id: '/price-info', label: '月度信息价管理', roles: ['admin'] },
      { id: '/contract', label: '合同管理', roles: ['admin'] }
    ],
    roles: ['admin']
  },
  {
    id: 'order',
    label: '报货管理',
    children: [
      { id: '/order', label: '报货登记', roles: ['admin', 'statistician'] }
    ],
    roles: ['admin', 'statistician']
  },
  {
    id: 'delivery',
    label: '送货单管理',
    children: [
      { id: '/delivery', label: '送货单列表', roles: ['admin', 'statistician'] }
    ],
    roles: ['admin', 'statistician']
  },
  {
    id: 'period',
    label: '周期对账管理',
    children: [
      { id: '/period-config', label: '周期配置', roles: ['admin'] },
      { id: '/period-reconciliation', label: '单据归集', roles: ['admin', 'finance'] }
    ],
    roles: ['admin', 'finance']
  },
  {
    id: 'finance',
    label: '财务中心',
    children: [
      { id: '/invoice', label: '发票管理', roles: ['admin', 'finance'] },
      { id: '/receivable-payable', label: '应收应付台账', roles: ['admin', 'finance', 'sales'] },
      { id: '/payment', label: '收付款核销', roles: ['admin', 'finance'] },
      { id: '/stock', label: '库存管理', roles: ['admin', 'finance'] }
    ],
    roles: ['admin', 'finance', 'sales']
  },
  {
    id: 'inventory',
    label: '库存管理',
    children: [
      { id: '/stock', label: '库存查询', roles: ['admin', 'finance'] }
    ],
    roles: ['admin', 'finance']
  },
  {
    id: 'report',
    label: '数据报表',
    children: [
      { id: '/report-diff', label: '报货/送货差异表', roles: ['admin', 'finance', 'sales'] },
      { id: '/report-receivable', label: '应收应付报表', roles: ['admin', 'finance', 'sales'] },
      { id: '/report-invoice', label: '开票报表', roles: ['admin', 'finance'] }
    ],
    roles: ['admin', 'finance', 'sales']
  },
  {
    id: 'system',
    label: '系统管理',
    children: [
      { id: '/system-user', label: '用户管理', roles: ['admin'] },
      { id: '/system-role', label: '角色权限分配', roles: ['admin'] },
      { id: '/system-log', label: '操作日志', roles: ['admin'] }
    ],
    roles: ['admin']
  }
]

const menuData = computed(() => {
  const currentRole = userStore.role
  
  // 如果没有角色，先显示所有菜单
  if (!currentRole) {
    return allMenuData
  }
  
  return allMenuData.filter(menu => {
    if (!menu.roles || menu.roles.length === 0) return true
    return menu.roles.includes(currentRole)
  }).map(menu => ({
    ...menu,
    children: menu.children?.filter(child => {
      if (!child.roles || child.roles.length === 0) return true
      return child.roles.includes(currentRole)
    }) || []
  }))
})

// 持久化菜单展开状态
const expandedKeys = ref<string[]>([])

// 路由变化时，自动展开当前页面所属的父菜单
watch(() => route.path, (newPath) => {
  const parentKeys = ['base', 'order', 'delivery', 'period', 'finance', 'inventory', 'report', 'system']
  parentKeys.forEach(key => {
    const item = allMenuData.find(m => m.id === key)
    if (item?.children.some(c => c.id === newPath) && !expandedKeys.value.includes(key)) {
      expandedKeys.value.push(key)
    }
  })
}, { immediate: true })

// 处理菜单展开/收起事件
const handleExpandChange = (keys: string[]) => {
  expandedKeys.value = keys
}

const treeProps = {
  children: 'children',
  label: 'label',
  id: 'id'
}

const handleNodeClick = (data: any) => {
  if (data.children && data.children.length > 0) return
  if (data.id && data.id.startsWith('/')) {
    router.push(data.id)
  }
}

const handleCommand = (command: string) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped lang="scss">
.layout-container {
  display: flex;
  width: 100%;
  height: 100%;
}

.sidebar {
  width: 240px;
  height: 100%;
  background-color: #fff;
  border-right: 1px solid #e8e8e8;
  overflow-y: auto;
  flex-shrink: 0;

  .logo {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #4a90d9 0%, #357abd 100%);
    h1 {
      color: #fff;
      font-size: 18px;
      font-weight: 600;
    }
  }

  .sidebar-tree {
    padding: 10px 0;
    :deep(.el-tree-node) {
      &:hover {
        background-color: #f5f7fa;
      }
    }
    :deep(.el-tree-node.is-current > .el-tree-node__content) {
      background-color: #e6f7ff;
      color: #1890ff;
      font-weight: 500;
    }
    :deep(.el-tree-node__expand-icon) {
      color: #999;
    }
    :deep(.el-tree-node__label) {
      font-size: 14px;
      color: #666;
    }
    :deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
      background-color: #e6f7ff;
    }
  }
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 64px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .header-left {
    .page-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }
  }

  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 4px;
      &:hover {
        background-color: #f5f7fa;
      }
      .username {
        color: #666;
        font-size: 14px;
      }
    }
  }
}

.content {
  flex: 1;
  overflow-y: auto;
  background-color: #fafafa;
  padding: 20px;
}
</style>
