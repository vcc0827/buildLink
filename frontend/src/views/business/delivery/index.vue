<template>
  <div class="delivery-container">
    <el-card>
      <template #header>
        <div class="header-actions">
          <el-button type="primary" @click="handleAdd">新增送货单</el-button>
          <el-button @click="handleImport">导入送货单</el-button>
        </div>
      </template>

      <!-- 搜索区域 -->
      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="单号">
          <el-input v-model="queryForm.no" placeholder="请输入单号" clearable @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item label="送货单位">
          <el-select v-model="queryForm.projectId" placeholder="请选择" clearable filterable style="width: 200px">
            <el-option v-for="item in projectList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="queryForm.supplierId" placeholder="请选择" clearable filterable style="width: 200px">
            <el-option v-for="item in supplierList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="queryForm.date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 150px" />
        </el-form-item>
        <el-form-item label="品名">
          <el-select v-model="queryForm.productName" placeholder="请选择" clearable filterable style="width: 150px">
            <el-option v-for="item in productNameOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="请选择" clearable style="width: 120px">
            <el-option label="待审核" value="pending" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="no" label="单号" width="180" />
        <el-table-column prop="date" label="日期" width="100" formatter={(row) => formatDate(row.date)} />
        <el-table-column prop="projectName" label="送货单位" min-width="200" />
        <el-table-column prop="supplierName" label="供应商" min-width="200" />
        <el-table-column prop="salesman" label="业务员" width="100" />
        <el-table-column prop="driver" label="驾驶员" width="100" />
        <el-table-column label="采购金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">{{ formatCurrency(row.purchaseTotal) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="销售金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">{{ formatCurrency(row.salesTotal) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 新增/编辑/查看弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="90%" top="5vh" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="日期" prop="date">
              <el-date-picker v-model="form.date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" :disabled="dialogType === 'view'" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="送货单位" prop="projectId">
              <el-select v-model="form.projectId" placeholder="请选择" filterable style="width: 100%" :disabled="dialogType === 'view'" @change="handleProjectChange">
                <el-option v-for="item in projectList" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="供应商" prop="supplierId">
              <el-select v-model="form.supplierId" placeholder="请选择" filterable style="width: 100%" :disabled="dialogType === 'view'" @change="handleSupplierChange">
                <el-option v-for="item in supplierList" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="所属区域" prop="region">
              <el-input v-model="form.region" placeholder="请输入" :disabled="dialogType === 'view'" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="合同归属" prop="contractBelong">
              <el-input v-model="form.contractBelong" placeholder="请输入" :disabled="dialogType === 'view'" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="业务员" prop="salesman">
              <el-input v-model="form.salesman" placeholder="请输入" :disabled="dialogType === 'view'" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="驾驶员" prop="driver">
              <el-input v-model="form.driver" placeholder="请输入" :disabled="dialogType === 'view'" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%" :disabled="dialogType === 'view'">
                <el-option label="待审核" value="pending" />
                <el-option label="已确认" value="confirmed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" placeholder="请输入" :disabled="dialogType === 'view'" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 货品明细 -->
        <el-divider content-position="left">货品明细</el-divider>

        <div class="items-section">
          <el-button type="primary" plain @click="handleAddItem" :disabled="dialogType === 'view'" style="margin-bottom: 10px">添加明细</el-button>

          <el-table :data="form.items" border stripe size="small">
            <el-table-column label="品名" width="150">
              <template #default="{ row, $index }">
                <el-input v-model="row.productName" placeholder="品名" :disabled="dialogType === 'view'" @blur="handleProductNameChange($index)" />
              </template>
            </el-table-column>
            <el-table-column label="规格型号" width="120">
              <template #default="{ row }">
                <el-input v-model="row.spec" placeholder="规格" :disabled="dialogType === 'view'" />
              </template>
            </el-table-column>
            <el-table-column label="砂浆吨数" width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.mortarTonnage" :precision="4" :min="0" placeholder="吨" :disabled="dialogType === 'view'" controls-position="right" style="width: 100%" @change="calculateItemAmounts($index)" />
              </template>
            </el-table-column>
            <el-table-column label="砌块数量" width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.blockQuantity" :precision="4" :min="0" placeholder="数量" :disabled="dialogType === 'view'" controls-position="right" style="width: 100%" @change="calculateItemAmounts($index)" />
              </template>
            </el-table-column>
            <el-table-column label="实收数量" width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.receivedQuantity" :precision="4" :min="0" placeholder="实收" :disabled="dialogType === 'view'" controls-position="right" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="折立方" width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.cubicMeter" :precision="4" :min="0" placeholder="立方" :disabled="dialogType === 'view'" controls-position="right" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="包装类型" width="100">
              <template #default="{ row }">
                <el-select v-model="row.packingType" placeholder="选择" :disabled="dialogType === 'view'" style="width: 100%">
                  <el-option label="散装" value="bulk" />
                  <el-option label="袋包" value="bagged" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="采购单价" width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.purchaseUnitPrice" :precision="4" :min="0" placeholder="单价" :disabled="dialogType === 'view'" controls-position="right" style="width: 100%" @change="calculateItemAmounts($index)" />
              </template>
            </el-table-column>
            <el-table-column label="采购金额" width="120">
              <template #default="{ row }">
                <span>{{ formatCurrency(row.purchaseAmount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="销售单价" width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.salesUnitPrice" :precision="4" :min="0" placeholder="单价" :disabled="dialogType === 'view'" controls-position="right" style="width: 100%" @change="calculateItemAmounts($index)" />
              </template>
            </el-table-column>
            <el-table-column label="销售金额" width="120">
              <template #default="{ row }">
                <span>{{ formatCurrency(row.salesAmount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="带去铁架" width="100">
              <template #default="{ row }">
                <el-input-number v-model="row.frameTaken" :min="0" placeholder="数量" :disabled="dialogType === 'view'" controls-position="right" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="带回铁架" width="100">
              <template #default="{ row }">
                <el-input-number v-model="row.frameReturned" :min="0" placeholder="数量" :disabled="dialogType === 'view'" controls-position="right" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="120">
              <template #default="{ row }">
                <el-input v-model="row.remark" placeholder="备注" :disabled="dialogType === 'view'" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right" v-if="dialogType !== 'view'">
              <template #default="{ $index }">
                <el-button link type="danger" size="small" @click="handleRemoveItem($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 汇总 -->
        <div class="summary-section">
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="summary-item">
                <span class="label">采购总金额：</span>
                <span class="value">{{ formatCurrency(totalPurchaseAmount) }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <span class="label">销售总金额：</span>
                <span class="value">{{ formatCurrency(totalSalesAmount) }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <span class="label">毛利：</span>
                <span class="value profit">{{ formatCurrency(totalSalesAmount - totalPurchaseAmount) }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-form>

      <template #footer v-if="dialogType !== 'view'">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 导入弹窗 -->
    <el-dialog v-model="importDialogVisible" title="导入送货单" width="500px">
      <el-upload
        ref="uploadRef"
        class="upload-demo"
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
        accept=".xlsx,.xls"
      >
        <el-button type="primary">选择Excel文件</el-button>
        <template #tip>
          <div class="el-upload__tip">支持.xlsx和.xls格式，请确保文件包含正确的列名</div>
        </template>
      </el-upload>

      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportSubmit" :loading="importing">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deliveryApi } from '@/api'
import type { DeliveryOrder, DeliveryOrderItemNew } from '@/types'
import * as XLSX from 'xlsx'

const loading = ref(false)
const submitting = ref(false)
const importDialogVisible = ref(false)
const importing = ref(false)
const uploadRef = ref()
const fileList = ref<any[]>([])
const importData = ref<any[]>([])

const tableData = ref<DeliveryOrder[]>([])
const projectList = ref<{ id: number; name: string }[]>([])
const supplierList = ref<{ id: number; name: string }[]>([])
const productNameOptions = ref<string[]>([])

const queryForm = reactive({
  no: '',
  projectId: undefined as number | undefined,
  supplierId: undefined as number | undefined,
  date: '',
  productName: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit' | 'view'>('add')
const dialogTitle = computed(() => {
  return { add: '新增送货单', edit: '编辑送货单', view: '查看送货单' }[dialogType.value]
})

const formRef = ref()
const form = reactive({
  id: undefined as number | undefined,
  date: '',
  projectId: undefined as number | undefined,
  supplierId: undefined as number | undefined,
  region: '',
  contractBelong: '',
  salesman: '',
  driver: '',
  status: 'pending',
  remark: '',
  items: [] as DeliveryOrderItemNew[]
})

const formRules = {
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  projectId: [{ required: true, message: '请选择送货单位', trigger: 'change' }],
  supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }]
}

const defaultItem: DeliveryOrderItemNew = {
  productName: '',
  spec: '',
  mortarTonnage: undefined,
  packingType: 'bulk',
  blockQuantity: undefined,
  receivedQuantity: undefined,
  cubicMeter: undefined,
  purchaseUnitPrice: 0,
  purchaseAmount: 0,
  salesUnitPrice: 0,
  salesAmount: 0,
  frameTaken: 0,
  frameReturned: 0,
  remark: ''
}

const totalPurchaseAmount = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.purchaseAmount || 0), 0)
})

const totalSalesAmount = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.salesAmount || 0), 0)
})

onMounted(() => {
  loadData()
  loadCustomers()
  loadSuppliers()
  loadProductNames()
})

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...queryForm
    }
    const res = await deliveryApi.list(params)
    tableData.value = res.list
    pagination.total = res.total
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

const loadCustomers = async () => {
  try {
    const res = await deliveryApi.getCustomerList()
    projectList.value = res
  } catch (error) {
    console.error('加载客户列表失败:', error)
  }
}

const loadSuppliers = async () => {
  try {
    const res = await deliveryApi.getSupplierList()
    supplierList.value = res
  } catch (error) {
    console.error('加载供应商列表失败:', error)
  }
}

const loadProductNames = async () => {
  try {
    const res = await deliveryApi.getProductNames()
    productNameOptions.value = res
  } catch (error) {
    console.error('加载产品名称列表失败:', error)
  }
}

const handleReset = () => {
  Object.assign(queryForm, {
    no: '',
    projectId: undefined,
    supplierId: undefined,
    date: '',
    productName: '',
    status: ''
  })
  pagination.page = 1
  loadData()
}

const handleAdd = () => {
  dialogType.value = 'add'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: DeliveryOrder) => {
  dialogType.value = 'edit'
  loadFormData(row.id!)
}

const handleView = (row: DeliveryOrder) => {
  dialogType.value = 'view'
  loadFormData(row.id!)
}

const loadFormData = async (id: number) => {
  try {
    const res = await deliveryApi.get(id)
    Object.assign(form, {
      id: res.id,
      date: res.date,
      projectId: res.projectId,
      supplierId: res.supplierId,
      region: res.region || '',
      contractBelong: res.contractBelong || '',
      salesman: res.salesman || '',
      driver: res.driver || '',
      status: res.status,
      remark: res.remark || '',
      items: res.items.map((item: any) => ({ ...item }))
    })
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

const resetForm = () => {
  form.id = undefined
  form.date = new Date().toISOString().split('T')[0]
  form.projectId = undefined
  form.supplierId = undefined
  form.region = ''
  form.contractBelong = ''
  form.salesman = ''
  form.driver = ''
  form.status = 'pending'
  form.remark = ''
  form.items = []
}

const handleAddItem = () => {
  form.items.push({ ...defaultItem })
}

const handleRemoveItem = (index: number) => {
  form.items.splice(index, 1)
}

const calculateItemAmounts = async (index: number) => {
  const item = form.items[index]
  
  // 计算采购金额
  if (item.mortarTonnage && item.purchaseUnitPrice) {
    item.purchaseAmount = item.mortarTonnage * item.purchaseUnitPrice
  } else if (item.blockQuantity && item.purchaseUnitPrice) {
    item.purchaseAmount = item.blockQuantity * item.purchaseUnitPrice
  } else {
    item.purchaseAmount = 0
  }
  
  // 计算销售金额
  if (item.mortarTonnage && item.salesUnitPrice) {
    item.salesAmount = item.mortarTonnage * item.salesUnitPrice
  } else if (item.blockQuantity && item.salesUnitPrice) {
    item.salesAmount = item.blockQuantity * item.salesUnitPrice
  } else {
    item.salesAmount = 0
  }
}

const handleProductNameChange = async (index: number) => {
  const item = form.items[index]
  if (!item.productName || !form.supplierId || !form.projectId) return

  try {
    const res = await deliveryApi.calculatePrices({
      supplierId: form.supplierId,
      projectId: form.projectId,
      items: [{ productName: item.productName }]
    })
    
    if (res && res.length > 0) {
      const priceInfo = res[0]
      if (priceInfo.purchaseUnitPrice && !item.purchaseUnitPrice) {
        item.purchaseUnitPrice = priceInfo.purchaseUnitPrice
      }
      if (priceInfo.salesUnitPrice && !item.salesUnitPrice) {
        item.salesUnitPrice = priceInfo.salesUnitPrice
      }
      calculateItemAmounts(index)
    }
  } catch (error) {
    console.error('计算价格失败:', error)
  }
}

const handleProjectChange = () => {
  // 选择项目后，重新计算所有明细的价格
  form.items.forEach((_, index) => {
    handleProductNameChange(index)
  })
}

const handleSupplierChange = () => {
  // 选择供应商后，重新计算所有明细的价格
  form.items.forEach((_, index) => {
    handleProductNameChange(index)
  })
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    if (form.items.length === 0) {
      ElMessage.warning('请添加货品明细')
      return
    }
    
    submitting.value = true
    
    // 计算每行的金额
    form.items.forEach((item, index) => {
      calculateItemAmounts(index)
    })
    
    if (dialogType.value === 'add') {
      await deliveryApi.create(form)
      ElMessage.success('新增成功')
    } else {
      await deliveryApi.update(form.id!, form)
      ElMessage.success('更新成功')
    }
    
    dialogVisible.value = false
    loadData()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (row: DeliveryOrder) => {
  try {
    await ElMessageBox.confirm('确定要删除这条送货单吗？', '提示', {
      type: 'warning'
    })
    
    await deliveryApi.delete(row.id!)
    ElMessage.success('删除成功')
    loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleImport = () => {
  importDialogVisible.value = true
}

const handleFileChange = (file: any) => {
  fileList.value = [file]
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      importData.value = XLSX.utils.sheet_to_json(worksheet)
    } catch (error) {
      ElMessage.error('解析Excel文件失败')
    }
  }
  reader.readAsBinaryString(file.raw)
}

const handleImportSubmit = async () => {
  if (importData.value.length === 0) {
    ElMessage.warning('请先选择Excel文件')
    return
  }

  try {
    importing.value = true
    
    const res = await deliveryApi.importDeliveryOrders({
      rows: importData.value,
      customerMappings: projectList.value,
      supplierMappings: supplierList.value
    })

    if (res.success > 0) {
      ElMessage.success(`成功导入 ${res.success} 条数据`)
    }
    if (res.failed > 0) {
      ElMessage.warning(`有 ${res.failed} 条数据导入失败`)
      if (res.errors && res.errors.length > 0) {
        console.error('导入错误:', res.errors)
      }
    }

    importDialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

const formatDate = (date: string) => {
  if (!date) return ''
  return date.split('T')[0]
}

const formatCurrency = (value: number) => {
  if (!value && value !== 0) return ''
  return value.toFixed(2)
}

const getStatusType = (status: string) => {
  const map: any = {
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: any = {
    pending: '待审核',
    confirmed: '已确认',
    cancelled: '已取消'
  }
  return map[status] || status
}
</script>

<style scoped>
.delivery-container {
  padding: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-form {
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.amount {
  font-weight: 500;
}

.items-section {
  margin-top: 10px;
}

.summary-section {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.summary-item {
  display: flex;
  align-items: center;
  font-size: 16px;
}

.summary-item .label {
  color: #606266;
}

.summary-item .value {
  font-weight: bold;
  color: #303133;
}

.summary-item .value.profit {
  color: #67c23a;
}
</style>
