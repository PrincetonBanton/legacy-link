<template>
  <div class="consolidated-metrics-horizontal">
    <div class="metric-inline-item overall">
      <p class="metric-title">RANGE TOTAL</p>
      <div class="metric-value text-green">{{ totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</div>
      <p class="metric-subtext">{{ dateRange.start }} - {{ dateRange.end }}</p>
    </div>

    <div class="metric-inline-item">
      <p class="metric-title">CODE SOURCE</p>
      <div class="metric-value text-purple">{{ mainTableInfo.name || 'None Active' }}</div>
      <p class="metric-subtext">Database Target</p>
    </div>

    <div class="metric-inline-item">
      <p class="metric-title">VERIFIED LOG COUNT</p>
      <div class="metric-value text-yellow">{{ matchedRecordsLength }} Entries</div>
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
.consolidated-metrics-horizontal { display: flex; align-items: center; gap: 12px; }
.metric-inline-item { background: #1e293b; border: 1px solid #334155; padding: 10px 16px; border-radius: 8px; flex: 1; display: flex; flex-direction: column; gap: 2px; transition: all 0.2s ease; min-width: 160px; }
.metric-inline-item:hover { background: #24334d; border-color: #475569; }
.metric-inline-item.overall { background: #0f172a; border-color: #475569; }
.metric-title { font-size: 0.6rem; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin: 0; text-transform: uppercase; }
.metric-value { font-size: 1.2rem; font-weight: 800; color: #fff; line-height: 1.2; }
.metric-subtext { font-size: 0.6rem; color: #9ca3af; margin: 0; font-weight: 500; line-height: 1; }
.text-green { color: #10b981 !important; }
.text-purple { color: #a855f7 !important; }
.text-yellow { color: #eab308 !important; }
</style>