<template>
  <div class="page-container">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="付款登记" name="payment" />
      <el-tab-pane label="回款登记" name="receivable" />
    </el-tabs>

    <div class="table-search">
      <el-form :model="queryForm" inline class="search-form">
        <el-form-item label="单据号">
          <el-input v-model="queryForm.no" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="客商">
          <el-select v-model="queryForm.customerId" placeholder="请选择" clearable>
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
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
        <el-icon><Plus /></el-icon> {{ activeTab === 'payment' ? '登记付款' : '登记回款' }}
      </el-button>
    </div>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="no" label="单据号" width="150" />
      <el-table-column prop="customerName" label="对方单位" width="150" />
      <el-table-column prop="bank" label="银行" width="120" />
      <el-table-column prop="account" label="账号" width="180" />
      <el-table-column prop="amount" label="金额" width="120" align="right">
        <template #default="{ row }"> ¥{{ row.amount?.toLocaleString() }} </template>
      </el-table-column>
      <el-table-column prop="paymentDate" label="日期" width="110" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'confirmed' ? 'success' : 'warning'" size="small">
            {{ row.status === 'confirmed' ? '已确认' : '待确认' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleView(row)">查看</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="单据号" prop="no">
              <el-input v-model="form.no" placeholder="系统自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="日期" prop="paymentDate">
              <el-date-picker v-model="form.paymentDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="对方单位" prop="customerId">
          <el-select v-model="form.customerId" placeholder="请选择" @change="onCustomerChange">
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开户银行" prop="bank">
              <el-input v-model="form.bank" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="银行账号" prop="account">
              <el-input v-model="form.account" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择">
            <el-option label="待确认" value="pending" />
            <el-option label="已确认" value="confirmed" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" rows="2" />
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
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { Payment, Customer } from '@/types'
import { paymentApi } from '@/api'

const activeTab = ref<'payment' | 'receivable'>('payment')
const loading = ref(false)
const tableData = ref<Payment[]>([])
const dialogVisible = ref(false)
const customers = ref<Customer[]>([])
const formRef = ref()

const queryForm = reactive({ no: '', customerId: undefined })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const form = reactive<Partial<Payment>>({
  id: undefined, no: '', type: 'payment', customerId: undefined, customerName: '',
  bank: '', account: '', amount: 0, paymentDate: '', status: 'pending', remark: ''
})

const dialogTitle = computed(() => activeTab.value === 'payment' ? '登记付款' : '登记回款')

watch(activeTab, (val) => {
  form.type = val === 'payment' ? 'payment' : 'receivable'
  loadData()
})

const rules = {
  customerId: [{ required: true, message: '请选择对方单位', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }]
}

const onCustomerChange = (id: number) => {
  const c = customers.value.find(x => x.id === id)
  if (c) form.customerName = c.name
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await paymentApi.list({ ...queryForm, type: activeTab.value, ...pagination })
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch {
    tableData.value = [
      { id: 1, no: 'FK-2024-001', type: 'payment', customerId: 1, customerName: '浙江建材有限公司', bank: '工商银行', account: '6222021234567890', amount: 249380, paymentDate: '2024-05-20', status: 'confirmed', createdAt: '2024-05-20', updatedAt: '2024-05-20' }
    ]
    pagination.total = 1
  } finally {
    loading.value = false
  }
}

const loadCustomers = () => {
  customers.value = [
    { id: 1, name: '浙江建材有限公司', type: 'supplier', status: 'active', createdAt: '', updatedAt: '' },
    { id: 2, name: '上海工地项目部', type: 'project', status: 'active', createdAt: '', updatedAt: '' }
  ]
}

const handleQuery = () => { pagination.page = 1; loadData() }
const handleReset = () => { Object.assign(queryForm, { no: '', customerId: undefined }); handleQuery() }

const handleAdd = () => {
  Object.assign(form, { id: undefined, no: '', type: activeTab.value === 'payment' ? 'payment' : 'receivable', customerId: undefined, customerName: '', bank: '', account: '', amount: 0, paymentDate: '', status: 'pending', remark: '' })
  dialogVisible.value = true
}

const handleView = (row: Payment) => { Object.assign(form, row); dialogVisible.value = true }

const handleDelete = async (row: Payment) => {
  await ElMessageBox.confirm('确认删除该记录吗？', '提示', { type: 'warning' })
  try { await paymentApi.delete(row.id); ElMessage.success('删除成功') }
  catch { ElMessage.success('删除成功（模拟）') }
  loadData()
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  try {
    if (form.id) { await paymentApi.update(form.id, form) }
    else { await paymentApi.create(form) }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch { ElMessage.success('保存成功（模拟）'); dialogVisible.value = false; loadData() }
}

loadData()
loadCustomers()
</script>
