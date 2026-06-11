import { ref, computed } from 'vue'

export function useInventory() {
  const ENABLE_DEBUG_ALERTS = false 

  // --- STATE MANAGEMENT ---
  const rawItems = ref([])
  const isLoading = ref(false)
  const activeViewType = ref('inventory_groups')
  const totalAmount = ref(0) 
  const activeCategoryFilter = ref('all')
  
  // 🎯 NEW: Tracks sorting rules ('alphabetical' or 'highest_value')
  const activeSortOrder = ref('alphabetical')

  // --- SAFE ELECTRON RUNTIME CONTEXT INTERFACE ---
  const getIpc = () => window.require ? window.require('electron').ipcRenderer : null

  // --- TEXT VALUE NORMALIZATION WORKER ---
  const normalizeGroup = (groupName) => {
    const name = (groupName || '').toLowerCase().trim()
    if (name.includes('material')) return 'materials'
    if (name.includes('chemical')) return 'chemicals'
    if (name.includes('fertilizer') || name.includes('fert')) return 'fertilizer'
    if (name.includes('fuel') || name.includes('pol') || name.includes('oil')) return 'fuel_pol'
    return 'materials' 
  }

  // --- INVENTORY EXTRACTION PIPELINE WORKER ---
  const loadLegacyInventory = async () => {
    isLoading.value = true
    try {
      const res = await getIpc()?.invoke('query-inventory')
      if (!res || res.error) return

      const dataPayload = res.data ? res.data : []
      rawItems.value = dataPayload

      const grandInventorySum = dataPayload.reduce((accumulator, row) => {
        const stock = Number((row.AvailStock || '0').toString().replace(/,/g, ''))
        const cost = Number((row.Cost || '0').toString().replace(/,/g, ''))
        return accumulator + (stock * cost)
      }, 0)

      totalAmount.value = grandInventorySum
    } catch (err) {
      console.error("Local inventory synchronization fault:", err)
    } finally {
      isLoading.value = false
    }
  }

  // --- REACTIVE SUMMARY PRODUCERS ---
  const categoryTotals = computed(() => {
    const totals = { materials: 0, chemicals: 0, fertilizer: 0, fuel_pol: 0 }
    rawItems.value.forEach(item => {
      const stock = Number((item.AvailStock || '0').toString().replace(/,/g, ''))
      const cost = Number((item.Cost || '0').toString().replace(/,/g, ''))
      const targetBucket = normalizeGroup(item.ItemGroup)
      totals[targetBucket] += (stock * cost)
    })
    return totals
  })

  const overallTotalValue = computed(() => totalAmount.value)

  // --- 🎯 UPDATED: DYNAMIC SORT & FILTER MATRIX ---
  const filteredAndRankedItems = computed(() => {
    return [...rawItems.value]
      .map(item => {
        const stock = Number((item.AvailStock || '0').toString().replace(/,/g, ''))
        const cost = Number((item.Cost || '0').toString().replace(/,/g, ''))
        return {
          id: item.InvID,
          item_code: item.ItemCode || 'UNKNOWN',
          item_name: item.ItemName || 'Unnamed Item',
          item_group: item.ItemGroup || 'Unassigned',
          normalized_group: normalizeGroup(item.ItemGroup), 
          available_stock: stock,
          unit_of_measure: item.Unit || 'pcs',
          unit_cost: cost,
          computed_total_value: stock * cost
        }
      })
      .filter(item => {
        if (activeCategoryFilter.value === 'all') return true
        return item.normalized_group === activeCategoryFilter.value
      })
      .sort((a, b) => {
        // 🎯 Condition 1: Sort by Total Financial Net Assets Highest to Lowest
        if (activeSortOrder.value === 'highest_value') {
          if (b.computed_total_value !== a.computed_total_value) {
            return b.computed_total_value - a.computed_total_value
          }
          // Tie-breaker fallback to alphabetical if financial values are equal
          return a.item_name.toLowerCase().localeCompare(b.item_name.toLowerCase())
        }
        
        // 🎯 Condition 2: Default Case-Insensitive Alphabetical sorting (A to Z)
        return a.item_name.toLowerCase().localeCompare(b.item_name.toLowerCase())
      })
  })

  const chartData = computed(() => ({
    labels: ['Materials', 'Chemicals', 'Fertilizer', 'Fuel / POL'],
    datasets: [{
      data: [
        categoryTotals.value.materials,
        categoryTotals.value.chemicals,
        categoryTotals.value.fertilizer,
        categoryTotals.value.fuel_pol
      ],
      backgroundColor: ['#38bdf8', '#a855f7', '#eab308', '#ef4444'],
      borderWidth: 0
    }]
  }))

  const clearInventoryData = () => {
    rawItems.value = []
    totalAmount.value = 0
    activeCategoryFilter.value = 'all'
    activeSortOrder.value = 'alphabetical'
  }

  return {
    rawItems, isLoading, activeViewType, totalAmount, categoryTotals,
    overallTotalValue, filteredAndRankedItems, chartData, activeCategoryFilter, activeSortOrder,
    getIpc, loadLegacyInventory, clearInventoryData
  }
}