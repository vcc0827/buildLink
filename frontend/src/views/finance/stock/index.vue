<template>
  <div class="stock-management">
    <!-- Tab标签页 -->
    <el-tabs v-model="activeTab">
      <el-tab-pane label="库存明细" name="detail" />
      <el-tab-pane label="库存汇总" name="summary" />
    </el-tabs>

    <!-- 搜索区域 -->
    <div class="search-bar">
      <div class="search-group">
        <el-select v-model="queryForm.month" placeholder="选择月份" class="search-select">
          <el-option v-for="m in monthOptions" :key="m.value" :label="m.label" :value="m.value" />
        </el-select>
        <el-select v-model="queryForm.unit" placeholder="选择单位" class="search-select">
          <el-option v-for="u in unitOptions" :key="u.value" :label="u.label" :value="u.value" />
        </el-select>
        <el-select v-model="queryForm.product" placeholder="选择品名" class="search-select">
          <el-option v-for="p in productOptions" :key="p.value" :label="p.label" :value="p.value" />
        </el-select>
        <el-button type="primary" @click="handleSearch" class="search-btn">查询</el-button>
        <el-button @click="handleReset" class="reset-btn">重置</el-button>
      </div>
      <div class="action-btns">
        <el-button v-if="activeTab === 'detail'" type="primary" @click="handleAdd('stock_in')" class="add-btn">
          <el-icon><Plus /></el-icon> 入库
        </el-button>
        <el-button v-if="activeTab === 'detail'" type="success" @click="handleAdd('stock_out')" class="add-btn">
          <el-icon><Minus /></el-icon> 出库
        </el-button>
      </div>
    </div>

    <!-- 库存明细表格 -->
    <div v-if="activeTab === 'detail'" class="table-section">
      <el-table :data="stockListWithPreviousStock" border size="small">
        <el-table-column prop="month" label="月份" width="80" />
        <el-table-column label="单位" min-width="120">
          <template #default="{ row }">
            <span>{{ row.buyer?.name || row.unit || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="品名" min-width="150">
          <template #default="{ row }">
            <span>{{ row.product?.name || row.productName || row.product || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="规格型号" width="120">
          <template #default="{ row }">
            <span>{{ row.model || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="上期库存量" width="120">
          <template #default="{ row }">
            <span>{{ row.previousQuantity !== undefined ? row.previousQuantity.toFixed(2) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="上期库存成本" width="130">
          <template #default="{ row }">
            <span>{{ row.previousAmount !== undefined ? '¥' + row.previousAmount.toFixed(2) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="入库数量" width="100">
          <template #default="{ row }">
            <span>{{ row.type === 'stock_in' ? (row.quantity || 0) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="入库总价" width="120">
          <template #default="{ row }">
            <span>{{ row.type === 'stock_in' && row.amount ? '¥' + row.amount.toFixed(2) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="入库单价" width="100">
          <template #default="{ row }">
            <span>{{ row.type === 'stock_in' && row.unitPrice ? '¥' + row.unitPrice.toFixed(2) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="出库数量" width="100">
          <template #default="{ row }">
            <span>{{ row.type === 'stock_out' ? (row.quantity || 0) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button v-if="row.type !== 'previous'" type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.type !== 'previous'" type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 库存汇总表格 -->
    <div v-if="activeTab === 'summary'" class="table-section">
      <el-table :data="summaryData" border size="small">
        <el-table-column prop="product" label="品名" min-width="150" />
        <el-table-column prop="totalInQuantity" label="入库汇总数量" width="120" />
        <el-table-column prop="totalInAmount" label="入库汇总总价" width="120">
          <template #default="{ row }">
            <span>¥{{ row.totalInAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="avgUnitPrice" label="平均单价" width="100">
          <template #default="{ row }">
            <span>¥{{ row.avgUnitPrice.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalOutQuantity" label="出库汇总数量" width="120" />
        <el-table-column prop="totalOutAmount" label="出库总成本" width="120">
          <template #default="{ row }">
            <span>¥{{ row.totalOutAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="balanceQuantity" label="结余数量" width="100" />
        <el-table-column prop="balanceAmount" label="结余库存" width="120">
          <template #default="{ row }">
            <span>¥{{ row.balanceAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="日期" prop="date">
          <el-date-picker v-model="form.date" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="购买方" prop="buyerId">
          <el-select v-model="form.buyerId" placeholder="选择购买方" style="width: 100%">
            <el-option v-for="c in customerOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="销售方" prop="sellerId">
          <el-select v-model="form.sellerId" placeholder="选择销售方" style="width: 100%">
            <el-option v-for="c in customerOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="产品" prop="productId">
          <el-select v-model="form.productId" placeholder="选择产品" style="width: 100%" @change="handleProductChange">
            <el-option v-for="p in productList" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="规格型号" prop="model">
          <el-input v-model="form.model" placeholder="规格型号" style="width: 100%" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="单位" style="width: 100%" />
        </el-form-item>

        <template v-if="form.type === 'stock_in'">
          <el-form-item label="入库数量" prop="quantity">
            <el-input-number v-model="form.quantity" :min="0" :precision="3" :controls="false" style="width: 100%" @change="calculateUnitPrice" />
          </el-form-item>
          <el-form-item label="入库总价" prop="amount">
            <el-input-number v-model="form.amount" :min="0" :precision="2" :controls="false" style="width: 100%" @change="calculateUnitPrice" />
          </el-form-item>
          <el-form-item label="入库单价">
            <el-input :value="form.unitPrice ? form.unitPrice.toFixed(2) : '0.00'" disabled style="width: 100%" />
          </el-form-item>
        </template>

        <template v-else>
          <el-form-item label="出库数量" prop="quantity">
            <el-input-number v-model="form.quantity" :min="0" :precision="3" :controls="false" style="width: 100%" />
          </el-form-item>
        </template>

        <el-form-item label="税率" prop="taxRate">
          <el-input-number v-model="form.taxRate" :min="0" :max="1" :precision="2" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="备注" style="width: 100%" />
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
import { ref, reactive, onMounted } from 'vue'
import { Plus, Minus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { stockApi, customerApi, productApi } from '@/api'

const monthOptions = [
  { label: '1月', value: '1月' },
  { label: '2月', value: '2月' },
  { label: '3月', value: '3月' },
  { label: '4月', value: '4月' },
  { label: '5月', value: '5月' },
  { label: '6月', value: '6月' },
  { label: '7月', value: '7月' },
  { label: '8月', value: '8月' },
  { label: '9月', value: '9月' },
  { label: '10月', value: '10月' },
  { label: '11月', value: '11月' },
  { label: '12月', value: '12月' },
]

const currentMonth = `${new Date().getMonth() + 1}月`
const activeTab = ref('detail')

const queryForm = reactive({
  month: currentMonth,
  unit: '',
  product: '',
})

const customerOptions = ref<any[]>([])
const productList = ref<any[]>([])
const unitOptions = ref<any[]>([])
const productOptions = ref<any[]>([])

const stockList = ref<any[]>([])
const stockListWithPreviousStock = ref<any[]>([])
const summaryData = ref<any[]>([])

const dialogVisible = ref(false)
const dialogTitle = ref('入库')

const form = reactive({
  id: 0,
  type: 'stock_in',
  date: '',
  buyerId: 0,
  sellerId: 0,
  productId: 0,
  model: '',
  unit: '',
  quantity: 0,
  amount: 0,
  unitPrice: 0,
  taxRate: 0,
  remark: '',
})

const calculateUnitPrice = () => {
  if (form.quantity > 0 && form.amount > 0) {
    form.unitPrice = Number((form.amount / form.quantity).toFixed(4))
  } else {
    form.unitPrice = 0
  }
}

const handleProductChange = async () => {
  if (form.productId) {
    const res = await productApi.getById(form.productId)
    if (res.data) {
      form.unit = res.data.unit || ''
      form.model = res.data.model || ''
    }
  }
}

const handleSearch = async () => {
  await loadStockList()
}

const handleReset = () => {
  queryForm.month = currentMonth
  queryForm.unit = ''
  queryForm.product = ''
  loadStockList()
}

const handleAdd = (type: 'stock_in' | 'stock_out') => {
  dialogTitle.value = type === 'stock_in' ? '入库' : '出库'
  form.id = 0
  form.type = type
  form.date = new Date().toISOString().split('T')[0]
  form.buyerId = 0
  form.sellerId = 0
  form.productId = 0
  form.model = ''
  form.unit = ''
  form.quantity = 0
  form.amount = 0
  form.unitPrice = 0
  form.taxRate = 0
  form.remark = ''
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = row.type === 'stock_in' ? '编辑入库' : '编辑出库'
  form.id = row.id
  form.type = row.type
  form.date = row.date?.split('T')[0] || ''
  form.buyerId = row.buyerId || row.buyer?.id || 0
  form.sellerId = row.sellerId || row.seller?.id || 0
  form.productId = row.productId || row.product?.id || 0
  form.model = row.model || ''
  form.unit = row.unit || ''
  form.quantity = Number(row.quantity) || 0
  form.amount = Number(row.amount) || 0
  form.unitPrice = Number(row.unitPrice) || 0
  form.taxRate = Number(row.taxRate) || 0
  form.remark = row.remark || ''
  dialogVisible.value = true
}

const handleDelete = async (row: any) => {
  if (row.id && typeof row.id === 'number') {
    const res = await stockApi.delete(row.id)
    if (res.success) {
      ElMessage.success('删除成功')
      await loadStockList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  }
}

const handleSubmit = async () => {
  if (!form.date) {
    ElMessage.warning('请选择日期')
    return
  }
  if (!form.buyerId) {
    ElMessage.warning('请选择购买方')
    return
  }
  if (!form.sellerId) {
    ElMessage.warning('请选择销售方')
    return
  }
  if (!form.productId) {
    ElMessage.warning('请选择产品')
    return
  }
  if (form.type === 'stock_in' && (!form.quantity || !form.amount)) {
    ElMessage.warning('请填写入库数量和总价')
    return
  }
  if (form.type === 'stock_out' && !form.quantity) {
    ElMessage.warning('请填写出库数量')
    return
  }

  const data = {
    date: form.date,
    type: form.type,
    buyerId: form.buyerId,
    sellerId: form.sellerId,
    productId: form.productId,
    model: form.model,
    unit: form.unit,
    quantity: form.quantity,
    amount: form.type === 'stock_in' ? form.amount : 0,
    taxRate: form.taxRate,
    remark: form.remark,
  }

  let res
  if (form.id) {
    res = await stockApi.update(form.id, data)
  } else {
    res = await stockApi.create(data)
  }

  if (res.success) {
    ElMessage.success(form.id ? '修改成功' : '新增成功')
    dialogVisible.value = false
    await loadStockList()
  } else {
    ElMessage.error(res.message || (form.id ? '修改失败' : '新增失败'))
  }
}

const loadStockList = async () => {
  const params: any = {}
  if (queryForm.month) params.month = queryForm.month
  if (queryForm.unit) params.unit = queryForm.unit
  if (queryForm.product) params.product = queryForm.product

  const res = await stockApi.listWithBalance(params)
  if (res.success) {
    stockListWithPreviousStock.value = res.data
  }

  const summaryRes = await stockApi.getSummary(params)
  if (summaryRes.success) {
    summaryData.value = summaryRes.data
  }
}

const loadCustomers = async () => {
  const res = await customerApi.list({ page: 1, pageSize: 100 })
  if (res.success) {
    customerOptions.value = res.data.data.map((item: any) => ({
      id: item.id,
      name: item.name,
      type: item.type,
    }))
    unitOptions.value = [...new Set(customerOptions.value.map((c: any) => c.name))].map(name => ({
      label: name,
      value: name,
    }))
  }
}

const loadProducts = async () => {
  const res = await productApi.list({ page: 1, pageSize: 100 })
  if (res.success) {
    productList.value = res.data.data
    const productNames = [...new Set(res.data.data.map((p: any) => p.name))]
    productOptions.value = productNames.map(name => ({
      label: name,
      value: name,
    }))
  }
}

onMounted(() => {
  loadCustomers()
  loadProducts()
  loadStockList()
})
</script>

<style scoped>
.stock-management {
  padding: 20px;
}

.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 4px;
}

.search-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-btns {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-select {
  width: 120px;
  height: 32px;
}

.search-btn {
  width: 80px;
}

.reset-btn {
  width: 80px;
}

.add-btn {
  width: 80px;
}

.table-section {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
}
</style>