<template>
  <div class="page-container">
    <div class="search-bar mb-16">
      <el-select v-model="queryForm.cycleType" placeholder="选择周期" style="width: 150px">
        <el-option label="月度" value="monthly" />
        <el-option label="季度" value="quarterly" />
        <el-option label="年度" value="yearly" />
      </el-select>
      <el-date-picker v-model="queryForm.period" type="month" value-format="YYYY-MM" style="width: 150px" placeholder="选择月份" />
      <el-select v-model="queryForm.customerId" placeholder="选择项目" clearable style="width: 200px">
        <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-button type="primary" @click="handleQuery">查询</el-button>
      <el-button type="success" @click="handleCollect">单据归集</el-button>
    </div>

    <el-card class="mb-16">
      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-label">待归集单据</span>
          <span class="summary-value">{{ summary.pendingCount }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">已归集单据</span>
          <span class="summary-value">{{ summary.collectedCount }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">本期金额</span>
          <span class="summary-value amount">¥{{ summary.amount }}</span>
        </div>
      </div>
    </el-card>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="no" label="单号" width="180" />
      <el-table-column prop="customerName" label="项目名称" min-width="150" />
      <el-table-column prop="categoryName" label="产品品类" width="120" />
      <el-table-column prop="deliveryDate" label="送货日期" width="120" />
      <el-table-column prop="totalAmount" label="金额" width="120" align="right">
        <template #default="{ row }">¥{{ row.totalAmount?.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'collected' ? 'success' : 'warning'" size="small">
            {{ row.status === 'collected' ? '已归集' : '待归集' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button v-if="row.status !== 'collected'" type="success" link @click="handleCollectSingle(row)">归集</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="mt-16" v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" />

    <el-dialog v-model="collectDialogVisible" title="批量归集" width="600px">
      <el-form :model="collectForm" label-width="100px">
        <el-form-item label="周期类型">
          <el-select v-model="collectForm.cycleType">
            <el-option label="月度" value="monthly" />
            <el-option label="季度" value="quarterly" />
            <el-option label="年度" value="yearly" />
          </el-select>
        </el-form-item>
        <el-form-item label="周期月份">
          <el-date-picker v-model="collectForm.period" type="month" value-format="YYYY-MM" style="width: 100%" />
        </el-form-item>
        <el-form-item label="选择项目">
          <el-select v-model="collectForm.customerId" placeholder="全部项目" clearable>
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="collectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCollectSubmit">确认归集</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const collectDialogVisible = ref(false)

const queryForm = reactive({
  cycleType: 'monthly',
  period: '',
  customerId: undefined
})

const collectForm = reactive({
  cycleType: 'monthly',
  period: '',
  customerId: undefined
})

const pagination = reactive({ page: 1, pageSize: 10, total: 100 })

const customers = ref([
  { id: 1, name: '项目A' },
  { id: 2, name: '项目B' },
  { id: 3, name: '项目C' }
])

const summary = reactive({
  pendingCount: 15,
  collectedCount: 8,
  amount: 1258000
})

const tableData = ref([
  { id: 1, no: 'SHD-202401001', customerName: '项目A', categoryName: '砂浆', deliveryDate: '2024-01-15', totalAmount: 50000, status: 'pending' },
  { id: 2, no: 'SHD-202401002', customerName: '项目A', categoryName: '砌块', deliveryDate: '2024-01-18', totalAmount: 35000, status: 'pending' },
  { id: 3, no: 'SHD-202401003', customerName: '项目B', categoryName: '砂浆', deliveryDate: '2024-01-20', totalAmount: 42000, status: 'collected' },
  { id: 4, no: 'SHD-202401004', customerName: '项目C', categoryName: '板材', deliveryDate: '2024-01-22', totalAmount: 28000, status: 'pending' },
  { id: 5, no: 'SHD-202401005', customerName: '项目A', categoryName: '砂浆', deliveryDate: '2024-01-25', totalAmount: 68000, status: 'collected' }
])

const handleQuery = () => {
  pagination.page = 1
}

const handleCollect = () => {
  collectForm.cycleType = queryForm.cycleType
  collectForm.period = queryForm.period
  collectForm.customerId = queryForm.customerId
  collectDialogVisible.value = true
}

const handleCollectSingle = (row: any) => {
  row.status = 'collected'
  ElMessage.success('归集成功')
}

const handleCollectSubmit = () => {
  tableData.value.forEach(row => {
    if (row.status === 'pending') {
      row.status = 'collected'
    }
  })
  summary.collectedCount += summary.pendingCount
  summary.pendingCount = 0
  ElMessage.success('批量归集成功')
  collectDialogVisible.value = false
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
  gap: 40px;
}

.summary-item {
  display: flex;
  flex-direction: column;
}

.summary-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;

  &.amount {
    color: #f56c6c;
  }
}

.mb-16 { margin-bottom: 16px; }
.mt-16 { margin-top: 16px; }
</style>