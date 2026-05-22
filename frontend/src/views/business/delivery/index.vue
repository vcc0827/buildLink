<template>
  <div class="page-container">
    <div class="search-bar">
      <div class="search-group">
        <el-input
          v-model="queryForm.no"
          placeholder="请输入送货单号搜索"
          clearable
          class="search-input"
          @keyup.enter="handleQuery"
        />
        <el-select v-model="queryForm.productName" placeholder="选择产品" clearable class="search-select" @change="handleQuery">
          <el-option v-for="item in productNameOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-button type="primary" class="search-btn" @click="handleQuery">
          <el-icon><Search /></el-icon> 查询
        </el-button>
      </div>
      <el-button  type="primary" class="export-btn" @click="handleExport">
        <el-icon><Download /></el-icon> 下载
      </el-button>
    </div>

    <div class="flex-between mb-16">
      <div>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon> 批量删除 ({{ selectedRows.length }})
        </el-button>
        <el-button v-if="showRecycleBin" type="warning" @click="handleRecycleBin">
          <el-icon><Delete /></el-icon> 回收站
        </el-button>
      </div>
      <div>
        <el-button type="success" @click="handleImport">
          <el-icon><Upload /></el-icon> 导入送货单
        </el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新增送货单
        </el-button>
      </div>
    </div>

    <el-table :data="tableData" border stripe v-loading="loading" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" />
      <el-table-column prop="no" label="送货单号" width="180" />
      <el-table-column prop="supplierName" label="供货单位" min-width="150" />
      <el-table-column prop="customerName" label="项目名称" min-width="150" />
      <el-table-column prop="productType" label="产品类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.productType === 'mortar' ? 'success' : 'warning'" size="small">
            {{ row.productType === 'mortar' ? '砂浆' : '蒸压加气混凝土砌块' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="deliveryDate" label="送货日期" width="110">
        <template #default="{ row }">{{ formatDate(row.deliveryDate) }}</template>
      </el-table-column>
      <el-table-column prop="totalAmount" label="总金额" width="120" align="right">
        <template #default="{ row }"> ¥{{ row.totalAmount?.toLocaleString() }} </template>
      </el-table-column>
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
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="mt-16" v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @size-change="loadData" @current-change="loadData" />

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="900px" @closed="onDialogClosed">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品类型" prop="productType">
              <el-select v-model="form.productType" placeholder="请选择" :disabled="!!form.id" style="width: 100%" @change="onProductTypeChange">
                <el-option label="砂浆" value="mortar" />
                <el-option label="蒸压加气混凝土砌块" value="block" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="送货日期" prop="deliveryDate">
              <el-date-picker v-model="form.deliveryDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="送货单号" prop="no">
              <el-input v-model="form.no" placeholder="请输入（由厂家提供）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联合同" prop="contractId">
              <el-select v-model="form.contractId" placeholder="请选择（可选）" clearable style="width: 100%" @change="onContractChange">
                <el-option v-for="c in contracts" :key="c.id" :label="c.no + ' - ' + c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供货单位" prop="supplierId">
              <el-select v-model="form.supplierId" placeholder="请选择" @change="onSupplierChange" style="width: 100%">
                <el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目名称" prop="customerId">
              <el-select v-model="form.customerId" placeholder="请选择" @change="onCustomerChange" style="width: 100%">
                <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="待发货" value="pending" />
                <el-option label="已发货" value="delivered" />
                <el-option label="已确认" value="confirmed" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">产品明细</el-divider>

        <div class="items-section" v-if="form.productType === 'mortar'">
          <el-table :data="form.mortarItems" border size="small">
            <el-table-column label="产品" width="150">
              <template #default="{ row, $index }">
                <el-select v-model="row.productId" placeholder="选择产品" @change="onMortarProductChange($index)" style="width: 100%">
                  <el-option v-for="p in mortarProducts" :key="p.id" :label="p.name" :value="p.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="砂浆标号" width="120">
              <template #default="{ row }">
                <el-input v-model="row.mortarGrade" placeholder="如：M5" />
              </template>
            </el-table-column>
            <el-table-column label="数量(吨)" width="130">
              <template #default="{ row }">
                <el-input-number v-model="row.quantity" :precision="4" :step="0.1" style="width: 100%" @change="calcMortarItemAmount(row)" />
              </template>
            </el-table-column>
            <el-table-column label="单价" width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.price" :min="0" :precision="4" style="width: 100%" @change="calcMortarItemAmount(row)" />
              </template>
            </el-table-column>
            <el-table-column label="金额(元)" width="120">
              <template #default="{ row }">
                <span class="amount-text">¥{{ Number(row.amount || 0).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="散装/袋包" width="100">
              <template #default="{ row }">
                <el-select v-model="row.packingType" placeholder="选择" style="width: 100%">
                  <el-option label="散装" value="bulk" />
                  <el-option label="袋包" value="bagged" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="车牌号" width="120">
              <template #default="{ row }">
                <el-input v-model="row.licensePlate" placeholder="如：沪A12345" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="60">
              <template #default="{ $index }">
                <el-button type="danger" link @click="removeMortarItem($index)">删</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="primary" link class="mt-8" @click="addMortarItem">
            <el-icon><Plus /></el-icon> 添加砂浆明细
          </el-button>
        </div>

        <div class="items-section" v-else-if="form.productType === 'block'">
          <el-table :data="form.blockItems" border size="small">
            <el-table-column label="产品" width="180">
              <template #default="{ row, $index }">
                <el-select v-model="row.productId" placeholder="选择产品" @change="onBlockProductChange($index)" style="width: 100%">
                  <el-option v-for="p in blockProducts" :key="p.id" :label="p.name + (p.spec ? ' ' + p.spec : '')" :value="p.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="规格型号" width="120">
              <template #default="{ row }">
                <span>{{ row.spec || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="实收数量" width="130">
              <template #default="{ row }">
                <el-input-number v-model="row.quantity" :precision="4" :step="1" style="width: 100%" @change="onBlockQuantityChange(row)" />
              </template>
            </el-table-column>
            <el-table-column label="折立方" width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.convertedCubic" :precision="4" :step="0.1" style="width: 100%" @change="onBlockCubicChange(row)" />
              </template>
            </el-table-column>
            <el-table-column label="单价" width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.price" :min="0" :precision="4" style="width: 100%" @change="calcBlockItemAmount(row)" />
              </template>
            </el-table-column>
            <el-table-column label="金额(元)" width="120">
              <template #default="{ row }">
                <span class="amount-text">¥{{ Number(row.amount || 0).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="带去铁架" width="80">
              <template #default="{ row }">
                <el-input v-model.number="row.frameTaken" type="number" min="0" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="带回铁架" width="80">
              <template #default="{ row }">
                <el-input v-model.number="row.frameReturned" type="number" min="0" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="60">
              <template #default="{ $index }">
                <el-button type="danger" link @click="removeBlockItem($index)">删</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="primary" link class="mt-8" @click="addBlockItem">
            <el-icon><Plus /></el-icon> 添加蒸压加气混凝土砌块明细
          </el-button>
        </div>

        <el-row :gutter="20" class="mt-16">
          <el-col :span="12">
            <el-form-item label="总金额">
              <span class="total-amount">¥{{ Number(form.totalAmount || 0).toFixed(2) }}</span>
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

    <el-dialog v-model="recycleBinVisible" title="回收站" width="900px">
      <div class="mb-16">
        <el-button type="warning" :disabled="recycleSelectedRows.length === 0" @click="handleBatchRestore">
          批量恢复 ({{ recycleSelectedRows.length }})
        </el-button>
      </div>
      <el-table :data="recycleBinData" border stripe v-loading="recycleLoading" @selection-change="handleRecycleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="no" label="送货单号" width="180" />
        <el-table-column prop="supplierName" label="供货单位" min-width="150" />
        <el-table-column prop="customerName" label="项目名称" min-width="150" />
        <el-table-column prop="productType" label="产品类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.productType === 'mortar' ? 'success' : 'warning'" size="small">
              {{ row.productType === 'mortar' ? '砂浆' : '蒸压加气混凝土砌块' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deliveryDate" label="送货日期" width="110">
          <template #default="{ row }">{{ formatDate(row.deliveryDate) }}</template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="总金额" width="120" align="right">
          <template #default="{ row }"> ¥{{ row.totalAmount?.toLocaleString() }} </template>
        </el-table-column>
        <el-table-column prop="deletedAt" label="删除时间" width="160">
          <template #default="{ row }">{{ formatDate(row.deletedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link @click="handleRestore(row)">恢复</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination class="mt-16" v-model:current-page="recyclePagination.page" v-model:page-size="recyclePagination.pageSize" :total="recyclePagination.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @size-change="loadRecycleBinData" @current-change="loadRecycleBinData" />
    </el-dialog>

    <el-dialog v-model="importDialogVisible" title="导入送货单" width="500px">
      <el-form :model="importForm" label-width="100px">
        <el-form-item label="产品类型" required>
          <el-radio-group v-model="importForm.productType">
            <el-radio label="mortar">砂浆</el-radio>
            <el-radio label="block">蒸压加气混凝土砌块</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="选择文件" required>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx"
            :on-change="handleFileChange"
          >
            <el-button type="primary">选择Excel文件</el-button>
            <template #tip>
              <div class="el-upload__tip">只能上传xlsx格式文件</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-button type="info" @click="downloadTemplate">下载模板</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importLoading" @click="handleImportSubmit">开始导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Upload, Search, Download } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import type { DeliveryOrder, DeliveryOrderMortarItem, DeliveryOrderBlockItem, Customer, Contract, Product } from '@/types'
import { deliveryApi, customerApi, contractApi, productApi } from '@/api'

const loading = ref(false)
const tableData = ref<any[]>([])
const selectedRows = ref<any[]>([])
const dialogVisible = ref(false)
const showRecycleBin = ref(false)
const recycleBinVisible = ref(false)
const recycleBinData = ref<any[]>([])
const recycleSelectedRows = ref<any[]>([])
const recycleLoading = ref(false)
const recyclePagination = reactive({ page: 1, pageSize: 10, total: 0 })
const importDialogVisible = ref(false)
const importLoading = ref(false)
const uploadRef = ref()
const importForm = reactive({
  productType: 'mortar',
  file: null as any
})
const customers = ref<Customer[]>([])
const suppliers = ref<Customer[]>([])
const contracts = ref<Contract[]>([])
const mortarProducts = ref<Product[]>([])
const blockProducts = ref<Product[]>([])
const contractItems = ref<any[]>([])
const dialogTitle = computed(() => (form.id ? '编辑送货单' : '新增送货单'))

const onDialogClosed = () => {
  formRef.value?.resetFields()
}

const formatDate = (date: any) => {
  if (!date) return '-'
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const queryForm = reactive({ no: '', productType: '', status: '', productName: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const formRef = ref()
const productNameOptions = ref<string[]>([])

const defaultMortarItem: DeliveryOrderMortarItem = {
  productId: undefined, quantity: 0, price: 0, amount: 0,
  mortarGrade: '', packingType: 'bulk', licensePlate: ''
}

const defaultBlockItem: DeliveryOrderBlockItem = {
  productId: undefined, quantity: 0, convertedCubic: 0, price: 0, amount: 0,
  frameTaken: 0, frameReturned: 0, remarks: ''
}

const form = reactive<any>({
  id: undefined, no: '', productType: 'mortar', contractId: undefined,
  supplierId: undefined, supplierName: '',
  customerId: undefined, customerName: '', deliveryDate: '', totalAmount: 0,
  status: 'pending', remark: '', mortarItems: [], blockItems: [], contractItems: []
})

const rules = {
  productType: [{ required: true, message: '请选择产品类型', trigger: 'change' }],
  supplierId: [{ required: true, message: '请选择供货单位', trigger: 'change' }],
  customerId: [{ required: true, message: '请选择项目', trigger: 'change' }],
  deliveryDate: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

const getStatusType = (status: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    pending: 'warning',
    delivered: 'primary',
    confirmed: 'success'
  }
  return map[status] || 'info'
}
const getStatusText = (status: string) => ({ pending: '待发货', delivered: '已发货', confirmed: '已确认' }[status] || status)

const calcMortarItemAmount = (item: DeliveryOrderMortarItem) => {
  item.amount = parseFloat(((item.quantity || 0) * (item.price || 0)).toFixed(2))
  calcTotalAmount()
}

const calcBlockItemAmount = (item: DeliveryOrderBlockItem) => {
  item.amount = parseFloat(((item.convertedCubic || 0) * (item.price || 0)).toFixed(2))
  calcTotalAmount()
}

const calcTotalAmount = () => {
  const items = form.productType === 'mortar' ? form.mortarItems : form.blockItems
  form.totalAmount = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
}

const onSupplierChange = (id: number) => {
  const s = suppliers.value.find(x => x.id === id)
  if (s) form.supplierName = s.name
}

const onCustomerChange = (id: number) => {
  const c = customers.value.find(x => x.id === id)
  if (c) form.customerName = c.name
}

const onProductTypeChange = (val: string) => {
  if (val === 'block' && form.blockItems.length === 0) {
    form.blockItems.push({ ...defaultBlockItem, model: '' })
  }
}

const onContractChange = async (contractId: number) => {
  contractItems.value = []
  if (!contractId) return

  try {
    const res = await contractApi.getById(contractId)
    contractItems.value = res.data.items || []

    if (form.productType === 'mortar' && form.mortarItems.length > 0) {
      form.mortarItems[0].price = 0
      form.mortarItems[0].mortarGrade = ''
    } else if (form.productType === 'block' && form.blockItems.length > 0) {
      form.blockItems[0].price = 0
    }
  } catch {
    contractItems.value = []
  }
}

const onMortarProductChange = (index: number) => {
  const contractItem = contractItems.value.find((item: any) => item.productId === form.mortarItems[index].productId)
  if (contractItem) {
    form.mortarItems[index].price = parseFloat(contractItem.price) || 0
    form.mortarItems[index].mortarGrade = contractItem.spec || ''
    calcMortarItemAmount(form.mortarItems[index])
  } else {
    const product = mortarProducts.value.find(p => p.id === form.mortarItems[index].productId)
    if (product) {
      form.mortarItems[index].price = product.price || 0
      calcMortarItemAmount(form.mortarItems[index])
    }
  }
}

const onBlockProductChange = (index: number) => {
  const contractItem = contractItems.value.find((item: any) => item.productId === form.blockItems[index].productId)
  if (contractItem) {
    form.blockItems[index].price = parseFloat(contractItem.price) || 0
    form.blockItems[index].spec = contractItem.spec || ''
    calcBlockItemAmount(form.blockItems[index])
  } else {
    const product = blockProducts.value.find(p => p.id === form.blockItems[index].productId)
    if (product) {
      form.blockItems[index].price = product.price || 0
      form.blockItems[index].spec = product.spec || ''
      calcBlockItemAmount(form.blockItems[index])
    }
  }
}

const onBlockQuantityChange = (row: any) => {
  if (row.spec) {
    const dims = parseBlockSpec(row.spec)
    if (dims) {
      row.convertedCubic = parseFloat((dims.l * dims.w * dims.h * row.quantity).toFixed(4))
    }
  }
  calcBlockItemAmount(row)
}

const onBlockCubicChange = (row: any) => {
  if (row.spec) {
    const dims = parseBlockSpec(row.spec)
    if (dims && dims.l * dims.w * dims.h !== 0) {
      row.quantity = parseFloat((row.convertedCubic / (dims.l * dims.w * dims.h)).toFixed(4))
    }
  }
  calcBlockItemAmount(row)
}

const parseBlockSpec = (spec: string): { l: number; w: number; h: number } | null => {
  const match = spec.match(/(\d+)\*(\d+)\*(\d+)/)
  if (match) {
    return {
      l: parseInt(match[1]) / 1000,
      w: parseInt(match[2]) / 1000,
      h: parseInt(match[3]) / 1000
    }
  }
  return null
}

const addMortarItem = () => {
  form.mortarItems.push({ ...defaultMortarItem })
}

const removeMortarItem = (index: number) => {
  form.mortarItems.splice(index, 1)
  calcTotalAmount()
}

const addBlockItem = () => {
  form.blockItems.push({ ...defaultBlockItem })
}

const removeBlockItem = (index: number) => {
  form.blockItems.splice(index, 1)
  calcTotalAmount()
}

const loadData = async () => {
  loading.value = true
  try {
    const params = { ...queryForm, page: pagination.page, pageSize: pagination.pageSize }
    const res = await deliveryApi.list(params)
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch {
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
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
  } catch {
    suppliers.value = []
    customers.value = []
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
    const allProducts = res.data.list
    mortarProducts.value = allProducts.filter((p: Product) => p.pricingType === 'info_price')
    blockProducts.value = allProducts.filter((p: Product) => p.pricingType === 'fixed_price')
  } catch {
    mortarProducts.value = []
    blockProducts.value = []
  }
}

const loadProductNames = async () => {
  try {
    const res = await deliveryApi.getProductNames()
    productNameOptions.value = res.data || []
  } catch {
    productNameOptions.value = []
  }
}

const handleQuery = () => { pagination.page = 1; loadData() }


const handleAdd = () => {
  Object.assign(form, {
    id: undefined, no: '', productType: 'mortar', contractId: undefined,
    supplierId: undefined, supplierName: '',
    customerId: undefined, customerName: '', deliveryDate: '', totalAmount: 0,
    status: 'pending', remark: '', mortarItems: [{ ...defaultMortarItem }], blockItems: [], contractItems: []
  })
  dialogVisible.value = true
}

const handleEdit = async (row: any) => {
  try {
    const res = await deliveryApi.get(row.id)
    const data = res.data
    if (data.productType === 'mortar') {
      const items = (data.items || []).map((item: any) => ({ ...item, spec: item.product?.spec || '' }))
      Object.assign(form, { ...data, mortarItems: items, blockItems: [] })
    } else {
      const items = (data.items || []).map((item: any) => ({ ...item, spec: item.product?.spec || '' }))
      Object.assign(form, { ...data, blockItems: items, mortarItems: [] })
    }

    if (form.contractId) {
      await onContractChange(form.contractId)
    }

    dialogVisible.value = true
  } catch {
    ElMessage.error('获取数据失败')
  }
}

const handleView = async (row: any) => {
  try {
    const res = await deliveryApi.get(row.id)
    const data = res.data
    if (data.productType === 'mortar') {
      const items = (data.items || []).map((item: any) => ({ ...item, spec: item.product?.spec || '' }))
      Object.assign(form, { ...data, mortarItems: items, blockItems: [] })
    } else {
      const items = (data.items || []).map((item: any) => ({ ...item, spec: item.product?.spec || '' }))
      Object.assign(form, { ...data, blockItems: items, mortarItems: [] })
    }
    dialogVisible.value = true
  } catch {
    ElMessage.error('获取数据失败')
  }
}

const handleDelete = async (row: DeliveryOrder) => {
  await ElMessageBox.confirm('确认删除该送货单吗？', '提示', { type: 'warning' })
  try {
    await deliveryApi.delete(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {
    ElMessage.error('删除失败')
  }
}

const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的送货单')
    return
  }
  await ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 条送货单吗？`, '提示', { type: 'warning' })
  try {
    const ids = selectedRows.value.map(r => r.id)
    await Promise.all(ids.map(id => deliveryApi.delete(id)))
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    loadData()
  } catch {
    ElMessage.error('批量删除失败')
  }
}

const handleRecycleBin = async () => {
  recycleBinVisible.value = true
  loadRecycleBinData()
}

const loadRecycleBinData = async () => {
  recycleLoading.value = true
  try {
    const res = await deliveryApi.getDeleted({
      page: recyclePagination.page,
      pageSize: recyclePagination.pageSize
    })
    recycleBinData.value = res.data.list || []
    recyclePagination.total = res.data.total || 0
  } catch {
    ElMessage.error('加载回收站数据失败')
  } finally {
    recycleLoading.value = false
  }
}

const handleRecycleSelectionChange = (rows: any[]) => {
  recycleSelectedRows.value = rows
}

const handleRestore = async (row: any) => {
  await ElMessageBox.confirm(`确认恢复送货单「${row.no}」吗？`, '提示', { type: 'warning' })
  try {
    await deliveryApi.restore(row.id)
    ElMessage.success('恢复成功')
    loadRecycleBinData()
  } catch {
    ElMessage.error('恢复失败')
  }
}

const handleBatchRestore = async () => {
  if (recycleSelectedRows.value.length === 0) {
    ElMessage.warning('请先选择要恢复的送货单')
    return
  }
  await ElMessageBox.confirm(`确认恢复选中的 ${recycleSelectedRows.value.length} 条送货单吗？`, '提示', { type: 'warning' })
  try {
    const ids = recycleSelectedRows.value.map((r: any) => r.id)
    await Promise.all(ids.map((id: number) => deliveryApi.restore(id)))
    ElMessage.success('批量恢复成功')
    recycleSelectedRows.value = []
    loadRecycleBinData()
  } catch {
    ElMessage.error('批量恢复失败')
  }
}

const handleImport = () => {
  importForm.productType = 'mortar'
  importForm.file = null
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  importDialogVisible.value = true
}

const handleFileChange = (file: any) => {
  importForm.file = file.raw
}

const downloadTemplate = () => {
  const templateData = importForm.productType === 'mortar'
    ? getMortarTemplate()
    : getBlockTemplate()
  const ws = XLSX.utils.aoa_to_sheet(templateData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '送货单')
  XLSX.writeFile(wb, `送货单导入模板_${importForm.productType === 'mortar' ? '砂浆' : '蒸压加气混凝土砌块'}.xlsx`)
}

const getMortarTemplate = (): string[][] => {
  return [
    ['送货单号', '供货单位', '项目名称', '送货日期', '产品名称', '砂浆标号', '数量', '单价', '金额', '散装/袋包', '车牌号', '备注'],
    ['SHD-001', '厂家A', '项目C', '2026-05-01', '砂浆', 'M5', '10', '100', '1000', '散装', '沪A12345', '']
  ]
}

const getBlockTemplate = (): string[][] => {
  return [
    ['送货单号', '供货单位', '项目名称', '送货日期', '产品名称', '规格型号', '实收数量', '折立方', '单价', '金额', '铁架数量', '铁架返还', '备注'],
    ['SHD-001', '厂家A', '项目C', '2026-05-01', '蒸压加气混凝土砌块', '600*200*200', '100', '80', '120', '9600', '10', '5', '']
  ]
}

const handleImportSubmit = async () => {
  if (!importForm.file) {
    ElMessage.warning('请选择要导入的Excel文件')
    return
  }

  importLoading.value = true
  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' }) as any[][]

        if (jsonData.length < 2) {
          ElMessage.error('Excel文件数据为空')
          importLoading.value = false
          return
        }

        const headers = jsonData[0].map((h: any) => {
          const headerText = typeof h === 'string' ? h.trim() : String(h).trim()
          return headerText.replace(/[\r\n]/g, '').replace(/\s+/g, '')
        })

        const excelSerialToDate = (serial: number): string => {
          const excelEpoch = new Date(1899, 11, 30)
          const date = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }

        const rows = jsonData.slice(1).map((row: any[]) => {
          const obj: any = {}
          headers.forEach((header: string, index: number) => {
            let value = row[index]
            if (value === null || value === undefined) {
              value = ''
            } else if (typeof value === 'number' && header === '送货日期') {
              value = excelSerialToDate(value)
            } else if (header === '送货日期' && typeof value === 'string') {
              const date = new Date(value)
              if (!isNaN(date.getTime())) {
                value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
              }
            } else {
              value = value.toString().trim()
            }
            obj[header] = value
          })
          return obj
        }).filter((row: any) => row['送货单号'] && row['送货单号'].trim() !== '')

        const result = await deliveryApi.importDeliveryOrders({
          productType: importForm.productType,
          rows
        })

        if (result.data.failed > 0) {
          const errorMsg = `导入失败：${result.data.failed}条记录存在问题\n\n`
          const errorDetails = result.data.errors.slice(0, 10).map((err: any) =>
            `第${err.row}行: ${err.message}`
          ).join('\n')
          ElMessage.error(errorMsg + errorDetails + (result.data.errors.length > 10 ? '\n...(更多错误已省略)' : ''))

          const errorBlob = new Blob([JSON.stringify(result.data.errors, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(errorBlob)
          const link = document.createElement('a')
          link.href = url
          link.download = `导入错误报告_${Date.now()}.json`
          link.click()
          URL.revokeObjectURL(url)
        } else {
          ElMessage.success(`导入成功：${result.data.success}条记录`)
          importDialogVisible.value = false
          loadData()
        }
      } catch (err: any) {
        ElMessage.error('解析Excel文件失败：' + err.message)
      } finally {
        importLoading.value = false
      }
    }
    reader.readAsArrayBuffer(importForm.file)
  } catch (err: any) {
    ElMessage.error('导入失败：' + err.message)
    importLoading.value = false
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const items = form.productType === 'mortar' ? form.mortarItems : form.blockItems
  if (!items || items.length === 0) {
    ElMessage.error('请添加产品明细')
    return
  }

  calcTotalAmount()

  const submitData: any = {
    productType: form.productType,
    contractId: form.contractId,
    supplierId: form.supplierId,
    customerId: form.customerId,
    deliveryDate: form.deliveryDate,
    status: form.status,
    remark: form.remark,
    items
  }

  try {
    if (form.id) {
      await deliveryApi.update(form.id, submitData)
    } else {
      await deliveryApi.create(submitData)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  loadData()
  loadCustomers()
  loadContracts()
  loadProducts()
  loadProductNames()
})

const handleExport = () => {
  const headers = ['送货单号', '供货单位', '项目名称', '产品类型', '送货日期', '总金额', '状态']
  const data = tableData.value.map(row => [
    row.no,
    row.supplierName,
    row.customerName,
    row.productType === 'mortar' ? '砂浆' : '蒸压加气混凝土砌块',
    formatDate(row.deliveryDate),
    row.totalAmount,
    getStatusText(row.status)
  ])
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '送货单')
  XLSX.writeFile(wb, `送货单_${new Date().toISOString().split('T')[0]}.xlsx`)
}

onBeforeUnmount(() => {
  dialogVisible.value = false
})
</script>

<style scoped lang="scss">
.items-section { width: 100%; }
.amount-text { color: #409eff; font-weight: 500; }
.total-amount { font-size: 18px; color: #f56c6c; font-weight: bold; }

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
  gap: 0;
}

.search-input {
  width: 350px;
  height: 36px;
  border-radius: 4px 0 0 4px;
  border-right: none;
  :deep(.el-input__wrapper) {
    border-radius: 4px 0 0 4px;
    border-right: none;
    box-shadow: none;
  }
}

.search-btn {
  height: 36px;
  border-radius: 0 4px 4px 0;
  padding: 0 20px;
  font-weight: 500;
  background: linear-gradient(135deg, #4a90d9 0%, #357abd 100%);
  border: none;
  :hover {
    background: linear-gradient(135deg, #357abd 0%, #2d6bb3 100%);
  }
}

.export-btn {
  height: 36px;
  padding: 0 20px;
  font-weight: 500;
  background: linear-gradient(135deg, #4a90d9 0%, #357abd 100%);
  border: none;
  border-radius: 4px;
  :hover {
    background: linear-gradient(135deg, #357abd 0%, #2d6bb3 100%);
  }
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mb-16 {
  margin-bottom: 16px;
}

:deep(.el-table) {
  --el-table-border-color: #e8e8e8;
  --el-table-row-hover-bg-color: #fafafa;
}

:deep(.el-table th) {
  background-color: #fafafa;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e8e8e8;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f0f0f0;
}
</style>