import { ref } from 'vue'
import { useDebugLogger } from './useDebugLogger'

export function useAnalysis(detectedType, activeArea) {
  const ENABLE_DEBUG_ALERTS = false

  // --- STATE FOR FILTERING & SUMMARY ---
  const totalAmount = ref(0)
  const invoiceRecords = ref([])
  const blockRecords = ref([])
  
  // 🍇 STATE FOR PRODUCT PIE CHART AGGREGATIONS
  const productRecords = ref([])
  const activeViewType = ref('')

  const today = new Date()
  const year = today.getFullYear()
  const monthIndex = today.getMonth()
  const monthString = String(monthIndex + 1).padStart(2, '0')
  const lastDayOfThisMonth = new Date(year, monthIndex + 1, 0).getDate()
  const lastDayString = String(lastDayOfThisMonth).padStart(2, '0')
  
  const dateRange = ref({
    start: `${year}-${monthString}-01`,
    end: `${year}-${monthString}-${lastDayString}`
  })

  const getTableName = () => detectedType.value === "Production System" ? "DRDetails" : "MISDetails"
  const getIpc = () => window.require ? window.require('electron').ipcRenderer : null

  // Initialize the local log utility containing our alert hooks
  const { logFilteredInvoices, logBlockSummary, logProductSummary } = useDebugLogger()

  // --- 1. FILTER BY DATE WORKER (LINE GRAPH - INVOICES) ---
  const handleExecuteInvoices = async () => {
    if (!detectedType.value) return
    const table = getTableName()

    const res = await getIpc()?.invoke('check-data-by-date', {
      table,
      startDate: dateRange.value.start,
      endDate: dateRange.value.end
    })
    
    if (!res || res.error) return

    if (!res.data || res.data.length === 0) {
      totalAmount.value = 0
      invoiceRecords.value = []
      alert(`ℹ️ Notice: No invoice records found between ${dateRange.value.start} and ${dateRange.value.end} for table "${table}".`)
      return
    }

    const totalSum = res.data.reduce((accumulator, row) => accumulator + (row.UniqueTotal || 0), 0)
    totalAmount.value = totalSum

    activeViewType.value = 'dates'
    invoiceRecords.value = res.data.map(row => ({
      date: row.TransactionDate ? row.TransactionDate.trim() : 'N/A',
      identifier: row.CleanNum,
      value: row.UniqueTotal,
      extraInfo: 'Invoice'
    }))

    if (ENABLE_DEBUG_ALERTS) {
      logFilteredInvoices(res, detectedType.value, table, dateRange.value, totalSum)
    }
  }

  // --- 2. CHECK BLOCK DATA WORKER (BAR GRAPH - BLOCKS) ---
  const handleExecuteBlocks = async () => {
    if (!detectedType.value) return
    const table = getTableName()
    const isProduction = detectedType.value === "Production System"
    const blockCol = isProduction ? "DRBlock" : "MISBlock"
    const amountCol = isProduction ? "DRAmount" : "MISAmount"

    const res = await getIpc()?.invoke('check-block-data', {
      table,
      startDate: dateRange.value.start,
      endDate: dateRange.value.end
    })
    
    if (!res || res.error) return

    if (!res.data || res.data.length === 0) {
      blockRecords.value = []
      return
    }

    const grandBlockSum = res.data.reduce((accumulator, row) => accumulator + (row.BlockSumTotal || 0), 0)
    totalAmount.value = grandBlockSum

    activeViewType.value = 'blocks'
    
    blockRecords.value = res.data.map(row => ({
      date: row.TransactionDate ? row.TransactionDate.trim() : 'N/A',
      identifier: row.CleanBlock,
      value: row.BlockSumTotal,
      extraInfo: `${row.RowCount} items`
    }))

    if (ENABLE_DEBUG_ALERTS) {
      logBlockSummary(res, detectedType.value, table, dateRange.value, grandBlockSum, blockCol, amountCol)
    }
  }

// --- 🍇 DYNAMIC PRODUCT & MATERIAL MATERIAL AGGREGATION ---
  const handleExecuteProducts = async () => {
    if (!detectedType.value) return
    
    const table = getTableName()
    const isProduction = detectedType.value === "Production System"
    
    const productCol = isProduction ? "DRProduct" : "MISGroup"
    const amountCol = isProduction ? "DRAmount" : "MISAmount"

    try {
      // 1. Clear out state explicitly to force Vue to teardown old chart references
      productRecords.value = []

      const res = await getIpc()?.invoke('check-product-data', {
        table,
        startDate: dateRange.value.start,
        endDate: dateRange.value.end
      })

      if (!res || res.error) {
        return
      }

      if (!res.data || res.data.length === 0) {
        if (ENABLE_DEBUG_ALERTS) {
          logProductSummary(res, detectedType.value, table, dateRange.value, productCol, amountCol)
        }
        return
      }

      // 2. Standardize mapping keys so Chart.js deep watchers notice the switch
      productRecords.value = res.data.map(row => ({
        identifier: String(row.CleanProduct || '').trim() || (isProduction ? 'Unnamed Crop' : 'Uncategorized Group'),
        value: parseFloat(row.ProductSumTotal) || 0,
        extraInfo: `${row.RowCount || 0} references`
      }))
      
      // Trigger debugger alert natively
      if (ENABLE_DEBUG_ALERTS) {
        logProductSummary(res, detectedType.value, table, dateRange.value, productCol, amountCol)
      }

    } catch (e) {
      console.error("❌ Error running product records mapping pipe:", e)
      productRecords.value = []
    }
  }

  const clearAnalysisData = () => {
    totalAmount.value = 0
    invoiceRecords.value = []
    blockRecords.value = []
    productRecords.value = []
    activeViewType.value = ''
  }

  return {
    dateRange, totalAmount, invoiceRecords, blockRecords, productRecords, activeViewType,
    getTableName, getIpc, handleExecuteInvoices, handleExecuteBlocks, handleExecuteProducts, clearAnalysisData
  }
}