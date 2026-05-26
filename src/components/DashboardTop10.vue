<template>
  <div class="card dynamic-table-card">
    <div class="card-header">
      <h3>{{ dynamicHeaderTitle }}</h3>
      <span class="subtitle">Sorted by highest value</span>
    </div>
    
    <div class="table-scroll-container">
      <table v-if="sortedRecords?.length" class="modern-excel-table">
        <thead>
          <tr>
            <th style="width: 35%;">{{ activeViewType === 'dates' ? 'Document Number' : 'Block Batch ID' }}</th>
            <th style="width: 35%;">Details</th>
            <th style="width: 30%; text-align: right;">Financial Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in sortedRecords" :key="idx">
            <td class="cell-id">{{ item.identifier }}</td>
            <td class="cell-text">{{ item.extraInfo || '—' }}</td>
            <td class="cell-num">
              {{ item.value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state-card-message">No active data rows available to display.</div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  matchedRecords: { type: Array, required: true, default: () => [] },
  activeViewType: { type: String, required: true },
  mainTableInfo: { type: Object, required: false, default: () => ({}) } // Changed type from String to Object
})

const extractedTableName = computed(() => {
  if (!props.mainTableInfo) return ''
  return props.mainTableInfo.name || props.mainTableInfo.tableName || props.mainTableInfo.table || ''
})

// Dynamic header title resolver utilizing the extracted object string
const dynamicHeaderTitle = computed(() => {
  const tableName = extractedTableName.value;
  if (tableName.includes('DRDetails')) {
    return 'Production Analysis'
  }
  if (tableName.includes('MISDetails')) {
    return 'Material Management Input'
  }
  
  return 'Productions / Expenses'
})

const sortedRecords = computed(() => {
  if (!props.matchedRecords) return []
  return [...props.matchedRecords].sort((a, b) => (b.value || 0) - (a.value || 0))
})
</script>

<style scoped>
/* --- CORE CONTAINER SHORTHANDS --- */
.card { background: #fff; border-radius: 16px; border: 1px solid #f3f4f6; padding: 1.25rem 1rem; box-sizing: border-box; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01); height: 100%; overflow: hidden; }
.dynamic-table-card { display: flex; flex-direction: column; gap: 1rem; height: 100%; min-height: 0; min-width: 0; }
.card-header { display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; }
.card-header h3 { font: 600 0.95rem/1.2 'Inter', -apple-system, sans-serif; color: #111827; margin: 0; letter-spacing: -0.2px; }
.subtitle { font: 400 0.75rem/1.2 'Inter', -apple-system, sans-serif; color: #9ca3af; }
.table-scroll-container { flex: 1; overflow-y: auto; width: 100%; min-width: 0; min-height: 0; }

/* --- COMPACT TABLE GRID --- */
.modern-excel-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: left; table-layout: fixed; }
.modern-excel-table th { position: sticky; top: 0; z-index: 1; padding: 6px 8px; color: #6b7280; font-weight: 600; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.3px; font-family: 'Inter', sans-serif; }
.modern-excel-table td { padding: 8px 6px; border-bottom: 1px solid #f3f4f6; color: #374151; word-break: break-all; vertical-align: middle; transition: background-color 0.15s ease; }

/* --- ALTERNATING LIGHT GREEN / LIGHT BLUE ROWS --- */
.modern-excel-table tbody tr:nth-child(odd) { background: #f0fdf4; }
.modern-excel-table tbody tr:nth-child(even) { background: #f0f9ff; }
.modern-excel-table tbody tr:hover { background: #e0f2fe; }
.modern-excel-table tr:last-child td { border-bottom: none; }

/* --- CONDENSED TYPOGRAPHY LINES --- */
.cell-id { font: 500 0.75rem 'Inter Condensed', 'Arial Narrow', sans-serif; color: #111827; letter-spacing: -0.1px; }
.cell-text { color: #4b5563; font: 400 0.75rem 'Inter Condensed', 'Arial Narrow', sans-serif; }
.cell-num { text-align: right; font: 600 0.825rem 'Inter Condensed', 'Arial Narrow', sans-serif; font-stretch: condensed; color: #111827; letter-spacing: -0.3px; }
.empty-state-card-message { display: flex; align-items: center; justify-content: center; height: 100%; min-height: 150px; color: #9ca3af; font: 500 0.8rem 'Inter', sans-serif; padding: 1rem; box-sizing: border-box; }
</style>