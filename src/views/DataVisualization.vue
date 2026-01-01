<template>
  <div class="data-visualization-page page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="数据分析"
      left-arrow
      @click-left="router.back()"
    />

    <div class="content-wrapper">
      <!-- 时间范围选择 -->
      <div class="card">
        <van-tabs v-model:active="timeRange" @change="handleTimeRangeChange">
          <van-tab title="近7天" name="7"></van-tab>
          <van-tab title="近30天" name="30"></van-tab>
          <van-tab title="近90天" name="90"></van-tab>
        </van-tabs>
      </div>

      <!-- 销售趋势图 -->
      <div class="card">
        <div class="section-title">📈 销售趋势</div>
        <div class="chart-container">
          <v-chart 
            :option="salesTrendOption" 
            :autoresize="true"
            style="height: 300px"
          />
        </div>
      </div>

      <!-- 商品销量排行 -->
      <div class="card">
        <div class="section-title">🏆 商品销量TOP10</div>
        <div class="chart-container">
          <v-chart 
            :option="productRankingOption" 
            :autoresize="true"
            style="height: 400px"
          />
        </div>
      </div>

      <!-- 销售额 vs 利润对比 -->
      <div class="card">
        <div class="section-title">💰 销售额与利润对比</div>
        <div class="chart-container">
          <v-chart 
            :option="salesProfitOption" 
            :autoresize="true"
            style="height: 300px"
          />
        </div>
      </div>

      <!-- 会员消费分析 -->
      <div class="card" v-if="memberStore.getAllMembers.length > 0">
        <div class="section-title">👥 会员消费TOP5</div>
        <div class="chart-container">
          <v-chart 
            :option="memberConsumptionOption" 
            :autoresize="true"
            style="height: 300px"
          />
        </div>
      </div>

      <!-- 员工业绩对比 -->
      <div class="card">
        <div class="section-title">🎯 员工业绩对比</div>
        <div class="chart-container">
          <v-chart 
            :option="staffPerformanceOption" 
            :autoresize="true"
            style="height: 300px"
          />
        </div>
      </div>

      <!-- 库存分布 -->
      <div class="card">
        <div class="section-title">📦 库存分布</div>
        <div class="chart-container">
          <v-chart 
            :option="stockDistributionOption" 
            :autoresize="true"
            style="height: 300px"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { useSalesStore } from '@/stores/sales'
import { useProductStore } from '@/stores/product'
import { useMemberStore } from '@/stores/member'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const router = useRouter()
const salesStore = useSalesStore()
const productStore = useProductStore()
const memberStore = useMemberStore()

const timeRange = ref('30')

// 获取指定时间范围的销售数据
const getFilteredSales = computed(() => {
  const days = parseInt(timeRange.value)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)
  const startTime = startDate.getTime()
  
  return salesStore.sales.filter(sale => {
    const saleTime = sale.time || sale.date || sale.createTime
    return saleTime >= startTime
  })
})

// 销售趋势数据
const salesTrendOption = computed(() => {
  const days = parseInt(timeRange.value)
  const dateMap = new Map()
  
  // 初始化所有日期
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
    dateMap.set(dateStr, { sales: 0, profit: 0, count: 0 })
  }
  
  // 统计每天的数据
  getFilteredSales.value.forEach(sale => {
    const saleTime = sale.time || sale.date || sale.createTime
    const dateStr = new Date(saleTime).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
    if (dateMap.has(dateStr)) {
      const data = dateMap.get(dateStr)
      data.sales += sale.actualAmount || sale.totalAmount || 0
      data.profit += sale.profit || 0
      data.count += 1
    }
  })
  
  const dates = Array.from(dateMap.keys())
  const salesData = Array.from(dateMap.values()).map(d => d.sales.toFixed(2))
  const profitData = Array.from(dateMap.values()).map(d => d.profit.toFixed(2))
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['销售额', '利润'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45,
        interval: Math.floor(days / 7)
      }
    },
    yAxis: {
      type: 'value',
      name: '金额(¥)'
    },
    series: [
      {
        name: '销售额',
        type: 'line',
        data: salesData,
        smooth: true,
        itemStyle: { color: '#1989fa' }
      },
      {
        name: '利润',
        type: 'line',
        data: profitData,
        smooth: true,
        itemStyle: { color: '#07c160' }
      }
    ]
  }
})

