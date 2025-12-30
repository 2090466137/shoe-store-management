<template>
  <div class="data-management-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="数据管理"
      left-arrow
      @click-left="router.back()"
    />

    <div class="content-wrapper">
      <!-- 数据统计 -->
      <div class="card">
        <div class="section-title">📊 数据统计</div>
        <div class="stats-list">
          <div class="stat-row">
            <span class="stat-label">商品数量</span>
            <span class="stat-value">{{ dataStats.productsCount }} 个</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">销售记录</span>
            <span class="stat-value">{{ dataStats.salesCount }} 条</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">进货记录</span>
            <span class="stat-value">{{ dataStats.purchasesCount }} 条</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">最后备份</span>
            <span class="stat-value" :class="{ 'warning': needBackup }">
              {{ dataStats.lastBackupTime }}
            </span>
          </div>
        </div>
        
        <van-notice-bar
          v-if="needBackup"
          left-icon="info-o"
          color="#ff976a"
          background="#fff7e6"
          style="margin-top: 12px;"
        >
          建议备份数据，距离上次备份已超过24小时
        </van-notice-bar>
      </div>

      <!-- 数据备份 -->
      <div class="card">
        <div class="section-title">💾 数据备份</div>
        <div class="action-list">
          <van-button
            type="primary"
            size="large"
            block
            icon="down"
            @click="handleExportJSON"
            class="action-button"
          >
            导出完整备份（JSON）
          </van-button>
          
          <van-button
            type="success"
            size="large"
            block
            icon="down"
            @click="handleExportProductsCSV"
            class="action-button"
          >
            导出商品列表（CSV）
          </van-button>
          
          <van-button
            type="success"
            size="large"
            block
            icon="down"
            @click="handleExportSalesCSV"
            class="action-button"
          >
            导出销售记录（CSV）
          </van-button>
        </div>
        
        <div class="tips">
          <van-icon name="info-o" />
          <span>建议定期备份数据，防止数据丢失</span>
        </div>
      </div>

      <!-- 数据恢复 -->
      <div class="card">
        <div class="section-title">📥 数据恢复</div>
        <div class="action-list">
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            style="display: none"
            @change="handleFileSelect"
          />
          
          <van-button
            type="warning"
            size="large"
            block
            icon="upgrade"
            @click="$refs.fileInput.click()"
            class="action-button"
          >
            从备份文件恢复数据
          </van-button>
        </div>
        
        <div class="tips warning">
          <van-icon name="warning-o" />
          <span>恢复数据将覆盖当前所有数据，请谨慎操作！</span>
        </div>
      </div>

      <!-- 数据清理 -->
      <div class="card">
        <div class="section-title">🗑️ 数据清理</div>
        <div class="action-list">
          <van-button
            type="danger"
            size="large"
            block
            icon="delete-o"
            @click="handleClearData"
            class="action-button"
          >
            清空所有数据
          </van-button>
        </div>
        
        <div class="tips danger">
          <van-icon name="warning-o" />
          <span>此操作不可恢复，请务必先备份数据！</span>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="card">
        <div class="section-title">📖 使用说明</div>
        <div class="help-content">
          <div class="help-item">
            <div class="help-title">💾 完整备份（JSON）</div>
            <div class="help-text">
              包含所有商品、销售和进货数据，可用于完整恢复系统数据。
            </div>
          </div>
          
          <div class="help-item">
            <div class="help-title">📊 导出CSV</div>
            <div class="help-text">
              导出为Excel可打开的CSV格式，方便查看和打印。
            </div>
          </div>
          
          <div class="help-item">
            <div class="help-title">📥 数据恢复</div>
            <div class="help-text">
              选择之前导出的JSON备份文件，可恢复所有数据。
            </div>
          </div>
          
          <div class="help-item">
            <div class="help-title">⚠️ 注意事项</div>
            <div class="help-text">
              • 建议每天备份一次数据<br>
              • 备份文件请妥善保管<br>
              • 恢复数据前请先备份当前数据<br>
              • 清空数据操作不可恢复
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog, showLoadingToast, closeToast } from 'vant'
import {
  exportDataAsJSON,
  importDataFromJSON,
  exportProductsAsCSV,
  exportSalesAsCSV,
  autoBackup,
  updateBackupTime,
  clearAllData,
  getDataStats
} from '@/utils/backup'

const router = useRouter()
const fileInput = ref(null)
const dataStats = ref({
  productsCount: 0,
  salesCount: 0,
  purchasesCount: 0,
  lastBackupTime: '从未备份'
})
const needBackup = ref(false)

