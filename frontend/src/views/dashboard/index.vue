<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #409eff">
            <el-icon :size="32"><Box /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-label">供应商数量</p>
            <p class="stat-value">{{ stats.supplierCount }}</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #67c23a">
            <el-icon :size="32"><OfficeBuilding /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-label">工地项目数量</p>
            <p class="stat-value">{{ stats.projectCount }}</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #e6a23c">
            <el-icon :size="32"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-label">待对账单据</p>
            <p class="stat-value">{{ stats.pendingStatement }}</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #f56c6c">
            <el-icon :size="32"><Money /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-label">应收应付款</p>
            <p class="stat-value">¥{{ stats.arrearsAmount.toLocaleString() }}</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-16">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" @click="router.push('/customer?action=add')">
              <el-icon><Plus /></el-icon> 新增客商
            </el-button>
            <el-button type="success" @click="router.push('/contract?action=add')">
              <el-icon><Plus /></el-icon> 新签合同
            </el-button>
            <el-button type="warning" @click="router.push('/delivery?action=add')">
              <el-icon><Plus /></el-icon> 录入送货单
            </el-button>
            <el-button type="info" @click="router.push('/invoice?action=add')">
              <el-icon><Plus /></el-icon> 登记发票
            </el-button>
          </div>
        </el-card>

        <el-card class="mt-16">
          <template #header>
            <span>待办事项</span>
          </template>
          <el-table :data="todos" style="width: 100%">
            <el-table-column prop="type" label="类型" width="120">
              <template #default="{ row }">
                <el-tag :type="row.type === 'statement' ? 'warning' : 'primary'" size="small">
                  {{ row.typeName }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="事项" />
            <el-table-column prop="amount" label="金额" width="120" align="right">
              <template #default="{ row }"> ¥{{ row.amount?.toLocaleString() }} </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-button type="primary" link @click="handleTodo(row)">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <span>近期待办</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="item in recentTodos"
              :key="item.id"
              :timestamp="item.date"
              :type="item.type"
              placement="top"
            >
              <el-card>
                <h4>{{ item.title }}</h4>
                <p>{{ item.content }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Box, OfficeBuilding, Document, Money, Plus } from '@element-plus/icons-vue'

const router = useRouter()

const stats = reactive({
  supplierCount: 12,
  projectCount: 8,
  pendingStatement: 5,
  arrearsAmount: 1256800
})

const todos = ref([
  { id: 1, type: 'statement', typeName: '对账单', content: '浙江建材供应商 5月批次对账', amount: 258000 },
  { id: 2, type: 'invoice', typeName: '发票', content: '上海工地项目 待收销项发票', amount: 85000 },
  { id: 3, type: 'payment', typeName: '付款', content: '江苏石料厂 付款申请', amount: 156000 }
])

const recentTodos = ref<{ id: number; type: 'primary' | 'success' | 'warning' | 'info' | 'danger'; title: string; content: string; date: string }[]>([
  { id: 1, type: 'primary', title: '送货单待确认', content: '杭州工地 ALC板送货单 #DL20240501', date: '2024-05-01' },
  { id: 2, type: 'warning', title: '上游对账', content: '山东砂浆供应商 月度对账单待审核', date: '2024-04-30' },
  { id: 3, type: 'success', title: '发票已收', content: '进项发票 #INV20240428 已入库', date: '2024-04-28' },
  { id: 4, type: 'info', title: '回款到账', content: '南京工地 回款 ¥180,000', date: '2024-04-27' }
])

const handleTodo = (row: any) => {
  const pathMap: Record<string, string> = {
    statement: '/upstream',
    invoice: '/invoice',
    payment: '/payment'
  }
  router.push(pathMap[row.type] || '/dashboard')
}
</script>

<style scoped lang="scss">
.dashboard {
  padding: 20px;
}

.stat-cards {
  .stat-card {
    display: flex;
    align-items: center;
    padding: 20px;
    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      margin-right: 16px;
    }
    .stat-info {
      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 8px;
      }
      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: #303133;
      }
    }
  }
}

.quick-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
