<template>
  <div class="page-container">
    <div class="table-search">
      <el-form :model="queryForm" inline class="search-form">
        <el-form-item label="厂家">
          <el-select v-model="queryForm.supplierId" placeholder="请选择" clearable style="width: 200px">
            <el-option v-for="c in suppliers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="结算周期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 320px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="supplierName" label="厂家名称" min-width="200" />
      <el-table-column prop="productType" label="类型" width="100">
        <template #default="{ row }">
          <span>{{ row.productType === 'mortar' ? '砂浆' : '蒸压加气混凝土砌块' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="totalQuantity" label="总数量" width="140" align="right">
        <template #default="{ row }">
          <span>{{ Number(row.totalQuantity || 0).toFixed(2) }}{{ row.productType === 'mortar' ? 't' : 'm³' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="totalAmount" label="总金额" width="140" align="right">
        <template #default="{ row }">¥{{ row.totalAmount?.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="deliveryCount" label="送货单数" width="100" align="center" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleView(row)">查看详情</el-button>
          <el-button type="success" link @click="handleStatusChange(row)">修改状态</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleQuery"
      @current-change="handleQuery"
    />

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="90%" top="5vh" destroy-on-close>
      <div class="detail-content">
        <div class="info-section">
          <div class="info-row">
            <span class="label">厂家名称：</span>
            <span class="value">{{ detailData.supplierName }}</span>
          </div>
          <div class="info-row">
            <span class="label">结算周期：</span>
            <span class="value">{{ queryForm.startDate }} 至 {{ queryForm.endDate }}</span>
          </div>
        </div>

        <div class="table-section" v-if="currentRow?.productType === 'block'">
          <el-table :data="detailData.list" border max-height="500">
            <el-table-column prop="deliveryDate" label="日期" width="100" />
            <el-table-column prop="deliveryMethod" label="送货方式" width="100" />
            <el-table-column prop="deliveryNo" label="送货单号" width="150" />
            <el-table-column prop="spec" label="规格型号" width="120" />
            <el-table-column prop="type" label="类型" width="80" />
            <el-table-column prop="quantity" label="发货数量" width="100" align="right" />
            <el-table-column prop="receivedQuantity" label="收货数量" width="100" align="right" />
            <el-table-column prop="deduction" label="扣方量" width="100" align="right" />
            <el-table-column prop="convertedCubic" label="实收方量" width="100" align="right" />
            <el-table-column prop="contractPrice" label="合同单价" width="120" align="right">
              <template #default="{ row, $index }">
                <span 
                  class="price-cell" 
                  @click="togglePriceVisibility($index)"
                  :title="detailData.priceVisible[$index] ? '' : '点击查看单价'"
                >
                  {{ detailData.priceVisible[$index] ? '¥' + row.contractPrice?.toLocaleString() : '***' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120" align="right">
              <template #default="{ row }">¥{{ row.amount?.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="150" />
          </el-table>
          <div class="summary-row">
            <span class="summary-label">合计：</span>
            <span class="summary-item">收货数量：{{ detailData.totals.receivedQuantity }}</span>
            <span class="summary-item">扣方量：{{ detailData.totals.deduction }}</span>
            <span class="summary-item">实收方量：{{ detailData.totals.convertedCubic }}</span>
            <span class="summary-item highlight">总金额：¥{{ detailData.totals.totalAmount?.toLocaleString() }}</span>
          </div>
        </div>

        <div class="table-section" v-else>
          <el-table :data="detailData.list" border max-height="500">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="deliveryDate" label="发货日期" width="110" />
            <el-table-column prop="customerName" label="项目名称" min-width="150" />
            <el-table-column prop="mortarGrade" label="砂浆标号" width="100" />
            <el-table-column prop="packingType" label="散装/袋包" width="100" />
            <el-table-column prop="quantity" label="需求发货量(吨)" width="130" align="right" />
            <el-table-column prop="receivedQuantity" label="实收(吨)" width="100" align="right" />
            <el-table-column prop="price" label="单价" width="100" align="right">
              <template #default="{ row }">¥{{ row.price?.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120" align="right">
              <template #default="{ row }">¥{{ row.amount?.toLocaleString() }}</template>
            </el-table-column>
          </el-table>
          <div class="summary-row">
            <span class="summary-label">合计：</span>
            <span class="summary-item">实收(吨)：{{ detailData.totals.receivedQuantity }}</span>
            <span class="summary-item highlight">总金额：¥{{ detailData.totals.totalAmount?.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="statusDialogVisible" title="修改对账状态" width="400px">
      <el-form :model="statusForm" label-width="100px">
        <el-form-item label="当前状态">
          <el-tag :type="getStatusType(statusForm.currentStatus)">{{ getStatusText(statusForm.currentStatus) }}</el-tag>
        </el-form-item>
        <el-form-item label="修改为" prop="status">
          <el-select v-model="statusForm.status" placeholder="请选择状态">
            <el-option label="未对账" value="unreconciled" />
            <el-option label="已对账" value="reconciled" />
            <el-option label="部分结清" value="partial" />
            <el-option label="已结清" value="settled" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="statusForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleStatusSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import type { Customer } from '@/types'
import { customerApi, deliveryApi } from '@/api'

const loading = ref(false)
const tableData = ref<any[]>([])
const suppliers = ref<Customer[]>([])
const dialogVisible = ref(false)
const statusDialogVisible = ref(false)
const currentRow = ref<any>(null)
const statusRow = ref<any>(null)

const statusForm = reactive({
  status: '',
  currentStatus: '',
  remark: ''
})

const detailData = reactive({
  supplierName: '',
  list: [] as any[],
  priceVisible: [] as boolean[],
  totals: {
    receivedQuantity: '0',
    deduction: '0',
    convertedCubic: '0',
    totalAmount: '0'
  }
})

const queryForm = reactive({
  supplierId: undefined as number | undefined,
  startDate: '',
  endDate: ''
})

const dateRange = ref<string[]>([])

const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const dialogTitle = computed(() => {
  if (!currentRow.value) return ''
  return currentRow.value.productType === 'mortar' ? '砂浆对账确认单' : '蒸压加气混凝土砌块对账确认单'
})

const getStatusType = (s: string) => {
  const types: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    unreconciled: 'info',
    reconciled: 'success',
    partial: 'warning',
    settled: 'success'
  }
  return types[s] || 'info'
}

const getStatusText = (s: string) => ({
  unreconciled: '未对账',
  reconciled: '已对账',
  partial: '部分结清',
  settled: '已结清'
}[s] || s)

const setDefaultDateRange = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  queryForm.startDate = start.toISOString().split('T')[0]
  queryForm.endDate = end.toISOString().split('T')[0]
  dateRange.value = [queryForm.startDate, queryForm.endDate]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await deliveryApi.getSupplierReconciliation({
      supplierId: queryForm.supplierId,
      startDate: queryForm.startDate,
      endDate: queryForm.endDate,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (e) {
    console.error('加载对账数据失败', e)
    tableData.value = []
  } finally {
    loading.value = false
  }
}

const loadSuppliers = async () => {
  try {
    const res = await customerApi.list({ type: 'supplier', pageSize: 200 })
    suppliers.value = res.data.list || []
  } catch (e) {
    console.error('加载供应商失败', e)
    suppliers.value = []
  }
}

const handleQuery = () => {
  pagination.page = 1
  if (dateRange.value.length === 2) {
    queryForm.startDate = dateRange.value[0]
    queryForm.endDate = dateRange.value[1]
  }
  loadData()
}

const handleReset = () => {
  queryForm.supplierId = undefined
  setDefaultDateRange()
  handleQuery()
}

const togglePriceVisibility = (index: number) => {
  if (detailData.priceVisible[index] !== undefined) {
    detailData.priceVisible[index] = !detailData.priceVisible[index]
  }
}

const handleView = async (row: any) => {
  currentRow.value = row
  dialogVisible.value = true
  
  detailData.supplierName = row.supplierName
  
  try {
    const res = await deliveryApi.getSupplierDeliveryDetail({
      supplierId: row.supplierId,
      startDate: queryForm.startDate,
      endDate: queryForm.endDate,
      productType: row.productType
    })
    detailData.list = res.data.list || []
    detailData.priceVisible = detailData.list.map(() => false)
    
    let receivedQuantity = 0
    let deduction = 0
    let convertedCubic = 0
    let totalAmount = 0
    
    detailData.list.forEach((item: any) => {
      receivedQuantity += parseFloat(item.receivedQuantity || 0)
      deduction += parseFloat(item.deduction || 0)
      convertedCubic += parseFloat(item.convertedCubic || 0)
      totalAmount += parseFloat(item.amount || 0)
    })
    
    detailData.totals = {
      receivedQuantity: receivedQuantity.toFixed(4),
      deduction: deduction.toFixed(4),
      convertedCubic: convertedCubic.toFixed(4),
      totalAmount: totalAmount.toFixed(2)
    }
  } catch (e) {
    console.error('加载详情失败', e)
    detailData.list = []
  }
}

const handleStatusChange = (row: any) => {
  statusRow.value = row
  statusForm.currentStatus = row.status
  statusForm.status = row.status
  statusForm.remark = ''
  statusDialogVisible.value = true
}

const handleStatusSubmit = async () => {
  if (!statusForm.status) {
    alert('请选择状态')
    return
  }
  
  const row = statusRow.value
  try {
    const idx = tableData.value.findIndex(r => r.supplierId === row.supplierId && r.productType === row.productType)
    if (idx !== -1) {
      tableData.value[idx].status = statusForm.status
    }
    statusDialogVisible.value = false
    alert('状态修改成功')
  } catch (e) {
    console.error('修改状态失败', e)
    alert('修改状态失败')
  }
}

watch(dateRange, (newVal) => {
  if (newVal.length === 2) {
    queryForm.startDate = newVal[0]
    queryForm.endDate = newVal[1]
  }
})

onMounted(() => {
  setDefaultDateRange()
  loadSuppliers()
  loadData()
})
</script>

<style scoped>
.detail-content {
  max-height: 75vh;
  overflow-y: auto;
}

.info-section {
  display: flex;
  gap: 40px;
  margin-bottom: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.info-row {
  display: flex;
  align-items: center;
}

.label {
  font-weight: bold;
  color: #666;
}

.value {
  color: #333;
  margin-left: 8px;
}

.table-section {
  margin-top: 20px;
}

.price-cell {
  cursor: pointer;
  color: #1890ff;
  text-decoration: underline;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;
  padding: 16px 24px;
  background: #fafafa;
  border-top: 1px solid #e0e0e0;
  margin-top: -1px;
}

.summary-label {
  font-weight: bold;
  color: #666;
}

.summary-item {
  color: #333;
}

.summary-item.highlight {
  font-weight: bold;
  color: #1890ff;
  font-size: 16px;
}
</style>
