<template>
  <div class="inventory-view-wrapper">
    <div class="stats-grid-row">
      <div class="stat-pill overall">
        <span class="label">OVERALL TOTAL VALUE</span>
        <span class="value">${{ overallTotalValue.toLocaleString(undefined, {minimumFractionDigits: 2}) }}</span>
      </div>
      <div class="stat-pill">
        <span class="label">MATERIALS</span>
        <span class="value text-sky">${{ categoryTotals.materials.toLocaleString(undefined, {minimumFractionDigits: 2}) }}</span>
      </div>
      <div class="stat-pill">
        <span class="label">CHEMICALS</span>
        <span class="value text-purple">${{ categoryTotals.chemicals.toLocaleString(undefined, {minimumFractionDigits: 2}) }}</span>
      </div>
      <div class="stat-pill">
        <span class="label">FERTILIZER</span>
        <span class="value text-yellow">${{ categoryTotals.fertilizer.toLocaleString(undefined, {minimumFractionDigits: 2}) }}</span>
      </div>
      <div class="stat-pill">
        <span class="label">FUEL / POL</span>
        <span class="value text-red">${{ categoryTotals.fuel_pol.toLocaleString(undefined, {minimumFractionDigits: 2}) }}</span>
      </div>
    </div>

    <div class="inventory-body-grid">
      <div class="inventory-list-panel">
        <div class="panel-header">
          <h3>INVENTORY RANKING (HIGHEST TO LOWEST)</h3>
        </div>
        <div class="table-scroll-frame">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>ITEM CODE</th>
                <th>DESCRIPTION</th>
                <th>CATEGORY</th>
                <th class="num">STOCK</th>
                <th class="num">UNIT COST</th>
                <th class="num">TOTAL VALUE</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in rankedInventoryItems" :key="item.id">
                <td class="code-text">{{ item.item_code }}</td>
                <td>{{ item.item_name }}</td>
                <td><span class="pill-category">{{ item.item_group }}</span></td>
                <td class="num">{{ item.available_stock.toLocaleString() }} <small>{{ item.unit_of_measure }}</small></td>
                <td class="num">${{ item.unit_cost.toFixed(2) }}</td>
                <td class="num highlight">${{ item.computed_total_value.toLocaleString(undefined, {minimumFractionDigits: 2}) }}</td>
              </tr>
              <tr v-if="isLoading">
                <td colspan="6" class="empty-msg loading">Fetching inventory metrics from master table...</td>
              </tr>
              <tr v-else-if="!rankedInventoryItems.length">
                <td colspan="6" class="empty-msg">No inventory records found in MS Access.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="inventory-graph-panel">
        <InventoryDistributionChart :chart-data="chartData" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useInventory } from '../composables/useInventory'
import InventoryDistributionChart from '../components/InventoryDistributionChart.vue'

const { 
  categoryTotals, 
  overallTotalValue, 
  rankedInventoryItems, 
  chartData, 
  isLoading,
  loadLegacyInventory 
} = useInventory()

onMounted(async () => {
  await loadLegacyInventory()
})
</script>

<style scoped>
.inventory-view-wrapper { display: flex; flex-direction: column; gap: 20px; width: 100%; height: 100%; box-sizing: border-box; padding: 1rem 1.5rem; }
.stats-grid-row { display: flex; gap: 12px; width: 100%; flex-shrink: 0; }
.stat-pill { background: #1e293b; border: 1px solid #334155; padding: 10px 16px; border-radius: 8px; flex: 1; display: flex; flex-direction: column; gap: 2px; }
.stat-pill.overall { background: #0f172a; border-color: #475569; position: relative; }
.stat-pill .label { font-size: 0.6rem; font-weight: 700; color: #64748b; letter-spacing: 0.05em; }
.stat-pill .value { font-size: 1.2rem; font-weight: 800; color: #fff; }
.text-sky { color: #38bdf8 !important; }
.text-purple { color: #a855f7 !important; }
.text-yellow { color: #eab308 !important; }
.text-red { color: #ef4444 !important; }
.inventory-body-grid { display: flex; gap: 20px; width: 100%; flex: 1; min-height: 0; }
.inventory-list-panel { flex: 0 0 70%; display: flex; flex-direction: column; background: #1e293b; border: 1px solid #334155; border-radius: 12px; min-width: 0; height: 100%; }
.inventory-graph-panel { flex: 0 0 30%; min-width: 0; height: 100%; }
.panel-header { padding: 12px 16px; border-bottom: 1px solid #334155; }
.panel-header h3 { margin: 0; font-size: 0.8rem; font-weight: 800; color: #94a3b8; }
.table-scroll-frame { flex: 1; overflow-y: auto; padding: 8px; min-height: 0; }
.inventory-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; }
.inventory-table th { padding: 10px; font-weight: 700; color: #64748b; border-bottom: 2px solid #334155; font-size: 0.75rem; text-transform: uppercase; }
.inventory-table td { padding: 10px; border-bottom: 1px solid #334155; color: #cbd5e1; vertical-align: middle; }
.inventory-table tr:hover td { background: #24334d; }
.inventory-table th.num, .inventory-table td.num { text-align: right; }
.code-text { font-family: monospace; font-weight: 700; color: #38bdf8; }
.pill-category { font-size: 0.7rem; font-weight: 700; background: #334155; color: #94a3b8; padding: 2px 8px; border-radius: 4px; }
.highlight { color: #34d399 !important; font-weight: 700; }
.empty-msg { text-align: center; color: #475569; padding: 40px !important; }
.empty-msg.loading { color: #38bdf8; }
</style>