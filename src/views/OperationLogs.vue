<template>
  <div class="operation-logs-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="操作日志"
      left-arrow
      @click-left="router.back()"
    >
      <template #right>
        <van-icon name="filter-o" @click="showFilterPopup = true" />
      </template>
    </van-nav-bar>

    <!-- 统计卡片 -->
    <div class="stats-card">
      <div class="stat-item">
        <div class="stat-value">{{ logStore.stats.total }}</div>
        <div class="stat-label">总日志数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ logStore.stats.today }}</div>
        <div class="stat-label">今日操作</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ uniqueUsers }}</div>
        <div class="stat-label">操作人数</div>
      </div>
    </div>

    <!-- 筛选标签 -->
    <div class="filter-tags" v-if="hasActiveFilters">
      <van-tag
        v-if="filterType"
        closeable
        type="primary"
        @close="filterType = ''"
      >
        {{ logStore.OPERATION_TYPE_LABELS[filterType] }}
      </van-tag>
      <van-tag
        v-if="filterUser"
        closeable
        type="success"
        @close="filterUser = ''"
      >
        {{ filterUser }}
      </van-tag>
      <van-tag
        v-if="filterDateRange.length > 0"
        closeable
        type="warning"
        @close="filterDateRange = []"
      >
        {{ formatDateRange() }}
      </van-tag>
      <van-button
        size="small"
        type="danger"
        plain
        @click="clearFilters"
      >
        清除全部
      </van-button>
    </div>

    <!-- 日志列表 -->
    <div class="content-wrapper">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div
            v-for="log in displayedLogs"
            :key="log.id"
            class="log-item"
            @click="showLogDetail(log)"
          >
            <div class="log-header">
              <div class="log-type">
                <van-tag :type="getLogTypeColor(log.operationType)">
                  {{ log.operationLabel }}
                </van-tag>
              </div>
              <div class="log-time">{{ formatTime(log.createTime) }}</div>
            </div>
            
            <div class="log-content">
              <div class="log-user">
                <van-icon name="user-o" />
                <span>{{ log.username }}</span>
              </div>
              
              <div class="log-target" v-if="log.targetName">
                <van-icon name="label-o" />
                <span>{{ log.targetName }}</span>
              </div>
              
              <div class="log-details" v-if="log.details">
                {{ log.details }}
              </div>
            </div>
          </div>

          <van-empty
            v-if="displayedLogs.length === 0 && !loading"
            description="暂无操作日志"
          />
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 筛选弹窗 -->
    <van-popup
      v-model:show="showFilterPopup"
      position="bottom"
      :style="{ height: '60%' }"
      round
    >
      <div class="filter-popup">
        <div class="popup-header">
          <span class="popup-title">筛选条件</span>
          <van-button type="primary" size="small" @click="applyFilter">
            应用
          </van-button>
        </div>

        <div class="filter-content">
          <!-- 操作类型筛选 -->
          <van-cell-group title="操作类型" inset>
            <van-radio-group v-model="tempFilterType">
              <van-cell
                title="全部"
                clickable
                @click="tempFilterType = ''"
              >
                <template #right-icon>
                  <van-radio name="" />
                </template>
              </van-cell>
              <van-cell
                v-for="(label, type) in commonOperationTypes"
                :key="type"
                :title="label"
                clickable
                @click="tempFilterType = type"
              >
                <template #right-icon>
                  <van-radio :name="type" />
                </template>
              </van-cell>
            </van-radio-group>
          </van-cell-group>

          <!-- 日期范围筛选 -->
          <van-cell-group title="日期范围" inset>
            <van-cell
              title="选择日期范围"
              :value="tempFilterDateRange.length > 0 ? formatDateRange(tempFilterDateRange) : '全部'"
              is-link
              @click="showDatePicker = true"
            />
            <van-cell
              v-if="tempFilterDateRange.length > 0"
              title="清除日期筛选"
              is-link
              @click="tempFilterDateRange = []"
            />
          </van-cell-group>

          <!-- 快捷日期选择 -->
          <van-cell-group title="快捷选择" inset>
            <van-cell
              title="今天"
              is-link
              @click="selectToday"
            />
            <van-cell
              title="最近7天"
              is-link
              @click="selectLast7Days"
            />
            <van-cell
              title="最近30天"
              is-link
              @click="selectLast30Days"
            />
          </van-cell-group>
        </div>
      </div>
    </van-popup>

    <!-- 日期选择器 -->
    <van-calendar
      v-model:show="showDatePicker"
      type="range"
      @confirm="onDateConfirm"
      :min-date="minDate"
      :max-date="maxDate"
    />

    <!-- 日志详情弹窗 -->
    <van-popup
      v-model:show="showDetailPopup"
      position="bottom"
      :style="{ height: '70%' }"
      round
    >
      <div class="detail-popup" v-if="selectedLog">
        <div class="popup-header">
          <span class="popup-title">操作详情</span>
          <van-icon name="cross" @click="showDetailPopup = false" />
        </div>

        <div class="detail-content">
          <van-cell-group inset>
            <van-cell title="操作类型" :value="selectedLog.operationLabel" />
            <van-cell title="操作人" :value="selectedLog.username" />
            <van-cell title="操作时间" :value="formatFullTime(selectedLog.createTime)" />
            <van-cell
              v-if="selectedLog.targetName"
              title="操作对象"
              :value="selectedLog.targetName"
            />
            <van-cell
              v-if="selectedLog.details"
              title="操作详情"
              :label="selectedLog.details"
            />
          </van-cell-group>

          <!-- 变更对比 -->
          <van-cell-group
            v-if="selectedLog.oldValue || selectedLog.newValue"
            title="数据变更"
            inset
          >
            <div class="value-compare">
              <div class="old-value" v-if="selectedLog.oldValue">
                <div class="value-label">修改前：</div>
                <pre>{{ formatJSON(selectedLog.oldValue) }}</pre>
              </div>
              <div class="new-value" v-if="selectedLog.newValue">
                <div class="value-label">修改后：</div>
                <pre>{{ formatJSON(selectedLog.newValue) }}</pre>
              </div>
            </div>
          </van-cell-group>

          <!-- 技术信息 -->
          <van-cell-group title="技术信息" inset>
            <van-cell
              v-if="selectedLog.ipAddress"
              title="IP地址"
              :value="selectedLog.ipAddress"
            />
            <van-cell
              v-if="selectedLog.userAgent"
              title="浏览器"
              :label="selectedLog.userAgent"
            />
            <van-cell title="日志ID" :value="selectedLog.id" />
          </van-cell-group>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOperationLogStore } from '@/stores/operationLog'
