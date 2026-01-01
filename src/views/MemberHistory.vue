<template>
  <div class="member-history-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="会员历史记录"
      left-arrow
      @click-left="router.back()"
    >
      <template #right>
        <van-icon name="filter-o" size="22" @click="showFilterPopup = true" />
      </template>
    </van-nav-bar>

    <div class="content-wrapper">
      <!-- 统计卡片 -->
      <div class="stats-card card">
        <div class="stats-grid">
          <div class="stats-item">
            <div class="stats-label">总充值</div>
            <div class="stats-value success">¥{{ totalRechargeAmount.toFixed(2) }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">总消费</div>
            <div class="stats-value primary">¥{{ totalConsumptionAmount.toFixed(2) }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">充值次数</div>
            <div class="stats-value">{{ filteredRecharges.length }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">消费次数</div>
            <div class="stats-value">{{ filteredConsumptions.length }}</div>
          </div>
        </div>
      </div>

      <!-- 筛选标签 -->
      <div class="filter-tabs">
        <van-tabs v-model:active="activeTab" @change="onTabChange">
          <van-tab title="全部" name="all"></van-tab>
          <van-tab title="充值记录" name="recharge"></van-tab>
          <van-tab title="消费记录" name="consumption"></van-tab>
        </van-tabs>
      </div>

      <!-- 记录列表 -->
      <div class="history-list">
        <div v-if="displayRecords.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-text">暂无记录</div>
        </div>

        <div 
          v-for="record in displayRecords" 
          :key="record.id"
          class="history-item"
        >
          <div class="history-header">
            <span class="history-type" :class="record.type">
              {{ record.type === 'recharge' ? '充值' : '消费' }}
            </span>
            <span class="history-time">{{ formatDate(record.time) }}</span>
          </div>

          <div class="history-content">
            <div class="history-member">
              <div class="member-name">{{ record.memberName }}</div>
              <div class="member-phone">{{ record.memberPhone }}</div>
            </div>
            <div class="history-amount" :class="record.type">
              {{ record.type === 'recharge' ? '+' : '-' }}¥{{ record.amount.toFixed(2) }}
            </div>
          </div>

          <div class="history-footer" v-if="record.notes || record.paymentMethod">
            <span class="history-payment" v-if="record.paymentMethod">
              {{ record.paymentMethod }}
            </span>
            <span class="history-notes" v-if="record.notes">
              {{ record.notes }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选弹窗 -->
    <van-popup 
      v-model:show="showFilterPopup" 
      position="bottom" 
      :style="{ height: '60%' }"
    >
      <div class="filter-popup">
        <div class="filter-header">
          <span class="filter-title">筛选条件</span>
          <van-icon name="cross" @click="showFilterPopup = false" />
        </div>

        <div class="filter-content">
          <!-- 会员筛选 -->
          <div class="filter-section">
            <div class="filter-section-title">选择会员</div>
            <van-field
              v-model="filterMemberText"
              placeholder="全部会员"
              readonly
              is-link
              @click="showMemberPicker = true"
            />
          </div>

          <!-- 日期筛选 -->
          <div class="filter-section">
            <div class="filter-section-title">日期范围</div>
            <van-field
              v-model="dateRangeText"
              placeholder="全部日期"
              readonly
              is-link
              @click="showDatePicker = true"
            />
          </div>

          <!-- 按钮 -->
          <div class="filter-actions">
            <van-button block @click="resetFilter">重置</van-button>
            <van-button type="primary" block @click="applyFilter">确定</van-button>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 会员选择器 -->
    <van-popup v-model:show="showMemberPicker" position="bottom" :style="{ height: '50%' }" teleport="body" :z-index="3000" safe-area-inset-bottom>
      <div class="picker-popup">
        <div class="picker-header">
          <span class="picker-title">选择会员</span>
          <van-icon name="cross" @click="showMemberPicker = false" />
        </div>
        <div class="picker-content">
          <div 
            class="member-picker-item"
            @click="selectMember(null)"
          >
            <div class="member-picker-name">全部会员</div>
          </div>
          <div 
            v-for="member in memberStore.getAllMembers" 
            :key="member.id"
            class="member-picker-item"
            @click="selectMember(member)"
          >
            <div class="member-picker-info">
              <div class="member-picker-name">{{ member.name || '未命名' }}</div>
              <div class="member-picker-phone">{{ member.phone }}</div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 日期选择器 -->
    <van-popup 
      v-model:show="showDatePicker" 
      position="bottom"
      round
      teleport="body"
      :z-index="3000"
      safe-area-inset-bottom
    >
      <div class="popup-header">
        <span></span>
        <span class="popup-title">选择日期</span>
        <van-icon name="cross" class="popup-close" @click="showDatePicker = false" />
      </div>
      <van-datetime-picker
        v-model="tempDateRange"
        type="date"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMemberStore } from '@/stores/member'
import { useSalesStore } from '@/stores/sales'
import { supabase, TABLES } from '@/config/supabase'

const router = useRouter()
const memberStore = useMemberStore()
const salesStore = useSalesStore()

// UI 状态
const activeTab = ref('all')
const showFilterPopup = ref(false)
const showMemberPicker = ref(false)
const showDatePicker = ref(false)

// 筛选条件
const filterMember = ref(null)
const filterMemberText = ref('全部会员')
const dateRange = ref(null)
const dateRangeText = ref('全部日期')
const tempDateRange = ref(new Date())

// 数据
const recharges = ref([])
const consumptions = ref([])
const loading = ref(false)

// 加载充值记录
const loadRecharges = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.MEMBER_RECHARGES)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('加载充值记录失败:', error)
      return
    }

    recharges.value = data.map(r => {
      const member = memberStore.getMemberById(r.member_id)
      return {
        id: r.id,
        type: 'recharge',
        memberId: r.member_id,
        memberName: member?.name || '未知会员',
        memberPhone: member?.phone || '',
        amount: parseFloat(r.amount) || 0,
        paymentMethod: r.payment_method || '现金',
        notes: r.notes || '',
        time: new Date(r.created_at).getTime()
      }
    })
  } catch (error) {
    console.error('加载充值记录异常:', error)
  }
}

