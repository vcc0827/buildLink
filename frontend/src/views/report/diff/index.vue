<template>
  <div class="page-container">
    <div class="search-bar mb-16">
      <el-date-picker v-model="queryForm.startDate" type="date" value-format="YYYY-MM-DD" style="width: 150px" placeholder="开始日期" />
      <el-date-picker v-model="queryForm.endDate" type="date" value-format="YYYY-MM-DD" style="width: 150px" placeholder="结束日期" />
      <el-select v-model="queryForm.customerId" placeholder="选择项目" clearable style="width: 200px">
        <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-button type="primary" @click="handleQuery">查询</el-button>
      <el-button type="success" @click="handleExport">导出</el-button>
    </div>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="orderNo" label="报货单号" width="150" />
      <el-table-column prop="deliveryNo" label="送货单号" width="150" />
      <el-table-column prop="customerName" label="项目名称" min-width="150" />
      <el-table-column prop="productName" label="产品名称" min-width="150" />
      <el-table-column prop="orderQuantity" label="报货数量" width="120" align="right" />
      <el-table-column prop="deliveryQuantity" label="实收数量" width="120" align="right" />
      <el-table-column prop="diff" label="差异数量" width="120" align="right">
        <template #default="{ row }">
          <span :class="{ 'danger': row.diff !== 0 }">{{ row.diff > 0 ? '+' : '' }}{{ row.diff }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="diffRate" label="差异率" width="100" align="right">
        <template #default="{ row }">{{ row.diffRate }}%</template>
      </el-table-column>
      <el-table-column prop="diffRemark" label="差异原因" min-width="200" />
      <el-table-column prop="deliveryDate" label="送货日期" width="120" />
    </el-table>

    <el-card class="mt-16">
      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-label">总报货数量</span>
          <span class="summary-value">{{ summary.totalOrder }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">总实收数量</span>
          <span class="summary-value">{{ summary.totalDelivery }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">差异数量</span>
          <span class="summary-value danger">{{ summary.totalDiff }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">差异率</span>
          <span class="summary-value warning">{{ summary.diffRate }}%</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">差异单据数</span>
          <span class="summary-value">{{ summary.diffCount }} 单</span>
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
  startDate: '',
  endDate: '',
  customerId: undefined
})

const pagination = reactive({ page: 1, pageSize: 10, total: 100 })

const customers = ref([
  { id: 1, name: '项目A' },
  { id: 2, name: '项目B' },
  { id: 3, name: '项目C' }
])

const summary = reactive({
  totalOrder: 1580,
  totalDelivery: 1520,
  totalDiff: 60,
  diffRate: 3.8,
  diffCount: 12
})

const tableData = ref([
  { id: 1, orderNo: 'BH-202401001', deliveryNo: 'SHD-202401001', customerName: '项目A', productName: '普通砂浆 M30', orderQuantity: 100, deliveryQuantity: 98, diff: -2, diffRate: 2.0, diffRemark: '运输损耗', deliveryDate: '2024-01-15' },
  { id: 2, orderNo: 'BH-202401002', deliveryNo: 'SHD-202401002', customerName: '项目A', productName: '普通砂浆 M25', orderQuantity: 80, deliveryQuantity: 80, diff: 0, diffRate: 0, diffRemark: '-', deliveryDate: '2024-01-18' },
  { id: 3, orderNo: 'BH-202401003', deliveryNo: 'SHD-202401003', customerName: '项目B', productName: '加气块 600*200*200', orderQuantity: 50, deliveryQuantity: 45, diff: -5, diffRate: 10.0, diffRemark: '现场验收不合格', deliveryDate: '2024-01-20' },
  { id: 4, orderNo: 'BH-202401004', deliveryNo: 'SHD-202401004', customerName: '项目C', productName: '石膏板 12mm', orderQuantity: 200, deliveryQuantity: 205, diff: 5, diffRate: 2.5, diffRemark: '补货', deliveryDate: '2024-01-22' },
  { id: 5, orderNo: 'BH-202401005', deliveryNo: 'SHD-202401005', customerName: '项目A', productName: '普通砂浆 M30', orderQuantity: 120, deliveryQuantity: 118, diff: -2, diffRate: 1.7, diffRemark: '运输损耗', deliveryDate: '2024-01-25' }
])

const handleQuery = () => {
  pagination.page = 1
}

const handleExport = () => {
  const headers = ['报货单号', '送货单号', '项目名称', '产品名称', '报货数量', '实收数量', '差异数量', '差异率', '差异原因', '送货日期']
  const data = tableData.value.map(row => [
    row.orderNo,
    row.deliveryNo,
    row.customerName,
    row.productName,
    row.orderQuantity,
    row.deliveryQuantity,
    row.diff,
    row.diffRate + '%',
    row.diffRemark,
    row.deliveryDate
  ])
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '报货送货差异表')
  XLSX.writeFile(wb, `报货送货差异表_${new Date().toISOString().split('T')[0]}.xlsx`)
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

  &.warning {
    color: #e6a23c;
  }
}

.danger {
  color: #f56c6c;
}

.mt-16 { margin-top: 16px; }
.mb-16 { margin-bottom: 16px; }
</style>