<template>
  <div class="page-container">
    <div class="search-bar">
      <div class="search-group">
        <el-input
          v-model="queryForm.companyName"
          placeholder="公司名称"
          clearable
          class="search-input"
          @keyup.enter="handleQuery"
        />
        <el-input
          v-model="queryForm.projectName"
          placeholder="项目名称"
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
          <el-icon><Plus /></el-icon> 新增对账单位
        </el-button>
      </div>
    </div>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="companyName" label="公司名称" min-width="200" />
      <el-table-column prop="projectName" label="项目名称" min-width="200" />
      <el-table-column prop="contact" label="联系人" width="100" />
      <el-table-column prop="phone" label="联系电话" width="130" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
            {{ row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleView(row)">查看</el-button>
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
        <el-form-item label="公司名称" prop="companyName">
          <el-input v-model="form.companyName" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="项目名称" prop="projectName">
          <el-input v-model="form.projectName" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="纳税人识别号" prop="taxNumber">
          <el-input v-model="form.taxNumber" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="form.contact" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="开户银行名称" prop="bankName">
          <el-input v-model="form.bankName" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="银行账号" prop="bankAccount">
          <el-input v-model="form.bankAccount" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="联行号" prop="bankCode">
          <el-input v-model="form.bankCode" placeholder="请输入" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

import { reconciliationUnitApi } from '@/api'

const loading = ref(false)
const tableData = ref<any[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增对账单位')

const queryForm = reactive({
  companyName: '',
  projectName: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formRef = ref()
const form = reactive<any>({
  id: undefined,
  companyName: '',
  projectName: '',
  taxNumber: '',
  address: '',
  phone: '',
  contact: '',
  bankName: '',
  bankAccount: '',
  bankCode: '',
  status: 'active',
  remark: ''
})

const rules = {
  companyName: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
  projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const params = { ...queryForm, page: pagination.page, pageSize: pagination.pageSize }
    const res = await reconciliationUnitApi.list(params)
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
  Object.assign(queryForm, { companyName: '', projectName: '', status: '' })
  handleQuery()
}

const handleAdd = () => {
  Object.assign(form, {
    id: undefined, companyName: '', projectName: '', taxNumber: '',
    address: '', phone: '', contact: '', bankName: '', bankAccount: '',
    bankCode: '', status: 'active', remark: ''
  })
  dialogTitle.value = '新增对账单位'
  dialogVisible.value = true
}

const handleView = (row: any) => {
  Object.assign(form, {
    id: row.id, companyName: row.companyName, projectName: row.projectName,
    taxNumber: row.taxNumber, address: row.address, phone: row.phone,
    contact: row.contact, bankName: row.bankName, bankAccount: row.bankAccount,
    bankCode: row.bankCode, status: row.status, remark: row.remark
  })
  dialogTitle.value = '查看对账单位'
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  Object.assign(form, {
    id: row.id, companyName: row.companyName, projectName: row.projectName,
    taxNumber: row.taxNumber, address: row.address, phone: row.phone,
    contact: row.contact, bankName: row.bankName, bankAccount: row.bankAccount,
    bankCode: row.bankCode, status: row.status, remark: row.remark
  })
  dialogTitle.value = '编辑对账单位'
  dialogVisible.value = true
}

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm('确认删除该对账单位吗？', '提示', { type: 'warning' })
  try {
    await reconciliationUnitApi.delete(row.id)
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
      await reconciliationUnitApi.update(form.id, form)
    } else {
      await reconciliationUnitApi.create(form)
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