// 商品销量排行
const productRankingOption = computed(() => {
  const productSales = new Map()
  
  getFilteredSales.value.forEach(sale => {
    if (sale.products && Array.isArray(sale.products)) {
      sale.products.forEach(item => {
        const key = item.productName
        if (!productSales.has(key)) {
          productSales.set(key, 0)
        }
        productSales.set(key, productSales.get(key) + item.quantity)
      })
    }
  })
  
  const sorted = Array.from(productSales.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: sorted.map(item => item[0]).reverse(),
      axisLabel: {
        interval: 0,
        formatter: (value) => {
          return value.length > 8 ? value.substring(0, 8) + '...' : value
        }
      }
    },
    series: [
      {
        type: 'bar',
        data: sorted.map(item => item[1]).reverse(),
        itemStyle: {
          color: (params) => {
            const colors = ['#ee0a24', '#ff976a', '#ffd21e', '#1989fa', '#07c160']
            return colors[params.dataIndex % colors.length]
          }
        },
        label: {
          show: true,
          position: 'right'
        }
      }
    ]
  }
})

// 销售额与利润对比
const salesProfitOption = computed(() => {
  const days = parseInt(timeRange.value)
  const dateMap = new Map()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
    dateMap.set(dateStr, { sales: 0, profit: 0 })
  }
  
  getFilteredSales.value.forEach(sale => {
    const saleTime = sale.time || sale.date || sale.createTime
    const dateStr = new Date(saleTime).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
    if (dateMap.has(dateStr)) {
      const data = dateMap.get(dateStr)
      data.sales += sale.actualAmount || sale.totalAmount || 0
      data.profit += sale.profit || 0
    }
  })
  
  const dates = Array.from(dateMap.keys())
  const salesData = Array.from(dateMap.values()).map(d => d.sales.toFixed(2))
  const profitData = Array.from(dateMap.values()).map(d => d.profit.toFixed(2))
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['销售额', '利润'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45,
        interval: Math.floor(days / 7)
      }
    },
    yAxis: {
      type: 'value',
      name: '金额(¥)'
    },
    series: [
      {
        name: '销售额',
        type: 'bar',
        data: salesData,
        itemStyle: { color: '#1989fa' }
      },
      {
        name: '利润',
        type: 'bar',
        data: profitData,
        itemStyle: { color: '#07c160' }
      }
    ]
  }
})

// 会员消费分析
const memberConsumptionOption = computed(() => {
  const members = memberStore.getAllMembers
    .filter(m => m.totalConsumption > 0)
    .sort((a, b) => b.totalConsumption - a.totalConsumption)
    .slice(0, 5)
  
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      formatter: (name) => {
        return name.length > 6 ? name.substring(0, 6) + '...' : name
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: members.map(m => ({
          name: m.name || m.phone,
          value: m.totalConsumption.toFixed(2)
        }))
      }
    ]
  }
})

// 员工业绩对比
const staffPerformanceOption = computed(() => {
  const staffStats = new Map()
  
  getFilteredSales.value.forEach(sale => {
    const staff = sale.salesperson || '未知'
    if (!staffStats.has(staff)) {
      staffStats.set(staff, { sales: 0, profit: 0 })
    }
    const data = staffStats.get(staff)
    data.sales += sale.actualAmount || sale.totalAmount || 0
    data.profit += sale.profit || 0
  })
  
  const staffNames = Array.from(staffStats.keys())
  const salesData = Array.from(staffStats.values()).map(d => d.sales.toFixed(2))
  const profitData = Array.from(staffStats.values()).map(d => d.profit.toFixed(2))
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['销售额', '利润'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: staffNames
    },
    yAxis: {
      type: 'value',
      name: '金额(¥)'
    },
    series: [
      {
        name: '销售额',
        type: 'bar',
        data: salesData,
        itemStyle: { color: '#1989fa' }
      },
      {
        name: '利润',
        type: 'bar',
        data: profitData,
        itemStyle: { color: '#07c160' }
      }
    ]
  }
})

// 库存分布（动态获取所有分类）
const stockDistributionOption = computed(() => {
  const products = productStore.getAllProducts
  const categories = {}
  
  // 动态统计所有分类的库存
  products.forEach(product => {
    const category = product.category || '未分类'
    if (!categories[category]) {
      categories[category] = 0
    }
    categories[category] += product.stock
  })
  
  // 如果没有任何分类，添加一个默认值
  if (Object.keys(categories).length === 0) {
    categories['暂无数据'] = 0
  }
  
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}件 ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0
    },
    series: [
      {
        type: 'pie',
        radius: '60%',
        center: ['50%', '45%'],
        data: Object.entries(categories).map(([name, value]) => ({
          name,
          value
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(91, 143, 249, 0.3)'
          }
        }
      }
    ]
  }
})

const handleTimeRangeChange = () => {
  // 时间范围改变时，图表会自动更新
}

onMounted(() => {
  salesStore.loadSales()
  memberStore.loadMembers()
})
</script>

<style scoped>
.data-visualization-page {
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.chart-container {
  padding: 16px 8px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 12px;
  padding: 0 8px;
}
</style>

