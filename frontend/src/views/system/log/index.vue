<template>
  <div class="page-container">
    <div class="search-bar mb-16">
      <el-input v-model="queryForm.keyword" placeholder="搜索内容" style="width: 250px" />
      <el-select v-model="queryForm.operation" placeholder="操作类型" clearable style="width: 150px">
        <el-option label="新增" value="create" />
        <el-option label="编辑" value="update" />
        <el-option label="删除" value="delete" />
        <el-option label="查询" value="query" />
        <el-option label="登录" value="login" />
      </el-select>
      <el-date-picker v-model="queryForm.startDate" type="date" value-format="YYYY-MM-DD" style="width: 150px" placeholder="开始日期" />
      <el-date-picker v-model="queryForm.endDate" type="date" value-format="YYYY-MM-DD" style="width: 150px" placeholder="结束日期" />
      <el-button type="primary" @click="handleQuery">查询</el-button>
    </div>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="操作人" width="120" />
      <el-table-column prop="operation" label="操作类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getOperationType(row.operation)" size="small">{{ getOperationText(row.operation) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="module" label="操作模块" width="120" />
      <el-table-column prop="content" label="操作内容" min-width="300" />
      <el-table-column prop="ip" label="IP地址" width="150" />
      <el-table-column prop="createdAt" label="操作时间" width="180" />
    </el-table>

    <el-pagination class="mt-16" v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

const loading = ref(false)

const queryForm = reactive({
  keyword: '',
  operation: '',
  startDate: '',
  endDate: ''
})

const pagination = reactive({ page: 1, pageSize: 10, total: 200 })

const tableData = ref([
  { id: 1, username: 'admin', operation: 'login', module: '系统', content: '用户登录系统', ip: '192.168.1.100', createdAt: '2024-01-25 10:30:25' },
  { id: 2, username: 'admin', operation: 'create', module: '报货管理', content: '新增报货单 BH-202401005', ip: '192.168.1.100', createdAt: '2024-01-25 10:35:42' },
  { id: 3, username: 'stat', operation: 'update', module: '送货单管理', content: '更新送货单 SHD-202401001 状态为已签收', ip: '192.168.1.101', createdAt: '2024-01-25 11:20:15' },
  { id: 4, username: 'finance', operation: 'create', module: '财务中心', content: '开具发票 FP-202401003', ip: '192.168.1.102', createdAt: '2024-01-25 14:10:33' },
  { id: 5, username: 'admin', operation: 'delete', module: '系统管理', content: '删除用户 test', ip: '192.168.1.100', createdAt: '2024-01-25 15:45:20' }
])

const getOperationType = (operation: string): 'success' | 'warning' | 'info' | 'danger' => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
    create: 'success',
    update: 'warning',
    delete: 'danger',
    query: 'info',
    login: 'info'
  }
  return map[operation] || 'info'
}

const getOperationText = (operation: string) => ({
  create: '新增',
  update: '编辑',
  delete: '删除',
  query: '查询',
  login: '登录'
}[operation] || operation)

const handleQuery = () => {
  pagination.page = 1
}

onMounted(() => {
})
</script>

<style scoped lang="scss">
.page-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.search-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.mt-16 { margin-top: 16px; }
.mb-16 { margin-bottom: 16px; }
</style>