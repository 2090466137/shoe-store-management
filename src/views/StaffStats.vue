<template>
  <div class="staff-stats-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="员工业绩"
      left-arrow
      @click-left="router.back()"
    />

    <div class="content-wrapper">
      <!-- 时间段选择 -->
      <div class="card">
        <van-tabs v-model:active="activeTab">
          <van-tab title="今日" name="today"></van-tab>
          <van-tab title="本月" name="month"></van-tab>
          <van-tab title="总计" name="total"></van-tab>
        </van-tabs>
      </div>

      <!-- 业绩排行 -->
      <div class="card">
        <div class="section-title">🏆 业绩排行</div>
        
        <div v-if="currentStats.length === 0" class="empty-state">
          <div class="empty-state-icon">📊</div>
          <div class="empty-state-text">暂无数据</div>
        </div>

        <div 
          v-for="(staff, index) in currentStats" 
          :key="staff.name"
          class="staff-card"
        >
          <div class="rank-badge" :class="`rank-${index + 1}`">
            {{ index + 1 }}
          </div>
          
          <div class="staff-content">
            <div class="staff-header">
              <div class="staff-name">{{ staff.name }}</div>
              <div class="staff-amount" v-if="canViewProfit">¥{{ staff.totalAmount.toFixed(2) }}</div>
            </div>
            
            <div class="staff-details">
              <div class="detail-item">
                <span class="detail-label">销售单数</span>
                <span class="detail-value">{{ staff.salesCount }} 单</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">销售件数</span>
                <span class="detail-value">{{ staff.quantity }} 件</span>
              </div>
              <div class="detail-item" v-if="canViewProfit">
                <span class="detail-label">总销售额</span>
                <span class="detail-value">¥{{ staff.totalAmount.toFixed(2) }}</span>
              </div>
              <div class="detail-item" v-if="canViewProfit">
                <span class="detail-label">总利润</span>
                <span class="detail-value profit">¥{{ staff.totalProfit.toFixed(2) }}</span>
              </div>
              <div class="detail-item" v-if="canViewProfit">
                <span class="detail-label">客单价</span>
                <span class="detail-value">¥{{ (staff.totalAmount / staff.salesCount).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSalesStore } from '@/stores/sales'
import { useUserStore, PERMISSIONS } from '@/stores/user'

const router = useRouter()
const salesStore = useSalesStore()
const userStore = useUserStore()
const activeTab = ref('today')

// 检查是否有查看所有员工业绩的权限
const canViewAllStats = computed(() => userStore.hasPermission(PERMISSIONS.STAFF_STATS_ALL))

// 检查是否有查看利润的权限
const canViewProfit = computed(() => userStore.hasPermission(PERMISSIONS.STATS_PROFIT))

const currentStats = computed(() => {
  let stats = []
  switch (activeTab.value) {
    case 'today':
      stats = salesStore.todaySalespersonStats
      break
    case 'month':
      stats = salesStore.monthSalespersonStats
      break
    case 'total':
      stats = salesStore.salespersonStats
      break
    default:
      stats = []
  }
  
  // 如果没有查看所有员工业绩的权限，只显示自己的
  if (!canViewAllStats.value) {
    return stats.filter(s => s.name === userStore.currentUserName)
  }
  
  return stats
})
</script>

<style scoped>
.staff-stats-page {
  background-color: #f7f8fa;
}

.staff-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f7f8fa;
  border-radius: 8px;
  margin-bottom: 12px;
}

.staff-card:last-child {
  margin-bottom: 0;
}

.rank-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.rank-badge.rank-1 {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #8b6914;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
}

.rank-badge.rank-2 {
  background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
  color: #666;
  box-shadow: 0 2px 8px rgba(192, 192, 192, 0.4);
}

.rank-badge.rank-3 {
  background: linear-gradient(135deg, #cd7f32 0%, #e8a87c 100%);
  color: #5c3a1a;
  box-shadow: 0 2px 8px rgba(205, 127, 50, 0.4);
}

.rank-badge:not(.rank-1):not(.rank-2):not(.rank-3) {
  background: linear-gradient(135deg, #969799 0%, #c8c9cc 100%);
}

.staff-content {
  flex: 1;
}

.staff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.staff-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.staff-amount {
  font-size: 20px;
  font-weight: 600;
  color: #1989fa;
}

.staff-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #969799;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}

.detail-value.profit {
  color: #07c160;
}
</style>

