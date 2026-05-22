<template>
  <div class="page-container">
    <div class="search-bar">
      <div class="search-group">
        <el-input
          v-model="queryForm.name"
          placeholder="厂家名称"
          clearable
          class="search-input"
          @keyup.enter="handleQuery"
        />
        <el-select v-model="queryForm.category" placeholder="主营品类" clearable class="search-select">
          <el-option value="砂浆" label="砂浆" />
          <el-option value="蒸压加气混凝土砌块" label="蒸压加气混凝土砌块" />
          <el-option value="供销商" label="供销商" />
        </el-select>
        <el-select v-model="queryForm.status" placeholder="状态" clearable class="search-select">
          <el-option value="active" label="启用" />
          <el-option value="inactive" label="禁用" />
        </el-select>
        <el-button type="primary" class="search-btn" @click="handleQuery">查询</el-button>
        <el-button class="reset-btn" @click="handleReset">重置</el-button>
      </div>
      <div class="action-btns">
        <!-- <el-button type="primary" class="export-btn" @click="handleExport">下载</el-button> -->
        <el-button type="primary" class="add-btn" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新增厂家
        </el-button>
      </div>
    </div>

    <el-table :data="tableData" v-loading="loading" class="data-table">
      <el-table-column prop="name" label="厂家名称" min-width="150" />
      <el-table-column prop="category" label="主营品类" min-width="200">
        <template #default="{ row }">
          {{ row.category || '-' }}
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
        <el-form-item label="厂家名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="主营品类" prop="category">
          <el-select v-model="form.category" placeholder="请选择主营品类" style="width: 100%">
            <el-option value="砂浆" label="砂浆" />
            <el-option value="蒸压加气混凝土砌块" label="蒸压加气混凝土砌块" />
            <el-option value="供销商" label="供销商" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="form.contact" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="开户银行" prop="bank">
          <el-input v-model="form.bank" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="银行账号" prop="account">
          <el-input v-model="form.account" placeholder="请输入" />
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

import type { Customer } from '@/types'
import { customerApi } from '@/api'

const loading = ref(false)
const tableData = ref<Customer[]>([])
const dialogVisible = ref(false)
const dialogTitle = computed(() => (form.id ? '编辑厂家' : '新增厂家'))

const queryForm = reactive({
  name: '',
  category: '',
  status: ''
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
  type: 'supplier',
  category: '',
  contact: '',
  phone: '',
  address: '',
  bank: '',
  account: '',
  status: 'active',
  remark: ''
})

const rules = {
  name: [{ required: true, message: '请输入厂家名称', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const params = { ...queryForm, type: 'supplier', page: pagination.page, pageSize: pagination.pageSize }
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
  Object.assign(queryForm, { name: '', category: '', status: '' })
  handleQuery()
}

const handleAdd = () => {
  Object.assign(form, {
    id: undefined, name: '', type: 'supplier', category: '', contact: '',
    phone: '', address: '', bank: '', account: '', status: 'active', remark: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row: Customer) => {
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleDelete = async (row: Customer) => {
  await ElMessageBox.confirm('确认删除该厂家吗？', '提示', { type: 'warning' })
  try {
    await customerApi.delete(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {
    ElMessage.error('删除失败')
  }
}

const handleView = (row: Customer) => {
  handleEdit(row)
}



const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    if (form.id) {
      await customerApi.update(form.id, form)
    } else {
      await customerApi.create({ ...form, type: 'supplier' })
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

<style scoped lang="scss">
.page-container {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
  min-height: calc(100vh - 140px);
}

.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.export-btn {
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
  :deep(.el-table) {
    border: 1px solid #e8e8e8;
    border-radius: 4px;
  }
  :deep(.el-table th) {
    background-color: #f7f8fa;
    font-weight: 600;
    color: #333;
    border-bottom: 2px solid #e8e8e8;
    padding: 12px 8px;
  }
  :deep(.el-table td) {
    border-bottom: 1px solid #f0f0f0;
    padding: 12px 8px;
    color: #666;
  }
  :deep(.el-table--border) {
    --el-table-border-color: #e8e8e8;
  }
}

.view-btn {
  padding: 4px 12px;
  font-size: 12px;
  background: #2385bb;
  border: none;
  border-radius: 4px;
  :hover {
    background: #1f75a8;
  }
}

.mt-16 {
  margin-top: 16px;
}
</style>
