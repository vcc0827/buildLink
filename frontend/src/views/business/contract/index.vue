<template>
  <div class="page-container">
    <div class="table-search">
      <el-form :model="queryForm" inline class="search-form">
        <el-form-item label="合同名称">
          <el-input v-model="queryForm.name" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="合同类型">
          <el-select v-model="queryForm.type" placeholder="请选择" clearable>
            <el-option label="上游合同" value="upstream" />
            <el-option label="下游合同" value="downstream" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="请选择" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="执行中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="flex-between mb-16">
      <span />
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon> 新增合同
      </el-button>
    </div>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="no" label="合同编号" width="150" />
      <el-table-column prop="name" label="合同名称" min-width="180" />
      <el-table-column label="签约方" width="180">
        <template #default="{ row }">
          {{ row.customerName }}
          <el-tag size="small" :type="row.customerType === 'supplier' ? 'success' : 'warning'">
            {{ row.customerType === 'supplier' ? '厂家' : '项目' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="itemCount" label="产品数" width="80">
        <template #default="{ row }"> {{ row.itemCount || 0 }}种 </template>
      </el-table-column>
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.type === 'upstream' ? 'success' : 'warning'" size="small">
            {{ row.type === 'upstream' ? '上游' : '下游' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="amount" label="合同金额" width="120" align="right">
        <template #default="{ row }"> ¥{{ row.amount?.toLocaleString() }} </template>
      </el-table-column>
      <el-table-column prop="signedDate" label="签订日期" width="110" />
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

    <el-pagination
      class="mt-16"
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadData"
      @current-change="loadData"
    />

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="900px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合同编号" prop="no">
              <el-input v-model="form.no" placeholder="系统自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合同类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择">
                <el-option label="上游合同" value="upstream" />
                <el-option label="下游合同" value="downstream" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="合同名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入" />
        </el-form-item>

        <el-divider content-position="left">签约方信息</el-divider>

        <el-form-item label="签约方" prop="customerId">
          <el-select v-model="form.customerId" placeholder="请选择" @change="onCustomerChange" style="width: 100%">
            <el-option
              v-for="c in filteredCustomers"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
        </el-form-item>

        <template v-if="form.customerId">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="单位名称">
                <el-input v-model="form.unitName" placeholder="自动填充" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="电话">
                <el-input v-model="form.phone" placeholder="自动填充" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="单位地址">
                <el-input v-model="form.unitAddress" placeholder="自动填充" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="开户银行">
                <el-input v-model="form.bank" placeholder="自动填充" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="银行账户">
                <el-input v-model="form.account" placeholder="自动填充" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="项目地址">
                <el-input v-model="form.projectAddress" placeholder="请输入项目地址" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <el-divider content-position="left">产品明细</el-divider>

        <div class="items-section">
          <el-button v-if="!viewMode" type="primary" size="small" @click="handleAddItem" style="margin-bottom: 10px;">
            <el-icon><Plus /></el-icon> 添加产品
          </el-button>
          <el-table :data="form.items" border size="small">
            <el-table-column label="产品名称" width="150">
              <template #default="{ row, $index }">
                <el-select v-if="!viewMode" v-model="row.category" placeholder="选择大类" @change="onCategoryChange($index)" style="width: 100%">
                  <el-option
                    v-for="cat in productCategories"
                    :key="cat"
                    :label="cat"
                    :value="cat"
                  />
                </el-select>
                <span v-else>{{ row.category }}</span>
              </template>
            </el-table-column>
            <el-table-column label="型号" width="120">
              <template #default="{ row, $index }">
                <el-select v-if="!viewMode" v-model="row.model" placeholder="选择型号" @change="onModelChange($index)" style="width: 100%">
                  <el-option
                    v-for="model in getModelsByCategory(row.category)"
                    :key="model"
                    :label="model"
                    :value="model"
                  />
                </el-select>
                <span v-else>{{ row.model }}</span>
              </template>
            </el-table-column>
            <el-table-column label="规格" width="120">
              <template #default="{ row, $index }">
                <el-select v-if="!viewMode" v-model="row.spec" placeholder="选择规格" style="width: 100%">
                  <el-option
                    v-for="spec in getSpecsByCategoryAndModel(row.category, row.model)"
                    :key="spec"
                    :label="spec"
                    :value="spec"
                  />
                </el-select>
                <span v-else>{{ row.spec }}</span>
              </template>
            </el-table-column>
            <el-table-column label="计量单位" width="80">
              <template #default="{ row }">
                <span>{{ row.unit }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单价" width="100">
              <template #default="{ row }">
                <el-input-number v-if="!viewMode"
                  v-model="row.basePrice"
                  :min="0"
                  :precision="2"
                  :controls="false"
                  style="width: 100%"
                  @change="onPriceChange"
                />
                <span v-else>¥{{ parseFloat(row.basePrice || 0).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="调整方式" width="100">
              <template #default="{ row }">
                <el-select v-if="!viewMode" v-model="row.adjustmentType" placeholder="选择方式" @change="onAdjustmentTypeChange($index)" style="width: 100%">
                  <el-option label="信息价" value="info_price" />
                  <el-option label="固定价" value="fixed_price" />
                </el-select>
                <span v-else>{{ row.adjustmentType === 'info_price' ? '信息价' : '固定价' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="调整值" width="100">
              <template #default="{ row }">
                <el-input-number v-if="!viewMode"
                  v-model="row.adjustmentValue"
                  :min="0"
                  :max="row.adjustmentType === 'info_price' ? 1 : 999999"
                  :precision="2"
                  :controls="false"
                  :disabled="row.adjustmentType !== 'info_price'"
                  style="width: 100%"
                  @change="onPriceChange"
                />
                <span v-else>{{ parseFloat(row.adjustmentValue || 0).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="实际单价" width="100">
              <template #default="{ row }">
                <span class="price-value">¥{{ parseFloat(row.price || 0).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column v-if="!viewMode" label="操作" width="80">
              <template #default="{ $index }">
                <el-button type="danger" link @click="handleRemoveItem($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-divider content-position="left">合同信息</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合同金额" prop="amount">
              <el-input-number v-model="form.amount" :min="0" :precision="2" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="签订日期" prop="signedDate">
              <el-date-picker v-model="form.signedDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期" prop="startDate">
              <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期" prop="endDate">
              <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择">
            <el-option label="草稿" value="draft" />
            <el-option label="执行中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" rows="3" />
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { Contract, Customer, Product, ContractItem } from '@/types'
import { contractApi, customerApi, productApi } from '@/api'

const loading = ref(false)
const tableData = ref<Contract[]>([])
const dialogVisible = ref(false)
const customers = ref<Customer[]>([])
const products = ref<Product[]>([])
const productCategories = ref<string[]>([])
const productsByCategory = ref<Record<string, Product[]>>({})
const modelsByCategory = ref<Record<string, string[]>>({})
const specsByCategoryAndModel = ref<Record<string, Record<string, string[]>>>({})

const getModelsByCategory = (category: string | undefined) => {
  if (!category) return []
  return modelsByCategory.value[category] || []
}

const getSpecsByCategoryAndModel = (category: string | undefined, model: string | undefined) => {
  if (!category || !model) return []
  return specsByCategoryAndModel.value[category]?.[model] || []
}
const dialogTitle = computed(() => (form.id ? '编辑合同' : '新增合同'))

const queryForm = reactive({
  name: '',
  type: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formRef = ref()
const form = reactive<any>({
  id: undefined,
  no: '',
  name: '',
  type: 'upstream',
  customerId: undefined,
  customerName: '',
  customerType: '',
  amount: 0,
  signedDate: '',
  startDate: '',
  endDate: '',
  status: 'draft',
  unitName: '',
  unitAddress: '',
  bank: '',
  account: '',
  phone: '',
  projectAddress: '',
  remark: '',
  items: [] as ContractItem[]
})

const filteredCustomers = computed(() => {
  return customers.value.filter(c => c.type === (form.type === 'upstream' ? 'supplier' : 'project'))
})

watch(() => form.type, () => {
  form.customerId = undefined
  form.customerName = ''
  form.customerType = ''
})

const rules = {
  name: [{ required: true, message: '请输入合同名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择合同类型', trigger: 'change' }],
  customerId: [{ required: true, message: '请选择签约方', trigger: 'change' }]
}

const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    draft: 'info', active: 'success', completed: 'warning', cancelled: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    draft: '草稿', active: '执行中', completed: '已完成', cancelled: '已取消'
  }
  return map[status] || status
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await contractApi.list({ ...queryForm, page: pagination.page, pageSize: pagination.pageSize })
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
    const res = await customerApi.list({ page: 1, pageSize: 100 })
    customers.value = res.data.list
  } catch {
    customers.value = []
  }
}

const loadProducts = async () => {
  try {
    const res = await productApi.list({ page: 1, pageSize: 100, status: 'active' })
    products.value = res.data.list
    
    const categories: string[] = []
    const modelMap: Record<string, string[]> = {}
    const specMap: Record<string, Record<string, string[]>> = {}
    
    res.data.list.forEach((p: Product) => {
      const category = p.name
      const model = p.model || ''
      const spec = p.spec || ''
      
      if (!categories.includes(category)) {
        categories.push(category)
      }
      
      if (!modelMap[category]) {
        modelMap[category] = []
      }
      if (!modelMap[category].includes(model)) {
        modelMap[category].push(model)
      }
      
      if (!specMap[category]) {
        specMap[category] = {}
      }
      if (!specMap[category][model]) {
        specMap[category][model] = []
      }
      if (!specMap[category][model].includes(spec)) {
        specMap[category][model].push(spec)
      }
    })
    
    productCategories.value = categories
    modelsByCategory.value = modelMap
    specsByCategoryAndModel.value = specMap
  } catch {
    products.value = []
  }
}

const getProductsByCategory = (category: string | undefined) => {
  if (!category) return []
  return productsByCategory.value[category] || []
}

const onCustomerChange = async (id: number) => {
  const customer = customers.value.find(c => c.id === id)
  if (customer) {
    form.customerName = customer.name
    form.customerType = customer.type
    form.unitName = customer.name
    form.unitAddress = customer.address || ''
    form.phone = customer.phone || ''
    form.bank = customer.bank || ''
    form.account = customer.account || ''
  }
}

const onCategoryChange = (index: number) => {
  form.items[index].spec = ''
  form.items[index].unit = ''
  form.items[index].model = ''
  form.items[index].basePrice = 0
  form.items[index].adjustmentType = 'fixed_price'
  form.items[index].adjustmentValue = 0
  form.items[index].price = 0
}

const onModelChange = (index: number) => {
  const category = form.items[index].category
  const model = form.items[index].model
  form.items[index].spec = ''
  const product = products.value.find(p => p.name === category && p.model === model)
  if (product) {
    form.items[index].unit = product.unit || ''
    form.items[index].basePrice = product.price || 0
    calculateItemPrice(form.items[index])
  }
}

const onAdjustmentTypeChange = (index: number) => {
  const item = form.items[index]
  if (!item) return
  if (item.adjustmentType === 'info_price') {
    item.adjustmentValue = 0
  } else {
    item.adjustmentValue = item.basePrice || 0
  }
  calculateItemPrice(item)
}

const calculateItemPrice = (item: any) => {
  if (!item) return
  const basePrice = parseFloat(item.basePrice || 0)
  const adjustmentType = item.adjustmentType || 'fixed_price'
  const adjustmentValue = parseFloat(item.adjustmentValue || 0)

  if (adjustmentType === 'info_price') {
    item.price = parseFloat((basePrice * (1 - adjustmentValue)).toFixed(2))
  } else {
    item.price = parseFloat(basePrice.toFixed(2))
  }
}

const onPriceChange = () => {
  form.items.forEach((item: any) => {
    calculateItemPrice(item)
  })
}

const handleAddItem = () => {
  form.items.push({
    category: '',
    productId: undefined,
    productName: '',
    unit: '',
    model: '',
    spec: '',
    basePrice: 0,
    adjustmentType: 'fixed_price',
    adjustmentValue: 0,
    price: 0
  })
}

const handleRemoveItem = (index: number) => {
  form.items.splice(index, 1)
}

const handleQuery = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  Object.assign(queryForm, { name: '', type: '', status: '' })
  handleQuery()
}

const handleAdd = async () => {
  form.id = undefined
  form.no = ''
  form.name = ''
  form.type = 'upstream'
  form.customerId = undefined
  form.customerName = ''
  form.customerType = ''
  form.amount = 0
  form.signedDate = ''
  form.startDate = ''
  form.endDate = ''
  form.status = 'draft'
  form.unitName = ''
  form.unitAddress = ''
  form.bank = ''
  form.account = ''
  form.phone = ''
  form.projectAddress = ''
  form.remark = ''
  form.items = []
  dialogVisible.value = true
}

const handleEdit = async (row: Contract) => {
  try {
    const res = await contractApi.getById(row.id)
    const data = res.data
    Object.assign(form, data)
    viewMode.value = false
    dialogVisible.value = true
  } catch {
    ElMessage.error('获取合同详情失败')
  }
}

const viewMode = ref(false)

const handleView = async (row: Contract) => {
  try {
    const res = await contractApi.getById(row.id)
    const data = res.data
    Object.assign(form, data)
    viewMode.value = true
    dialogVisible.value = true
  } catch {
    ElMessage.error('获取合同详情失败')
  }
}

const handleDelete = async (row: Contract) => {
  await ElMessageBox.confirm('确认删除该合同吗？', '提示', { type: 'warning' })
  try {
    await contractApi.delete(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {
    ElMessage.error('删除失败')
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    const submitData = { ...form }
    if (form.id) {
      await contractApi.update(form.id, submitData)
    } else {
      await contractApi.create(submitData)
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
  loadProducts()
})
</script>

<style scoped>
.items-section {
  margin-bottom: 20px;
}
</style>
