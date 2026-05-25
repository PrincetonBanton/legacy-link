<template>
  <div class="card consolidated-metrics-card">
    <div class="metric-row">
      <div class="metric-info">
        <p class="metric-label">Range Total</p>
        <p class="metric-subtext">Total Window: {{ dateRange.start }} - {{ dateRange.end }}</p>
      </div>
      <h2 class="giant-currency-header">Php {{ totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</h2>
    </div>

    <div class="metric-row">
      <div class="metric-info">
        <p class="metric-label">Code-Source</p>
        <p class="metric-subtext">Operational Database Query Target</p>
      </div>
      <span class="metric-value-badge source-badge">{{ mainTableInfo.name || 'None Active' }}</span>
    </div>

    <div class="metric-row">
      <div class="metric-info">
        <p class="metric-label">Verified Log Count</p>
        <p class="metric-subtext">Distinct Transaction Counts</p>
      </div>
      <span class="metric-value-badge count-badge">{{ matchedRecordsLength }} Entries</span>
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
.card { background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 1.5rem; box-sizing: border-box; }
.consolidated-metrics-card { grid-column: span 1; display: flex; flex-direction: column; justify-content: space-between; height: 220px; padding: 1.25rem; box-sizing: border-box; }
.metric-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed #f3f4f6; }
.metric-row:last-child { border-bottom: none; }

.metric-info { display: flex; flex-direction: column; gap: 2px; }
.metric-label { font-size: 0.85rem; font-weight: 700; color: #111827; margin: 0; }
.metric-subtext { font-size: 0.65rem; color: #6b7280; margin: 0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.2px; }

.giant-currency-header { font-size: 1.2rem; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.5px; }
.metric-value-badge { font-size: 0.8rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.metric-value-badge.source-badge { color: #2563eb; background: #eff6ff; font-family: monospace; }
.metric-value-badge.count-badge { color: #059669; background: #ecfdf5; }
</style>