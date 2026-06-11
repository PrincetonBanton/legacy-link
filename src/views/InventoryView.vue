<template>
  <div class="inventory-view-wrapper">
    <div class="stats-grid-row">
      <div class="stat-pill overall" :class="{ active: activeCategoryFilter === 'all' }" @click="activeCategoryFilter = 'all'">
        <span class="label">OVERALL TOTAL VALUE</span>
        <span class="value">${{ overallTotalValue.toLocaleString(undefined, {minimumFractionDigits: 2}) }}</span>
      </div>
      <div class="stat-pill" :class="{ active: activeCategoryFilter === 'materials' }" @click="activeCategoryFilter = 'materials'">
        <span class="label">MATERIALS</span>
        <span class="value text-sky">${{ categoryTotals.materials.toLocaleString(undefined, {minimumFractionDigits: 2}) }}</span>
      </div>
      <div class="stat-pill" :class="{ active: activeCategoryFilter === 'chemicals' }" @click="activeCategoryFilter = 'chemicals'">
        <span class="label">CHEMICALS</span>
        <span class="value text-purple">${{ categoryTotals.chemicals.toLocaleString(undefined, {minimumFractionDigits: 2}) }}</span>
      </div>
      <div class="stat-pill" :class="{ active: activeCategoryFilter === 'fertilizer' }" @click="activeCategoryFilter = 'fertilizer'">
        <span class="label">FERTILIZER</span>
        <span class="value text-yellow">${{ categoryTotals.fertilizer.toLocaleString(undefined, {minimumFractionDigits: 2}) }}</span>
      </div>
      <div class="stat-pill" :class="{ active: activeCategoryFilter === 'fuel_pol' }" @click="activeCategoryFilter = 'fuel_pol'">
        <span class="label">FUEL / POL</span>
        <span class="value text-red">${{ categoryTotals.fuel_pol.toLocaleString(undefined, {minimumFractionDigits: 2}) }}</span>
      </div>
    </div>

    <div class="inventory-body-grid">
      <div class="inventory-list-panel">
        <div class="panel-header flex-header">
          
          <div class="left-controls">
            <h3>INVENTORY REGISTRY</h3>
            <div class="sort-selector-group">
              <button :class="{ active: activeSortOrder === 'alphabetical' }" @click="activeSortOrder = 'alphabetical'">
                🔤 A-Z ORDER
              </button>
              <button :class="{ active: activeSortOrder === 'highest_value' }" @click="activeSortOrder = 'highest_value'">
                💰 HIGHEST VALUE
              </button>
            </div>
          </div>
          
          <div class="filter-selector-group">
            <button :class="{ active: activeCategoryFilter === 'all' }" @click="activeCategoryFilter = 'all'">ALL</button>
            <button :class="{ active: activeCategoryFilter === 'materials' }" @click="activeCategoryFilter = 'materials'">MATERIALS</button>
            <button :class="{ active: activeCategoryFilter === 'chemicals' }" @click="activeCategoryFilter = 'chemicals'">CHEMICALS</button>
            <button :class="{ active: activeCategoryFilter === 'fertilizer' }" @click="activeCategoryFilter = 'fertilizer'">FERTILIZER</button>
            <button :class="{ active: activeCategoryFilter === 'fuel_pol' }" @click="activeCategoryFilter = 'fuel_pol'">FUEL / POL</button>
          </div>
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
              <tr v-for="item in filteredAndRankedItems" :key="item.id">
                <td class="code-text">{{ item.item_code }}</td>
                <td class="interactive-name-cell" @click="triggerSmartSearch(item)">
                  {{ item.item_name }}
                  <span class="hover-search-hint">🔍 Info</span>
                </td>
                <td><span class="pill-category">{{ item.item_group }}</span></td>
                <td class="num">{{ item.available_stock.toLocaleString() }} <small>{{ item.unit_of_measure }}</small></td>
                <td class="num">${{ item.unit_cost.toFixed(2) }}</td>
                <td class="num highlight" :class="{ 'alt-highlight': activeSortOrder === 'highest_value' }">
                  ${{ item.computed_total_value.toLocaleString(undefined, {minimumFractionDigits: 2}) }}
                </td>
              </tr>
              <tr v-if="isLoading">
                <td colspan="6" class="empty-msg loading">Fetching inventory metrics from master table...</td>
              </tr>
              <tr v-else-if="!filteredAndRankedItems.length">
                <td colspan="6" class="empty-msg">No inventory records found matching selection.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="inventory-graph-panel">
        <InventoryDistributionChart :chart-data="chartData" />
      </div>
    </div>

    <ItemLookupModal 
      :is-open="isModalOpen"
      :item-name="selectedItemName"
      :item-group="selectedItemGroup"
      @close="isModalOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useInventory } from '../composables/useInventory'
import InventoryDistributionChart from '../components/InventoryDistributionChart.vue'
import ItemLookupModal from '../components/ItemLookupModal.vue'

const { 
  categoryTotals, 
  overallTotalValue, 
  filteredAndRankedItems, 
  chartData, 
  isLoading,
  activeCategoryFilter,   
  activeSortOrder, // Injected sorting tracker state
  loadLegacyInventory 
} = useInventory()