onMounted(() => {
  loadDataStats()
  checkBackupStatus()
})

const loadDataStats = () => {
  dataStats.value = getDataStats()
}

const checkBackupStatus = () => {
  const backupStatus = autoBackup()
  needBackup.value = backupStatus.needBackup
}

const handleExportJSON = () => {
  showLoadingToast({
    message: '正在导出...',
    forbidClick: true,
    duration: 0
  })
  
  setTimeout(() => {
    const result = exportDataAsJSON()
    closeToast()
    
    if (result.success) {
      updateBackupTime()
      loadDataStats()
      checkBackupStatus()
      
      showDialog({
        title: '导出成功',
        message: `文件已保存：${result.fileName}\n\n请妥善保管备份文件！`,
      })
    } else {
      showToast({
        type: 'fail',
        message: '导出失败：' + result.error
      })
    }
  }, 500)
}

const handleExportProductsCSV = () => {
  showLoadingToast({
    message: '正在导出...',
    forbidClick: true,
    duration: 0
  })
  
  setTimeout(() => {
    const result = exportProductsAsCSV()
    closeToast()
    
    if (result.success) {
      showToast({
        type: 'success',
        message: '商品列表导出成功'
      })
    } else {
      showToast({
        type: 'fail',
        message: result.error
      })
    }
  }, 500)
}

const handleExportSalesCSV = () => {
  showLoadingToast({
    message: '正在导出...',
    forbidClick: true,
    duration: 0
  })
  
  setTimeout(() => {
    const result = exportSalesAsCSV()
    closeToast()
    
    if (result.success) {
      showToast({
        type: 'success',
        message: '销售记录导出成功'
      })
    } else {
      showToast({
        type: 'fail',
        message: result.error
      })
    }
  }, 500)
}

const handleFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  showDialog({
    title: '确认恢复',
    message: '恢复数据将覆盖当前所有数据，确定要继续吗？\n\n建议先备份当前数据！',
    showCancelButton: true,
  })
    .then(async () => {
      showLoadingToast({
        message: '正在恢复数据...',
        forbidClick: true,
        duration: 0
      })
      
      try {
        const result = await importDataFromJSON(file)
        closeToast()
        
        if (result.success) {
          showDialog({
            title: '恢复成功',
            message: result.message,
          }).then(() => {
            // 刷新页面以加载新数据
            window.location.reload()
          })
        }
      } catch (error) {
        closeToast()
        showToast({
          type: 'fail',
          message: '恢复失败：' + error.error
        })
      }
      
      // 清空文件选择
      event.target.value = ''
    })
    .catch(() => {
      // 取消操作
      event.target.value = ''
    })
}

const handleClearData = () => {
  showDialog({
    title: '危险操作',
    message: '确定要清空所有数据吗？\n\n此操作不可恢复！\n\n强烈建议先备份数据！',
    showCancelButton: true,
    confirmButtonText: '确认清空',
    confirmButtonColor: '#ff4d4f',
  })
    .then(() => {
      showDialog({
        title: '最后确认',
        message: '真的要清空所有数据吗？\n\n这是最后一次确认！',
        showCancelButton: true,
        confirmButtonText: '确认清空',
        confirmButtonColor: '#ff4d4f',
      })
        .then(() => {
          const result = clearAllData()
          
          if (result.success) {
            showDialog({
              title: '清空成功',
              message: '所有数据已清空，页面将刷新。',
            }).then(() => {
              window.location.reload()
            })
          }
        })
        .catch(() => {
          // 取消操作
        })
    })
    .catch(() => {
      // 取消操作
    })
}
</script>

<style scoped>
.data-management-page {
  background-color: #f7f8fa;
}

.stats-list {
  margin-top: 12px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 14px;
  color: #646566;
}

.stat-value {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}

.stat-value.warning {
  color: #ff976a;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.action-button {
  border-radius: 8px;
  font-weight: 500;
}

.tips {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 6px;
  font-size: 12px;
  color: #1989fa;
}

.tips.warning {
  background: #fff7e6;
  color: #ff976a;
}

.tips.danger {
  background: #fff1f0;
  color: #ff4d4f;
}

.help-content {
  margin-top: 12px;
}

.help-item {
  margin-bottom: 16px;
}

.help-item:last-child {
  margin-bottom: 0;
}

.help-title {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 6px;
}

.help-text {
  font-size: 13px;
  color: #646566;
  line-height: 1.6;
}
</style>

