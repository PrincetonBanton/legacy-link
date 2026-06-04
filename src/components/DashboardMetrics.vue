<template>
  <div class="consolidated-metrics-horizontal">
    <div class="metric-inline-item">
      <p class="metric-label">Range Total</p>
      <h2 class="metric-label text-green">Php {{ totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</h2>
      <p class="metric-subtext">{{ dateRange.start }} - {{ dateRange.end }}</p>
    </div>

    <div class="metric-inline-item">
      <p class="metric-label">Code-Source</p>
      <span class="metric-label text-green">{{ mainTableInfo.name || 'None Active' }}</span>
      <p class="metric-subtext">Database Target</p>
    </div>

    <div class="metric-inline-item">
      <p class="metric-label">Verified Log Count</p>
      <span class="metric-label text-green">{{ matchedRecordsLength }} Entries</span>
      <p class="metric-subtext">Transactions</p>
    </div>

    <!-- <div class="metric-inline-item">
      <p class="metric-label">System Date</p>
      <span class="metric-label text-green">{{ currentLiveDate }}</span>
      <p class="metric-subtext">Live Timestamp</p>
    </div> -->
    
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
.metric-inline-item { display: flex; flex-direction: column; justify-content: center; gap: 5px; padding-right: 2rem; min-width: auto; }
.metric-inline-item:last-child { border-right: none; padding-right: 0; min-width: auto; }

/* Set label font-weight to 800 (Extra Bold) and slightly increased scale */
.metric-label { font-size: 0.7rem; font-weight: 800; color: #eff6ff; margin: 0; letter-spacing: 0.5px; line-height: 1; }
.metric-subtext { font-size: 0.6rem; color: #9ca3af; margin: 0; font-weight: 500; line-height: 1; }
.metric-label.text-green { color: #10b981; font-size: .8rem; }

</style>