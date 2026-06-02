import { ref } from 'vue'
import { useDebugLogger } from './useDebugLogger'
import { useCloudSync } from './useCloudSync'

export function useCloudOperations(detectedType, dateRange, getTableName, getIpc) {
  const ENABLE_DEBUG_ALERTS = true

  const cloudRecords = ref([])
  const { logRawPreview } = useDebugLogger()
  const { uploadHistoricalData, isSyncing, syncError } = useCloudSync()


  // --- PRODUCTION CLOUD PUBLISHING DATA EXTRACTION ---
  const handlePublishToCloud = async () => {
    if (!detectedType.value) return []

    const table = getTableName()
    const ipc = getIpc()
    if (!ipc) return []

    const isProduction = detectedType.value === "Production System"
    const targetCol = isProduction ? "DRAmount" : "MISAmount"

    try {
      const res = await ipc.invoke('check-raw-cloud-data', {
        table,
        startDate: dateRange.value.start,
        endDate: dateRange.value.end
      })

      if (!res || res.error) return []

      // Empty state fallback prompt inside the extraction data engine
      if (!res.data || res.data.length === 0) {
        cloudRecords.value = []
        return []
      }

      cloudRecords.value = res.data

      if (ENABLE_DEBUG_ALERTS) {
        logRawPreview(res, detectedType.value, table, targetCol, dateRange.value)
      }
      return cloudRecords.value

    } catch (err) {
      console.error('Snapshot extraction failure:', err)
      return []
    }
  }

  // --- CENTRALIZED PORTAL PUBLISH CONTROLLER ---
  const handlePublishToCloudPortal = async (locationsArray) => {
    if (!detectedType.value) {
      alert("Please load a database profile first.")
      return
    }

    const rawRows = await handlePublishToCloud() 
    if (!rawRows || rawRows.length === 0) {
      alert(`⚠️ No matching local records found in the window [${dateRange.value.start}] to [${dateRange.value.end}]. Cloud sync skipped.`)
      return
    }

    const branchName = locationsArray?.[0] || 'Unknown Branch'

    try {
      await uploadHistoricalData(branchName, rawRows, detectedType.value)
    } catch (err) {
      console.error("Portal sync pipeline rejected:", err)
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