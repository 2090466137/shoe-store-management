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
        const stored = localStorage.getItem('members')
        if (stored) {
          members.value = JSON.parse(stored)
        }
        return
      }

      members.value = data.map(dbToFrontend)
      await saveMembers()
    } catch (error) {
      console.error('加载会员异常:', error)
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

      const index = members.value.findIndex(m => m.id === id)
      if (index !== -1) {
        members.value[index] = { ...members.value[index], ...updates }
        await saveMembers()
        return true
      }
      return false
    } catch (error) {
      console.error('更新会员失败:', error)
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

      // 更新会员余额和消费总额
      await updateMember(memberId, {
        balance: newBalance,
        totalConsumption: newTotalConsumption
      })

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
      return false
    }
    
    const tempMember = members.value[index]
    
    try {
      members.value.splice(index, 1)
      await saveMembers()
      
      const { error } = await supabase
        .from(TABLES.MEMBERS)
        .delete()
        .eq('id', id)

      if (error) {
        members.value.splice(index, 0, tempMember)
        await saveMembers()
        throw error
      }

      return true
    } catch (error) {
      console.error('删除会员失败:', error)
      const currentIndex = members.value.findIndex(m => m.id === id)
      if (currentIndex === -1 && tempMember) {
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
