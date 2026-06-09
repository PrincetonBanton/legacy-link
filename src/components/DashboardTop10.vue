<template>
  <div class="card dynamic-table-card">
    <div class="table-scroll-container">
      <table v-if="sortedRecords?.length" class="modern-excel-table">
        <thead>
          <tr>
            <th style="width: 40%;">{{ activeViewType === 'dates' ? 'Document Number' : 'Block Batch ID' }}</th>
            <th style="width: 20%;">Details</th>
            <th style="width: 40%; text-align: right;">Financial Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in sortedRecords" :key="idx">
            <td class="cell-id">{{ item.identifier }}</td>
            <td class="cell-text">{{ item.extraInfo || '—' }}</td>
            <td class="cell-num text-green">
              Php {{ item.value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state-card-message">No active data rows available to display.</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  matchedRecords: { type: Array, required: true, default: () => [] },
  activeViewType: { type: String, required: true },
  mainTableInfo: { type: Object, required: false, default: () => ({}) }
})

const extractedTableName = computed(() => {
  if (!props.mainTableInfo) return ''
  return props.mainTableInfo.name || props.mainTableInfo.tableName || props.mainTableInfo.table || ''
})

const sortedRecords = computed(() => {
  if (!props.matchedRecords) return []
  return [...props.matchedRecords].sort((a, b) => (b.value || 0) - (a.value || 0))
})
</script>

<style scoped>
.card { background: #111827; border: 1px solid #1e293b; border-radius: 10px; }
.dynamic-table-card { display: flex; flex-direction: column; height: 100%; min-height: 0; min-width: 0; }
.table-scroll-container { flex: 1; overflow-y: auto; width: 100%; min-width: 0; min-height: 0; }
.modern-excel-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; text-align: left; table-layout: fixed; background: #111827; }
.modern-excel-table th { position: sticky; top: 0; z-index: 1; padding: 6px 8px; color: #64748b; font-weight: 700; background: #162235; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.05em; font-family: -apple-system, sans-serif; border-bottom: 1px solid #1e293b; }
.modern-excel-table td { padding: 6px 8px; border: none; word-break: break-all; vertical-align: middle; transition: background-color 0.15s ease; }
.modern-excel-table tbody tr { background: #111827; }
.modern-excel-table tbody tr:hover { background: #1e293b; }
.cell-id { font-family: monospace; font-weight: 500; color: #f8fafc; font-size: 0.75rem; }
.cell-text { color: #94a3b8; font-family: -apple-system, sans-serif; font-size: 0.75rem; }
.cell-num { text-align: right; font-family: monospace; font-weight: 700; font-size: 0.825rem; }
.text-green { color: #10b981; }
.empty-state-card-message { display: flex; align-items: center; justify-content: center; height: 100%; min-height: 150px; color: #475569; font-size: 0.8rem; font-family: -apple-system, sans-serif; padding: 1rem; box-sizing: border-box; }
</style>