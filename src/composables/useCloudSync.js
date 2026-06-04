import { createClient } from '@supabase/supabase-js'
import { ref } from 'vue'

const SUPABASE_URL = 'https://iggdqakajrauoehfvegx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnZ2RxYWthanJhdW9laGZ2ZWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTU2MTAsImV4cCI6MjA5NTU3MTYxMH0.urHZtvPmADAuUpTkaBqqgQUkUG4uw2D1G0GFZ10pEac'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export function useCloudSync() {
  const isSyncing = ref(false)
  const syncError = ref(null)

  /**
   * Pushes a clean array of un-aggregated database rows directly to Supabase
   * @param {string} areaName - The name of the active branch/location (e.g., "B3-MALUNGON")
   * @param {Array} rawRecords - The raw cloudRecords array extracted via check-raw-cloud-data
   * @param {string} detectedType - Current database system identity ("Production System" or "Material Management")
   */
  const uploadHistoricalData = async (areaName, rawRecords, detectedType) => {
    if (!rawRecords || rawRecords.length === 0) return
    
    isSyncing.value = true
    syncError.value = null

    const isProd = detectedType === "Production System"
    const areaClean = areaName.trim().toUpperCase()
    const invoicePattern = isProd ? 'DR' : 'MIS'

    try {
      // === PHASE 1: SCAN THE SUPABASE TABLE FOR CONFLICTS ===
      console.log(`Scanning cloud table for pre-existing ${detectedType} logs in ${areaClean}...`)
      
      const { data: cloudScan, error: scanError } = await supabase
        .from('delivery_details')
        .select('transaction_date')
        .eq('area_name', areaClean)
        .ilike('invoice_num', `%${invoicePattern}%`)

      if (scanError) throw scanError

      // === PHASE 2: EVALUATE TIMELINES & PROMPT THE USER ===
      if (cloudScan && cloudScan.length > 0) {
        // Extract and sort unique dates to find the absolute timeline boundaries
        const dates = cloudScan
          .map(row => row.transaction_date ? row.transaction_date.split('T')[0] : null)
          .filter(Boolean)
          .sort()

        const totalRows = cloudScan.length
        const minDate = dates[0] || 'N/A'
        const maxDate = dates[dates.length - 1] || 'N/A'

        // Display browser-native warning dialog tracking the exact balance scope
        const confirmOverwrite = window.confirm(
          `Conflict Detected on Cloud Portal!\n\n` +
          `Existing "${detectedType}" data already exists for area "${areaClean}".\n` +
          `• Total Entries: ${totalRows} rows\n` +
          `• Date Range: ${minDate} to ${maxDate}\n\n` +
          `Do you want to DELETE this existing cloud dataset and replace it with your fresh local files?`
        )

        // Exit cleanly if the user presses cancel
        if (!confirmOverwrite) {
          console.log('Publish workflow aborted by user choice.')
          isSyncing.value = false
          return
        }

        // === PHASE 3: PURGE PRE-EXISTING CLOUD SEGMENT ===
        console.log(`Purging old data bracket from cloud table...`)
        const { error: deleteError } = await supabase
          .from('delivery_details')
          .delete()
          .eq('area_name', areaClean)
          .ilike('invoice_num', `%${invoicePattern}%`)

        if (deleteError) throw deleteError
      }

      // === PHASE 4: PREPARE FRESH INJECTION PAYLOAD ===
      const payload = rawRecords.map((row, i) => {
        const cleanAmount = parseFloat(String(isProd ? row.DRAmount : row.MISAmount).replace(/,/g, '')) || 0
        const cleanQty = parseFloat(String(isProd ? row.DRQty : row.MISQty).replace(/,/g, '')) || 0
        const cleanWeight = parseFloat(String(isProd ? (row.DRWeight || row.DRTotalWeight) : (row.MISWeight || 0)).replace(/,/g, '')) || 0
        const lineItemModifier = row.DRItemNo || row.MISItemNo || `L${i}`

        return {
          legacy_id: `${isProd ? row.DRRef : row.MISId}-${lineItemModifier}`,
          area_name: areaClean,
          system_type: isProd ? "Production System" : "Material Management",
          transaction_date: isProd ? row.DRDate : row.MISDate,
          invoice_num: isProd ? row.DRNum?.trim() : row.MISNum?.trim(),
          customer_name: isProd ? row.DRCustomer?.trim() : row.MISGroup?.trim(),
          destination: isProd ? row.DRDestination?.trim() : row.MISGroup?.trim(),
          block_name: isProd ? row.DRBlock?.trim() : row.MISBlock?.trim(),
          product_name: isProd ? row.DRProduct?.trim() : row.MISItem?.trim(),
          quantity: cleanQty,
          weight: cleanWeight,
          amount: cleanAmount
        }
      })

      console.log(`Initializing cloud injection engine for ${payload.length} items...`)

      // === PHASE 5: FRESH BATCH INSERTION ===
      const { data, error: insertError } = await supabase
        .from('delivery_details')
        .insert(payload)
        .select('legacy_id')

      if (insertError) throw insertError
      
      const syncedCount = data?.length || payload.length
      console.log(`🌐 [${areaClean}] Sync Complete: ${syncedCount} rows successfully written to portal template.`)
      alert(`🎉 Successfully published ${syncedCount} itemized records to the Executive Portal!`)

    } catch (err) {
      console.error('Cloud Sync Failed:', err)
      syncError.value = err.message
      alert(`❌ Cloud Sync Error: ${err.message}`)
    } finally {
      isSyncing.value = false
    }
  }

  return { 
    uploadHistoricalData, 
    isSyncing, 
    syncError 
  }
}