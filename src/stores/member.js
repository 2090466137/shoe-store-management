import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, TABLES } from '../config/supabase'

export const useMemberStore = defineStore('member', () => {
  const members = ref([])
  const loading = ref(false)

  // 将数据库格式转换为前端格式
  const dbToFrontend = (dbMember) => {
    return {
      id: dbMember.id,
      phone: dbMember.phone,
      name: dbMember.name || '',
      balance: parseFloat(dbMember.balance) || 0,
      totalRecharge: parseFloat(dbMember.total_recharge) || 0,
      totalConsumption: parseFloat(dbMember.total_consumption) || 0,
      discount: parseFloat(dbMember.discount) || 1.0,
      level: dbMember.level || '普通会员',
      notes: dbMember.notes || '',
      createTime: new Date(dbMember.created_at).getTime()
    }
  }

  // 将前端格式转换为数据库格式
  const frontendToDb = (member) => {
    return {
      phone: member.phone,
      name: member.name || null,
      balance: parseFloat(member.balance) || 0,
      total_recharge: parseFloat(member.totalRecharge) || 0,
      total_consumption: parseFloat(member.totalConsumption) || 0,
      discount: parseFloat(member.discount) || 1.0,
      level: member.level || '普通会员',
      notes: member.notes || null
    }
  }

  // 从云端加载会员数据
  const loadMembers = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from(TABLES.MEMBERS)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('加载会员失败:', error)
        // 如果云端加载失败，尝试从localStorage加载
        const stored = localStorage.getItem('members')
        if (stored) {
          members.value = JSON.parse(stored)
        }
        return
      }

      // 转换数据格式
      members.value = data.map(dbToFrontend)
      
      // 同步更新localStorage，确保与云端一致
      await saveMembers()
    } catch (error) {
      console.error('加载会员异常:', error)
      // 降级到localStorage
      const stored = localStorage.getItem('members')
      if (stored) {
        members.value = JSON.parse(stored)
      }
    } finally {
      loading.value = false
    }
  }

  // 保存到localStorage作为备份
  const saveMembers = async () => {
    try {
      localStorage.setItem('members', JSON.stringify(members.value))
    } catch (error) {
      console.error('保存到localStorage失败:', error)
    }
  }

  // 获取所有会员
  const getAllMembers = computed(() => members.value)

  // 根据手机号查找会员
  const getMemberByPhone = (phone) => {
    return members.value.find(m => m.phone === phone)
  }

  // 根据ID查找会员
  const getMemberById = (id) => {
    return members.value.find(m => m.id === id)
  }

  // 注册会员
  const addMember = async (memberData) => {
    try {
      // 检查手机号是否已存在
      const existing = getMemberByPhone(memberData.phone)
      if (existing) {
        return { success: false, message: '该手机号已注册' }
      }

      const dbMember = frontendToDb(memberData)
      
      const { data, error } = await supabase
        .from(TABLES.MEMBERS)
        .insert([dbMember])
        .select()
        .single()

      if (error) throw error

      const newMember = dbToFrontend(data)
      members.value.unshift(newMember)
      await saveMembers()
      
      return { success: true, data: newMember }
    } catch (error) {
      console.error('注册会员失败:', error)
      // 降级到localStorage
      const newMember = {
        ...memberData,
        id: Date.now().toString(),
        createTime: Date.now()
      }
      members.value.push(newMember)
      saveMembers()
      return { success: true, data: newMember }
    }
  }

  // 更新会员信息
  const updateMember = async (id, updates) => {
    try {
      const dbUpdates = {}
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.balance !== undefined) dbUpdates.balance = updates.balance
      if (updates.totalRecharge !== undefined) dbUpdates.total_recharge = updates.totalRecharge
      if (updates.totalConsumption !== undefined) dbUpdates.total_consumption = updates.totalConsumption
      if (updates.discount !== undefined) dbUpdates.discount = updates.discount
      if (updates.level !== undefined) dbUpdates.level = updates.level
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes

      const { error } = await supabase
        .from(TABLES.MEMBERS)
        .update(dbUpdates)
        .eq('id', id)

      if (error) throw error

      // 更新本地状态
      const index = members.value.findIndex(m => m.id === id)
      if (index !== -1) {
        members.value[index] = { ...members.value[index], ...updates }
        await saveMembers()
        return true
      }
      return false
    } catch (error) {
      console.error('更新会员失败:', error)
      // 降级到localStorage
      const index = members.value.findIndex(m => m.id === id)
      if (index !== -1) {
        members.value[index] = { ...members.value[index], ...updates }
        saveMembers()
        return true
      }
      return false
    }
  }

  // 会员充值
  const rechargeMember = async (memberId, amount, paymentMethod = '现金', notes = '') => {
    try {
      const member = getMemberById(memberId)
      if (!member) {
        return { success: false, message: '会员不存在' }
      }

      const newBalance = member.balance + amount
      const newTotalRecharge = member.totalRecharge + amount

      // 先更新本地状态，提供即时反馈
      const index = members.value.findIndex(m => m.id === memberId)
      if (index !== -1) {
        members.value[index] = {
          ...members.value[index],
          balance: newBalance,
          totalRecharge: newTotalRecharge
        }
      }

      // 更新云端数据
      const dbUpdates = {
        balance: newBalance,
        total_recharge: newTotalRecharge
      }

      const { error: updateError } = await supabase
        .from(TABLES.MEMBERS)
        .update(dbUpdates)
        .eq('id', memberId)

      if (updateError) {
        console.error('更新云端余额失败:', updateError)
        // 云端更新失败，但本地已更新，继续执行
      }

      // 保存到 localStorage
      await saveMembers()

      // 记录充值记录
      const { error } = await supabase
        .from(TABLES.MEMBER_RECHARGES)
        .insert([{
          member_id: memberId,
          amount: amount,
          payment_method: paymentMethod,
          notes: notes
        }])

      if (error) {
        console.error('记录充值失败:', error)
      }

      return { success: true, balance: newBalance }
    } catch (error) {
      console.error('充值失败:', error)
      return { success: false, message: '充值失败' }
    }
  }

  // 会员消费（扣减余额）
  const consumeMember = async (memberId, amount) => {
    try {
      const member = getMemberById(memberId)
      if (!member) {
        return { success: false, message: '会员不存在' }
      }

      if (member.balance < amount) {
        return { success: false, message: '余额不足' }
      }

      const newBalance = member.balance - amount
      const newTotalConsumption = member.totalConsumption + amount

      // 先更新本地状态，提供即时反馈
      const index = members.value.findIndex(m => m.id === memberId)
      if (index !== -1) {
        members.value[index] = {
          ...members.value[index],
          balance: newBalance,
          totalConsumption: newTotalConsumption
        }
      }

      // 更新云端数据
      const dbUpdates = {
        balance: newBalance,
        total_consumption: newTotalConsumption
      }

      const { error: updateError } = await supabase
        .from(TABLES.MEMBERS)
        .update(dbUpdates)
        .eq('id', memberId)

      if (updateError) {
        console.error('更新云端余额失败:', updateError)
        // 云端更新失败，但本地已更新，继续执行
      }

      // 保存到 localStorage
      await saveMembers()

      return { success: true, balance: newBalance }
    } catch (error) {
      console.error('消费失败:', error)
      return { success: false, message: '消费失败' }
    }
  }

  // 删除会员
  const deleteMember = async (id) => {
    const index = members.value.findIndex(m => m.id === id)
    if (index === -1) {
      console.error('❌ 会员不存在:', id)
      return false
    }
    
    // 临时保存，如果删除失败可以恢复
    const tempMember = members.value[index]
    
    try {
      // 先从本地删除，避免UI延迟
      members.value.splice(index, 1)
      
      // 立即更新localStorage
      await saveMembers()
      
      // 判断是否是本地会员（UUID 格式: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx）
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const isCloudMember = uuidRegex.test(id)
      
      if (!isCloudMember) {
        // 本地会员，只需要从 localStorage 删除即可
        console.log('✅ 本地会员已删除:', id)
        return true
      }
      
      // 云端会员，需要从 Supabase 删除
      const { error } = await supabase
        .from(TABLES.MEMBERS)
        .delete()
        .eq('id', id)

      if (error) {
        console.error('❌ 云端删除失败:', error)
        // 如果云端删除失败，恢复本地数据
        members.value.splice(index, 0, tempMember)
        await saveMembers()
        throw error
      }

      console.log('✅ 云端会员已删除:', id)
      return true
    } catch (error) {
      console.error('❌ 删除会员失败:', error)
      // 如果云端删除失败，检查是否需要恢复
      const currentIndex = members.value.findIndex(m => m.id === id)
      if (currentIndex === -1 && tempMember) {
        // 如果会员不在列表中，说明已经被删除了，恢复它
        members.value.splice(index, 0, tempMember)
        await saveMembers()
      }
      return false
    }
  }

  // 搜索会员
  const searchMembers = (keyword) => {
    if (!keyword) return members.value
    const lowerKeyword = keyword.toLowerCase()
    return members.value.filter(m => 
      m.phone.includes(keyword) ||
      (m.name && m.name.toLowerCase().includes(lowerKeyword))
    )
  }

  return {
    members,
    loading,
    getAllMembers,
    loadMembers,
    getMemberByPhone,
    getMemberById,
    addMember,
    updateMember,
    deleteMember,
    rechargeMember,
    consumeMember,
    searchMembers
  }
})

