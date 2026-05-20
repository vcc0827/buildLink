<template>
  <div class="page-container">
    <div class="search-bar">
      <div class="search-group">
        <el-input
          v-model="queryForm.name"
          placeholder="项目名称"
          clearable
          class="search-input"
          @keyup.enter="handleQuery"
        />
        <el-select v-model="queryForm.reconciliationUnitId" placeholder="对账单位" clearable class="search-select">
          <el-option v-for="unit in unitOptions" :key="unit.id" :label="unit.companyName" :value="unit.id" />
        </el-select>
        <el-select v-model="queryForm.category" placeholder="所需材料" clearable class="search-select">
          <el-option v-for="cat in categoryOptions" :key="cat" :label="cat" :value="cat" />
        </el-select>
        <el-select v-model="queryForm.status" placeholder="状态" clearable class="search-select">
          <el-option value="active" label="启用" />
          <el-option value="inactive" label="禁用" />
        </el-select>
        <el-button type="primary" class="search-btn" @click="handleQuery">查询</el-button>
        <el-button class="reset-btn" @click="handleReset">重置</el-button>
      </div>
      <div class="action-btns">
        <el-button type="primary" class="add-btn" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新增项目
        </el-button>
      </div>
    </div>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column type="index" label="序号" width="80" align="center" />
      <el-table-column prop="name" label="项目名称" min-width="150" />
      <el-table-column prop="reconciliationUnitName" label="对账单位" width="150" />
      <el-table-column prop="category" label="所需材料" min-width="180" />
      <el-table-column prop="address" label="项目地址" min-width="200" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
            {{ row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="primary" link @click="handleView(row)">详情</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="mt-16"
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadData"
      @current-change="loadData"
    />

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="对账单位" prop="reconciliationUnitId">
          <el-select v-model="form.reconciliationUnitId" placeholder="请选择" clearable style="width: 100%">
            <el-option v-for="unit in unitOptions" :key="unit.id" :label="unit.companyName" :value="unit.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="所需材料" prop="category">
          <el-select v-model="form.category" multiple placeholder="请选择所需材料" style="width: 100%">
            <el-option v-for="cat in categoryOptions" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="form.contact" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="项目地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" title="项目详情" width="600px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="项目名称">{{ viewForm.name }}</el-descriptions-item>
        <el-descriptions-item label="对账单位">{{ viewForm.reconciliationUnitName }}</el-descriptions-item>
        <el-descriptions-item label="所需材料">{{ viewForm.category }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ viewForm.contact || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ viewForm.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="项目地址">{{ viewForm.address }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="viewForm.status === 'active' ? 'success' : 'danger'" size="small">
            {{ viewForm.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注">{{ viewForm.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { Customer, ReconciliationUnit } from '@/types'
import { customerApi, reconciliationUnitApi, productApi } from '@/api'

const loading = ref(false)
const tableData = ref<Customer[]>([])
const unitOptions = ref<ReconciliationUnit[]>([])
const categoryOptions = ref<string[]>([])
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const dialogTitle = computed(() => (form.id ? '编辑项目' : '新增项目'))

const queryForm = reactive({
  name: '',
  status: '',
  category: '',
  reconciliationUnitId: undefined
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formRef = ref()
const form = reactive<Partial<Customer>>({
  id: undefined,
  name: '',
  type: 'project',
  category: [] as string[],
  contact: '',
  phone: '',
  address: '',
  reconciliationUnitId: undefined,
  status: 'active',
  remark: ''
})

const viewForm = reactive<Partial<Customer>>({})

const rules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }]
}

const loadUnitOptions = async () => {
  try {
    const res = await reconciliationUnitApi.list({ page: 1, pageSize: 100 })
    unitOptions.value = res.data.list
  } catch {
    unitOptions.value = []
  }
}

const loadCategoryOptions = async () => {
  try {
    const res = await productApi.getCategories()
    categoryOptions.value = res.data
  } catch {
    categoryOptions.value = []
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      ...queryForm,
      type: 'project',
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await customerApi.list(params)
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch {
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  Object.assign(queryForm, { name: '', status: '', category: '', reconciliationUnitId: undefined })
  handleQuery()
}

const handleAdd = () => {
  Object.assign(form, {
    id: undefined, name: '', type: 'project', category: [], contact: '',
    phone: '', address: '', reconciliationUnitId: undefined, status: 'active', remark: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row: Customer) => {
  const categoryValue = row.category ? row.category.split(',').filter(Boolean) : []
  Object.assign(form, { ...row, category: categoryValue })
  dialogVisible.value = true
}

const handleView = (row: Customer) => {
  Object.assign(viewForm, row)
  viewDialogVisible.value = true
}

const handleDelete = async (row: Customer) => {
  await ElMessageBox.confirm('确认删除该项目吗？', '提示', { type: 'warning' })
  try {
    await customerApi.delete(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {
    ElMessage.error('删除失败')
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const { id, ...submitData } = {
    ...form,
    category: Array.isArray(form.category) ? form.category.join(',') : form.category
  }

  try {
    if (form.id) {
      await customerApi.update(form.id, submitData)
    } else {
      await customerApi.create({ ...submitData, type: 'project' })
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  loadUnitOptions()
  loadCategoryOptions()
  loadData()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.search-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.search-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 300px;
  height: 32px;
  border-radius: 4px;
  :deep(.el-input__wrapper) {
    border-radius: 4px;
    border: 1px solid #dcdfe6;
    box-shadow: none;
    &:hover {
      border-color: #2385bb;
    }
    &:focus {
      border-color: #2385bb;
    }
  }
}

.search-select {
  width: 160px;
  height: 32px;
  :deep(.el-select__wrapper) {
    border-radius: 4px;
    border: 1px solid #dcdfe6;
    box-shadow: none;
    &:hover {
      border-color: #2385bb;
    }
    &:focus {
      border-color: #2385bb;
    }
  }
}

.search-btn {
  height: 32px;
  border-radius: 4px;
  padding: 0 16px;
  font-weight: 500;
  background: #2385bb;
  border: none;
  :hover {
    background: #1f75a8;
  }
}

.reset-btn {
  height: 32px;
  border-radius: 4px;
  padding: 0 16px;
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-btn {
  height: 32px;
  padding: 0 16px;
  font-weight: 500;
  background: #2385bb;
  border: none;
  border-radius: 4px;
  :hover {
    background: #1f75a8;
  }
}

.data-table {
  border-radius: 4px;
}

.mb-16 {
  margin-bottom: 16px;
}

.mt-16 {
  margin-top: 16px;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