// 加载消费记录（从销售记录中筛选会员消费）
const loadConsumptions = () => {
  consumptions.value = salesStore.getAllSales
    .filter(sale => sale.memberId)
    .map(sale => {
      const member = memberStore.getMemberById(sale.memberId)
      return {
        id: sale.id,
        type: 'consumption',
        memberId: sale.memberId,
        memberName: member?.name || '未知会员',
        memberPhone: member?.phone || '',
        amount: sale.actualAmount || sale.totalAmount,
        paymentMethod: sale.paymentMethod || '会员余额',
        notes: sale.remark || '',
        time: sale.time || sale.date
      }
    })
}

// 筛选后的充值记录
const filteredRecharges = computed(() => {
  let records = recharges.value

  // 会员筛选
  if (filterMember.value) {
    records = records.filter(r => r.memberId === filterMember.value.id)
  }

  // 日期筛选
  if (dateRange.value) {
    const startTime = new Date(dateRange.value).setHours(0, 0, 0, 0)
    const endTime = new Date(dateRange.value).setHours(23, 59, 59, 999)
    records = records.filter(r => r.time >= startTime && r.time <= endTime)
  }

  return records
})

// 筛选后的消费记录
const filteredConsumptions = computed(() => {
  let records = consumptions.value

  // 会员筛选
  if (filterMember.value) {
    records = records.filter(r => r.memberId === filterMember.value.id)
  }

  // 日期筛选
  if (dateRange.value) {
    const startTime = new Date(dateRange.value).setHours(0, 0, 0, 0)
    const endTime = new Date(dateRange.value).setHours(23, 59, 59, 999)
    records = records.filter(r => r.time >= startTime && r.time <= endTime)
  }

  return records
})

// 显示的记录（根据标签页筛选）
const displayRecords = computed(() => {
  let records = []
  
  if (activeTab.value === 'all') {
    records = [...filteredRecharges.value, ...filteredConsumptions.value]
  } else if (activeTab.value === 'recharge') {
    records = filteredRecharges.value
  } else {
    records = filteredConsumptions.value
  }

  // 按时间倒序排序
  return records.sort((a, b) => b.time - a.time)
})

// 统计数据
const totalRechargeAmount = computed(() => {
  return filteredRecharges.value.reduce((sum, r) => sum + r.amount, 0)
})

const totalConsumptionAmount = computed(() => {
  return filteredConsumptions.value.reduce((sum, r) => sum + r.amount, 0)
})

const onTabChange = () => {
  // 标签切换逻辑已在computed中处理
}

const selectMember = (member) => {
  filterMember.value = member
  filterMemberText.value = member ? `${member.name || '未命名'} (${member.phone})` : '全部会员'
  showMemberPicker.value = false
}

const onDateConfirm = (value) => {
  dateRange.value = value
  const date = new Date(value)
  dateRangeText.value = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  showDatePicker.value = false
}

const resetFilter = () => {
  filterMember.value = null
  filterMemberText.value = '全部会员'
  dateRange.value = null
  dateRangeText.value = '全部日期'
  showFilterPopup.value = false
}

const applyFilter = () => {
  showFilterPopup.value = false
}

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

onMounted(async () => {
  loading.value = true
  await Promise.all([
    memberStore.loadMembers(),
    salesStore.loadSales(),
    loadRecharges()
  ])
  loadConsumptions()
  loading.value = false
})
</script>

<style scoped>
.member-history-page {
  background-color: #f7f8fa;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stats-item {
  text-align: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(91, 143, 249, 0.08);
  border: 1px solid #e5e7eb;
}

.stats-label {
  font-size: 13px;
  color: #969799;
  margin-bottom: 8px;
}

.stats-value {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
}

.stats-value.success {
  color: #07c160;
}

.stats-value.primary {
  color: #1989fa;
}

.filter-tabs {
  background: white;
  margin-bottom: 12px;
}

.history-list {
  padding: 0 16px;
}

.history-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebedf0;
}

.history-type {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.history-type.recharge {
  background: #e6f7ff;
  color: #07c160;
}

.history-type.consumption {
  background: #fff3e0;
  color: #1989fa;
}

.history-time {
  font-size: 13px;
  color: #969799;
}

.history-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.history-member {
  flex: 1;
}

.member-name {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.member-phone {
  font-size: 13px;
  color: #969799;
}

.history-amount {
  font-size: 20px;
  font-weight: 600;
}

.history-amount.recharge {
  color: #07c160;
}

.history-amount.consumption {
  color: #1989fa;
}

.history-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #ebedf0;
  font-size: 12px;
  color: #969799;
}

.filter-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebedf0;
}

.filter-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.filter-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 12px;
}

.filter-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 24px;
}

.picker-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebedf0;
}

.picker-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.picker-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.member-picker-item {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  cursor: pointer;
}

.member-picker-item:active {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(91, 143, 249, 0.12);
}

.member-picker-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-picker-name {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}

.member-picker-phone {
  font-size: 12px;
  color: #969799;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #969799;
}

/* 弹窗头部 */
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.popup-close {
  font-size: 20px;
  color: #969799;
  cursor: pointer;
  padding: 4px;
}

.popup-close:active {
  opacity: 0.7;
}
</style>

