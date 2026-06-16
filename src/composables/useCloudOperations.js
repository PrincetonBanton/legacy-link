import { ref } from 'vue'
import { useDebugLogger } from './useDebugLogger'
import { useCloudSync } from './useCloudSync'

export function useCloudOperations(detectedType, dateRange, getTableName, getIpc) {
  const ENABLE_DEBUG_ALERTS = false

  const cloudRecords = ref([])
  const { logLocalDataSnapshot, logRawPreview } = useDebugLogger()
  const { uploadHistoricalData, isSyncing, syncError } = useCloudSync()

  // --- INTERNAL UTILITY TO EXTRACT SPECIFIC LOCAL DATABASE SNAPSHOTS ---
  const extractLocalDataBlock = async (tableName) => {
    const ipc = getIpc()
    if (!ipc) return []

    try {
      const res = await ipc.invoke('check-raw-cloud-data', {
        table: tableName,
        startDate: dateRange.value.start,
        endDate: dateRange.value.end
      })

      if (!res || res.error || !res.data || res.data.length === 0) return []
      return res.data
    } catch (err) {
      console.error(`Snapshot extraction failure on table [${tableName}]:`, err)
      return []
    }
  }

  // --- DUAL-PIPELINE PUBLISHING EXTRACTOR CONTROLLER ---
  const handlePublishToCloud = async () => {
    if (!detectedType.value) return null

    const primaryTable = getTableName()
    const isProduction = detectedType.value === "Production System"
    const targetCol = isProduction ? "DRAmount" : "MISAmount"

    try {
      const extractionPayload = {
        transactionalDetails: [],
        currentInventory: []
      }

      // 1. Always extract transaction records (DRDetails or MISDetails)
      extractionPayload.transactionalDetails = await extractLocalDataBlock(primaryTable)

      // 2. If Material Management profile is active, pull from local inventory table
      if (!isProduction) {
        extractionPayload.currentInventory = await extractLocalDataBlock('Inventory')
      }

      // 🚨 DELEGATED: Debugger alerts handled by the logger utility now
      //logLocalDataSnapshot(extractionPayload, detectedType.value, primaryTable)

      const detailsCount = extractionPayload.transactionalDetails.length
      const inventoryCount = extractionPayload.currentInventory.length

      // Empty state fallbacks check
      if (detailsCount === 0 && inventoryCount === 0) {
        cloudRecords.value = []
        return null
      }

      cloudRecords.value = extractionPayload.transactionalDetails

      if (ENABLE_DEBUG_ALERTS) {
        logRawPreview({ data: extractionPayload.transactionalDetails }, detectedType.value, primaryTable, targetCol, dateRange.value)
      }

      return extractionPayload
    } catch (err) {
      console.error('Unified extraction pipeline fault:', err)
      return null
    }
  }

  // --- CENTRALIZED PORTAL PUBLISH ACTION CONTROLLER ---
  const handlePublishToCloudPortal = async (locationsArray) => {
    if (!detectedType.value) {
      alert("Please load a database profile first.")
      return
    }

    const multiPayload = await handlePublishToCloud() 
    if (!multiPayload) {
      alert(`⚠️ No records extracted in the sync window [${dateRange.value.start}] to [${dateRange.value.end}]. Sync skipped.`)
      return
    }

    const branchName = locationsArray?.[0] || 'Unknown Branch'

    try {
      await uploadHistoricalData(branchName, multiPayload, detectedType.value)
    } catch (err) {
      console.error("Portal sync execution failed:", err)
    }
  }

  const clearCloudRecords = () => {
    cloudRecords.value = []
  }

  return {
    cloudRecords, isSyncing, syncError,
    handlePublishToCloud, handlePublishToCloudPortal, clearCloudRecords
  }
}