const isModalOpen = ref(false)
const selectedItemName = ref('')
const selectedItemGroup = ref('')

const triggerSmartSearch = (item) => {
  selectedItemName.value = item.item_name
  selectedItemGroup.value = item.item_group
  isModalOpen.value = true
}

onMounted(async () => {
  await loadLegacyInventory()
})
</script>

<style scoped>
.inventory-view-wrapper { display: flex; flex-direction: column; gap: 20px; width: 100%; height: 100%; box-sizing: border-box; padding: 1rem 1.5rem; }
.stats-grid-row { display: flex; gap: 12px; width: 100%; flex-shrink: 0; }
.stat-pill { background: #1e293b; border: 1px solid #334155; padding: 10px 16px; border-radius: 8px; flex: 1; display: flex; flex-direction: column; gap: 2px; cursor: pointer; transition: all 0.2s ease; }
.stat-pill:hover { background: #24334d; border-color: #475569; }
.stat-pill.active { border-color: #38bdf8; background: #0f172a; box-shadow: 0 0 8px rgba(56, 189, 248, 0.2); }
.stat-pill.overall { background: #0f172a; border-color: #475569; position: relative; }
.stat-pill.overall.active { border-color: #34d399; box-shadow: 0 0 8px rgba(52, 211, 153, 0.2); }
.stat-pill .label { font-size: 0.6rem; font-weight: 700; color: #64748b; letter-spacing: 0.05em; }
.stat-pill .value { font-size: 1.2rem; font-weight: 800; color: #fff; }

.text-sky { color: #38bdf8 !important; }
.text-purple { color: #a855f7 !important; }
.text-yellow { color: #eab308 !important; }
.text-red { color: #ef4444 !important; }

.inventory-body-grid { display: flex; gap: 20px; width: 100%; flex: 1; min-height: 0; }
.inventory-list-panel { flex: 0 0 70%; display: flex; flex-direction: column; background: #1e293b; border: 1px solid #334155; border-radius: 12px; min-width: 0; height: 100%; }
.inventory-graph-panel { flex: 0 0 30%; min-width: 0; height: 100%; }

.flex-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #334155; }
.left-controls { display: flex; align-items: center; gap: 16px; }
.left-controls h3 { margin: 0; font-size: 0.8rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.02em; }

/* 🔤 LEFT SORT SWITCH LAYOUT */
.sort-selector-group { display: flex; gap: 2px; background: #0f172a; padding: 2px; border-radius: 4px; border: 1px solid #334155; }
.sort-selector-group button { background: transparent; border: none; color: #475569; font-size: 0.6rem; font-weight: 800; padding: 3px 8px; border-radius: 3px; cursor: pointer; transition: all 0.15s ease; }
.sort-selector-group button:hover { color: #94a3b8; }
.sort-selector-group button.active { background: #334155; color: #34d399; }

/* 📂 RIGHT CATEGORY FILTER LAYOUT */
.filter-selector-group { display: flex; gap: 4px; background: #0f172a; padding: 3px; border-radius: 6px; border: 1px solid #334155; }
.filter-selector-group button { background: transparent; border: none; color: #64748b; font-size: 0.65rem; font-weight: 800; padding: 4px 10px; border-radius: 4px; cursor: pointer; transition: all 0.15s ease; }
.filter-selector-group button:hover { color: #cbd5e1; }
.filter-selector-group button.active { background: #334155; color: #38bdf8; }

.table-scroll-frame { flex: 1; overflow-y: auto; padding: 8px; min-height: 0; }
.inventory-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; }
.inventory-table th { padding: 10px; font-weight: 700; color: #64748b; border-bottom: 2px solid #334155; font-size: 0.75rem; text-transform: uppercase; }
.inventory-table td { padding: 10px; border-bottom: 1px solid #334155; color: #cbd5e1; vertical-align: middle; }
.inventory-table tr:hover td { background: #24334d; }
.inventory-table th.num, .inventory-table td.num { text-align: right; }

.code-text { font-family: monospace; font-weight: 700; color: #38bdf8; }
.pill-category { font-size: 0.7rem; font-weight: 700; background: #334155; color: #94a3b8; padding: 2px 8px; border-radius: 4px; }
.highlight { color: #cbd5e1; font-weight: 700; transition: color 0.2s; }
.highlight.alt-highlight { color: #34d399 !important; } /* Changes color when highest value sort rule is active */

.empty-msg { text-align: center; color: #475569; padding: 40px !important; }
.empty-msg.loading { color: #38bdf8; }

.interactive-name-cell { cursor: pointer; position: relative; font-weight: 500; transition: color 0.15s ease; padding-right: 45px !important; }
.interactive-name-cell:hover { color: #38bdf8; text-decoration: underline; }
.hover-search-hint { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 0.6rem; font-weight: 800; color: #0f172a; background: #38bdf8; padding: 1px 5px; border-radius: 4px; opacity: 0; pointer-events: none; transition: opacity 0.15s ease; }
.interactive-name-cell:hover .hover-search-hint { opacity: 1; }
</style>