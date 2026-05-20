<template>
  <div class="page-container">
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #409eff"><el-icon :size="32"><Box /></el-icon></div>
          <div class="stat-info">
            <p class="stat-label">本月供货额</p>
            <p class="stat-value">¥{{ stats.monthDelivery.toLocaleString() }}</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #67c23a"><el-icon :size="32"><Money /></el-icon></div>
          <div class="stat-info">
            <p class="stat-label">本月回款</p>
            <p class="stat-value">¥{{ stats.monthReceipt.toLocaleString() }}</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #e6a23c"><el-icon :size="32"><Document /></el-icon></div>
          <div class="stat-info">
            <p class="stat-label">本月开票额</p>
            <p class="stat-value">¥{{ stats.monthInvoice.toLocaleString() }}</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #f56c6c"><el-icon :size="32"><Warning /></el-icon></div>
          <div class="stat-info">
            <p class="stat-label">应收应付</p>
            <p class="stat-value">¥{{ stats.arrears.toLocaleString() }}</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-16">
      <el-col :span="12">
        <el-card>
          <template #header><span>近6个月供货趋势</span></template>
          <div ref="deliveryChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><span>客商应收应付分布</span></template>
          <div ref="arrearsChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-16">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>应收应付台账</span>
          </template>
          <el-table :data="arrearsTable" border stripe>
            <el-table-column prop="customerName" label="客商名称" width="150" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.type === 'receivable' ? 'success' : 'warning'" size="small">
                  {{ row.type === 'receivable' ? '应收' : '应付' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="statementAmount" label="对账金额" width="120" align="right">
              <template #default="{ row }"> ¥{{ row.statementAmount?.toLocaleString() }} </template>
            </el-table-column>
            <el-table-column prop="invoiceAmount" label="已开票" width="120" align="right">
              <template #default="{ row }"> ¥{{ row.invoiceAmount?.toLocaleString() }} </template>
            </el-table-column>
            <el-table-column prop="paidAmount" label="已付款" width="120" align="right">
              <template #default="{ row }"> ¥{{ row.paidAmount?.toLocaleString() }} </template>
            </el-table-column>
            <el-table-column prop="balance" label="余额" width="120" align="right">
              <template #default="{ row }">
                <span :style="{ color: row.balance < 0 ? '#f56c6c' : '#67c23a' }">
                  ¥{{ row.balance?.toLocaleString() }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Box, Money, Document, Warning } from '@element-plus/icons-vue'



const stats = reactive({
  monthDelivery: 2580000,
  monthReceipt: 1850000,
  monthInvoice: 2100000,
  arrears: 1256800
})

const arrearsTable = ref([
  { customerName: '浙江建材有限公司', type: 'payable', statementAmount: 258000, invoiceAmount: 249380, paidAmount: 249380, balance: 8620 },
  { customerName: '上海工地项目部', type: 'receivable', statementAmount: 185000, invoiceAmount: 185000, paidAmount: 150000, balance: 35000 }
])

onMounted(() => {
  // Chart rendering would be implemented here with ECharts
})
</script>

<style scoped lang="scss">
.dashboard { padding: 20px; }
.stat-cards {
  .stat-card {
    display: flex; align-items: center; padding: 20px;
    .stat-icon { width: 64px; height: 64px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; margin-right: 16px; }
    .stat-info {
      .stat-label { font-size: 14px; color: #909399; margin-bottom: 8px; }
      .stat-value { font-size: 24px; font-weight: 600; color: #303133; }
    }
  }
}
</style>
