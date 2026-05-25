<template>
  <div class="card dynamic-table-card">
    <h3>Top 10 Productions / Expenses</h3>
    <div class="table-scroll-container">
      <table v-if="matchedRecords?.length" class="simple-data-table">
        <thead>
          <tr>
            <th>Transaction Date</th>
            <th>{{ activeViewType === 'dates' ? 'Document Number' : 'Block Batch ID' }}</th>
            <th>Details</th>
            <th style="text-align: right;">Financial Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in matchedRecords.slice(0, 10)" :key="idx">
            <td>{{ item.date }}</td>
            <td><span class="table-id-badge">{{ item.identifier }}</span></td>
            <td><span class="meta-tag-pill">{{ item.extraInfo }}</span></td>
            <td style="text-align: right; font-weight: 700; color: #111827;">
              Php {{ item.value.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state-card-message">No active data rows available to display.</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  matchedRecords: { type: Array, required: true, default: () => [] },
  activeViewType: { type: String, required: true }
})
</script>

<style scoped>
.card { background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 1.5rem; box-sizing: border-box; }
.dynamic-table-card { display: flex; flex-direction: column; gap: 14px; height: 220px; min-width: 0; }
.dynamic-table-card h3 { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
.table-scroll-container { flex: 1; overflow-y: auto; width: 100%; min-width: 0; }

.simple-data-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: left; table-layout: fixed; }
.simple-data-table th { padding: 8px 10px; color: #9ca3af; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #f3f4f6; font-size: 0.65rem; }
.simple-data-table td { padding: 10px; border-bottom: 1px solid #f9fafb; color: #4b5563; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.table-id-badge { background: #f3f4f6; padding: 3px 8px; border-radius: 4px; font-weight: 700; color: #111827; font-family: monospace; font-size: 0.8rem; }
.meta-tag-pill { background: #ecfdf5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
.empty-state-card-message { display: flex; align-items: center; justify-content: center; height: 100%; text-align: center; color: #9ca3af; font-size: 0.8rem; font-weight: 500; border: 1px dashed #e5e7eb; border-radius: 8px; padding: 1rem; box-sizing: border-box; }
</style>