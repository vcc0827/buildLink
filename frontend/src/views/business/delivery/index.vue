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
        <el-select v-model="queryForm.categoryCode" placeholder="产品品类" clearable style="width: 160px" @change="handleQuery">
          <el-option v-for="cat in categories" :key="cat.code" :label="cat.name" :value="cat.code" />
        </el-select>
        <el-select v-model="queryForm.status" placeholder="状态" clearable style="width: 120px" @change="handleQuery">
          <el-option label="待发货" value="pending" />
          <el-option label="已发货" value="delivered" />
          <el-option label="已确认" value="confirmed" />
        </el-select>
        <el-button type="primary" class="search-btn" @click="handleQuery">
          <el-icon><Search /></el-icon> 查询
        </el-button>
      </div>
      <el-button type="primary" class="export-btn" @click="handleExport">
        <el-icon><Download /></el-icon> 下载
      </el-button>
    </div>

    <div class="flex-between mb-16">
      <div>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon> 批量删除 ({{ selectedRows.length }})
        </el-button>
        <el-button v-if="showRecycleBin" type="warning" @click="handleRecycleBin">
          <el-icon><Refresh /></el-icon> 回收站
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

    <!-- 主列表表格 -->
    <el-table :data="tableData" border stripe v-loading="loading" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" />
      <el-table-column prop="no" label="送货单号" width="180" />
      <el-table-column prop="supplierName" label="供货单位" min-width="150" />
      <el-table-column prop="customerName" label="项目名称" min-width="150" />
      <el-table-column prop="categoryCode" label="产品品类" width="140">
        <template #default="{ row }">
          <el-tag :type="getCategoryTagType(row.categoryCode)" size="small">
            {{ row.categoryName || row.categoryCode }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="deliveryDate" label="送货日期" width="110">
        <template #default="{ row }">{{ formatDate(row.deliveryDate) }}</template>
      </el-table-column>
      <!-- 动态品类专属列 -->
      <el-table-column v-for="col in dynamicColumns" :key="col.code" :prop="col.code" :label="col.name" :width="col.width || 120" align="right">
        <template #default="{ row }">
          {{ formatDynamicValue(row, col) }}
        </template>
      </el-table-column>
      <el-table-column prop="totalAmount" label="总金额" width="120" align="right">
        <template #default="{ row }"> ¥{{ row.totalAmount?.toLocaleString() }} </template>
      </el-table-column>
      <el-table-column prop="businessType" label="业务类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.businessType === 'contract' ? 'primary' : 'success'" size="small">
            {{ row.businessType === 'contract' ? '合同单' : '零售单' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleView(row)">查看</el-button>
          <el-button v-if="row.status !== 'confirmed'" type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button v-if="row.status === 'delivered'" type="success" link @click="handleConfirm(row)">确认签收</el-button>
          <el-button v-if="row.status !== 'confirmed'" type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="mt-16" v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @size-change="loadData" @current-change="loadData" />

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="950px" @closed="onDialogClosed">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品品类" prop="categoryCode">
              <el-select v-model="form.categoryCode" placeholder="请选择" :disabled="!!form.id" style="width: 100%" @change="onCategoryChange">
                <el-option v-for="cat in categories" :key="cat.code" :label="cat.name" :value="cat.code" />
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
            <el-form-item label="业务类型" prop="businessType">
              <el-select v-model="form.businessType" style="width: 100%">
                <el-option label="合同单" value="contract" />
                <el-option label="零售单" value="retail" />
              </el-select>
            </el-form-item>
          </el-col>
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

        <!-- 通用明细表格（动态渲染品类专属列） -->
        <div class="items-section">
          <el-table :data="form.items" border size="small">
            <!-- 产品列 -->
            <el-table-column label="产品" width="180">
              <template #default="{ row, $index }">
                <el-select v-model="row.productId" placeholder="选择产品" @change="onProductChange($index)" style="width: 100%">
                  <el-option v-for="p in currentProducts" :key="p.id" :label="p.name + (p.spec ? ' ' + p.spec : '')" :value="p.id" />
                </el-select>
              </template>
            </el-table-column>
            <!-- 主计量列 -->
            <el-table-column :label="currentCategory?.unit || '报货数量'" width="130">
              <template #default="{ row }">
                <el-input-number v-model="row.quantity" :precision="4" :step="0.1" style="width: 100%" :disabled="form.status === 'confirmed'" @change="calcItemAmount(row)" />
              </template>
            </el-table-column>
            <el-table-column :label="'实收数量'" width="130">
              <template #default="{ row }">
                <el-input-number v-model="row.receivedQuantity" :precision="4" :step="0.1" style="width: 100%" :disabled="form.status === 'confirmed'" @change="checkQuantityDiff(row)" />
              </template>
            </el-table-column>
            <el-table-column label="单价" width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.price" :min="0" :precision="4" style="width: 100%" @change="calcItemAmount(row)" />
              </template>
            </el-table-column>
            <el-table-column label="金额(元)" width="120">
              <template #default="{ row }">
                <span class="amount-text">¥{{ Number(row.amount || 0).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <!-- 动态品类专属属性列 -->
            <el-table-column v-for="field in dynamicFormFields" :key="field.code" :label="field.name" :width="getFieldWidth(field)" :required="field.required">
              <template #default="{ row }">
                <!-- select 类型 -->
                <el-select v-if="field.type === 'select'" v-model="row.attributes[field.code]" placeholder="选择" style="width: 100%">
                  <el-option v-for="opt in field.options" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
                <!-- number 类型 -->
                <el-input-number v-else-if="field.type === 'number'" v-model="row.attributes[field.code]" :precision="4" :step="0.1" style="width: 100%" />
                <!-- string/其他 -->
                <el-input v-else v-model="row.attributes[field.code]" :placeholder="field.name" />
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
            <el-form-item label="总金额">
              <span class="total-amount">¥{{ Number(form.totalAmount || 0).toFixed(2) }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="差异提醒">
              <span v-if="hasQuantityDiff" class="diff-warning">报货数量与实收数量不一致，请填写差异备注</span>
              <span v-else class="diff-normal">数量一致</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>

        <el-form-item label="差异备注" prop="diffRemark">
          <el-input v-model="form.diffRemark" type="textarea" :rows="3" placeholder="当报货数量与实收数量不一致时，请填写差异原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 回收站对话框 -->
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
        <el-table-column prop="categoryCode" label="产品品类" width="140">
          <template #default="{ row }">
            <el-tag :type="getCategoryTagType(row.categoryCode)" size="small">
              {{ row.categoryName || row.categoryCode }}
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

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入送货单" width="500px">
      <el-form :model="importForm" label-width="100px">
        <el-form-item label="产品品类" required>
          <el-select v-model="importForm.categoryCode" placeholder="请选择" style="width: 100%">
            <el-option v-for="cat in categories" :key="cat.code" :label="cat.name" :value="cat.code" />
          </el-select>
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

    <!-- 确认签收对话框 -->
    <el-dialog v-model="confirmDialogVisible" title="确认签收" width="800px">
      <el-form :model="confirmForm" label-width="100px">
        <el-divider content-position="left">签收明细</el-divider>
        <el-table :data="confirmForm.items" border size="small">
          <el-table-column prop="productName" label="产品" width="180" />
          <el-table-column label="报货数量" width="130" align="right">
            <template #default="{ row }">{{ row.quantity }}</template>
          </el-table-column>
          <el-table-column label="实收数量" width="130" align="right">
            <template #default="{ row }">
              <el-input-number v-model="row.receivedQuantity" :precision="4" :step="0.1" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column label="差异" width="100" align="right">
            <template #default="{ row }">
              <span :class="{ 'diff-red': row.diff !== 0 }">{{ row.diff > 0 ? '+' : '' }}{{ row.diff }}</span>
            </template>
          </el-table-column>
        </el-table>

        <el-form-item label="差异备注" prop="diffRemark" :required="hasConfirmDiff">
          <el-input v-model="confirmForm.diffRemark" type="textarea" :rows="3" placeholder="当报货数量与实收数量不一致时，请填写差异原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmSubmit">确认签收</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Upload, Search, Download, Refresh } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import type { DeliveryOrder, Customer, Contract, Product, ProductCategory } from '@/types'
import { deliveryApi, customerApi, contractApi, productApi, productCategoryApi } from '@/api'

// ============================================
// 状态定义
// ============================================
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
const importForm = reactive({ categoryCode: 'mortar', file: null as any })

const confirmDialogVisible = ref(false)
const confirmForm = reactive({
  items: [] as any[],
  diffRemark: ''
})

const customers = ref<Customer[]>([])
const suppliers = ref<Customer[]>([])
const contracts = ref<Contract[]>([])
const products = ref<Product[]>([])
const categories = ref<ProductCategory[]>([])

const dialogTitle = computed(() => (form.id ? '编辑送货单' : '新增送货单'))

// ============================================
// 动态列计算
// ============================================
const currentCategory = computed(() => categories.value.find(c => c.code === form.categoryCode))

const dynamicColumns = computed(() => {
  if (!currentCategory.value?.fields) return []
  return currentCategory.value.fields
    .filter(f => f.code !== 'remarks')
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
    .map(f => ({
      code: `attr_${f.code}`,
      name: f.name,
      width: f.type === 'select' ? 120 : 100
    }))
})

const dynamicFormFields = computed(() => {
  if (!currentCategory.value?.fields) return []
  return currentCategory.value.fields
    .filter(f => f.code !== 'remarks')
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
})

const currentProducts = computed(() => {
  if (!form.categoryCode) return products.value
  return products.value.filter((p: any) => p.categoryCode === form.categoryCode)
})

const getFieldWidth = (field: any) => {
  if (field.type === 'select') return 120
  if (field.code === 'licensePlate') return 130
  return 110
}

const formatDynamicValue = (row: any, col: any) => {
  const attrCode = col.code.replace('attr_', '')
  const attrs = row.items?.[0]?.attributes || {}
  const val = attrs[attrCode]
  if (val === null || val === undefined) return '-'
  // 处理 select 类型显示 label
  const field = currentCategory.value?.fields?.find((f: any) => f.code === attrCode)
  if (field?.type === 'select' && field.options) {
    const opt = field.options.find((o: any) => o.value === val)
    return opt?.label || val
  }
  return String(val)
}

// ============================================
// 表单与查询
// ============================================
const queryForm = reactive({ no: '', categoryCode: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const formRef = ref()

const defaultItem = (): any => ({
  productId: undefined,
  productName: '',
  productSpec: '',
  quantity: 0,
  receivedQuantity: 0,
  price: 0,
  amount: 0,
  attributes: {}
})

const form = reactive<any>({
  id: undefined,
  no: '',
  categoryCode: 'mortar',
  businessType: 'contract',
  contractId: undefined,
  supplierId: undefined,
  supplierName: '',
  customerId: undefined,
  customerName: '',
  deliveryDate: '',
  totalAmount: 0,
  status: 'pending',
  remark: '',
  diffRemark: '',
  items: [{ ...defaultItem() }]
})

const rules = {
  categoryCode: [{ required: true, message: '请选择产品品类', trigger: 'change' }],
  supplierId: [{ required: true, message: '请选择供货单位', trigger: 'change' }],
  customerId: [{ required: true, message: '请选择项目', trigger: 'change' }],
  deliveryDate: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

// ============================================
// 工具方法
// ============================================
const formatDate = (date: any) => {
  if (!date) return '-'
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getStatusType = (status: string): 'success' | 'warning' | 'info' | 'danger' => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
    pending: 'warning',
    delivered: 'info',
    confirmed: 'success'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => ({ pending: '待发货', delivered: '已发货', confirmed: '已确认' }[status] || status)

const getCategoryTagType = (code: string): 'success' | 'warning' | 'info' | 'danger' => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
    mortar: 'success',
    block: 'warning',
    board: 'info',
    steel: 'danger'
  }
  return map[code] || 'info'
}

const calcItemAmount = (item: any) => {
  const qty = item.receivedQuantity || item.quantity || 0
  const prc = item.price || 0
  // 砌块用折立方验算
  if (form.categoryCode === 'block' && item.attributes?.convertedCubic) {
    item.amount = parseFloat((item.attributes.convertedCubic * prc).toFixed(2))
  } else {
    item.amount = parseFloat((qty * prc).toFixed(2))
  }
  calcTotalAmount()
}

const hasQuantityDiff = computed(() => {
  return form.items.some((item: any) => {
    const qty = item.quantity || 0
    const received = item.receivedQuantity || 0
    return Math.abs(qty - received) > 0.0001
  })
})

const checkQuantityDiff = (row: any) => {
  calcItemAmount(row)
}

const hasConfirmDiff = computed(() => {
  return confirmForm.items.some((item: any) => {
    const qty = item.quantity || 0
    const received = item.receivedQuantity || 0
    return Math.abs(qty - received) > 0.0001
  })
})

const calcTotalAmount = () => {
  form.totalAmount = form.items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
}

// ============================================
// 品类切换处理
// ============================================
const onCategoryChange = () => {
  // 切换品类时重置明细，初始化空行
  form.items = [{ ...defaultItem() }]
  form.totalAmount = 0
}

const onProductChange = (index: number) => {
  const product = products.value.find(p => p.id === form.items[index].productId)
  if (product) {
    form.items[index].price = product.price || 0
    calcItemAmount(form.items[index])
  }
}

// ============================================
// 明细行操作
// ============================================
const addItem = () => {
  form.items.push({ ...defaultItem() })
}

const removeItem = (index: number) => {
  form.items.splice(index, 1)
  calcTotalAmount()
}

// ============================================
// 加载数据
// ============================================
const loadData = async () => {
  loading.value = true
  try {
    const params = { ...queryForm, page: pagination.page, pageSize: pagination.pageSize }
    const res = await deliveryApi.list(params)
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
    const res = await productCategoryApi.list()
    categories.value = res.data || []
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
    products.value = res.data.list || []
  } catch {
    products.value = []
  }
}

// ============================================
// 事件处理
// ============================================
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
    categoryCode: 'mortar',
    businessType: 'contract',
    contractId: undefined,
    supplierId: undefined,
    supplierName: '',
    customerId: undefined,
    customerName: '',
    deliveryDate: '',
    totalAmount: 0,
    status: 'pending',
    remark: '',
    diffRemark: '',
    items: [{ ...defaultItem() }]
  })
  dialogVisible.value = true
}

const handleEdit = async (row: any) => {
  try {
    const res = await deliveryApi.get(row.id)
    const data = res.data
    // 转换 items 到新格式
    const items = (data.items || []).map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productSpec: item.productSpec,
      quantity: item.quantity,
      receivedQuantity: item.receivedQuantity || item.quantity,
      price: item.price,
      amount: item.amount,
      attributes: item.attributes || {}
    }))
    Object.assign(form, {
      ...data,
      items: items.length ? items : [{ ...defaultItem() }]
    })
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
    const items = (data.items || []).map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productSpec: item.productSpec,
      quantity: item.quantity,
      receivedQuantity: item.receivedQuantity || item.quantity,
      price: item.price,
      amount: item.amount,
      attributes: item.attributes || {}
    }))
    Object.assign(form, { ...data, items })
    dialogVisible.value = true
  } catch {
    ElMessage.error('获取数据失败')
  }
}

