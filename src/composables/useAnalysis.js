import { ref } from 'vue'

export function useAnalysis(detectedType) {
  // --- STATE FOR FILTERING & SUMMARY ---
  const totalAmount = ref(0)
  const matchedRecords = ref([])
  const activeViewType = ref('')

  // 🚀 Dynamic current month boundary calculation (First Day to Last Day)
const today = new Date()
const year = today.getFullYear()
const monthIndex = today.getMonth() // 0-11
const monthString = String(monthIndex + 1).padStart(2, '0')
const lastDayOfThisMonth = new Date(year, monthIndex + 1, 0).getDate()
const lastDayString = String(lastDayOfThisMonth).padStart(2, '0')
const dateRange = ref({
  start: `${year}-${monthString}-01`,            // Forces Day 01
  end: `${year}-${monthString}-${lastDayString}` // Forces Day 30/31
})

  // --- INTERNAL ENGINE UTILITIES ---
  const getTableName = () => detectedType.value === "Production System" ? "DRDetails" : "MISDetails"
  const getIpc = () => window.require ? window.require('electron').ipcRenderer : null

  // --- 1. RAW PREVIEW DIAGNOSTIC (GO BUTTON) ---
  const handleExecuteGo = async () => {
    if (!detectedType.value) return alert("Please sync a database first.")
    const isProduction = detectedType.value === "Production System"
    const table = getTableName()
    const targetCol = isProduction ? "DRAmount" : "MISAmount"

    const res = await getIpc()?.invoke('debug-check-data', { table })
    if (!res) return

    alert(`📜 BACKEND SQL STATEMENT EXECUTED:\n\n"${res.executedSql}"`)

    if (res.error) return alert(`❌ Database Error: ${res.error}`)
    if (res.data.length === 0) return alert(`⚠️ Table "${table}" is EMPTY.`)

    const firstRow = res.data[0]
    alert(
      `✅ SYSTEM: ${detectedType.value}\n` +
      `📂 TABLE: ${table}\n` +
      `🔍 TARGET COL: ${targetCol}\n\n` +
      `📊 SAMPLE ROW PREVIEW:\n${JSON.stringify(firstRow, null, 2)}\n\n` +
      `💰 VALUE IN ${targetCol}: "${firstRow[targetCol]}"`
    )
  }

  // --- 2. FILTER BY DATE BUTTON ---
  const handleExecuteFiltered = async () => {
    if (!detectedType.value) return alert("Please sync a database first.")
    const table = getTableName()

    const res = await getIpc()?.invoke('check-data-by-date', {
      table,
      startDate: dateRange.value.start,
      endDate: dateRange.value.end
    })
    if (!res) return

    alert(`📜 FILTERED TEXT-COMPATIBLE SQL EXECUTED:\n\n"${res.executedSql}"`)

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

    const formattedRecordsVertical = res.data.map(row => {
      const formattedAmount = row.UniqueTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      return `${row.TransactionDate.trim()} - ${row.CleanNum} - ${formattedAmount}`
    }).join("\n")

    alert(
      `📊 DISTINCT TRANSACTION SUMMARY\n` +
      `----------------------------------------\n` +
      `🖥️ System Profile: ${detectedType.value}\n` +
      `📂 Query Target Table: ${table}\n` +
      `📅 Date Range Window: [${dateRange.value.start}] to [${dateRange.value.end}]\n` +
      `🔢 Unique Invoices Found: ${res.data.length} records\n` +
      `💰 Net Aggregate Financial Value: Php ${totalSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\n` +
      `📋 Matched Distinct Document Totals:\n${formattedRecordsVertical}`
    )
  }

  // --- 3. CHECK BLOCK DATA BUTTON ---
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

    alert(`📜 FILTERED BLOCK LINE-ITEM SQL EXECUTED:\n\n"${res.executedSql}"`)

    if (res.error) return alert(`❌ Database Error: ${res.error}`)
    if (!res.data || res.data.length === 0) {
      matchedRecords.value = []
      return alert(`⚠️ No blocks found between ${dateRange.value.start} and ${dateRange.value.end} for table "${table}".`)
    }

    const grandBlockSum = res.data.reduce((accumulator, row) => accumulator + (row.BlockSumTotal || 0), 0)
    totalAmount.value = grandBlockSum

    activeViewType.value = 'blocks'
    matchedRecords.value = res.data.map(row => ({
      date: row.TransactionDate ? row.TransactionDate.trim() : 'N/A',
      identifier: row.CleanBlock,
      value: row.BlockSumTotal,
      extraInfo: `${row.RowCount} items`
    }))

    const formattedBlocksVertical = res.data.map(row => {
      const formattedAmount = row.BlockSumTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      return `${row.TransactionDate.trim()} - ${row.CleanBlock} - Php ${formattedAmount} (${row.RowCount} items)`
    }).join("\n")

    alert(
      `📊 DISTINCT BLOCK STRUCTURAL SUMMARY\n` +
      `----------------------------------------\n` +
      `🖥️ System Profile: ${detectedType.value}\n` +
      `📂 Query Target Table: ${table}\n` +
      `📅 Date Range Window: [${dateRange.value.start}] to [${dateRange.value.end}]\n` +
      `🔢 Total Unique Log Blocks Found: ${res.data.length}\n` +
      `💰 Overall Blocks Grand Total: Php ${grandBlockSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\n` +
      `📋 Matched Block Manifest (Date - ${blockCol} - ${amountCol}):\n${formattedBlocksVertical}`
    )
  }

  const clearAnalysisData = () => {
    totalAmount.value = 0
    matchedRecords.value = []
    activeViewType.value = ''
  }

  return {
    dateRange, totalAmount, matchedRecords, activeViewType,
    handleExecuteGo, handleExecuteFiltered, handleExecuteBlocks, clearAnalysisData
  }
}