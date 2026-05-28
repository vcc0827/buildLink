<template>
  <div class="page-container">
    <div class="role-tabs">
      <el-tabs v-model="activeRole" @change="handleRoleChange">
        <el-tab-pane v-for="role in roles" :key="role.key" :label="role.name" :name="role.key" />
      </el-tabs>
    </div>

    <el-card class="mt-16">
      <div class="permission-section">
        <h4 class="section-title">菜单权限</h4>
        <el-tree :data="menuTree" :props="treeProps" show-checkbox default-expand-all @check="handleCheck" />
      </div>
    </el-card>

    <div class="mt-16 text-right">
      <el-button type="primary" @click="handleSave">保存权限</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const activeRole = ref('admin')

const roles = ref([
  { key: 'admin', name: '超级管理员', description: '拥有所有权限' },
  { key: 'statistician', name: '统计员', description: '报货、送货单录入' },
  { key: 'finance', name: '财务', description: '对账、开票、应收应付、库存' },
  { key: 'sales', name: '销售经理', description: '查看报表、应收应付、dashboard' }
])

const treeProps = {
  label: 'label',
  children: 'children',
  disabled: 'disabled'
}

const menuTree = ref([
  {
    id: 'dashboard',
    label: '首页 Dashboard',
    disabled: activeRole.value === 'admin',
    checked: activeRole.value === 'admin' || activeRole.value === 'sales',
    children: []
  },
  {
    id: 'base',
    label: '基础档案',
    disabled: activeRole.value === 'admin',
    checked: true,
    children: [
      { id: 'supplier', label: '厂家管理', disabled: activeRole.value === 'admin', checked: true },
      { id: 'customer', label: '对账单位/项目管理', disabled: activeRole.value === 'admin', checked: true },
      { id: 'product', label: '产品管理', disabled: activeRole.value === 'admin', checked: true },
      { id: 'price', label: '月度信息价管理', disabled: activeRole.value === 'admin', checked: true },
      { id: 'contract', label: '合同管理', disabled: activeRole.value === 'admin', checked: true }
    ]
  },
  {
    id: 'order',
    label: '报货管理',
    disabled: activeRole.value === 'admin',
    checked: activeRole.value === 'admin' || activeRole.value === 'statistician',
    children: [
      { id: 'order-add', label: '报货登记', disabled: activeRole.value === 'admin', checked: activeRole.value === 'admin' || activeRole.value === 'statistician' },
      { id: 'order-list', label: '报货列表', disabled: activeRole.value === 'admin', checked: activeRole.value === 'admin' || activeRole.value === 'statistician' }
    ]
  },
  {
    id: 'delivery',
    label: '送货单管理',
    disabled: activeRole.value === 'admin',
    checked: activeRole.value === 'admin' || activeRole.value === 'statistician',
    children: [
      { id: 'delivery-draft', label: '送货单草稿', disabled: activeRole.value === 'admin', checked: activeRole.value === 'admin' || activeRole.value === 'statistician' },
      { id: 'delivery-confirm', label: '送货单确认', disabled: activeRole.value === 'admin', checked: activeRole.value === 'admin' || activeRole.value === 'statistician' },
      { id: 'delivery-list', label: '送货单列表', disabled: activeRole.value === 'admin', checked: activeRole.value === 'admin' || activeRole.value === 'statistician' }
    ]
  },
  {
    id: 'period',
    label: '周期对账管理',
    disabled: activeRole.value === 'admin',
    checked: activeRole.value === 'admin' || activeRole.value === 'finance',
    children: [
      { id: 'period-config', label: '周期配置', disabled: activeRole.value === 'admin', checked: activeRole.value === 'admin' || activeRole.value === 'finance' },
      { id: 'period-reconciliation', label: '单据归集', disabled: activeRole.value === 'admin', checked: activeRole.value === 'admin' || activeRole.value === 'finance' },
      { id: 'period-history', label: '对账历史', disabled: activeRole.value === 'admin', checked: activeRole.value === 'admin' || activeRole.value === 'finance' }
    ]
  },
  {
    id: 'finance',
    label: '财务中心',
    disabled: activeRole.value === 'admin',
    checked: activeRole.value === 'admin' || activeRole.value === 'finance' || activeRole.value === 'sales',
    children: [
      { id: 'invoice', label: '发票管理', disabled: activeRole.value === 'admin', checked: activeRole.value === 'admin' || activeRole.value === 'finance' },
      { id: 'receivable-payable', label: '应收应付台账', disabled: activeRole.value === 'admin', checked: activeRole.value === 'admin' || activeRole.value === 'finance' || activeRole.value === 'sales' },
      { id: 'verification', label: '收付款核销', disabled: activeRole.value === 'admin', checked: activeRole.value === 'admin' || activeRole.value === 'finance' }
    ]
  },
  {
    id: 'inventory',
    label: '库存管理',
    disabled: activeRole.value === 'admin',
    checked: activeRole.value === 'admin' || activeRole.value === 'finance',
    children: [
      { id: 'inventory-query', label: '库存查询', disabled: activeRole.value === 'admin', checked: activeRole.value === 'admin' || activeRole.value === 'finance' },
      { id: 'inventory-record', label: '出入库记录', disabled: activeRole.value === 'admin', checked: activeRole.value === 'admin' || activeRole.value === 'finance' }
    ]
  },
  {
    id: 'report',
    label: '数据报表',
    disabled: activeRole.value === 'admin',
    checked: activeRole.value === 'admin' || activeRole.value === 'finance' || activeRole.value === 'sales',
    children: [
      { id: 'report-diff', label: '报货/送货差异表', disabled: activeRole.value === 'admin', checked: activeRole.value === 'admin' || activeRole.value === 'finance' },
      { id: 'report-receivable', label: '应收应付报表', disabled: activeRole.value === 'admin', checked: activeRole.value === 'admin' || activeRole.value === 'finance' || activeRole.value === 'sales' },
      { id: 'report-invoice', label: '开票报表', disabled: activeRole.value === 'admin', checked: activeRole.value === 'admin' || activeRole.value === 'finance' }
    ]
  },
  {
    id: 'system',
    label: '系统管理',
    disabled: activeRole.value !== 'admin',
    checked: activeRole.value === 'admin',
    children: [
      { id: 'system-user', label: '用户管理', disabled: activeRole.value !== 'admin', checked: activeRole.value === 'admin' },
      { id: 'system-role', label: '角色权限分配', disabled: activeRole.value !== 'admin', checked: activeRole.value === 'admin' },
      { id: 'system-log', label: '操作日志', disabled: activeRole.value !== 'admin', checked: activeRole.value === 'admin' }
    ]
  }
])

