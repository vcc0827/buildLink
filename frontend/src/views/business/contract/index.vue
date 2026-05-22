<template>
  <div class="page-container">
    <div class="table-search">
      <el-form :model="queryForm" inline class="search-form">
        <el-form-item label="合同编号">
          <el-input v-model="queryForm.no" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="合同名称">
          <el-input v-model="queryForm.name" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="签约方">
          <el-select v-model="queryForm.reconciliationUnitId" placeholder="请选择" clearable>
            <el-option
              v-for="unit in reconciliationUnits"
              :key="unit.id"
              :label="unit.companyName"
              :value="unit.id"
            />
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
      <el-table-column prop="companyName" label="签约方" width="180" />
      <el-table-column prop="projectName" label="项目名称" width="180" />
      <el-table-column prop="itemCount" label="产品数" width="80">
        <template #default="{ row }"> {{ row.itemCount || 0 }}种 </template>
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
              <el-input v-model="form.no" placeholder="请输入合同编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="签订日期" prop="signedDate">
              <el-date-picker v-model="form.signedDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="合同名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入" />
        </el-form-item>

        <el-divider content-position="left">签约方信息</el-divider>

        <el-form-item label="签约方（对账单位）" prop="reconciliationUnitId">
          <el-select v-model="form.reconciliationUnitId" placeholder="请选择对账单位" style="width: 100%">
            <el-option
              v-for="unit in reconciliationUnits"
              :key="unit.id"
              :label="unit.companyName"
              :value="unit.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="项目名称" prop="projectName">
          <el-input v-model="form.projectName" placeholder="请输入项目名称" />
        </el-form-item>

        <el-divider content-position="left">产品明细</el-divider>

        <div class="items-section">
          <el-button v-if="!viewMode" type="primary" size="small" @click="handleAddItem" style="margin-bottom: 10px;">
            <el-icon><Plus /></el-icon> 添加产品
          </el-button>
          <el-table :data="form.items" border size="small">
            <el-table-column label="产品名称" width="150">
              <template #default="{ row, $index }">
                <el-select v-if="!viewMode" v-model="row.productId" placeholder="选择产品" @change="onProductChange($index)" style="width: 100%">
                  <el-option
                    v-for="product in products"
                    :key="product.id"
                    :label="product.name + (product.model ? '-' + product.model : '') + (product.spec ? '-' + product.spec : '')"
                    :value="product.id"
                  />
                </el-select>
                <span v-else>{{ row.productName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="计量单位" width="100">
              <template #default="{ row }">
                <span>{{ row.unit }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单价" width="120">
              <template #default="{ row }">
                <el-input-number v-if="!viewMode"
                  v-model="row.price"
                  :min="0"
                  :precision="2"
                  :controls="false"
                  style="width: 100%"
                />
                <span v-else>¥{{ parseFloat(row.price || 0).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column v-if="!viewMode" label="操作" width="80">
              <template #default="{ $index }">
                <el-button type="danger" link @click="handleRemoveItem($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-divider content-position="left">其他信息</el-divider>

        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择">
            <el-option label="草稿" value="draft" />
            <el-option label="执行中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { Contract, ContractItem, Product, ReconciliationUnit } from '@/types'
import { contractApi, productApi, reconciliationUnitApi } from '@/api'

const loading = ref(false)
const tableData = ref<Contract[]>([])
const dialogVisible = ref(false)
const reconciliationUnits = ref<ReconciliationUnit[]>([])
const products = ref<Product[]>([])

const dialogTitle = computed(() => (form.id ? '编辑合同' : '新增合同'))

const queryForm = reactive({
  no: '',
  name: '',
  reconciliationUnitId: '',
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
  reconciliationUnitId: undefined,
  projectName: '',
  signedDate: '',
  status: 'draft',
  remark: '',
  items: [] as ContractItem[]
})

const rules = {
  no: [{ required: true, message: '请输入合同编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入合同名称', trigger: 'blur' }],
  reconciliationUnitId: [{ required: true, message: '请选择签约方', trigger: 'change' }],
  projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  signedDate: [{ required: true, message: '请选择签订日期', trigger: 'change' }]
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
    const params = {
      ...queryForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await contractApi.list(params)
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch {
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const loadReconciliationUnits = async () => {
  try {
    const res = await reconciliationUnitApi.list({ page: 1, pageSize: 100 })
    reconciliationUnits.value = res.data.list
  } catch {
    reconciliationUnits.value = []
  }
}

const loadProducts = async () => {
  try {
    const res = await productApi.list({ page: 1, pageSize: 100, status: 'active' })
    products.value = res.data.list
  } catch {
    products.value = []
  }
}

const onProductChange = (index: number) => {
  const productId = form.items[index].productId
  const product = products.value.find(p => p.id === productId)
  if (product) {
    form.items[index].productName = product.name + (product.model ? '-' + product.model : '') + (product.spec ? '-' + product.spec : '')
    form.items[index].unit = product.unit || ''
    form.items[index].price = product.price || 0
  }
}

const handleAddItem = () => {
  form.items.push({
    productId: undefined,
    productName: '',
    unit: '',
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
  Object.assign(queryForm, { no: '', name: '', reconciliationUnitId: '', status: '' })
  handleQuery()
}

const handleAdd = async () => {
  form.id = undefined
  form.no = ''
  form.name = ''
  form.reconciliationUnitId = undefined
  form.projectName = ''
  form.signedDate = ''
  form.status = 'draft'
  form.remark = ''
  form.items = []
  viewMode.value = false
  dialogVisible.value = true
}

const viewMode = ref(false)

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
  loadReconciliationUnits()
  loadProducts()
})
</script>

<style scoped>
.items-section {
  margin-bottom: 20px;
}
</style>
