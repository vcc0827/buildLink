<template>
  <div class="page-container">
    <div class="table-search">
      <el-form :model="queryForm" inline class="search-form">
        <el-form-item label="工地项目">
          <el-select v-model="queryForm.customerId" placeholder="请选择" clearable style="width: 200px">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="结算周期">
          <el-date-picker
            v-model="queryForm.dateRange"
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
      <el-table-column prop="customerName" label="工地项目" />
      <el-table-column prop="productType" label="产品类型" width="100">
        <template #default="{ row }"> {{ row.productType === 'mortar' ? '砂浆' : '砌块' }} </template>
      </el-table-column>
      <el-table-column prop="totalQuantity" label="总数量" width="140" align="right">
        <template #default="{ row }">
          <span>{{ Number(row.totalQuantity || 0).toFixed(2) }}{{ row.productType === 'mortar' ? 't' : 'm³' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="totalAmount" label="对账金额" width="140" align="right">
        <template #default="{ row }"> ¥{{ row.totalAmount?.toLocaleString() }} </template>
      </el-table-column>
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

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog v-model="detailDialogVisible" :title="detailDialogTitle" width="90%" :close-on-click-modal="false">
      <div class="reconciliation-detail">
        <div class="detail-header">
          <div class="header-item">
            <span class="label">项目名称：</span>
            <span class="value">{{ detailData.customerName }}</span>
          </div>
          <div class="header-item">
            <span class="label">结算周期：</span>
            <span class="value">{{ detailData.dateRange }}</span>
          </div>
        </div>
        <div class="detail-table">
          <el-table v-if="detailData.productType === 'block'" :data="detailData.list" border stripe>
            <el-table-column prop="deliveryDate" label="日期" width="120" />
            <el-table-column prop="packingType" label="送货方式" width="100" />
            <el-table-column prop="no" label="送货单号" width="180" />
            <el-table-column prop="spec" label="规格型号" width="120" />
            <el-table-column prop="productType" label="类型" width="60" />
            <el-table-column prop="quantity" label="发货数量" width="100" align="right" />
            <el-table-column prop="quantity" label="收货数量" width="100" align="right" />
            <el-table-column prop="deductVolume" label="扣方量" width="100" align="right" />
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
            <el-table-column prop="amount" label="金额" width="100" align="right">
              <template #default="{ row }"> ¥{{ row.amount?.toLocaleString() }} </template>
            </el-table-column>
            <el-table-column prop="remarks" label="备注" />
          </el-table>
          <el-table v-else :data="detailData.list" border stripe>
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="deliveryDate" label="发货日期" width="120" />
            <el-table-column prop="supplierName" label="厂家名称" width="200" />
            <el-table-column prop="mortarGrade" label="砂浆标号" width="100" />
            <el-table-column prop="packingType" label="散装/袋包" width="100" />
            <el-table-column prop="quantity" label="需求发货量(吨)" width="130" align="right" />
            <el-table-column prop="quantity" label="实收(吨)" width="100" align="right" />
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
            <el-table-column prop="amount" label="金额" width="100" align="right">
              <template #default="{ row }"> ¥{{ row.amount?.toLocaleString() }} </template>
            </el-table-column>
          </el-table>
          <div class="detail-footer" v-if="detailData.list.length > 0">
            <div class="footer-left">合计：</div>
            <div class="footer-right" v-if="detailData.productType === 'block'">
              <span>收货数量：{{ detailData.totals.totalQuantity?.toLocaleString() }}</span>
              <span>扣方量：{{ detailData.totals.deductVolume?.toLocaleString() }}</span>
              <span>实收方量：{{ detailData.totals.convertedCubic?.toLocaleString() }}</span>
              <span class="total-amount">总金额：¥{{ detailData.totals.totalAmount?.toLocaleString() }}</span>
            </div>
            <div class="footer-right" v-else>
              <span>实收(吨)：{{ detailData.totals.totalQuantity?.toLocaleString() }}</span>
              <span class="total-amount">总金额：¥{{ detailData.totals.totalAmount?.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { customerApi, deliveryApi } from '@/api'
import type { Customer } from '@/types'

const loading = ref(false)
const tableData = ref<any[]>([])
const projects = ref<Customer[]>([])
const detailDialogVisible = ref(false)
const statusDialogVisible = ref(false)
const selectedRow = ref<any>(null)
const statusRow = ref<any>(null)

const statusForm = reactive({
  status: '',
  currentStatus: '',
  remark: ''
})

const queryForm = reactive({
  customerId: undefined as number | undefined,
  dateRange: [] as string[]
})

const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const detailData = reactive({
  customerName: '',
  productType: '',
  dateRange: '',
  list: [] as any[],
  priceVisible: [] as boolean[],
  totals: {
    totalQuantity: 0,
    totalAmount: 0,
    deductVolume: 0,
    convertedCubic: 0
  }
})

const detailDialogTitle = computed(() => {
  if (detailData.productType === 'block') {
    return '砌块对账确认单'
  } else {
    return '砂浆对账确认单'
  }
})

const getStatusType = (s: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    unreconciled: 'info',
    reconciled: 'success',
    partial: 'warning',
    settled: 'success'
  }
  return map[s] || 'info'
}

const getStatusText = (s: string) => ({
  unreconciled: '未对账',
  reconciled: '已对账',
  partial: '部分结清',
  settled: '已结清'
}[s] || s)

const getDefaultDateRange = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]
  return [startDate, endDate]
}

const loadData = async () => {
  loading.value = true
  try {
    const [startDate, endDate] = queryForm.dateRange.length === 2 
      ? queryForm.dateRange 
      : getDefaultDateRange()
    
    const res = await deliveryApi.getCustomerReconciliation({
      customerId: queryForm.customerId,
      startDate,
      endDate,
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

const loadProjects = async () => {
  try {
    const res = await customerApi.list({ type: 'project', pageSize: 100 })
    projects.value = res.data.list || []
  } catch (e) {
    console.error('加载项目失败', e)
    projects.value = []
  }
}

const handleQuery = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  Object.assign(queryForm, { customerId: undefined, dateRange: [] })
  handleQuery()
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  pagination.page = 1
  loadData()
}

const handleCurrentChange = (val: number) => {
  pagination.page = val
  loadData()
}

const handleView = async (row: any) => {
  selectedRow.value = row
  detailData.priceVisible = []
  
  const [startDate, endDate] = queryForm.dateRange.length === 2 
    ? queryForm.dateRange 
    : getDefaultDateRange()
  
  try {
    const res = await deliveryApi.getCustomerDeliveryDetail({
      customerId: row.customerId,
      startDate,
      endDate,
      productType: row.productType
    })
    
    detailData.customerName = res.data.customerName || ''
    detailData.productType = res.data.productType || ''
    detailData.dateRange = `${startDate} 至 ${endDate}`
    detailData.list = res.data.list || []
    detailData.totals = res.data.totals || { totalQuantity: 0, totalAmount: 0, deductVolume: 0, convertedCubic: 0 }
    detailData.priceVisible = new Array(detailData.list.length).fill(false)
    
    detailDialogVisible.value = true
  } catch (e) {
    console.error('加载详情失败', e)
    ElMessage.error('加载详情失败')
  }
}

const togglePriceVisibility = (index: number) => {
  if (detailData.priceVisible[index] !== undefined) {
    detailData.priceVisible[index] = !detailData.priceVisible[index]
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
    ElMessage.warning('请选择状态')
    return
  }
  
  const row = statusRow.value
  try {
    const idx = tableData.value.findIndex(r => r.customerId === row.customerId && r.productType === row.productType)
    if (idx !== -1) {
      tableData.value[idx].status = statusForm.status
    }
    statusDialogVisible.value = false
    ElMessage.success('状态修改成功')
  } catch (e) {
    console.error('修改状态失败', e)
    ElMessage.error('修改状态失败')
  }
}

onMounted(() => {
  loadData()
  loadProjects()
})
</script>

<style scoped>
.pagination-container {
  margin-top: 16px;
  text-align: right;
}

.reconciliation-detail {
  padding: 16px;
}

.detail-header {
  display: flex;
  gap: 40px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.header-item {
  display: flex;
  align-items: center;
}

.header-item .label {
  font-weight: bold;
  margin-right: 8px;
}

.header-item .value {
  font-size: 16px;
}

.detail-table {
  margin-top: 16px;
}

.detail-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px solid #e8e8e8;
  font-weight: bold;
}

.footer-left {
  flex: 1;
}

.footer-right {
  display: flex;
  gap: 24px;
}

.total-amount {
  color: #e74c3c;
  font-size: 16px;
}

.price-cell {
  cursor: pointer;
  color: #1890ff;
  text-decoration: underline;
}
</style>
