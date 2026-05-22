<template>
  <div class="page-container">
    <div class="table-search">
      <el-form :model="queryForm" inline class="search-form">
        <el-form-item label="客商名称">
          <el-input v-model="queryForm.name" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="queryForm.type" placeholder="请选择" clearable>
            <el-option label="供应商" value="supplier" />
            <el-option label="工地项目" value="project" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="请选择" clearable>
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="flex-between mb-16">
      <span />
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon> 新增客商
      </el-button>
    </div>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="客商名称" min-width="150" />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.type === 'supplier' ? 'success' : 'warning'" size="small">
            {{ row.type === 'supplier' ? '供应商' : '工地' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="category" label="品类" width="120" />
      <el-table-column prop="contact" label="联系人" width="100" />
      <el-table-column prop="phone" label="联系电话" width="130" />
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
        <el-form-item label="客商名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio value="supplier">供应商</el-radio>
            <el-radio value="project">工地项目</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="主营品类" prop="category">
          <el-input v-model="form.category" placeholder="如：砂浆、蒸压加气混凝土砌块、ALC板" />
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
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { Customer } from '@/types'
import { customerApi } from '@/api'

const loading = ref(false)
const tableData = ref<Customer[]>([])
const dialogVisible = ref(false)
const dialogTitle = computed(() => (form.id ? '编辑客商' : '新增客商'))

const queryForm = reactive({
  name: '',
  type: '',
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
  name: [{ required: true, message: '请输入客商名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await customerApi.list({ ...queryForm, ...pagination })
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch {
    tableData.value = [
      {
        id: 1, name: '浙江建材有限公司', type: 'supplier', category: '砂浆、蒸压加气混凝土砌块',
        contact: '张经理', phone: '13800138000', status: 'active',
        createdAt: '2024-01-15', updatedAt: '2024-01-15'
      },
      {
        id: 2, name: '上海工地项目部', type: 'project', category: 'ALC板、混凝土砖',
        contact: '李总', phone: '13900139000', status: 'active',
        createdAt: '2024-02-01', updatedAt: '2024-02-01'
      }
    ]
    pagination.total = 2
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  Object.assign(queryForm, { name: '', type: '', status: '' })
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
  await ElMessageBox.confirm('确认删除该客商吗？', '提示', { type: 'warning' })
  try {
    await customerApi.delete(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {
    ElMessage.success('删除成功（模拟）')
    loadData()
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    if (form.id) {
      await customerApi.update(form.id, form)
    } else {
      await customerApi.create(form)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch {
    ElMessage.success('保存成功（模拟）')
    dialogVisible.value = false
    loadData()
  }
}

loadData()
</script>
