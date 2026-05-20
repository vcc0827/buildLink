<template>
  <div class="page-container">
    <div class="table-search">
      <el-form :model="queryForm" inline class="search-form">
        <el-form-item label="核销类型">
          <el-select v-model="queryForm.type" placeholder="请选择" clearable>
            <el-option label="上游核销" value="upstream" />
            <el-option label="下游核销" value="downstream" />
          </el-select>
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
      <el-button type="primary" @click="handleAutoReconcile">
        <el-icon><Refresh /></el-icon> 智能核销
      </el-button>
    </div>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="no" label="核销单号" width="150" />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.type === 'upstream' ? 'success' : 'warning'" size="small">
            {{ row.type === 'upstream' ? '上游' : '下游' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="customerName" label="客商" width="150" />
      <el-table-column prop="statementId" label="对账单" width="120">
        <template #default="{ row }">
          <el-button type="primary" link @click="viewStatement(row)">查看</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="invoiceId" label="发票" width="120">
        <template #default="{ row }">
          <el-button type="primary" link v-if="row.invoiceId" @click="viewInvoice(row)">查看</el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="paymentId" label="收付款" width="120">
        <template #default="{ row }">
          <el-button type="primary" link v-if="row.paymentId" @click="viewPayment(row)">查看</el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="amount" label="核销金额" width="120" align="right">
        <template #default="{ row }"> ¥{{ row.amount?.toLocaleString() }} </template>
      </el-table-column>
      <el-table-column prop="reconcileDate" label="核销日期" width="110" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleView(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="智能核销" width="600px" destroy-on-close>
      <el-form :model="reconcileForm" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="核销类型" prop="type">
          <el-select v-model="reconcileForm.type" placeholder="请选择">
            <el-option label="上游核销" value="upstream" />
            <el-option label="下游核销" value="downstream" />
          </el-select>
        </el-form-item>
        <el-form-item label="客商" prop="customerId">
          <el-select v-model="reconcileForm.customerId" placeholder="请选择">
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-alert type="info" :closable="false">
          系统将自动匹配该客商下的未核销对账单、发票和收付款记录进行关联核销
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleReconcile">执行核销</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import type { Reconciliation, Customer } from '@/types'
import { reconciliationApi } from '@/api'

const loading = ref(false)
const tableData = ref<Reconciliation[]>([])
const dialogVisible = ref(false)
const customers = ref<Customer[]>([])
const formRef = ref()

const queryForm = reactive({ type: '', customerId: undefined })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const reconcileForm = reactive({ type: 'upstream', customerId: undefined })
const rules = {
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  customerId: [{ required: true, message: '请选择客商', trigger: 'change' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await reconciliationApi.list({ ...queryForm, ...pagination })
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch {
    tableData.value = [
      { id: 1, no: 'HX-2024-001', type: 'upstream', customerId: 1, customerName: '浙江建材有限公司', statementId: 1, invoiceId: 1, paymentId: 1, amount: 249380, reconcileDate: '2024-05-21', status: 'confirmed', createdAt: '2024-05-21' }
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
const handleReset = () => { Object.assign(queryForm, { type: '', customerId: undefined }); handleQuery() }
const handleAutoReconcile = () => { Object.assign(reconcileForm, { type: 'upstream', customerId: undefined }); dialogVisible.value = true }

const handleReconcile = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  try {
    await reconciliationApi.autoReconcile({ type: reconcileForm.type, customerId: reconcileForm.customerId! })
    ElMessage.success('核销成功')
    dialogVisible.value = false
    loadData()
  } catch { ElMessage.success('核销成功（模拟）'); dialogVisible.value = false; loadData() }
}

const handleView = (row: Reconciliation) => ElMessage.info('查看核销单：' + row.no)
const viewStatement = (row: Reconciliation) => ElMessage.info('查看对账单 ID：' + row.statementId)
const viewInvoice = (row: Reconciliation) => ElMessage.info('查看发票 ID：' + row.invoiceId)
const viewPayment = (row: Reconciliation) => ElMessage.info('查看收付款 ID：' + row.paymentId)

loadData()
loadCustomers()
</script>
