<template>
  <div class="layout-container">
    <aside class="sidebar">
      <div class="logo">
        <h1>BuildLink</h1>
      </div>
      <el-tree
        :data="menuData"
        :props="treeProps"
        :default-expanded-keys="expandedKeys"
        :default-active-id="activeMenu"
        class="sidebar-tree"
        @node-click="handleNodeClick"
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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const menuData = [
  {
    id: '/dashboard',
    label: '首页工作台',
    children: []
  },
  {
    id: 'business',
    label: '业务管理',
    children: [
      { id: '/supplier', label: '厂家管理' },
      { id: '/reconciliation-unit', label: '对账单位' },
      { id: '/project', label: '项目管理' },
      { id: '/product', label: '产品管理' },
      { id: '/contract', label: '合同管理' },
      { id: '/delivery', label: '送货单管理' },
      { id: '/upstream', label: '上游对账' },
      { id: '/downstream', label: '下游对账' }
    ]
  },
  {
    id: 'finance',
    label: '财务管理',
    children: [
      { id: '/invoice', label: '发票管理' },
      { id: '/stock', label: '库存管理' },
      { id: '/payment', label: '收付款管理' },
      { id: '/reconciliation', label: '往来核销' }
    ]
  },
  {
    id: 'report',
    label: '数据报表',
    children: [
      { id: '/report', label: '经营报表' }
    ]
  }
]

const treeProps = {
  children: 'children',
  label: 'label',
  id: 'id'
}

const expandedKeys = computed(() => {
  const path = route.path
  const parentKeys = ['business', 'finance', 'report']
  return parentKeys.filter(key => {
    const item = menuData.find(m => m.id === key)
    return item?.children.some(c => c.id === path)
  })
})

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
