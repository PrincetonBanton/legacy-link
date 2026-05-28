export function useDebugLogger() {
  const getIpc = () => window.require ? window.require('electron').ipcRenderer : null

  // Diagnostic Preview (Old GO Button Logic)
  const logRawPreview = (detectedType, table, targetCol, firstRow) => {
    alert(
      `✅ SYSTEM: ${detectedType}\n` +
      `📂 TABLE: ${table}\n` +
      `🔍 TARGET COL: ${targetCol}\n\n` +
      `📊 SAMPLE ROW PREVIEW:\n${JSON.stringify(firstRow, null, 2)}\n\n` +
      `💰 VALUE IN ${targetCol}: "${firstRow[targetCol]}"`
    )
  }

  // Invoice Filter Alert
  const logFilteredInvoices = (res, detectedType, table, dateRange, totalSum) => {
    alert(`📜 FILTERED TEXT-COMPATIBLE SQL EXECUTED:\n\n"${res.executedSql}"`)
    
    if (!res.data || res.data.length === 0) return

    const formattedRecordsVertical = res.data.map(row => {
      const formattedAmount = row.UniqueTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      return `${row.TransactionDate.trim()} - ${row.CleanNum} - ${formattedAmount}`
    }).join("\n")

    alert(
      `📊 DISTINCT TRANSACTION SUMMARY\n` +
      `----------------------------------------\n` +
      `🖥️ System Profile: ${detectedType}\n` +
      `📂 Query Target Table: ${table}\n` +
      `📅 Date Range Window: [${dateRange.start}] to [${dateRange.end}]\n` +
      `🔢 Unique Invoices Found: ${res.data.length} records\n` +
      `💰 Net Aggregate Financial Value: Php ${totalSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\n` +
      `📋 Matched Distinct Document Totals:\n${formattedRecordsVertical}`
    )
  }

  // Block Distribution Alert
  const logBlockSummary = (res, detectedType, table, dateRange, grandBlockSum, blockCol, amountCol) => {
    alert(`📜 FILTERED BLOCK LINE-ITEM SQL EXECUTED:\n\n"${res.executedSql}"`)
    
    if (!res.data || res.data.length === 0) return

    const formattedBlocksVertical = res.data.map(row => {
      const formattedAmount = row.BlockSumTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      return `${row.TransactionDate.trim()} - ${row.CleanBlock} - Php ${formattedAmount} (${row.RowCount} items)`
    }).join("\n")

    alert(
      `📊 DISTINCT BLOCK STRUCTURAL SUMMARY\n` +
      `----------------------------------------\n` +
      `🖥️ System Profile: ${detectedType}\n` +
      `📂 Query Target Table: ${table}\n` +
      `📅 Date Range Window: [${dateRange.start}] to [${dateRange.end}]\n` +
      `🔢 Total Unique Log Blocks Found: ${res.data.length}\n` +
      `💰 Overall Blocks Grand Total: Php ${grandBlockSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\n` +
      `📋 Matched Block Manifest (Date - ${blockCol} - ${amountCol}):\n${formattedBlocksVertical}`
    )
  }

  return {
    logRawPreview,
    logFilteredInvoices,
    logBlockSummary
  }
}