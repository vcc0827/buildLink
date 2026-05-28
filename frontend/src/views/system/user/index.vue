<template>
  <div class="page-container">
    <div class="search-bar mb-16">
      <el-input v-model="queryForm.username" placeholder="用户名" style="width: 200px" />
      <el-select v-model="queryForm.role" placeholder="角色" clearable style="width: 120px">
        <el-option label="超级管理员" value="admin" />
        <el-option label="统计员" value="statistician" />
        <el-option label="财务" value="finance" />
        <el-option label="销售经理" value="sales" />
      </el-select>
      <el-button type="primary" @click="handleQuery">查询</el-button>
    </div>

    <div class="flex-between mb-16">
      <div>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete">
          批量删除 ({{ selectedRows.length }})
        </el-button>
      </div>
      <div>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新增用户
        </el-button>
      </div>
    </div>

    <el-table :data="tableData" border stripe v-loading="loading" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" />
      <el-table-column prop="username" label="用户名" width="150" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="role" label="角色" width="120">
        <template #default="{ row }">
          <el-tag :type="getRoleTagType(row.role)" size="small">{{ getRoleText(row.role) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="email" label="邮箱" width="180" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-switch v-model="row.status" :active-value="'active'" :inactive-value="'inactive'" @change="handleStatusChange(row)" />
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="160" />
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="success" link @click="handleResetPwd(row)">重置密码</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="mt-16" v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" />

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role">
            <el-option label="超级管理员" value="admin" />
            <el-option label="统计员" value="statistician" />
            <el-option label="财务" value="finance" />
            <el-option label="销售经理" value="sales" />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item v-if="!form.id" label="密码" prop="password">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const dialogVisible = ref(false)
const formRef = ref()
const selectedRows = ref<any[]>([])

const queryForm = reactive({
  username: '',
  role: ''
})

const pagination = reactive({ page: 1, pageSize: 10, total: 50 })

const tableData = ref([
  { id: 1, username: 'admin', nickname: '管理员', role: 'admin', email: 'admin@example.com', phone: '13800138000', status: 'active', createdAt: '2024-01-01 10:00:00' },
  { id: 2, username: 'stat', nickname: '统计员小王', role: 'statistician', email: 'stat@example.com', phone: '13800138001', status: 'active', createdAt: '2024-01-05 14:30:00' },
  { id: 3, username: 'finance', nickname: '财务小李', role: 'finance', email: 'finance@example.com', phone: '13800138002', status: 'active', createdAt: '2024-01-08 09:15:00' },
  { id: 4, username: 'sales', nickname: '销售张经理', role: 'sales', email: 'sales@example.com', phone: '13800138003', status: 'active', createdAt: '2024-01-10 16:45:00' },
  { id: 5, username: 'test', nickname: '测试用户', role: 'statistician', email: 'test@example.com', phone: '', status: 'inactive', createdAt: '2024-01-15 11:20:00' }
])

const form = reactive({
  id: undefined as number | undefined,
  username: '',
  nickname: '',
  role: 'statistician',
  email: '',
  phone: '',
  password: '',
  status: 'active',
  createdAt: ''
})

const dialogTitle = computed(() => (form.id ? '编辑用户' : '新增用户'))

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const getRoleTagType = (role: string): 'success' | 'warning' | 'info' | 'danger' => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
    admin: 'danger',
    statistician: 'info',
    finance: 'success',
    sales: 'warning'
  }
  return map[role] || 'info'
}

const getRoleText = (role: string) => ({
  admin: '超级管理员',
  statistician: '统计员',
  finance: '财务',
  sales: '销售经理'
}[role] || role)

const handleQuery = () => {
  pagination.page = 1
}

const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows
}

const handleAdd = () => {
  Object.assign(form, { id: undefined, username: '', nickname: '', role: 'statistician', email: '', phone: '', password: '' })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  Object.assign(form, { ...row, password: '' })
  dialogVisible.value = true
}

const handleDelete = async (row: any) => {
  if (row.username === 'admin') {
    ElMessage.warning('不能删除管理员账户')
    return
  }
  await ElMessageBox.confirm('确认删除该用户吗？', '提示', { type: 'warning' })
  try {
    tableData.value = tableData.value.filter(item => item.id !== row.id)
    ElMessage.success('删除成功')
  } catch {
    ElMessage.error('删除失败')
  }
}

const handleBatchDelete = async () => {
  if (selectedRows.value.some(row => row.username === 'admin')) {
    ElMessage.warning('不能删除管理员账户')
    return
  }
  await ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 个用户吗？`, '提示', { type: 'warning' })
  try {
    const ids = selectedRows.value.map(row => row.id)
    tableData.value = tableData.value.filter(item => !ids.includes(item.id))
    selectedRows.value = []
    ElMessage.success('批量删除成功')
  } catch {
    ElMessage.error('批量删除失败')
  }
}

const handleResetPwd = async (_row: any) => {
  await ElMessageBox.confirm('确认重置该用户密码吗？重置后密码为123456', '提示', { type: 'warning' })
  ElMessage.success('密码重置成功，新密码为123456')
}

const handleStatusChange = (row: any) => {
  if (row.username === 'admin') {
    row.status = 'active'
    ElMessage.warning('管理员账户不能禁用')
    return
  }
  ElMessage.success(row.status === 'active' ? '已启用' : '已禁用')
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    if (form.id !== undefined) {
      const index = tableData.value.findIndex(item => item.id === form.id)
      if (index !== -1) {
        tableData.value[index] = { ...tableData.value[index], ...form } as any
      }
    } else {
      const newId = Date.now()
      tableData.value.push({
        ...form,
        id: newId,
        status: 'active',
        createdAt: new Date().toLocaleString()
      })
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
  } catch {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
})
</script>

<style scoped lang="scss">
.page-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.search-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mt-16 { margin-top: 16px; }
.mb-16 { margin-bottom: 16px; }
</style>