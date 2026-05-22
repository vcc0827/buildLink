<template>
  <div class="page-container">
    <div class="search-bar">
      <div class="search-group">
        <el-select v-model="queryForm.region" placeholder="地区" clearable class="search-select">
          <el-option v-for="r in regions" :key="r" :value="r" :label="r" />
        </el-select>
        <el-select v-model="queryForm.category" placeholder="产品大类" clearable class="search-select">
          <el-option v-for="c in categories" :key="c" :value="c" :label="c" />
        </el-select>
        <el-input
          v-model="queryForm.month"
          type="month"
          placeholder="生效月份"
          class="search-input"
        />
        <el-button type="primary" class="search-btn" @click="handleQuery">查询</el-button>
        <el-button class="reset-btn" @click="handleReset">重置</el-button>
      </div>
      <div class="action-btns">
        <el-button type="primary" class="add-btn" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新增信息价
        </el-button>
      </div>
    </div>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="region" label="地区" width="100" />
      <el-table-column prop="category" label="产品大类" width="120" />
      <el-table-column prop="model" label="型号" width="120" />
      <el-table-column prop="spec" label="规格" width="120" />
      <el-table-column prop="unit" label="计量单位" width="100" />
      <el-table-column prop="taxIncludedPrice" label="含税价格(元)" width="120">
        <template #default="{ row }">
          {{ formatPrice(row.taxIncludedPrice) }}
        </template>
      </el-table-column>

      <el-table-column prop="month" label="生效月份" width="120" />
      <el-table-column prop="remark" label="备注" min-width="150" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="地区" prop="region">
          <el-select v-model="form.region" placeholder="请选择" style="width: 100%">
            <el-option label="无锡" value="无锡" />
            <el-option label="上海" value="上海" />
            <el-option label="南京" value="南京" />
            <el-option label="苏州" value="苏州" />
            <el-option label="杭州" value="杭州" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="产品大类" prop="category">
          <el-select v-model="form.category" placeholder="请选择" style="width: 100%">
            <el-option label="砂浆" value="砂浆" />
            <el-option label="加气块" value="加气块" />
            <el-option label="红砖" value="红砖" />
            <el-option label="水泥" value="水泥" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="型号" prop="model">
          <el-input v-model="form.model" placeholder="如：砌筑砂浆、抹灰砂浆" />
        </el-form-item>
        <el-form-item label="规格" prop="spec">
          <el-input v-model="form.spec" placeholder="如：dmm5.0、dpm10" />
        </el-form-item>
        <el-form-item label="计量单位" prop="unit">
          <el-select v-model="form.unit" placeholder="请选择" style="width: 100%">
            <el-option label="吨" value="吨" />
            <el-option label="立方米" value="立方米" />
            <el-option label="块" value="块" />
            <el-option label="袋" value="袋" />
          </el-select>
        </el-form-item>
        <el-form-item label="含税价格" prop="taxIncludedPrice">
          <el-input v-model.number="form.taxIncludedPrice" type="number" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="除税价格" prop="taxExcludedPrice">
          <el-input v-model.number="form.taxExcludedPrice" type="number" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="生效月份" prop="month">
          <el-input v-model="form.month" type="month" placeholder="请选择" />
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
import type { PriceInfo } from '@/api/price-info'
import { priceInfoApi } from '@/api/price-info'

const loading = ref(false)
const tableData = ref<PriceInfo[]>([])
const dialogVisible = ref(false)

const formatPrice = (price: number | string | undefined): string => {
  if (price === undefined || price === null) return '0.00'
  const num = typeof price === 'string' ? parseFloat(price) : price
  return isNaN(num) ? '0.00' : num.toFixed(2)
}
const dialogTitle = computed(() => (form.id ? '编辑信息价' : '新增信息价'))

const regions = ref<string[]>([])
const categories = ref<string[]>([])

const queryForm = reactive({
  region: '',
  category: '',
  month: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formRef = ref()
const form = reactive<Partial<PriceInfo>>({
  id: undefined,
  region: '',
  category: '',
  model: '',
  spec: '',
  unit: '',
  taxIncludedPrice: 0,
  taxExcludedPrice: 0,
  month: '',
  remark: ''
})

const rules = {
  region: [{ required: true, message: '请选择地区', trigger: 'change' }],
  category: [{ required: true, message: '请选择产品大类', trigger: 'change' }],
  model: [{ required: true, message: '请输入型号', trigger: 'blur' }],
  unit: [{ required: true, message: '请选择计量单位', trigger: 'change' }],
  taxIncludedPrice: [{ required: true, message: '请输入含税价格', trigger: 'blur' }],
  taxExcludedPrice: [{ required: true, message: '请输入除税价格', trigger: 'blur' }],
  month: [{ required: true, message: '请选择生效月份', trigger: 'change' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const params = { ...queryForm, page: pagination.page, pageSize: pagination.pageSize }
    const res = await priceInfoApi.list(params)
    tableData.value = res.data.data || []
    pagination.total = res.data.total || 0
  } catch {
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const loadOptions = async () => {
  try {
    const [regionRes, categoryRes] = await Promise.all([
      priceInfoApi.getRegions(),
      priceInfoApi.getCategories()
    ])
    regions.value = regionRes.data || []
    categories.value = categoryRes.data || []
  } catch {
    regions.value = []
    categories.value = []
  }
}

const handleQuery = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  Object.assign(queryForm, { region: '', category: '', month: '' })
  handleQuery()
}

const handleAdd = () => {
  const now = new Date()
  Object.assign(form, {
    id: undefined,
    region: '',
    category: '',
    model: '',
    spec: '',
    unit: '',
    taxIncludedPrice: 0,
    taxExcludedPrice: 0,
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    remark: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row: PriceInfo) => {
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleDelete = async (row: PriceInfo) => {
  await ElMessageBox.confirm('确认删除该信息价吗？', '提示', { type: 'warning' })
  try {
    await priceInfoApi.delete(row.id!)
    ElMessage.success('删除成功')
    loadData()
  } catch {
    ElMessage.error('删除失败')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    if (form.id) {
      await priceInfoApi.update(form.id, form)
    } else {
      await priceInfoApi.create(form as Omit<PriceInfo, 'id' | 'createdAt' | 'updatedAt'>)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
    loadOptions()
  } catch {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  loadData()
  loadOptions()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.search-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.search-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 200px;
}

.search-select {
  width: 160px;
}

.search-btn, .reset-btn {
  width: 80px;
}

.action-btns {
  display: flex;
  gap: 12px;
}

.add-btn {
  width: 140px;
}

.mt-16 {
  margin-top: 16px;
}
</style>