<template>
  <div class="metrics-card product-pie-card">
    <div class="card-header">
      <div class="title-area">
        <h3>Product Line Distribution</h3>
      </div>
    </div>

    <div class="chart-wrapper">
      <div v-if="!productRecords || productRecords.length === 0" class="empty-state">
        <p>No product classifications active in this sync window.</p>
      </div>
      <div v-else class="canvas-container">
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <div v-if="productRecords && productRecords.length > 0" class="product-mini-list">
      <div v-for="(item, idx) in sortedProducts" :key="idx" class="product-item-row">
        <span class="color-dot" :style="{ backgroundColor: getPieColor(idx) }"></span>
        <span class="product-name">{{ item.identifier }}</span>
        <span class="product-value">{{ formatCurrency(item.value) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  productRecords: {
    type: Array,
    default: () => []
  },
  mainTableInfo: {
    type: Object,
    default: () => ({})
  }
})

// High-visibility palette tailored for dark dashboards
const chartColors = [
  '#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#6366f1',
  '#a855f7', '#14b8a6', '#f87171', '#06b6d4', '#a3e635'
]

const getPieColor = (index) => chartColors[index % chartColors.length]

const sortedProducts = computed(() => {
  return [...props.productRecords].sort((a, b) => b.value - a.value)
})

const chartData = computed(() => {
  const records = sortedProducts.value
  return {
    labels: records.map(r => r.identifier),
    datasets: [{
      label: 'Value Pool',
      data: records.map(r => r.value),
      backgroundColor: records.map((_, idx) => getPieColor(idx)),
      borderColor: '#0f172a',
      borderWidth: 2,
      hoverOffset: 6
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false // Using custom CSS list below instead
    },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#f8fafc',
      bodyColor: '#94a3b8',
      borderColor: '#334155',
      borderWidth: 1,
      padding: 10,
      callbacks: {
        label: function (context) {
          let value = context.raw || 0
          return ` Total: ₱${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        }
      }
    }
  }
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val)
}
</script>

<style scoped>
.metrics-card {
  background: #0f151f;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.card-header { display: flex; justify-content: space-between; align-items: flex-start; }
.title-area h3 { margin: 0; font-size: 0.95rem; font-weight: 700; color: #f8fafc; letter-spacing: -0.01em; }

.chart-wrapper { height: 180px; position: relative; width: 100%; display: flex; align-items: center; justify-content: center; margin: 10px 0; }
.canvas-container { height: 100%; width: 100%; }
.empty-state { text-align: center; color: #475569; font-size: 0.8rem; }

.product-mini-list { display: flex; flex-direction: column; gap: 8px; max-height: 180px; overflow-y: auto; padding-right: 4px; }
.product-mini-list::-webkit-scrollbar { width: 4px; }
.product-mini-list::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

.product-item-row { display: flex; align-items: center; font-size: 0.75rem; color: #e2e8f0; gap: 8px; }
.color-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.product-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
.product-value { font-weight: 700; color: #94a3b8; }
</style>