const handleRoleChange = () => {
  updateMenuTree()
}

const updateMenuTree = () => {
  const rolePermissions: Record<string, string[]> = {
    admin: ['dashboard', 'base', 'order', 'delivery', 'period', 'finance', 'inventory', 'report', 'system'],
    statistician: ['order', 'delivery', 'base'],
    finance: ['base', 'period', 'finance', 'inventory', 'report'],
    sales: ['dashboard', 'base', 'finance', 'report']
  }

  const permissions = rolePermissions[activeRole.value] || []

  menuTree.value = menuTree.value.map(menu => ({
    ...menu,
    disabled: activeRole.value === 'admin',
    checked: permissions.includes(menu.id),
    children: menu.children?.map(child => ({
      ...child,
      disabled: activeRole.value === 'admin',
      checked: permissions.includes(menu.id)
    })) || []
  }))
}

const handleCheck = (_checkedNodes: any, _indeterminateNodes: any) => {
}

const handleSave = () => {
  ElMessage.success('权限保存成功')
}

onMounted(() => {
  updateMenuTree()
})
</script>

<style scoped lang="scss">
.page-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.role-tabs {
  background: #fafafa;
  padding: 16px;
  border-radius: 8px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.permission-section {
  max-height: 500px;
  overflow-y: auto;
}

.mt-16 { margin-top: 16px; }
</style>