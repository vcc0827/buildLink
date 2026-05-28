<template>
  <div class="page-container">
    <div class="search-bar">
      <div class="search-group">
        <el-input
          v-model="queryForm.no"
          placeholder="请输入报货单号搜索"
          clearable
          class="search-input"
          @keyup.enter="handleQuery"
        />
        <el-select v-model="queryForm.status" placeholder="状态" clearable style="width: 120px" @change="handleQuery">
          <el-option label="待发货" value="pending" />
          <el-option label="已发货" value="delivered" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-button type="primary" class="search-btn" @click="handleQuery">
          <el-icon><Search /></el-icon> 查询
        </el-button>
      </div>
    </div>

    <div class="flex-between mb-16">
      <div>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchCancel">
          <el-icon><Delete /></el-icon> 批量取消 ({{ selectedRows.length }})
        </el-button>
      </div>
      <div>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新增报货单
        </el-button>
      </div>
    </div>

    <!-- 主列表表格 -->
    <el-table :data="tableData" border stripe v-loading="loading" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" />
      <el-table-column prop="no" label="报货单号" width="180" />
      <el-table-column prop="supplierName" label="供货单位" min-width="150" />
      <el-table-column prop="customerName" label="项目名称" min-width="150" />
      <el-table-column prop="categoryName" label="产品品类" width="140" />
      <el-table-column prop="planDeliveryDate" label="计划发货日期" width="140">
        <template #default="{ row }">
          <span :class="{ 'overdue': isOverdue(row.planDeliveryDate) }">
            {{ formatDate(row.planDeliveryDate) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="totalQuantity" label="总数量" width="120" align="right" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleView(row)">查看</el-button>
          <el-button v-if="row.status === 'pending'" type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button v-if="row.status === 'pending'" type="success" link @click="handleCreateDelivery(row)">生成送货单</el-button>
          <el-button v-if="row.status === 'pending'" type="danger" link @click="handleCancel(row)">取消</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="mt-16" v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @size-change="loadData" @current-change="loadData" />

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="950px" @closed="onDialogClosed">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计划发货日期" prop="planDeliveryDate">
              <el-date-picker v-model="form.planDeliveryDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报货单号" prop="no">
              <el-input v-model="form.no" placeholder="系统自动生成" :disabled="!!form.id" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联合同" prop="contractId">
              <el-select v-model="form.contractId" placeholder="请选择（可选）" clearable style="width: 100%">
                <el-option v-for="c in contracts" :key="c.id" :label="c.no + ' - ' + c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供货单位" prop="supplierId">
              <el-select v-model="form.supplierId" placeholder="请输入关键词搜索" filterable :remote-method="searchSuppliers" @change="onSupplierChange" style="width: 100%">
                <el-option v-for="s in filteredSuppliers" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目名称" prop="customerId">
              <el-select v-model="form.customerId" placeholder="请输入关键词搜索" filterable :remote-method="searchCustomers" @change="onCustomerChange" style="width: 100%">
                <el-option v-for="c in filteredCustomers" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">产品明细</el-divider>

        <div class="items-section">
          <el-table :data="form.items" border size="small">
            <el-table-column label="产品品类" width="140">
              <template #default="{ row, $index }">
                <el-select v-model="row.categoryCode" placeholder="请选择" @change="onItemCategoryChange($index)" style="width: 100%">
                  <el-option v-for="cat in categories" :key="cat.code" :label="cat.name" :value="cat.code" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="产品" width="220">
              <template #default="{ row, $index }">
                <el-select v-model="row.productId" placeholder="输入关键词搜索" filterable :remote-method="(keyword) => searchProducts($index, keyword)" @change="onProductChange($index)" style="width: 100%">
                  <el-option v-for="p in getProductsForItem(row.categoryCode, $index)" :key="p.id" :label="p.name + (p.spec ? ' ' + p.spec : '')" :value="p.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="数量" width="130">
              <template #default="{ row }">
                <el-input-number v-model="row.quantity" :precision="4" :step="0.1" style="width: 100%" @change="calcTotalQuantity" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="60">
              <template #default="{ $index }">
                <el-button type="danger" link @click="removeItem($index)">删</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="primary" link class="mt-8" @click="addItem">
            <el-icon><Plus /></el-icon> 添加明细
          </el-button>
        </div>

        <el-row :gutter="20" class="mt-16">
          <el-col :span="12">
            <el-form-item label="总数量">
              <span class="total-amount">{{ Number(form.totalQuantity || 0).toFixed(2) }} {{ currentCategory?.unit }}</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 生成送货单对话框 -->
    <el-dialog v-model="createDeliveryVisible" title="生成送货单" width="800px">
      <el-form ref="deliveryFormRef" :model="deliveryForm" :rules="deliveryRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="送货日期" prop="deliveryDate">
              <el-date-picker v-model="deliveryForm.deliveryDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="业务类型" prop="businessType">
              <el-select v-model="deliveryForm.businessType" style="width: 100%">
                <el-option label="合同单" value="contract" />
                <el-option label="零售单" value="retail" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">送货明细（来自报货单）</el-divider>

        <el-table :data="deliveryForm.items" border size="small">
          <el-table-column prop="productName" label="产品" width="200" />
          <el-table-column prop="productSpec" label="规格" width="150" />
          <el-table-column label="报货数量" width="120" align="right">
            <template #default="{ row }">{{ row.quantity }}</template>
          </el-table-column>
          <el-table-column label="实收数量" width="120" align="right">
            <template #default="{ row }">
              <el-input-number v-model="row.receivedQuantity" :precision="4" :step="0.1" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120" align="right">
            <template #default="{ row }">
              <el-input-number v-model="row.price" :precision="4" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column label="金额" width="120" align="right">
            <template #default="{ row }">¥{{ Number(row.amount || 0).toFixed(2) }}</template>
          </el-table-column>
        </el-table>

        <el-form-item label="差异备注" prop="diffRemark">
          <el-input v-model="deliveryForm.diffRemark" type="textarea" :rows="2" placeholder="报货数量与实收数量不一致时，请填写差异原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDeliveryVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateDeliverySubmit">生成送货单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Search } from '@element-plus/icons-vue'
import type { Order, Customer, Contract, Product } from '@/types'
import { orderApi, customerApi, contractApi, productApi } from '@/api'

const loading = ref(false)
const tableData = ref<any[]>([])
const selectedRows = ref<any[]>([])
const dialogVisible = ref(false)
const createDeliveryVisible = ref(false)
const currentOrderId = ref<number>(0)

const customers = ref<Customer[]>([])
const suppliers = ref<Customer[]>([])
const contracts = ref<Contract[]>([])
const products = ref<Product[]>([])
const categories = ref<ProductCategory[]>([])

const filteredSuppliers = ref<Customer[]>([])
const filteredCustomers = ref<Customer[]>([])
const productSearchKeywords = ref<Record<number, string>>({})

const dialogTitle = computed(() => (form.id ? '编辑报货单' : '新增报货单'))

const searchSuppliers = (keyword: string) => {
  if (!keyword) {
    filteredSuppliers.value = suppliers.value
  } else {
    filteredSuppliers.value = suppliers.value.filter(s => 
      s.name.toLowerCase().includes(keyword.toLowerCase()) || 
      (s.shortName && s.shortName.toLowerCase().includes(keyword.toLowerCase()))
    )
  }
}

const searchCustomers = (keyword: string) => {
  if (!keyword) {
    filteredCustomers.value = customers.value
  } else {
    filteredCustomers.value = customers.value.filter(c => 
      c.name.toLowerCase().includes(keyword.toLowerCase()) || 
      (c.shortName && c.shortName.toLowerCase().includes(keyword.toLowerCase()))
    )
  }
}

const searchProducts = (index: number, keyword: string) => {
  productSearchKeywords.value[index] = keyword
}

const getProductsForItem = (categoryCode: string, excludeIndex: number): any[] => {
  let availableProducts = products.value.filter(p => p.categoryCode === categoryCode)
  
  const selectedProductIds = form.items
    .filter((_, idx) => idx !== excludeIndex)
    .map(item => item.productId)
    .filter(Boolean)
  
  availableProducts = availableProducts.filter(p => !selectedProductIds.includes(p.id))
  
  const keyword = productSearchKeywords.value[excludeIndex]
  if (keyword) {
    availableProducts = availableProducts.filter(p => 
      p.name.toLowerCase().includes(keyword.toLowerCase()) ||
      (p.spec && p.spec.toLowerCase().includes(keyword.toLowerCase())) ||
      (p.model && p.model.toLowerCase().includes(keyword.toLowerCase()))
    )
  }
  
  return availableProducts
}

const queryForm = reactive({ no: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const formRef = ref()
const deliveryFormRef = ref()

const defaultItem = (): any => ({
  productId: undefined,
  productName: '',
  productSpec: '',
  quantity: 0,
  unit: '',
  categoryCode: ''
})

const form = reactive<any>({
  id: undefined,
  no: '',
  contractId: undefined,
  supplierId: undefined,
  supplierName: '',
  customerId: undefined,
  customerName: '',
  planDeliveryDate: '',
  totalQuantity: 0,
  status: 'pending',
  remark: '',
  items: [{ ...defaultItem() }]
})

const deliveryForm = reactive<any>({
  deliveryDate: '',
  businessType: 'contract',
  items: [],
  diffRemark: ''
})

const rules = {
  supplierId: [{ required: true, message: '请选择供货单位', trigger: 'change' }],
  customerId: [{ required: true, message: '请选择项目', trigger: 'change' }],
  planDeliveryDate: [{ required: true, message: '请选择计划发货日期', trigger: 'change' }]
}

const deliveryRules = {
  deliveryDate: [{ required: true, message: '请选择送货日期', trigger: 'change' }],
  businessType: [{ required: true, message: '请选择业务类型', trigger: 'change' }]
}

const formatDate = (date: any) => {
  if (!date) return '-'
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const isOverdue = (date: string) => {
  if (!date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const planDate = new Date(date)
  planDate.setHours(0, 0, 0, 0)
  return planDate < today
}

const getStatusType = (status: string): 'success' | 'warning' | 'info' | 'danger' => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
    pending: 'warning',
    delivered: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => ({ pending: '待发货', delivered: '已发货', cancelled: '已取消' }[status] || status)

const calcTotalQuantity = () => {
  form.totalQuantity = form.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
}

const onItemCategoryChange = (index: number) => {
  form.items[index].productId = undefined
  form.items[index].productName = ''
  form.items[index].productSpec = ''
  form.items[index].unit = ''
  calcTotalQuantity()
}

const onProductChange = (index: number) => {
  const product = products.value.find(p => p.id === form.items[index].productId)
  if (product) {
    form.items[index].productName = product.name
    form.items[index].productSpec = product.spec || ''
    form.items[index].unit = product.unit || ''
    calcTotalQuantity()
  }
}

const addItem = () => {
  form.items.push({ ...defaultItem() })
}

const removeItem = (index: number) => {
  form.items.splice(index, 1)
  calcTotalQuantity()
}

const loadData = async () => {
  loading.value = true
  try {
    const params = { ...queryForm, page: pagination.page, pageSize: pagination.pageSize }
    const res = await orderApi.list(params)
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch {
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const res = await productApi.getCategories()
    const data = res.data || []
    if (Array.isArray(data)) {
      categories.value = data.map((item: any) => {
        if (typeof item === 'string') {
          return { code: item, name: item }
        }
        return { code: item.code, name: item.name }
      })
    }
  } catch {
    categories.value = []
  }
}

const loadCustomers = async () => {
  try {
    const [suppliersRes, customersRes] = await Promise.all([
      customerApi.list({ type: 'supplier', page: 1, pageSize: 100 }),
      customerApi.list({ type: 'project', page: 1, pageSize: 100 })
    ])
    suppliers.value = suppliersRes.data.list
    customers.value = customersRes.data.list
    filteredSuppliers.value = suppliers.value
    filteredCustomers.value = customers.value
  } catch {
    suppliers.value = []
    customers.value = []
    filteredSuppliers.value = []
    filteredCustomers.value = []
  }
}

const loadContracts = async () => {
  try {
    const res = await contractApi.list({ page: 1, pageSize: 100 })
    contracts.value = res.data.list
  } catch {
    contracts.value = []
  }
}

const loadProducts = async () => {
  try {
    const res = await productApi.list({ page: 1, pageSize: 100 })
    products.value = res.data.list || []
  } catch {
    products.value = []
  }
}

const onDialogClosed = () => {
  formRef.value?.resetFields()
}

const handleQuery = () => {
  pagination.page = 1
  loadData()
}

const handleAdd = () => {
  Object.assign(form, {
    id: undefined,
    no: '',
    contractId: undefined,
    supplierId: undefined,
    supplierName: '',
    customerId: undefined,
    customerName: '',
    planDeliveryDate: '',
    totalQuantity: 0,
    status: 'pending',
    remark: '',
    items: [{ ...defaultItem() }]
  })
  dialogVisible.value = true
}

const handleEdit = async (row: any) => {
  try {
    const res = await orderApi.get(row.id)
    const data = res.data
    Object.assign(form, {
      ...data,
      items: (data.items || []).length ? data.items : [{ ...defaultItem() }]
    })
    dialogVisible.value = true
  } catch {
    ElMessage.error('获取数据失败')
  }
}

const handleView = async (row: any) => {
  try {
    const res = await orderApi.get(row.id)
    const data = res.data
    Object.assign(form, { ...data })
    dialogVisible.value = true
  } catch {
    ElMessage.error('获取数据失败')
  }
}

const handleCancel = async (row: Order) => {
  await ElMessageBox.confirm('确认取消该报货单吗？', '提示', { type: 'warning' })
  try {
    await orderApi.update(row.id, { status: 'cancelled' })
    ElMessage.success('取消成功')
    loadData()
  } catch {
    ElMessage.error('取消失败')
  }
}

const handleBatchCancel = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要取消的报货单')
    return
  }
  await ElMessageBox.confirm(`确认取消选中的 ${selectedRows.value.length} 条报货单吗？`, '提示', { type: 'warning' })
  try {
    const ids = selectedRows.value.map(r => r.id)
    await Promise.all(ids.map(id => orderApi.update(id, { status: 'cancelled' })))
    ElMessage.success('批量取消成功')
    selectedRows.value = []
    loadData()
  } catch {
    ElMessage.error('批量取消失败')
  }
}

const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows
}

const handleCreateDelivery = async (row: any) => {
  currentOrderId.value = row.id
  try {
    const res = await orderApi.get(row.id)
    const order = res.data
    deliveryForm.deliveryDate = formatDate(new Date())
    deliveryForm.businessType = order.contractId ? 'contract' : 'retail'
    deliveryForm.items = order.items.map((item: any) => ({
      productId: item.productId,
      productName: item.productName,
      productSpec: item.productSpec,
      quantity: item.quantity,
      receivedQuantity: item.quantity,
      price: 0,
      amount: 0
    }))
    deliveryForm.diffRemark = ''
    createDeliveryVisible.value = true
  } catch {
    ElMessage.error('获取报货单数据失败')
  }
}

const handleCreateDeliverySubmit = async () => {
  const valid = await deliveryFormRef.value.validate().catch(() => false)
  if (!valid) return

  const itemsWithAmount = deliveryForm.items.map((item: any) => ({
    ...item,
    amount: (item.receivedQuantity || 0) * (item.price || 0)
  }))

  try {
    await orderApi.createDelivery(currentOrderId.value, {
      deliveryDate: deliveryForm.deliveryDate,
      businessType: deliveryForm.businessType,
      items: itemsWithAmount,
      diffRemark: deliveryForm.diffRemark
    })
    ElMessage.success('送货单生成成功')
    createDeliveryVisible.value = false
    loadData()
  } catch {
    ElMessage.error('生成送货单失败')
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (!form.items || form.items.length === 0) {
    ElMessage.error('请添加产品明细')
    return
  }

  const hasEmptyCategory = form.items.some(item => !item.categoryCode)
  const hasEmptyProduct = form.items.some(item => !item.productId)
  const hasEmptyQuantity = form.items.some(item => !item.quantity || item.quantity <= 0)

  if (hasEmptyCategory) {
    ElMessage.error('请选择所有产品的品类')
    return
  }

  if (hasEmptyProduct) {
    ElMessage.error('请选择所有产品')
    return
  }

  if (hasEmptyQuantity) {
    ElMessage.error('请填写有效的数量')
    return
  }

  calcTotalQuantity()

  const submitData = {
    contractId: form.contractId,
    supplierId: form.supplierId,
    customerId: form.customerId,
    planDeliveryDate: form.planDeliveryDate,
    remark: form.remark,
    items: form.items.map((item: any) => ({
      categoryCode: item.categoryCode,
      productId: item.productId,
      productName: item.productName,
      productSpec: item.productSpec,
      quantity: item.quantity,
      unit: item.unit
    }))
  }

  try {
    if (form.id) {
      await orderApi.update(form.id, submitData)
    } else {
      await orderApi.create(submitData)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch {
    ElMessage.error('保存失败')
  }
}

const onSupplierChange = (id: number) => {
  const s = suppliers.value.find(x => x.id === id)
  if (s) form.supplierName = s.name
}

const onCustomerChange = (id: number) => {
  const c = customers.value.find(x => x.id === id)
  if (c) form.customerName = c.name
}

onMounted(async () => {
  await loadCategories()
  await Promise.all([
    loadData(),
    loadCustomers(),
    loadContracts(),
    loadProducts()
  ])
})
</script>

<style scoped lang="scss">
.items-section { width: 100%; }
.amount-text { color: #409eff; font-weight: 500; }
.total-amount { font-size: 18px; color: #f56c6c; font-weight: bold; }
.overdue { color: #f56c6c; font-weight: bold; }

.page-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.search-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 250px;
  :deep(.el-input__wrapper) {
    border-radius: 4px;
    box-shadow: none;
  }
}

.search-btn {
  height: 36px;
  padding: 0 20px;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  background: linear-gradient(135deg, #4a90d9 0%, #357abd 100%);
  color: #fff;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mb-16 { margin-bottom: 16px; }
.mt-8 { margin-top: 8px; }
.mt-16 { margin-top: 16px; }
</style>