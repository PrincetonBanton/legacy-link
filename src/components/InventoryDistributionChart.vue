<template>
  <div class="chart-card">
    <h3>ASSET DISTRIBUTION BY VALUE</h3>
    <div class="chart-container">
      <Doughnut :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

defineProps({ chartData: Object })

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { color: '#94a3b8', font: { weight: '600', size: 11 } } },
    tooltip: {
      callbacks: {
        label: (context) => ` $${context.raw.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      }
    }
  }
}))
</script>

<style scoped>
.chart-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.25rem; display: flex; flex-direction: column; height: 100%; box-sizing: border-box; }
.chart-card h3 { margin: 0 0 1rem 0; font-size: 0.85rem; font-weight: 700; color: #94a3b8; letter-spacing: 0.05em; }
.chart-container { flex: 1; position: relative; min-height: 0; }
</style>