const handleConfirm = async (row: any) => {
  try {
    const res = await deliveryApi.get(row.id)
    const data = res.data
    confirmForm.items = (data.items || []).map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      receivedQuantity: item.receivedQuantity || item.quantity,
      diff: 0
    }))
    confirmForm.diffRemark = data.diffRemark || ''
    confirmDialogVisible.value = true
  } catch {
    ElMessage.error('获取数据失败')
  }
}

const handleConfirmSubmit = async () => {
  confirmForm.items.forEach(item => {
    item.diff = (item.receivedQuantity || 0) - (item.quantity || 0)
  })

  if (hasConfirmDiff.value && !confirmForm.diffRemark) {
    ElMessage.error('报货数量与实收数量不一致，请填写差异备注')
    return
  }

  await ElMessageBox.confirm('确认签收后单据将不可修改，确定继续吗？', '提示', { type: 'warning' })

  try {
    const items = confirmForm.items.map(item => ({
      id: item.id,
      receivedQuantity: item.receivedQuantity,
      quantity: item.quantity || 0,
      price: item.price || 0,
      amount: item.amount || 0
    }))
    await deliveryApi.update(form.id, {
      status: 'confirmed',
      items: items as any,
      diffRemark: confirmForm.diffRemark
    })
    ElMessage.success('签收成功')
    confirmDialogVisible.value = false
    loadData()
  } catch {
    ElMessage.error('签收失败')
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

// ============================================
// 导入功能
// ============================================
const handleImport = () => {
  importForm.categoryCode = 'mortar'
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
  const category = categories.value.find(c => c.code === importForm.categoryCode)
  const fields = category?.fields || []

  // 构建表头
  const headers = ['送货单号', '供货单位', '项目名称', '送货日期', '产品名称', '数量', '单价', '金额']
  fields.forEach((f: any) => headers.push(f.name))

  // 构建示例行
  const exampleRow = ['SHD-001', '厂家A', '项目C', '2026-05-01', category?.name || '产品', '100', '100', '10000']
  fields.forEach((f: any) => {
    if (f.type === 'select' && f.options?.length) {
      exampleRow.push(f.options[0].value)
    } else if (f.type === 'number') {
      exampleRow.push('0')
    } else {
      exampleRow.push('')
    }
  })

  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '送货单')
  XLSX.writeFile(wb, `送货单导入模板_${category?.name || '通用'}.xlsx`)
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

        const headers = jsonData[0].map((h: any) => String(h).trim().replace(/[\r\n\s]/g, ''))

        const rows = jsonData.slice(1).map((row: any[]) => {
          const obj: any = {}
          headers.forEach((header: string, index: number) => {
            let value = row[index]
            if (value === null || value === undefined) value = ''
            obj[header] = value
          })
          return obj
        }).filter((row: any) => row['送货单号'] && row['送货单号'].trim() !== '')

        const result = await deliveryApi.importDeliveryOrders({
          categoryCode: importForm.categoryCode,
          rows
        })

        if (result.data.failed > 0) {
          const errorMsg = `导入失败：${result.data.failed}条记录存在问题\n\n`
          const errorDetails = result.data.errors.slice(0, 10).map((err: any) =>
            `第${err.row}行: ${err.message}`
          ).join('\n')
          ElMessage.error(errorMsg + errorDetails + (result.data.errors.length > 10 ? '\n...(更多错误已省略)' : ''))
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

// ============================================
// 提交表单
// ============================================
const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (!form.items || form.items.length === 0) {
    ElMessage.error('请添加产品明细')
    return
  }

  if (hasQuantityDiff.value && !form.diffRemark) {
    ElMessage.error('报货数量与实收数量不一致，请填写差异备注')
    return
  }

  calcTotalAmount()

  const submitData = {
    categoryCode: form.categoryCode,
    businessType: form.businessType,
    contractId: form.contractId,
    supplierId: form.supplierId,
    customerId: form.customerId,
    deliveryDate: form.deliveryDate,
    status: form.status,
    remark: form.remark,
    diffRemark: form.diffRemark,
    items: form.items.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      receivedQuantity: item.receivedQuantity || item.quantity,
      price: item.price,
      amount: item.amount,
      attributes: item.attributes
    }))
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

// ============================================
// 辅助方法
// ============================================
const onSupplierChange = (id: number) => {
  const s = suppliers.value.find(x => x.id === id)
  if (s) form.supplierName = s.name
}

const onCustomerChange = (id: number) => {
  const c = customers.value.find(x => x.id === id)
  if (c) form.customerName = c.name
}

const onContractChange = async (contractId: number) => {
  if (!contractId) {
    form.contractItems = []
    return
  }
  try {
    const res = await contractApi.get(contractId)
    form.contractItems = res.data.items || []
  } catch {
    form.contractItems = []
  }
}

// ============================================
// 导出
// ============================================
const handleExport = () => {
  const headers = ['送货单号', '供货单位', '项目名称', '产品品类', '送货日期', '总金额', '状态']
  const data = tableData.value.map(row => [
    row.no,
    row.supplierName,
    row.customerName,
    row.categoryName || row.categoryCode,
    formatDate(row.deliveryDate),
    row.totalAmount,
    getStatusText(row.status)
  ])
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '送货单')
  XLSX.writeFile(wb, `送货单_${new Date().toISOString().split('T')[0]}.xlsx`)
}

// ============================================
// 初始化
// ============================================
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
.diff-warning { color: #f56c6c; font-weight: 500; }
.diff-normal { color: #67c23a; }
.diff-red { color: #f56c6c; font-weight: 500; }

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

.search-btn, .export-btn {
  height: 36px;
  padding: 0 20px;
  font-weight: 500;
  border: none;
  border-radius: 4px;
}

.search-btn {
  background: linear-gradient(135deg, #4a90d9 0%, #357abd 100%);
  color: #fff;
}

.export-btn {
  background: linear-gradient(135deg, #67c23a 0%, #5daf34 100%);
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
