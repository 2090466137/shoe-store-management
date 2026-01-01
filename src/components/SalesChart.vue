<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  type: {
    type: String,
    default: 'line' // line, bar, pie
  },
  title: {
    type: String,
    default: ''
  }
})

const chartRef = ref(null)
let chartInstance = null

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chartInstance || !props.data || props.data.length === 0) return
  
  let option = {}
  
  if (props.type === 'line' || props.type === 'bar') {
    option = {
      title: {
        text: props.title,
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: props.data.map(item => item.name),
        axisLabel: {
          interval: 0,
          rotate: 30,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 10
        }
      },
      series: [{
        data: props.data.map(item => item.value),
        type: props.type,
        smooth: true,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ])
        },
        areaStyle: props.type === 'line' ? {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
            { offset: 1, color: 'rgba(118, 75, 162, 0.1)' }
          ])
        } : undefined
      }]
    }
  } else if (props.type === 'pie') {
    option = {
      title: {
        text: props.title,
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: {
          fontSize: 10
        }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: props.data.map((item, index) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: [
              '#667eea',
              '#764ba2',
              '#f093fb',
              '#f5576c',
              '#4facfe',
              '#00f2fe',
              '#43e97b',
              '#38f9d7'
            ][index % 8]
          }
        }))
      }]
    }
  }
  
  chartInstance.setOption(option)
}

const resizeHandler = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', resizeHandler)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  window.removeEventListener('resize', resizeHandler)
})

watch(() => props.data, () => {
  updateChart()
}, { deep: true })

watch(() => props.type, () => {
  updateChart()
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 300px;
}
</style>