import { showToast } from 'vant'

const router = useRouter()
const logStore = useOperationLogStore()

// UI 状态
const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const showFilterPopup = ref(false)
const showDatePicker = ref(false)
const showDetailPopup = ref(false)

// 筛选条件
const filterType = ref('')
const filterUser = ref('')
const filterDateRange = ref([])

// 临时筛选条件（用于弹窗）
const tempFilterType = ref('')
const tempFilterDateRange = ref([])

// 选中的日志
const selectedLog = ref(null)

// 日期范围限制
const minDate = new Date(2020, 0, 1)
const maxDate = new Date()

// 常用操作类型
const commonOperationTypes = {
  product_add: '添加商品',
  product_update: '修改商品',
  product_delete: '删除商品',
  sale_add: '新增销售',
  sale_delete: '删除销售',
  purchase_add: '新增进货',
  purchase_delete: '删除进货',
  return_add: '新增退货',
  member_recharge: '会员充值',
  user_login: '用户登录'
}

// 筛选后的日志列表
const filteredLogs = computed(() => {
  let result = logStore.getAllLogs

  // 按类型筛选
  if (filterType.value) {
    result = result.filter(log => log.operationType === filterType.value)
  }

  // 按用户筛选
  if (filterUser.value) {
    result = result.filter(log => log.username === filterUser.value)
  }

  // 按日期范围筛选
  if (filterDateRange.value.length === 2) {
    const [start, end] = filterDateRange.value
    result = result.filter(log =>
      log.createTime >= start.getTime() &&
      log.createTime <= end.getTime() + 24 * 60 * 60 * 1000 - 1
    )
  }

  return result
})

// 分页显示的日志
const pageSize = 20
const currentPage = ref(1)
const displayedLogs = computed(() => {
  return filteredLogs.value.slice(0, currentPage.value * pageSize)
})

// 是否有激活的筛选条件
const hasActiveFilters = computed(() => {
  return filterType.value || filterUser.value || filterDateRange.value.length > 0
})

