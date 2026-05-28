<template>
  <div class="page-container">
    <div class="search-bar mb-16">
      <el-select v-model="queryForm.type" placeholder="报表类型" style="width: 150px">
        <el-option label="应收账款" value="receivable" />
        <el-option label="应付账款" value="payable" />
      </el-select>
      <el-date-picker v-model="queryForm.period" type="month" value-format="YYYY-MM" style="width: 150px" placeholder="选择月份" />
      <el-select v-model="queryForm.customerId" placeholder="选择项目/厂家" clearable style="width: 200px">
        <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-button type="primary" @click="handleQuery">查询</el-button>
      <el-button type="success" @click="handleExport">导出</el-button>
    </div>

    <el-card class="mb-16">
      <div class="chart-section">
        <div class="chart-title">{{ queryForm.type === 'receivable' ? '应收账款趋势' : '应付账款趋势' }}</div>
        <div class="chart-bars">
          <div v-for="(item, index) in chartData" :key="index" class="chart-bar-item">
            <div class="chart-bar" :style="{ height: item.percent + '%' }">
              <span class="chart-value">¥{{ formatMoney(item.amount) }}</span>
            </div>
            <span class="chart-label">{{ item.month }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="customerName" label="项目/厂家" min-width="180" />
      <el-table-column prop="contractNo" label="合同号" width="150" />
      <el-table-column prop="openingBalance" label="期初余额" width="140" align="right">
        <template #default="{ row }">¥{{ row.openingBalance?.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="currentAmount" label="本期发生" width="140" align="right">
        <template #default="{ row }">¥{{ row.currentAmount?.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="paidAmount" label="本期收/付" width="140" align="right">
        <template #default="{ row }">¥{{ row.paidAmount?.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="closingBalance" label="期末余额" width="140" align="right">
        <template #default="{ row }">
          <span :class="{ 'danger': row.closingBalance > 0 }">¥{{ row.closingBalance?.toLocaleString() }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="overdueAmount" label="逾期金额" width="140" align="right">
        <template #default="{ row }">
          <span :class="{ 'danger': row.overdueAmount > 0 }">¥{{ row.overdueAmount?.toLocaleString() }}</span>
        </template>
      </el-table-column>
    </el-table>

    <el-card class="mt-16">
      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-label">期初余额</span>
          <span class="summary-value">¥{{ formatMoney(summary.openingBalance) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">本期发生</span>
          <span class="summary-value">¥{{ formatMoney(summary.currentAmount) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">本期收/付</span>
          <span class="summary-value">¥{{ formatMoney(summary.paidAmount) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">期末余额</span>
          <span class="summary-value danger">¥{{ formatMoney(summary.closingBalance) }}</span>
        </div>
      </div>
    </el-card>

    <el-pagination class="mt-16" v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'

const loading = ref(false)

const queryForm = reactive({
  type: 'receivable',
  period: '',
  customerId: undefined
})

const pagination = reactive({ page: 1, pageSize: 10, total: 100 })

const customers = ref([
  { id: 1, name: '项目A' },
  { id: 2, name: '项目B' },
  { id: 3, name: '项目C' },
  { id: 4, name: '厂家A' },
  { id: 5, name: '厂家B' }
])

const chartData = ref([
  { month: '8月', amount: 850000, percent: 60 },
  { month: '9月', amount: 980000, percent: 70 },
  { month: '10月', amount: 1100000, percent: 78 },
  { month: '11月', amount: 920000, percent: 65 },
  { month: '12月', amount: 1250000, percent: 89 },
  { month: '1月', amount: 1400000, percent: 100 }
])

const summary = reactive({
  openingBalance: 3580000,
  currentAmount: 1250000,
  paidAmount: 980000,
  closingBalance: 3850000
})

const tableData = ref([
  { id: 1, customerName: '项目A', contractNo: 'HT-2024-001', openingBalance: 1200000, currentAmount: 450000, paidAmount: 320000, closingBalance: 1330000, overdueAmount: 280000 },
  { id: 2, customerName: '项目B', contractNo: 'HT-2024-002', openingBalance: 850000, currentAmount: 320000, paidAmount: 280000, closingBalance: 890000, overdueAmount: 0 },
  { id: 3, customerName: '项目C', contractNo: '', openingBalance: 1530000, currentAmount: 480000, paidAmount: 380000, closingBalance: 1630000, overdueAmount: 520000 },
  { id: 4, customerName: '厂家A', contractNo: 'HT-2024-003', openingBalance: 0, currentAmount: 0, paidAmount: 0, closingBalance: 0, overdueAmount: 0 },
  { id: 5, customerName: '厂家B', contractNo: 'HT-2024-004', openingBalance: 0, currentAmount: 0, paidAmount: 0, closingBalance: 0, overdueAmount: 0 }
])

const formatMoney = (amount: number) => {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + '万'
  }
  return amount.toLocaleString()
}

const handleQuery = () => {
  pagination.page = 1
}

const handleExport = () => {
  const headers = ['项目/厂家', '合同号', '期初余额', '本期发生', '本期收/付', '期末余额', '逾期金额']
  const data = tableData.value.map(row => [
    row.customerName,
    row.contractNo,
    row.openingBalance,
    row.currentAmount,
    row.paidAmount,
    row.closingBalance,
    row.overdueAmount
  ])
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, queryForm.type === 'receivable' ? '应收账款报表' : '应付账款报表')
  XLSX.writeFile(wb, `${queryForm.type === 'receivable' ? '应收账款' : '应付账款'}报表_${new Date().toISOString().split('T')[0]}.xlsx`)
  ElMessage.success('导出成功')
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

.chart-section {
  padding: 20px;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.chart-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 200px;
  padding: 0 20px;
}

.chart-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.chart-bar {
  width: 40px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px 4px 0 0;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  transition: height 0.3s;
}

.chart-value {
  font-size: 11px;
  color: #fff;
  padding-top: 8px;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.chart-label {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
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

  &.danger {
    color: #f56c6c;
  }
}

.danger {
  color: #f56c6c;
}

.mt-16 { margin-top: 16px; }
.mb-16 { margin-bottom: 16px; }
</style>