<template>
  <div class="metrics-card product-pie-card">
    <div class="chart-wrapper">
      <div v-if="!productRecords || productRecords.length === 0" class="empty-state">
        <p>No active classifications in this sync window.</p>
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
  productRecords: { type: Array, default: () => [] },
  mainTableInfo: { type: Object, default: () => ({}) }
})

const isProduction = computed(() => props.mainTableInfo?.tableName === 'DRDetails')

// 🎨 Updated Palette: Green, Purple, and Yellow set as the first three primary options
const chartColors = [
  '#10b981', // 1. Green
  '#a855f7', // 2. Purple
  '#eab308', // 3. Yellow
  '#38bdf8', // 4. Sky Blue
  '#f472b6', // 5. Pink
  '#6366f1', // 6. Indigo
  '#14b8a6', // 7. Teal
  '#f87171'  // 8. Coral
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
      label: isProduction.value ? 'Yield Value' : 'Expenditures Value',
      data: records.map(r => r.value),
      backgroundColor: records.map((_, idx) => getPieColor(idx)),
      borderColor: '#0f151f',
      borderWidth: 2,
      hoverOffset: 6
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#f8fafc',
      bodyColor: '#94a3b8',
      borderColor: '#334155',
      borderWidth: 1,
      padding: 10,
      callbacks: {
        label: (context) => ` Total: ₱${(context.raw || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      }
    }
  }
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val)
}
</script>

<style scoped>
/* 📁 Compact Layout Footprint */
.metrics-card { background: #0f151f; border: 1px solid #1e293b; border-radius: 12px; padding: 1.25rem; display: flex; flex-direction: column; gap: 15px; }
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

/* 🍇 Explicit Color Utilities */
.text-green { color: #10b981 !important; }
.text-purple { color: #a855f7 !important; }
.text-yellow { color: #eab308 !important; }
</style>