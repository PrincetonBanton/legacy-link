<template>
  <div class="card graph-card">
    <div class="card-header"><h3>Structural Block Aggregations</h3></div>
    <div class="chart-container-frame">
      <div v-if="chartData?.datasets?.[0]?.data?.length" class="chart-wrapper">
        <Bar :data="chartData" :options="options" />
      </div>
      <div v-else class="empty-state-card-message">No block dataset active.</div>
    </div>
  </div>
</template>

<script setup>
import { Bar } from 'vue-chartjs'

defineProps({
  chartData: { type: Object, required: true },
  options: { type: Object, required: true }
})
</script>

<style scoped>
.card { background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 1.5rem; box-sizing: border-box; }
.graph-card { display: flex; flex-direction: column; gap: 1rem; height: 350px; }
.card-header h3 { font-size: 1.05rem; font-weight: 700; color: #111827; margin: 0; }
.chart-container-frame { flex: 1; position: relative; height: 100%; min-width: 0; }
.chart-wrapper { height: 100%; width: 100%; position: relative; }
.empty-state-card-message { display: flex; align-items: center; justify-content: center; height: 100%; text-align: center; color: #9ca3af; font-size: 0.8rem; font-weight: 500; border: 1px dashed #e5e7eb; border-radius: 8px; padding: 1rem; box-sizing: border-box; }
</style>