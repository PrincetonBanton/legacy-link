import { ref } from 'vue'
import { useDebugLogger } from './useDebugLogger'

export function useAnalysis(detectedType) {
  // 🎯 THE MASTER ALERTS SWITCH
  // Change to true to enable all debug popups; change to false to mute everything instantly!
  const ENABLE_DEBUG_ALERTS = false 

  // --- STATE FOR FILTERING & SUMMARY ---
  const totalAmount = ref(0)
  const matchedRecords = ref([])
  const blockRecords = ref([])
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

  // Initialize the external logger alerts
  const { logFilteredInvoices, logBlockSummary } = useDebugLogger()

  // --- 1. FILTER BY DATE WORKER (LINE GRAPH - INVOICES) ---
  const handleExecuteFiltered = async () => {
    if (!detectedType.value) return alert("Please sync a database first.")
    const table = getTableName()

    const res = await getIpc()?.invoke('check-data-by-date', {
      table,
      startDate: dateRange.value.start,
      endDate: dateRange.value.end
    })
    
    if (!res) return
    if (res.error) return alert(`❌ Database Error: ${res.error}`)

    if (!res.data || res.data.length === 0) {
      totalAmount.value = 0
      matchedRecords.value = []
      return alert(`⚠️ No records found between ${dateRange.value.start} and ${dateRange.value.end} for table "${table}".`)
    }

    const totalSum = res.data.reduce((accumulator, row) => accumulator + (row.UniqueTotal || 0), 0)
    totalAmount.value = totalSum

    activeViewType.value = 'dates'
    matchedRecords.value = res.data.map(row => ({
      date: row.TransactionDate ? row.TransactionDate.trim() : 'N/A',
      identifier: row.CleanNum,
      value: row.UniqueTotal,
      extraInfo: 'Invoice'
    }))

    // Handled automatically via the top flag variable
    if (ENABLE_DEBUG_ALERTS) {
      logFilteredInvoices(res, detectedType.value, table, dateRange.value, totalSum)
    }
  }

  // --- 2. CHECK BLOCK DATA WORKER (BAR GRAPH - BLOCKS) ---
  const handleExecuteBlocks = async () => {
    if (!detectedType.value) return alert("Please sync a database first.")
    const table = getTableName()
    const isProduction = detectedType.value === "Production System"
    const blockCol = isProduction ? "DRBlock" : "MISBlock"
    const amountCol = isProduction ? "DRAmount" : "MISAmount"

    const res = await getIpc()?.invoke('check-block-data', {
      table,
      startDate: dateRange.value.start,
      endDate: dateRange.value.end
    })
    
    if (!res) return
    if (res.error) return alert(`❌ Database Error: ${res.error}`)

    if (!res.data || res.data.length === 0) {
      blockRecords.value = []
      matchedRecords.value = []
      return alert(`⚠️ No blocks found between ${dateRange.value.start} and ${dateRange.value.end} for table "${table}".`)
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

    // Handled automatically via the top flag variable
    if (ENABLE_DEBUG_ALERTS) {
      logBlockSummary(res, detectedType.value, table, dateRange.value, grandBlockSum, blockCol, amountCol)
    }
  }

  const clearAnalysisData = () => {
    totalAmount.value = 0
    matchedRecords.value = []
    blockRecords.value = []
    activeViewType.value = ''
  }

  return {
    dateRange, totalAmount, matchedRecords, blockRecords, activeViewType,
    handleExecuteFiltered, handleExecuteBlocks, clearAnalysisData
  }
}