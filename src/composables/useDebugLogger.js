export function useDebugLogger() {

  // 🛠️ MOVED & ENCAPSULATED: Handles the local data engine snap alerts cleanly
  const logLocalDataSnapshot = (extractionPayload, detectedType, primaryTable) => {
    const detailsCount = extractionPayload.transactionalDetails?.length || 0
    const inventoryCount = extractionPayload.currentInventory?.length || 0
    const isProduction = detectedType === "Production System"
    
    let debugMessage = `🔍 [LOCAL ENGINE DATA SNAPSHOT]\n\n` +
      `• Active System Profile: ${detectedType}\n` +
      `• Local Target Table: ${primaryTable}\n\n` +
      `📊 Extraction Totals:\n` +
      `• Transaction Rows found: ${detailsCount} rows\n` +
      `• Inventory Master Rows found: ${inventoryCount} rows\n\n`

    if (!isProduction && inventoryCount > 0) {
      const previewItem = extractionPayload.currentInventory[0]
      debugMessage += `💡 First Inventory Row Preview:\n` +
        `• ItemCode: ${previewItem.ItemCode || 'MISSING'}\n` +
        `• ItemName: ${previewItem.ItemName || 'MISSING'}\n` +
        `• Stock Key Value: ${previewItem.AvailStock !== undefined ? previewItem.AvailStock : 'MISSING'}\n` +
        `• Cost Key Value: ${previewItem.Cost !== undefined ? previewItem.Cost : 'MISSING'}\n`
    } else if (!isProduction && inventoryCount === 0) {
      debugMessage += `⚠️ WARNING: Local 'Inventory' table returned 0 rows! Verify that your MS Access file has an 'Inventory' table filled with data.`
    }

    alert(debugMessage)
  }

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

  const logRawPreview = (res, detectedType, table, targetCol, dateRange) => {
    if (!res.data || res.data.length === 0) return
    const firstRow = res.data[0]
    alert(
      `🖥️ System Profile: ${detectedType}\n` +
      `📂 Query Target Table: ${table}\n` +
      `📅 Date Range Window: [${dateRange.start}] to [${dateRange.end}]\n` +
      `✅ SYSTEM SPEC: ${detectedType}\n` +
      `📂 SOURCE TABLE: ${table}\n` +
      `🔍 VALUE MAPPED: ${targetCol}\n` +
      `🔢 RAW ENTRIES COLLECTED: ${res.data.length} rows\n\n` +
      `📊 RAW ENTRY SNAPSHOT SCHEMA (FIRST ROW):\n${JSON.stringify(firstRow, null, 2)}\n\n` +
      `💰 TARGET FIELD INSTANCE VALUE: "${firstRow[targetCol]}"`
    )
  }

  return {
    logLocalDataSnapshot,
    logRawPreview,
    logFilteredInvoices,
    logBlockSummary
  }
}