// 唯一用户数
const uniqueUsers = computed(() => {
  const users = new Set(logStore.getAllLogs.map(log => log.userId))
  return users.size
})

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  // 1分钟内
  if (diff < 60000) {
    return '刚刚'
  }
  // 1小时内
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }
  // 今天
  if (date.toDateString() === now.toDateString()) {
    return date.toTimeString().slice(0, 5)
  }
  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.toTimeString().slice(0, 5)}`
  }
  // 其他
  return `${date.getMonth() + 1}-${date.getDate()} ${date.toTimeString().slice(0, 5)}`
}

// 格式化完整时间
const formatFullTime = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${date.toTimeString().slice(0, 8)}`
}

// 格式化日期范围
const formatDateRange = (range = filterDateRange.value) => {
  if (range.length !== 2) return ''
  const [start, end] = range
  return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`
}

// 格式化 JSON
const formatJSON = (value) => {
  try {
    if (typeof value === 'string') {
      return JSON.stringify(JSON.parse(value), null, 2)
    }
    return JSON.stringify(value, null, 2)
  } catch {
    return value
  }
}

// 获取日志类型颜色
const getLogTypeColor = (type) => {
  if (type.includes('add')) return 'success'
  if (type.includes('delete')) return 'danger'
  if (type.includes('update')) return 'warning'
  if (type.includes('login')) return 'primary'
  return 'default'
}

// 下拉刷新
const onRefresh = async () => {
  refreshing.value = true
  await logStore.loadLogs()
  currentPage.value = 1
  finished.value = false
  refreshing.value = false
  showToast('刷新成功')
}

// 加载更多
const onLoad = () => {
  if (displayedLogs.value.length >= filteredLogs.value.length) {
    finished.value = true
    return
  }
  
  setTimeout(() => {
    currentPage.value++
    loading.value = false
    
    if (displayedLogs.value.length >= filteredLogs.value.length) {
      finished.value = true
    }
  }, 500)
}

// 应用筛选
const applyFilter = () => {
  filterType.value = tempFilterType.value
  filterDateRange.value = [...tempFilterDateRange.value]
  showFilterPopup.value = false
  currentPage.value = 1
  finished.value = false
}

// 清除筛选
const clearFilters = () => {
  filterType.value = ''
  filterUser.value = ''
  filterDateRange.value = []
  tempFilterType.value = ''
  tempFilterDateRange.value = []
  currentPage.value = 1
  finished.value = false
}

// 日期确认
const onDateConfirm = (values) => {
  tempFilterDateRange.value = values
  showDatePicker.value = false
}

// 快捷日期选择
const selectToday = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  tempFilterDateRange.value = [today, new Date()]
}

const selectLast7Days = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 7)
  start.setHours(0, 0, 0, 0)
  tempFilterDateRange.value = [start, end]
}

const selectLast30Days = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  start.setHours(0, 0, 0, 0)
  tempFilterDateRange.value = [start, end]
}

// 显示日志详情
const showLogDetail = (log) => {
  selectedLog.value = log
  showDetailPopup.value = true
}

// 初始化
onMounted(async () => {
  loading.value = true
  await logStore.loadLogs()
  loading.value = false
})
</script>

<style scoped>
.operation-logs-page {
  background-color: #f7f8fa;
  min-height: 100vh;
}

.stats-card {
  display: flex;
  background: white;
  padding: 16px;
  margin: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(91, 143, 249, 0.08);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #969799;
}

.filter-tags {
  padding: 8px 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.content-wrapper {
  padding: 0 16px 16px;
}

.log-item {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(91, 143, 249, 0.08);
  cursor: pointer;
  transition: all 0.3s;
}

.log-item:active {
  transform: scale(0.98);
  box-shadow: 0 1px 2px rgba(91, 143, 249, 0.12);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.log-time {
  font-size: 12px;
  color: #969799;
}

.log-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.log-user,
.log-target {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #323233;
}

.log-details {
  font-size: 13px;
  color: #646566;
  margin-top: 4px;
  padding: 8px;
  background: #f0f2f5;
  border-radius: 8px;
}

.filter-popup,
.detail-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebedf0;
}

.popup-title {
  font-size: 16px;
  font-weight: bold;
}

.filter-content,
.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.value-compare {
  padding: 12px;
}

.value-label {
  font-weight: bold;
  margin-bottom: 8px;
  color: #323233;
}

.old-value,
.new-value {
  margin-bottom: 16px;
}

.old-value pre {
  background: #fff3f3;
  border-left: 3px solid #ee0a24;
}

.new-value pre {
  background: #f0f9ff;
  border-left: 3px solid #1989fa;
}

pre {
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>

