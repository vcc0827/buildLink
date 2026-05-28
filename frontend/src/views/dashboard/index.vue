<template>
  <div class="dashboard-container">
    <!-- 统计卡片区域 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon receivable">
          <el-icon><ArrowUp /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-label">应收总额</p>
          <p class="stat-value">¥{{ formatMoney(stats.receivableTotal) }}</p>
          <p class="stat-change positive">+{{ stats.receivableChange }}%</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon payable">
          <el-icon><ArrowDown /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-label">应付总额</p>
          <p class="stat-value">¥{{ formatMoney(stats.payableTotal) }}</p>
          <p class="stat-change negative">-{{ stats.payableChange }}%</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon pending">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-label">待回款</p>
          <p class="stat-value">¥{{ formatMoney(stats.pendingReceivable) }}</p>
          <p class="stat-label-sm">{{ stats.pendingReceivableCount }} 笔</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon uninvoice">
          <el-icon><Files /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-label">未开票</p>
          <p class="stat-value">¥{{ formatMoney(stats.uninvoiceAmount) }}</p>
          <p class="stat-label-sm">{{ stats.uninvoiceCount }} 笔</p>
        </div>
      </div>
    </div>

    <!-- 提醒区域 -->
    <div class="reminder-section">
      <div class="reminder-card">
        <div class="card-header">
          <h3><el-icon><Warning /></el-icon> 待处理提醒</h3>
        </div>
        <div class="reminder-list">
          <div class="reminder-item overdue" v-for="item in reminders.overdue" :key="'overdue-' + item.id">
            <div class="reminder-badge">逾期</div>
            <div class="reminder-content">
              <span>{{ item.title }}</span>
              <span class="reminder-time">{{ item.time }}</span>
            </div>
          </div>
          <div class="reminder-item" v-for="item in reminders.pending" :key="'pending-' + item.id">
            <div class="reminder-badge pending">待办</div>
            <div class="reminder-content">
              <span>{{ item.title }}</span>
              <span class="reminder-time">{{ item.time }}</span>
            </div>
          </div>
          <div v-if="reminders.overdue.length === 0 && reminders.pending.length === 0" class="empty-reminder">
            暂无待处理事项
          </div>
        </div>
      </div>

      <div class="reminder-card">
        <div class="card-header">
          <h3><el-icon><Calendar /></el-icon> 本月数据概览</h3>
        </div>
        <div class="monthly-summary">
          <div class="summary-item">
            <span class="summary-label">报货单</span>
            <span class="summary-value">{{ monthlyData.orderCount }}</span>
            <span class="summary-trend" :class="monthlyData.orderTrend > 0 ? 'up' : 'down'">
              {{ monthlyData.orderTrend > 0 ? '+' : '' }}{{ monthlyData.orderTrend }}%
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">送货单</span>
            <span class="summary-value">{{ monthlyData.deliveryCount }}</span>
            <span class="summary-trend" :class="monthlyData.deliveryTrend > 0 ? 'up' : 'down'">
              {{ monthlyData.deliveryTrend > 0 ? '+' : '' }}{{ monthlyData.deliveryTrend }}%
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">开票金额</span>
            <span class="summary-value">¥{{ formatMoney(monthlyData.invoiceAmount) }}</span>
            <span class="summary-trend" :class="monthlyData.invoiceTrend > 0 ? 'up' : 'down'">
              {{ monthlyData.invoiceTrend > 0 ? '+' : '' }}{{ monthlyData.invoiceTrend }}%
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">回款金额</span>
            <span class="summary-value">¥{{ formatMoney(monthlyData.paymentAmount) }}</span>
            <span class="summary-trend" :class="monthlyData.paymentTrend > 0 ? 'up' : 'down'">
              {{ monthlyData.paymentTrend > 0 ? '+' : '' }}{{ monthlyData.paymentTrend }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 今日数据区域 -->
    <div class="today-section">
      <div class="section-header">
        <h3><el-icon><Sunny /></el-icon> 今日数据</h3>
        <span class="today-date">{{ todayDate }}</span>
      </div>
      <div class="today-grid">
        <div class="today-item">
          <span class="today-label">新增报货</span>
          <span class="today-value">{{ todayData.orderCount }}</span>
        </div>
        <div class="today-item">
          <span class="today-label">新增送货</span>
          <span class="today-value">{{ todayData.deliveryCount }}</span>
        </div>
        <div class="today-item">
          <span class="today-label">新增开票</span>
          <span class="today-value">{{ todayData.invoiceCount }}</span>
        </div>
        <div class="today-item">
          <span class="today-label">新增回款</span>
          <span class="today-value">{{ todayData.paymentCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">import { reactive, computed, onMounted } from 'vue';
import { ArrowUp, ArrowDown, Clock, Files, Warning, Calendar } from '@element-plus/icons-vue';
const formatMoney = (amount: number) => {
 if (amount >= 100000000) {
 return (amount / 100000000).toFixed(2) + '亿';
 }
 else if (amount >= 10000) {
 return (amount / 10000).toFixed(2) + '万';
 }
 return amount.toFixed(2);
};
const todayDate = computed(() => {
 const now = new Date();
 const year = now.getFullYear();
 const month = String(now.getMonth() + 1).padStart(2, '0');
 const day = String(now.getDate()).padStart(2, '0');
 const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
 return `${year}-${month}-${day} 周${weekDays[now.getDay()]}`;
});
const stats = reactive({
 receivableTotal: 12580000,
 receivableChange: 12.5,
 payableTotal: 8960000,
 payableChange: 8.3,
 pendingReceivable: 3580000,
 pendingReceivableCount: 12,
 uninvoiceAmount: 2450000,
 uninvoiceCount: 8
});
const reminders = reactive({
 overdue: [
 { id: 1, title: '项目A 货款逾期30天', time: '2024-01-15' },
 { id: 2, title: '项目B 货款逾期15天', time: '2024-01-30' },
 { id: 3, title: '报货单HD202401001 超期未发货', time: '2024-01-28' }
 ],
 pending: [
 { id: 4, title: '待确认送货单 3笔', time: '今日' },
 { id: 5, title: '待开具发票 5张', time: '本周' },
 { id: 6, title: '待核销款项 2笔', time: '本周' }
 ]
});
const monthlyData = reactive({
 orderCount: 45,
 orderTrend: 15,
 deliveryCount: 68,
 deliveryTrend: 22,
 invoiceAmount: 3580000,
 invoiceTrend: 18,
 paymentAmount: 2950000,
 paymentTrend: 8
});
const todayData = reactive({
 orderCount: 3,
 deliveryCount: 5,
 invoiceCount: 2,
 paymentCount: 4
});
onMounted(() => {
});
</script>

<style scoped lang="scss">
.dashboard-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 80px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 24px;

  &.receivable {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }

  &.payable {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: #fff;
  }

  &.pending {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: #fff;
  }

  &.uninvoice {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    color: #fff;
  }
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin: 0 0 8px 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.stat-change {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;

  &.positive {
    background: #f0f9ff;
    color: #67c23a;
  }

  &.negative {
    background: #fef0f0;
    color: #f56c6c;
  }
}

.stat-label-sm {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

.reminder-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.reminder-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.card-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.reminder-list {
  max-height: 280px;
  overflow-y: auto;
}

.reminder-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  &.overdue {
    background: #fff7f7;
    margin: 8px -20px;
    padding: 12px 20px;
    border-radius: 4px;
  }
}

.reminder-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f56c6c;
  color: #fff;
  margin-right: 12px;
  flex-shrink: 0;

  &.pending {
    background: #e6a23c;
  }
}

.reminder-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #606266;
}

.reminder-time {
  color: #909399;
  font-size: 12px;
}

.empty-reminder {
  text-align: center;
  padding: 40px;
  color: #909399;
  font-size: 14px;
}

.monthly-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 8px;
}

.summary-label {
  font-size: 14px;
  color: #606266;
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.summary-trend {
  font-size: 13px;
  font-weight: 500;

  &.up {
    color: #67c23a;
  }

  &.down {
    color: #f56c6c;
  }
}

.today-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.today-date {
  font-size: 13px;
  color: #909399;
}

.today-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.today-item {
  text-align: center;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
}

.today-label {
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.today-value {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: #fff;
}

@media screen and (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .reminder-section {
    grid-template-columns: 1fr;
  }
}

@media screen and (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .today-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>