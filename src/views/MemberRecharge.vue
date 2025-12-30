<template>
  <div class="recharge-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="会员充值"
      left-arrow
      @click-left="router.back()"
    />

    <div class="content-wrapper">
      <!-- 会员信息 -->
      <div class="card" v-if="member">
        <div class="section-title">👤 会员信息</div>
        <div class="member-card">
          <div class="member-name">{{ member.name || '未设置姓名' }}</div>
          <div class="member-phone">{{ member.phone }}</div>
          <div class="member-balance">
            <span class="label">当前余额：</span>
            <span class="value">¥{{ member.balance.toFixed(2) }}</span>
          </div>
          <div class="member-stats">
            <div class="stat-item">
              <span class="stat-label">累计充值</span>
              <span class="stat-value">¥{{ member.totalRecharge.toFixed(2) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">累计消费</span>
              <span class="stat-value">¥{{ member.totalConsumption.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 充值表单 -->
      <div class="card">
        <div class="section-title">💰 充值</div>
        <van-form @submit="handleRecharge">
          <van-field
            v-model="rechargeForm.amount"
            name="amount"
            label="充值金额"
            type="number"
            placeholder="请输入充值金额"
            :rules="[{ required: true, message: '请输入充值金额' }]"
          >
            <template #button>
              <span>元</span>
            </template>
          </van-field>

          <van-field
            v-model="rechargeForm.paymentMethod"
            name="paymentMethod"
            label="支付方式"
            readonly
            is-link
            @click="showPaymentPicker = true"
            :rules="[{ required: true, message: '请选择支付方式' }]"
          />

          <van-field
            v-model="rechargeForm.notes"
            name="notes"
            label="备注"
            placeholder="请输入备注（可选）"
          />

          <div style="margin: 16px;">
            <van-button 
              round 
              block 
              type="success" 
              native-type="submit"
              size="large"
            >
              确认充值
            </van-button>
          </div>
        </van-form>
      </div>

      <!-- 快速充值金额 -->
      <div class="card">
        <div class="section-title">⚡ 快速充值</div>
        <div class="quick-amounts">
          <van-button
            v-for="amount in quickAmounts"
            :key="amount"
            size="small"
            @click="rechargeForm.amount = amount.toString()"
          >
            ¥{{ amount }}
          </van-button>
        </div>
      </div>
    </div>

    <!-- 支付方式选择器 -->
    <van-popup v-model:show="showPaymentPicker" position="bottom">
      <van-picker
        :columns="paymentMethods"
        @confirm="onPaymentConfirm"
        @cancel="showPaymentPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMemberStore } from '@/stores/member'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()
const memberStore = useMemberStore()

const member = ref(null)
const showPaymentPicker = ref(false)
const rechargeForm = ref({
  amount: '',
  paymentMethod: '现金',
  notes: ''
})

const quickAmounts = [100, 200, 500, 1000, 2000]

const paymentMethods = [
  { text: '现金', value: '现金' },
  { text: '微信', value: '微信' },
  { text: '支付宝', value: '支付宝' },
  { text: '银行卡', value: '银行卡' }
]

const onPaymentConfirm = ({ selectedOptions }) => {
  rechargeForm.value.paymentMethod = selectedOptions[0].value
  showPaymentPicker.value = false
}

const handleRecharge = async () => {
  if (!member.value) {
    showToast('会员信息不存在')
    return
  }

  const amount = parseFloat(rechargeForm.value.amount)
  if (!amount || amount <= 0) {
    showToast('请输入有效的充值金额')
    return
  }

  const result = await memberStore.rechargeMember(
    member.value.id,
    amount,
    rechargeForm.value.paymentMethod,
    rechargeForm.value.notes
  )

  if (result.success) {
    showToast({
      type: 'success',
      message: `充值成功！余额：¥${result.balance.toFixed(2)}`
    })
    
    // 等待 store 重新加载数据完成
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 重新获取会员信息，确保获取最新数据
    const updatedMember = memberStore.getMemberById(member.value.id)
    if (updatedMember) {
      // 深度拷贝，确保触发响应式更新
      member.value = JSON.parse(JSON.stringify(updatedMember))
    }
    
    // 重置表单
    rechargeForm.value = {
      amount: '',
      paymentMethod: '现金',
      notes: ''
    }
  } else {
    showToast(result.message || '充值失败')
  }
}

onMounted(async () => {
  const memberId = route.params.memberId
  if (memberId) {
    await memberStore.loadMembers()
    member.value = memberStore.getMemberById(memberId)
    if (!member.value) {
      showToast('会员不存在')
      router.back()
    }
  } else {
    // 如果没有memberId，可以显示选择会员的界面
    router.back()
  }
})
</script>

<style scoped>
.recharge-page {
  background-color: #f7f8fa;
}

.member-card {
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.member-name {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.member-phone {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 16px;
}

.member-balance {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  margin-bottom: 16px;
}

.member-balance .label {
  font-size: 14px;
  opacity: 0.9;
}

.member-balance .value {
  font-size: 24px;
  font-weight: 600;
}

.member-stats {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
}

.quick-amounts {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 0;
}

.quick-amounts .van-button {
  flex: 1;
  min-width: 80px;
}
</style>

