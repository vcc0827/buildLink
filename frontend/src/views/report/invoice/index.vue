<template>
  <div class="page-container">
    <div class="search-bar mb-16">
      <el-date-picker v-model="queryForm.startDate" type="date" value-format="YYYY-MM-DD" style="width: 150px" placeholder="开始日期" />
      <el-date-picker v-model="queryForm.endDate" type="date" value-format="YYYY-MM-DD" style="width: 150px" placeholder="结束日期" />
      <el-select v-model="queryForm.status" placeholder="开票状态" clearable style="width: 120px">
        <el-option label="已开票" value="invoiced" />
        <el-option label="未开票" value="uninvoiced" />
      </el-select>
      <el-select v-model="queryForm.type" placeholder="发票类型" clearable style="width: 120px">
        <el-option label="专票" value="special" />
        <el-option label="普票" value="normal" />
      </el-select>
      <el-button type="primary" @click="handleQuery">查询</el-button>
      <el-button type="success" @click="handleExport">导出</el-button>
    </div>

    <el-card class="mb-16">
      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-label">单据总数</span>
          <span class="summary-value">{{ summary.totalCount }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">已开票金额</span>
          <span class="summary-value">¥{{ formatMoney(summary.invoicedAmount) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">未开票金额</span>
          <span class="summary-value warning">¥{{ formatMoney(summary.uninvoicedAmount) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">开票率</span>
          <span class="summary-value">{{ summary.invoiceRate }}%</span>
        </div>
      </div>
    </el-card>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="deliveryNo" label="送货单号" width="150" />
      <el-table-column prop="invoiceNo" label="发票号" width="180" />
      <el-table-column prop="customerName" label="项目名称" min-width="150" />
      <el-table-column prop="amount" label="金额" width="120" align="right">
        <template #default="{ row }">¥{{ row.amount?.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="invoiceAmount" label="开票金额" width="120" align="right">
        <template #default="{ row }">¥{{ row.invoiceAmount?.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="invoiceDate" label="开票日期" width="120" />
      <el-table-column prop="invoiceType" label="发票类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.invoiceType === 'special' ? 'primary' : 'info'" size="small">
            {{ row.invoiceType === 'special' ? '专票' : '普票' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'invoiced' ? 'success' : 'warning'" size="small">
            {{ row.status === 'invoiced' ? '已开票' : '未开票' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button v-if="row.status === 'uninvoiced'" type="success" link @click="handleInvoice(row)">开票</el-button>
          <el-button type="primary" link @click="handleView(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="mt-16" v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" />

    <el-dialog v-model="invoiceDialogVisible" title="开具发票" width="500px">
      <el-form ref="invoiceFormRef" :model="invoiceForm" :rules="invoiceRules" label-width="100px">
        <el-form-item label="发票号" prop="invoiceNo">
          <el-input v-model="invoiceForm.invoiceNo" />
        </el-form-item>
        <el-form-item label="发票类型" prop="invoiceType">
          <el-select v-model="invoiceForm.invoiceType">
            <el-option label="专票" value="special" />
            <el-option label="普票" value="normal" />
          </el-select>
        </el-form-item>
        <el-form-item label="开票日期" prop="invoiceDate">
          <el-date-picker v-model="invoiceForm.invoiceDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="开票金额" prop="invoiceAmount">
          <el-input-number v-model="invoiceForm.invoiceAmount" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="invoiceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleInvoiceSubmit">确认开票</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'

const loading = ref(false)
const invoiceDialogVisible = ref(false)
const invoiceFormRef = ref()

const queryForm = reactive({
  startDate: '',
  endDate: '',
  status: '',
  type: ''
})

const invoiceForm = reactive({
  invoiceNo: '',
  invoiceType: 'special',
  invoiceDate: '',
  invoiceAmount: 0
})

const invoiceRules = {
  invoiceNo: [{ required: true, message: '请输入发票号', trigger: 'blur' }],
  invoiceType: [{ required: true, message: '请选择发票类型', trigger: 'change' }],
  invoiceDate: [{ required: true, message: '请选择开票日期', trigger: 'change' }],
  invoiceAmount: [{ required: true, message: '请输入开票金额', trigger: 'blur' }]
}

const pagination = reactive({ page: 1, pageSize: 10, total: 100 })

const summary = reactive({
  totalCount: 128,
  invoicedAmount: 8560000,
  uninvoicedAmount: 2450000,
  invoiceRate: 77.6
})

const tableData = ref([
  { id: 1, deliveryNo: 'SHD-202401001', invoiceNo: 'FP-202401001', customerName: '项目A', amount: 50000, invoiceAmount: 50000, invoiceDate: '2024-01-20', invoiceType: 'special', status: 'invoiced' },
  { id: 2, deliveryNo: 'SHD-202401002', invoiceNo: '', customerName: '项目A', amount: 35000, invoiceAmount: 0, invoiceDate: '', invoiceType: '', status: 'uninvoiced' },
  { id: 3, deliveryNo: 'SHD-202401003', invoiceNo: 'FP-202401002', customerName: '项目B', amount: 42000, invoiceAmount: 42000, invoiceDate: '2024-01-22', invoiceType: 'normal', status: 'invoiced' },
  { id: 4, deliveryNo: 'SHD-202401004', invoiceNo: '', customerName: '项目C', amount: 28000, invoiceAmount: 0, invoiceDate: '', invoiceType: '', status: 'uninvoiced' },
  { id: 5, deliveryNo: 'SHD-202401005', invoiceNo: 'FP-202401003', customerName: '项目A', amount: 68000, invoiceAmount: 68000, invoiceDate: '2024-01-25', invoiceType: 'special', status: 'invoiced' }
])

const formatMoney = (amount: number) => {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万'
  }
  return amount.toLocaleString()
}

const handleQuery = () => {
  pagination.page = 1
}

const handleExport = () => {
  const headers = ['送货单号', '发票号', '项目名称', '金额', '开票金额', '开票日期', '发票类型', '状态']
  const data = tableData.value.map(row => [
    row.deliveryNo,
    row.invoiceNo || '-',
    row.customerName,
    row.amount,
    row.invoiceAmount,
    row.invoiceDate || '-',
    row.invoiceType === 'special' ? '专票' : row.invoiceType === 'normal' ? '普票' : '-',
    row.status === 'invoiced' ? '已开票' : '未开票'
  ])
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '开票报表')
  XLSX.writeFile(wb, `开票报表_${new Date().toISOString().split('T')[0]}.xlsx`)
  ElMessage.success('导出成功')
}

const handleInvoice = (row: any) => {
  invoiceForm.invoiceNo = ''
  invoiceForm.invoiceType = 'special'
  invoiceForm.invoiceDate = ''
  invoiceForm.invoiceAmount = row.amount
  invoiceDialogVisible.value = true
}

const handleInvoiceSubmit = async () => {
  const valid = await invoiceFormRef.value.validate().catch(() => false)
  if (!valid) return

  ElMessage.success('开票成功')
  invoiceDialogVisible.value = false
}

const handleView = (row: any) => {
  ElMessage.info(`查看 ${row.deliveryNo}`)
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

.summary-row {
  display: flex;
  gap: 30px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  padding: 16px 24px;
  background: #fafafa;
  border-radius: 8px;
}

.summary-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;

  &.warning {
    color: #e6a23c;
  }
}

.mt-16 { margin-top: 16px; }
.mb-16 { margin-bottom: 16px; }
</style>