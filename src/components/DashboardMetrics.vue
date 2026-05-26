<template>
  <div class="consolidated-metrics-horizontal">
    <div class="metric-inline-item">
      <p class="metric-label">Range Total</p>
      <h2 class="giant-currency-header">Php {{ totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</h2>
      <p class="metric-subtext">{{ dateRange.start }} - {{ dateRange.end }}</p>
    </div>

    <div class="metric-inline-item">
      <p class="metric-label">Code-Source</p>
      <span class="metric-value-badge source-badge">{{ mainTableInfo.name || 'None Active' }}</span>
      <p class="metric-subtext">Database Target</p>
    </div>

    <div class="metric-inline-item">
      <p class="metric-label">Verified Log Count</p>
      <span class="metric-value-badge count-badge">{{ matchedRecordsLength }} Entries</span>
      <p class="metric-subtext">Transactions</p>
    </div>

    <div class="metric-inline-item">
      <p class="metric-label">System Date</p>
      <span class="date-display-text">{{ currentLiveDate }}</span>
      <p class="metric-subtext">Live Timestamp</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

defineProps({
  dateRange: { type: Object, required: true },
  totalAmount: { type: Number, required: true },
  mainTableInfo: { type: Object, required: true },
  matchedRecordsLength: { type: Number, required: true }
})

const currentLiveDate = computed(() => {
  return new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: '2-digit', 
    year: 'numeric' 
  })
})
</script>

<style scoped>
/* Increased horizontal gap between the separate sections */
.consolidated-metrics-horizontal { display: flex; align-items: center; gap: 2.5rem; }

/* Expanded item widths using padding-right and inner row vertical gaps */
.metric-inline-item { display: flex; flex-direction: column; justify-content: center; gap: 5px; padding-right: 2.5rem; border-right: 1px solid #e5e7eb; min-width: 140px; }
.metric-inline-item:last-child { border-right: none; padding-right: 0; min-width: auto; }

/* Set label font-weight to 800 (Extra Bold) and slightly increased scale */
.metric-label { font-size: 0.7rem; font-weight: 800; color: #374151; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1; }
.metric-subtext { font-size: 0.6rem; color: #9ca3af; margin: 0; font-weight: 500; line-height: 1; }

/* Increased text size readability for middle structural values */
.giant-currency-header { font-size: 1.05rem; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.3px; line-height: 1.1; }
.metric-value-badge { font-size: 0.75rem; font-weight: 700; padding: 3px 8px; border-radius: 4px; align-self: flex-start; line-height: 1.1; }
.metric-value-badge.source-badge { color: #2563eb; background: #eff6ff; font-family: monospace; }
.metric-value-badge.count-badge { color: #059669; background: #ecfdf5; }

.date-display-text { font-size: 0.75rem; font-weight: 700; color: #374151; background: #f3f4f6; padding: 3px 8px; border-radius: 4px; border: 1px solid #e5e7eb; font-family: monospace; align-self: flex-start; line-height: 1.1; }
</style>