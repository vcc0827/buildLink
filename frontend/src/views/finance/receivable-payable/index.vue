<template>
  <div class="page-container">
    <div class="tabs">
      <el-tabs v-model="activeTab" @change="handleTabChange">
        <el-tab-pane label="应收台账" name="receivable" />
        <el-tab-pane label="应付台账" name="payable" />
      </el-tabs>
    </div>

    <div class="search-bar mt-16">
      <el-select v-model="queryForm.type" placeholder="业务类型" style="width: 120px">
        <el-option label="合同单" value="contract" />
        <el-option label="零售单" value="retail" />
      </el-select>
      <el-date-picker v-model="queryForm.startDate" type="date" value-format="YYYY-MM-DD" style="width: 150px" placeholder="开始日期" />
      <el-date-picker v-model="queryForm.endDate" type="date" value-format="YYYY-MM-DD" style="width: 150px" placeholder="结束日期" />
      <el-input v-model="queryForm.customerName" placeholder="项目名称" style="width: 200px" />
      <el-button type="primary" @click="handleQuery">查询</el-button>
    </div>

    <el-card class="mb-16">
      <div class="summary-row">
        <div class="summary-item" :class="{ 'highlight': activeTab === 'receivable' }">
          <span class="summary-label">{{ activeTab === 'receivable' ? '应收总额' : '应付总额' }}</span>
          <span class="summary-value amount">{{ activeTab === 'receivable' ? '¥' + formatMoney(summary.receivableTotal) : '¥' + formatMoney(summary.payableTotal) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">已核销</span>
          <span class="summary-value">{{ activeTab === 'receivable' ? '¥' + formatMoney(summary.receivablePaid) : '¥' + formatMoney(summary.payablePaid) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">待收/付</span>
          <span class="summary-value warning">{{ activeTab === 'receivable' ? '¥' + formatMoney(summary.receivablePending) : '¥' + formatMoney(summary.payablePending) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">逾期金额</span>
          <span class="summary-value danger">{{ activeTab === 'receivable' ? '¥' + formatMoney(summary.receivableOverdue) : '¥' + formatMoney(summary.payableOverdue) }}</span>
        </div>
      </div>
    </el-card>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="no" label="单号" width="180" />
      <el-table-column prop="customerName" label="项目名称" min-width="150" />
      <el-table-column prop="contractNo" label="合同号" width="150" />
      <el-table-column prop="categoryName" label="品类" width="100" />
      <el-table-column prop="amount" label="金额" width="120" align="right">
        <template #default="{ row }">¥{{ row.amount?.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="paidAmount" label="已收/付" width="120" align="right">
        <template #default="{ row }">¥{{ row.paidAmount?.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="balance" label="余额" width="120" align="right">
        <template #default="{ row }">
          <span :class="{ 'danger': row.balance > 0 }">¥{{ row.balance?.toLocaleString() }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="dueDate" label="到期日" width="120">
        <template #default="{ row }">
          <span :class="{ 'overdue': isOverdue(row.dueDate) }">{{ row.dueDate }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleView(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="mt-16" v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const activeTab = ref('receivable')

const queryForm = reactive({
  type: '',
  startDate: '',
  endDate: '',
  customerName: ''
})

const pagination = reactive({ page: 1, pageSize: 10, total: 100 })

const summary = reactive({
  receivableTotal: 12580000,
  receivablePaid: 8950000,
  receivablePending: 3630000,
  receivableOverdue: 1250000,
  payableTotal: 8960000,
  payablePaid: 5200000,
  payablePending: 3760000,
  payableOverdue: 890000
})

const tableData = ref([
  { id: 1, no: 'SHD-202401001', customerName: '项目A', contractNo: 'HT-2024-001', categoryName: '砂浆', amount: 50000, paidAmount: 30000, balance: 20000, dueDate: '2024-02-28', status: 'partial' },
  { id: 2, no: 'SHD-202401002', customerName: '项目A', contractNo: 'HT-2024-001', categoryName: '砌块', amount: 35000, paidAmount: 0, balance: 35000, dueDate: '2024-01-15', status: 'overdue' },
  { id: 3, no: 'SHD-202401003', customerName: '项目B', contractNo: 'HT-2024-002', categoryName: '砂浆', amount: 42000, paidAmount: 42000, balance: 0, dueDate: '2024-02-15', status: 'paid' },
  { id: 4, no: 'SHD-202401004', customerName: '项目C', contractNo: '', categoryName: '板材', amount: 28000, paidAmount: 28000, balance: 0, dueDate: '2024-01-22', status: 'paid' },
  { id: 5, no: 'SHD-202401005', customerName: '项目A', contractNo: 'HT-2024-001', categoryName: '砂浆', amount: 68000, paidAmount: 50000, balance: 18000, dueDate: '2024-03-15', status: 'partial' }
])

const formatMoney = (amount: number) => {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万'
  }
  return amount.toLocaleString()
}

const isOverdue = (date: string) => {
  if (!date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = new Date(date)
  dueDate.setHours(0, 0, 0, 0)
  return dueDate < today
}

const getStatusType = (status: string): 'success' | 'warning' | 'info' | 'danger' => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
    paid: 'success',
    partial: 'warning',
    overdue: 'danger',
    pending: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => ({
  paid: '已结清',
  partial: '部分收/付',
  overdue: '逾期',
  pending: '待收/付'
}[status] || status)

const handleTabChange = () => {
  pagination.page = 1
}

const handleQuery = () => {
  pagination.page = 1
}

const handleView = (row: any) => {
  ElMessage.info(`查看 ${row.no}`)
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

  &.highlight {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    
    .summary-label {
      color: rgba(255, 255, 255, 0.8);
    }
    
    .summary-value {
      color: #fff;
    }
  }
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

  &.amount {
    font-size: 24px;
  }

  &.warning {
    color: #e6a23c;
  }

  &.danger {
    color: #f56c6c;
  }
}

.overdue {
  color: #f56c6c;
  font-weight: 500;
}

.danger {
  color: #f56c6c;
}

.mt-16 { margin-top: 16px; }
.mb-16 { margin-bottom: 16px; }
</style>