import { ref, computed } from 'vue'

export function useInventory() {
  const ENABLE_DEBUG_ALERTS = true // 🔎 Set to true to view structural specifications instantly on call

  // --- STATE FOR SUMMARY MANAGEMENT (Replicating useAnalysis structure) ---
  const rawItems = ref([])
  const isLoading = ref(false)
  const activeViewType = ref('inventory_groups')
  const totalAmount = ref(0) 

  // --- SAFE ELECTRON RUNTIME CONTEXT INTERFACE ---
  const getIpc = () => window.require ? window.require('electron').ipcRenderer : null

  // --- TEXT VALUE NORMALIZATION COMPASS ---
  const normalizeGroup = (groupName) => {
    const name = (groupName || '').toLowerCase().trim()
    if (name.includes('material')) return 'materials'
    if (name.includes('chemical')) return 'chemicals'
    if (name.includes('fertilizer') || name.includes('fert')) return 'fertilizer'
    if (name.includes('fuel') || name.includes('pol') || name.includes('oil')) return 'fuel_pol'
    return 'materials' 
  }

  // --- 📥 INVENTORY EXTRACTION PIPELINE WORKER ---
  const loadLegacyInventory = async () => {
    isLoading.value = true
    const table = 'Inventory'
    
    // Fallback system specifications mapping layout
    const systemProfile = {
      runtime_environment: 'Material Management System',
      system_spec: typeof window !== 'undefined' ? 'Electron Core Renderer Client' : 'Headless Node v8'
    }

    try {
      // 🔥 CONNECTED TO NEWLY REGISTERED SQLITE IPC CHANNEL 
      const res = await getIpc()?.invoke('query-inventory')
      
      if (!res || res.error) {
        alert(`❌ [DEBUG LOG: FAULT]\n\nIPC channel pipeline dropped or returned database execution exception: ${res?.error}`)
        return
      }

      const dataPayload = res.data ? res.data : []
      rawItems.value = dataPayload

      // Calculate total asset sum by scrubbing comma tokens from Short Text definitions
      const grandInventorySum = dataPayload.reduce((accumulator, row) => {
        const stock = Number((row.AvailStock || '0').toString().replace(/,/g, ''))
        const cost = Number((row.Cost || '0').toString().replace(/,/g, ''))
        return accumulator + (stock * cost)
      }, 0)

      totalAmount.value = grandInventorySum
      activeViewType.value = 'inventory_groups'

      // --- 🚨 INTEGRATED EXACT REPLICATED ALERT LOGGER ---
      if (ENABLE_DEBUG_ALERTS && dataPayload.length > 0) {
        const firstRow = dataPayload[0]
        alert(
          `🖥️ System Profile: ${systemProfile.runtime_environment}\n` +
          `📂 Query Target Table: ${table}\n` +
          `☑️ SYSTEM SPEC: ${systemProfile.system_spec}\n` +
          `📂 SOURCE TABLE: ${table}\n` +
          `🔍 VALUE MAPPED: AvailStock * Cost\n` +
          `🔢 RAW ENTRIES COLLECTED: ${dataPayload.length} rows\n\n` +
          `📊 RAW ENTRY SNAPSHOT SCHEMA (FIRST ROW):\n${JSON.stringify(firstRow, null, 2)}\n\n` +
          `💰 TARGET FIELD INSTANCE VALUE: "${firstRow.ItemAmount || 'N/A'}"`
        )
      }

    } catch (err) {
      console.error("Local inventory synchronization fault:", err)
    } finally {
      isLoading.value = false
    }
  }

  // --- 🧮 REACTIVE SUMMARY PRODUCERS ---
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

  const rankedInventoryItems = computed(() => {
    return [...rawItems.value].map(item => {
      const stock = Number((item.AvailStock || '0').toString().replace(/,/g, ''))
      const cost = Number((item.Cost || '0').toString().replace(/,/g, ''))
      return {
        id: item.InvID,
        item_code: item.ItemCode || 'UNKNOWN',
        item_name: item.ItemName || 'Unnamed Item',
        item_group: item.ItemGroup || 'Unassigned',
        available_stock: stock,
        unit_of_measure: item.Unit || 'pcs',
        unit_cost: cost,
        computed_total_value: stock * cost
      }
    }).sort((a, b) => b.computed_total_value - a.computed_total_value)
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
  }

  return {
    rawItems, isLoading, activeViewType, totalAmount, categoryTotals,
    overallTotalValue, rankedInventoryItems, chartData,
    getIpc, loadLegacyInventory, clearInventoryData
  }
}