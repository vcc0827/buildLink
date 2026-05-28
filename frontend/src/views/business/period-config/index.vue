<template>
  <div class="page-container">
    <div class="flex-between mb-16">
      <h3 class="page-title">周期配置</h3>
      <div>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新增配置
        </el-button>
      </div>
    </div>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="name" label="周期名称" width="150" />
      <el-table-column prop="cycleType" label="周期类型" width="120">
        <template #default="{ row }">
          <el-tag :type="row.cycleType === 'monthly' ? 'primary' : row.cycleType === 'quarterly' ? 'warning' : 'success'" size="small">
            {{ row.cycleType === 'monthly' ? '月度' : row.cycleType === 'quarterly' ? '季度' : '年度' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="dayOfMonth" label="对账日" width="100" />
      <el-table-column prop="startDate" label="开始日期" width="120" />
      <el-table-column prop="endDate" label="结束日期" width="120" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'warning'" size="small">
            {{ row.status === 'active' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="周期名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="周期类型" prop="cycleType">
          <el-select v-model="form.cycleType">
            <el-option label="月度" value="monthly" />
            <el-option label="季度" value="quarterly" />
            <el-option label="年度" value="yearly" />
          </el-select>
        </el-form-item>
        <el-form-item label="对账日" prop="dayOfMonth">
          <el-input-number v-model="form.dayOfMonth" :min="1" :max="28" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="'active'" :inactive-value="'inactive'" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const dialogVisible = ref(false)
const formRef = ref()

const tableData = ref([
  { id: 1, name: '月度对账', cycleType: 'monthly', dayOfMonth: 25, startDate: '2024-01-01', endDate: '2024-12-31', status: 'active' },
  { id: 2, name: '季度对账', cycleType: 'quarterly', dayOfMonth: 25, startDate: '2024-01-01', endDate: '2024-12-31', status: 'active' },
  { id: 3, name: '年度对账', cycleType: 'yearly', dayOfMonth: 25, startDate: '2024-01-01', endDate: '2024-12-31', status: 'inactive' }
])

const dialogTitle = computed(() => (form.id ? '编辑周期配置' : '新增周期配置'))

const form = reactive({
  id: undefined as number | undefined,
  name: '',
  cycleType: 'monthly',
  dayOfMonth: 25,
  startDate: '',
  endDate: '',
  status: 'active'
})

const rules = {
  name: [{ required: true, message: '请输入周期名称', trigger: 'blur' }],
  cycleType: [{ required: true, message: '请选择周期类型', trigger: 'change' }],
  dayOfMonth: [{ required: true, message: '请输入对账日', trigger: 'blur' }]
}

const handleAdd = () => {
  Object.assign(form, { id: undefined, name: '', cycleType: 'monthly', dayOfMonth: 25, status: 'active' })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm('确认删除该周期配置吗？', '提示', { type: 'warning' })
  try {
    tableData.value = tableData.value.filter(item => item.id !== row.id)
    ElMessage.success('删除成功')
  } catch {
    ElMessage.error('删除失败')
  }
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
        startDate: '2024-01-01',
        endDate: '2024-12-31'
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

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mb-16 { margin-bottom: 16px; }
</style>