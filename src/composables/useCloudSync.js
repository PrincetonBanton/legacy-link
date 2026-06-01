import { createClient } from '@supabase/supabase-js'
import { ref } from 'vue'

const SUPABASE_URL = 'https://iggdqakajrauoehfvegx.supabase.co'
// 🔐 Keep your public anon key available for the authenticated client initialization
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

    try {
      // 🛠️ 1. Map raw local SQLite/Access entries to match your precise PostgreSQL DDL columns
        // 🛠️ Inside your uploadHistoricalData method in useCloudSync.js:
        const payload = rawRecords.map((row, i) => {
          const cleanAmount = parseFloat(String(isProd ? row.DRAmount : row.MISAmount).replace(/,/g, '')) || 0
          const cleanQty = parseFloat(String(isProd ? row.DRQty : row.MISQty).replace(/,/g, '')) || 0
          const cleanWeight = parseFloat(String(isProd ? (row.DRWeight || row.DRTotalWeight) : (row.MISWeight || 0)).replace(/,/g, '')) || 0

          // Grab the legacy document item line number if it exists, otherwise fallback to the map index
          const lineItemModifier = row.DRItemNo || row.MISItemNo || `L${i}`;

          return {
            // 🔗 COMBINING ID WITH LINE MODIFIER GUARANTEES POSTGRES NEVER SEES DUPLICATE KEYS IN A BATCH
            legacy_id: `${isProd ? row.DRRef : row.MISId}-${lineItemModifier}`,
            area_name: areaName,
            transaction_date: isProd ? row.DRDate : row.MISDate,
            invoice_num: isProd ? row.DRNum?.trim() : row.MISNum?.trim(),
            customer_name: isProd ? row.DRCustomer.trim() : row.MISGroup?.trim(),
            destination: isProd ? row.DRDestination?.trim() : row.MISGroup?.trim(),
            block_name: isProd ? row.DRBlock?.trim() : row.MISBlock?.trim(),
            product_name: isProd ? row.DRProduct?.trim() : row.MISItem?.trim(),
            quantity: cleanQty,
            weight: cleanWeight,
            amount: cleanAmount
          }
        })

      console.log(`☁️ Initializing cloud upsert engine for ${payload.length} items...`)

      // 🚀 2. Safe, Idempotent Bulk Upsert Operation
      // If a row with the same (legacy_id + area_name) exists, it overrides it. Otherwise, it appends.
      // 🚀 Exact matching blueprint for your Supabase execution block
    const { data, error: upsertError } = await supabase
      .from('delivery_details')
      .upsert(payload, { onConflict: 'legacy_id,area_name' }) // 👈 Must match database columns perfectly
      .select('legacy_id')

      if (upsertError) throw upsertError
      
      const syncedCount = data?.length || payload.length
      console.log(`🌐 [${areaName}] Sync Complete: ${syncedCount} rows successfully merged into delivery_details table.`)
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