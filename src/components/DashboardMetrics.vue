<template>
  <div class="consolidated-metrics-horizontal">
    <div class="metric-inline-item">
      <p class="metric-title">RANGE TOTAL</p>
      <div class="metric-value text-green">Php {{ totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</div>
      <p class="metric-subtext">{{ dateRange.start }} - {{ dateRange.end }}</p>
    </div>

    <div class="metric-inline-item">
      <p class="metric-title">CODE SOURCE</p>
      <div class="metric-value text-green">{{ mainTableInfo.name || 'None Active' }}</div>
      <p class="metric-subtext">Database Target</p>
    </div>

    <div class="metric-inline-item">
      <p class="metric-title">VERIFIED LOG COUNT</p>
      <div class="metric-value text-green">{{ matchedRecordsLength }} Entries</div>
      <p class="metric-subtext">Transactions</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  dateRange: { type: Object, required: true },
  totalAmount: { type: Number, required: true },
  mainTableInfo: { type: Object, required: true },
  matchedRecordsLength: { type: Number, required: true }
})
</script>

<style scoped>
.consolidated-metrics-horizontal { display: flex; align-items: center; gap: 2.5rem; }
.metric-inline-item { display: flex; flex-direction: column; justify-content: center; gap: 4px; padding-right: 2.5rem; border-right: 1px dashed #334155; }
.metric-inline-item:last-child { border-right: none; padding-right: 0; }
.metric-title { font-size: 0.65rem; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin: 0; text-transform: uppercase; }
.metric-value { font-size: 0.95rem; font-weight: 800; letter-spacing: -0.01em; margin: 0; line-height: 1.2; }
.metric-value.text-green { color: #10b981; }
.metric-subtext { font-size: 0.6rem; color: #9ca3af; margin: 0; font-weight: 500; line-height: 1; }
</style>