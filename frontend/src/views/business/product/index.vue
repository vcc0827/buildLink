<template>
  <div class="page-container">
    <div class="search-bar">
      <div class="search-group">
        <el-input
          v-model="queryForm.name"
          placeholder="产品名称"
          clearable
          class="search-input"
          @keyup.enter="handleQuery"
        />
        <el-select v-model="queryForm.status" placeholder="状态" clearable class="search-select">
          <el-option value="active" label="启用" />
          <el-option value="inactive" label="禁用" />
        </el-select>
        <el-button type="primary" class="search-btn" @click="handleQuery">查询</el-button>
        <el-button class="reset-btn" @click="handleReset">重置</el-button>
      </div>
      <div class="action-btns">
        <el-button type="primary" class="add-btn" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新增产品
        </el-button>
      </div>
    </div>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="name" label="产品名称" min-width="150" />
      <el-table-column prop="model" label="型号" width="120" />
      <el-table-column prop="spec" label="规格" width="150" />
      <el-table-column prop="unit" label="计量单位" width="100" />
      <el-table-column prop="pricingType" label="计价类型" width="120">
        <template #default="{ row }">
          <el-tag :type="row.pricingType === 'info_price' ? 'primary' : 'success'" size="small">
            {{ row.pricingType === 'info_price' ? '信息价' : '固定价' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
            {{ row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
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
        <el-form-item label="产品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="计量单位" prop="unit">
          <el-select v-model="form.unit" placeholder="请选择" style="width: 100%">
            <el-option label="吨" value="吨" />
            <el-option label="m³" value="m³" />
            <el-option label="㎡" value="㎡" />
            <el-option label="块" value="块" />
            <el-option label="米" value="米" />
            <el-option label="千克" value="千克" />
            <el-option label="件" value="件" />
          </el-select>
        </el-form-item>
        <el-form-item label="型号" prop="model">
          <el-input v-model="form.model" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="规格" prop="spec">
          <el-input v-model="form.spec" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="计价类型" prop="pricingType">
          <el-radio-group v-model="form.pricingType">
            <el-radio value="fixed_price">固定价</el-radio>
            <el-radio value="info_price">信息价</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
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
import type { Product } from '@/types'
import { productApi } from '@/api'

const loading = ref(false)
const tableData = ref<Product[]>([])
const dialogVisible = ref(false)
const dialogTitle = computed(() => (form.id ? '编辑产品' : '新增产品'))

const queryForm = reactive({
  name: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formRef = ref()
const form = reactive<Partial<Product>>({
  id: undefined,
  name: '',
  unit: '',
  model: '',
  spec: '',
  pricingType: 'fixed_price',
  status: 'active',
  remark: ''
})

const rules = {
  name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  unit: [{ required: true, message: '请选择计量单位', trigger: 'change' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const params = { ...queryForm, page: pagination.page, pageSize: pagination.pageSize }
    const res = await productApi.list(params)
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
  Object.assign(queryForm, { name: '', status: '' })
  handleQuery()
}

const handleAdd = () => {
  Object.assign(form, {
    id: undefined, name: '', unit: '', model: '', spec: '', pricingType: 'fixed_price', status: 'active', remark: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row: Product) => {
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleDelete = async (row: Product) => {
  await ElMessageBox.confirm('确认删除该产品吗？', '提示', { type: 'warning' })
  try {
    await productApi.delete(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {
    ElMessage.error('删除失败')
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    if (form.id) {
      await productApi.update(form.id, form)
    } else {
      await productApi.create(form)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
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
