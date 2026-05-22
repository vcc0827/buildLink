<template>
  <div class="page-container">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="进项发票" name="input" />
      <el-tab-pane label="销项发票" name="output" />
    </el-tabs>

    <div class="table-search">
      <el-form :model="queryForm" inline class="search-form">
        <el-form-item label="发票号码">
          <el-input v-model="queryForm.no" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="客商">
          <el-select v-model="queryForm.customerId" placeholder="请选择" clearable>
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="请选择" clearable>
            <el-option label="待收/待开" value="pending" />
            <el-option label="已收/已开" value="received" />
            <el-option label="已认证" value="verified" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="flex-between mb-16">
      <el-radio-group v-model="queryForm.status">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="pending">待处理</el-radio-button>
        <el-radio-button value="received">已收/开</el-radio-button>
        <el-radio-button value="verified">已认证</el-radio-button>
      </el-radio-group>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon> {{ activeTab === 'input' ? '登记进项发票' : '开具销项发票' }}
      </el-button>
    </div>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="no" label="发票号码" width="150" />
      <el-table-column prop="customerName" label="对方单位" width="150" />
      <el-table-column prop="invoiceDate" label="发票日期" width="110" />
      <el-table-column prop="amount" label="不含税金额" width="120" align="right">
        <template #default="{ row }"> ¥{{ row.amount?.toLocaleString() }} </template>
      </el-table-column>
      <el-table-column prop="taxAmount" label="税额" width="100" align="right">
        <template #default="{ row }"> ¥{{ row.taxAmount?.toLocaleString() }} </template>
      </el-table-column>
      <el-table-column prop="totalAmount" label="价税合计" width="120" align="right">
        <template #default="{ row }"> ¥{{ row.totalAmount?.toLocaleString() }} </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
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
            <el-form-item label="发票号码" prop="no">
              <el-input v-model="form.no" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发票日期" prop="invoiceDate">
              <el-date-picker v-model="form.invoiceDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
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
            <el-form-item label="不含税金额" prop="amount">
              <el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%" @change="calcTotal" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税额" prop="taxAmount">
              <el-input-number v-model="form.taxAmount" :min="0" :precision="2" style="width: 100%" @change="calcTotal" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="价税合计">
          <span class="total-amount">¥{{ (form.totalAmount || 0).toLocaleString() }}</span>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择">
            <el-option label="待收/待开" value="pending" />
            <el-option label="已收/已开" value="received" />
            <el-option label="已认证" value="verified" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
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
import type { Invoice, Customer } from '@/types'
import { invoiceApi } from '@/api'

const activeTab = ref<'input' | 'output'>('input')
const loading = ref(false)
const tableData = ref<Invoice[]>([])
const dialogVisible = ref(false)
const customers = ref<Customer[]>([])
const formRef = ref()

const queryForm = reactive({ no: '', customerId: undefined, status: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const form = reactive<Partial<Invoice>>({
  id: undefined, no: '', type: 'input', customerId: undefined, customerName: '',
  invoiceDate: '', amount: 0, taxAmount: 0, totalAmount: 0, status: 'pending', remark: ''
})

const dialogTitle = computed(() => activeTab.value === 'input' ? '登记进项发票' : '开具销项发票')

const rules = {
  no: [{ required: true, message: '请输入发票号码', trigger: 'blur' }],
  customerId: [{ required: true, message: '请选择对方单位', trigger: 'change' }]
}

watch(activeTab, (val) => {
  form.type = val === 'input' ? 'input' : 'output'
  loadData()
})

const getStatusType = (s: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    pending: 'warning',
    received: 'success',
    verified: 'info'
  }
  return map[s] || 'info'
}
const getStatusText = (s: string) => ({ pending: '待收/待开', received: '已收/已开', verified: '已认证' }[s] || s)

const onCustomerChange = (id: number) => {
  const c = customers.value.find(x => x.id === id)
  if (c) form.customerName = c.name
}

const calcTotal = () => {
  form.totalAmount = (form.amount || 0) + (form.taxAmount || 0)
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await invoiceApi.list({ ...queryForm, type: activeTab.value, ...pagination })
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch {
    tableData.value = [
      { id: 1, no: 'FP-2024-001', type: 'input', customerId: 1, customerName: '浙江建材有限公司', invoiceDate: '2024-05-15', amount: 220690, taxAmount: 28690, totalAmount: 249380, status: 'received', verifyStatus: 'verified', cancelStatus: 'uncancelled', createdAt: '2024-05-15', updatedAt: '2024-05-15' }
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
const handleReset = () => { Object.assign(queryForm, { no: '', customerId: undefined, status: '' }); handleQuery() }

const handleAdd = () => {
  Object.assign(form, { id: undefined, no: '', type: activeTab.value === 'input' ? 'input' : 'output', customerId: undefined, customerName: '', invoiceDate: '', amount: 0, taxAmount: 0, totalAmount: 0, status: 'pending', remark: '' })
  dialogVisible.value = true
}

const handleView = (row: Invoice) => { Object.assign(form, row); dialogVisible.value = true }

const handleDelete = async (row: Invoice) => {
  await ElMessageBox.confirm('确认删除该发票吗？', '提示', { type: 'warning' })
  try { await invoiceApi.delete(row.id); ElMessage.success('删除成功') }
  catch { ElMessage.success('删除成功（模拟）') }
  loadData()
}

const handleSubmit = async () => {
  calcTotal()
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  try {
    if (form.id) { await invoiceApi.update(form.id, form) }
    else { await invoiceApi.create(form) }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch { ElMessage.success('保存成功（模拟）'); dialogVisible.value = false; loadData() }
}

loadData()
loadCustomers()
</script>

<style scoped lang="scss">
.total-amount { font-size: 18px; font-weight: 600; color: #409eff; }
</style>
