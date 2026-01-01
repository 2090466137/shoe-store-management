<template>
  <div class="members-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="会员管理"
      left-arrow
      @click-left="router.back()"
    >
      <template #right>
        <van-icon name="records" size="22" @click="router.push('/member/history')" />
        <van-icon name="plus" size="22" @click="showAddDialog = true" />
      </template>
    </van-nav-bar>

    <div class="content-wrapper">
      <!-- 搜索栏 -->
      <div class="card">
        <van-search
          v-model="searchKeyword"
          placeholder="搜索手机号或姓名"
          @search="handleSearch"
        />
      </div>

      <!-- 会员列表 -->
      <div class="card">
        <div class="section-title">👥 会员列表</div>
        
        <div v-if="filteredMembers.length === 0" class="empty-state">
          <div class="empty-state-icon">👤</div>
          <div class="empty-state-text">暂无会员</div>
        </div>

        <div 
          v-for="member in filteredMembers" 
          :key="member.id"
          class="member-item"
          @click="selectMember(member, $event)"
        >
          <div class="member-header">
            <div class="member-info">
              <div class="member-name">{{ member.name || '未设置姓名' }}</div>
              <div class="member-phone">{{ member.phone }}</div>
            </div>
            <div class="member-actions">
              <div class="member-balance" v-if="canViewBalance">¥{{ member.balance.toFixed(2) }}</div>
              <van-icon 
                v-if="canDeleteMember"
                name="delete-o" 
                class="delete-btn"
                @click="handleDeleteMember(member, $event)"
              />
            </div>
          </div>
          <div class="member-footer">
            <span class="member-level">{{ member.level }}</span>
            <span class="member-discount" v-if="member.discount < 1">
              {{ (member.discount * 10).toFixed(1) }}折
            </span>
            <span class="member-stats" v-if="canViewBalance">
              累计充值: ¥{{ member.totalRecharge.toFixed(2) }} | 
              累计消费: ¥{{ member.totalConsumption.toFixed(2) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加会员对话框 -->
    <van-dialog
      v-model:show="showAddDialog"
      title="注册会员"
      show-cancel-button
      @confirm="handleAddMember"
    >
      <van-form @submit="handleAddMember">
        <van-field
          v-model="newMember.phone"
          name="phone"
          label="手机号"
          placeholder="请输入手机号"
          :rules="[{ required: true, message: '请输入手机号' }]"
        />
        <van-field
          v-model="newMember.name"
          name="name"
          label="姓名"
          placeholder="请输入姓名（可选）"
        />
        <van-field
          v-if="canViewBalance"
          v-model="newMember.balance"
          name="balance"
          label="初始余额"
          type="number"
          placeholder="请输入初始余额"
          :rules="[{ required: canViewBalance, message: '请输入初始余额' }]"
        >
          <template #button>
            <span>元</span>
          </template>
        </van-field>
        <van-field
          v-model="newMember.discount"
          name="discount"
          label="会员折扣"
          type="number"
          placeholder="1.0表示无折扣，0.9表示9折"
          :rules="[{ required: true, message: '请输入折扣' }]"
        />
      </van-form>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMemberStore } from '@/stores/member'
import { useUserStore, PERMISSIONS } from '@/stores/user'
import { showToast, showConfirmDialog } from 'vant'

const router = useRouter()
const memberStore = useMemberStore()
const userStore = useUserStore()

// 权限检查
// 店员有充值权限时也能看到余额（充值时需要知道余额）
const canViewBalance = computed(() => 
  userStore.hasPermission(PERMISSIONS.STATS_PROFIT) || 
  userStore.hasPermission(PERMISSIONS.MEMBER_RECHARGE)
)
const canRecharge = computed(() => userStore.hasPermission(PERMISSIONS.MEMBER_RECHARGE))
const canDeleteMember = computed(() => userStore.hasPermission(PERMISSIONS.MEMBER_DELETE))
const canEditMember = computed(() => userStore.hasPermission(PERMISSIONS.MEMBER_EDIT))

const searchKeyword = ref('')
const showAddDialog = ref(false)
const newMember = ref({
  phone: '',
  name: '',
  balance: '0',
  discount: '1.0'
})

const filteredMembers = computed(() => {
  if (searchKeyword.value) {
    return memberStore.searchMembers(searchKeyword.value)
  }
  return memberStore.getAllMembers
})

const handleSearch = () => {
  // 搜索逻辑已在computed中处理
}

const selectMember = (member, event) => {
  // 如果点击的是删除按钮，不触发选择操作
  if (event && event.target.closest('.delete-btn')) {
    return
  }
  
  // 如果有充值权限
  if (canRecharge.value) {
    // 判断是否有编辑权限（店长）
    if (canEditMember.value) {
      // 店长：显示操作菜单
      showConfirmDialog({
        title: '选择操作',
        message: `会员：${member.name || member.phone}\n手机号：${member.phone}\n当前余额：¥${member.balance.toFixed(2)}`,
        confirmButtonText: '充值',
        cancelButtonText: '取消'
      }).then(() => {
        // 跳转到充值页面
        router.push({
          name: 'MemberRecharge',
          params: { memberId: member.id }
        })
      }).catch(() => {
        // 用户取消
      })
    } else {
      // 店员：直接跳转到充值页面（简化流程）
      router.push({
        name: 'MemberRecharge',
        params: { memberId: member.id }
      })
    }
  } else {
    // 没有任何权限：只显示基本信息
    showToast(`会员：${member.name || member.phone}\n等级：${member.level}\n折扣：${(member.discount * 10).toFixed(1)}折`)
  }
}

const handleDeleteMember = async (member, event) => {
  // 阻止事件冒泡
  if (event) {
    event.stopPropagation()
  }
  
  showConfirmDialog({
    title: '确认删除',
    message: `确定要删除会员"${member.name || member.phone}"吗？\n删除后无法恢复！`,
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    confirmButtonColor: '#ee0a24'
  }).then(async () => {
    const result = await memberStore.deleteMember(member.id)
    if (result) {
      showToast({
        type: 'success',
        message: '删除成功'
      })
      // 重新加载会员列表
      await memberStore.loadMembers()
    } else {
      showToast('删除失败')
    }
  }).catch(() => {
    // 取消删除
  })
}

const handleAddMember = async () => {
  if (!newMember.value.phone) {
    showToast('请输入手机号')
    return
  }

  const memberData = {
    phone: newMember.value.phone,
    name: newMember.value.name || '',
    balance: parseFloat(newMember.value.balance) || 0,
    discount: parseFloat(newMember.value.discount) || 1.0,
    totalRecharge: parseFloat(newMember.value.balance) || 0,
    totalConsumption: 0,
    level: '普通会员'
  }

  const result = await memberStore.addMember(memberData)
  
  if (result.success) {
    showToast('注册成功')
    showAddDialog.value = false
    // 重置表单
    newMember.value = {
      phone: '',
      name: '',
      balance: '0',
      discount: '1.0'
    }
  } else {
    showToast(result.message || '注册失败')
  }
}

onMounted(() => {
  memberStore.loadMembers()
})
</script>

<style scoped>
.members-page {
  background-color: #f7f8fa;
}

.member-item {
  padding: 16px;
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(91, 143, 249, 0.08);
  transition: all 0.3s ease;
}

.member-item:last-child {
  margin-bottom: 0;
}

.member-item:active {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(91, 143, 249, 0.12);
}

.member-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.member-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.delete-btn {
  font-size: 18px;
  color: #ee0a24;
  cursor: pointer;
  padding: 4px;
}

.delete-btn:active {
  opacity: 0.6;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.member-phone {
  font-size: 14px;
  color: #646566;
}

.member-balance {
  font-size: 20px;
  font-weight: 600;
  color: #07c160;
}

.member-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #969799;
}

.member-level {
  padding: 2px 8px;
  background: #1989fa;
  color: white;
  border-radius: 4px;
  font-size: 11px;
}

.member-discount {
  padding: 2px 8px;
  background: #ff976a;
  color: white;
  border-radius: 4px;
  font-size: 11px;
}

.member-stats {
  flex: 1;
  text-align: right;
}
</style>

