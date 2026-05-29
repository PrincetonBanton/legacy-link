import { createClient } from '@supabase/supabase-js'
import { ref } from 'vue'

const SUPABASE_URL = 'https://iggdqakajrauoehfvegx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnZ2RxYWthanJhdW9laGZ2ZWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTU2MTAsImV4cCI6MjA5NTU3MTYxMH0.urHZtvPmADAuUpTkaBqqgQUkUG4uw2D1G0GFZ10pEac'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export function useCloudSync() {
  const isSyncing = ref(false)
  const syncError = ref(null)

  // 📝 Added detectedType to the arguments list here
  const uploadHistoricalData = async (areaName, matchedRecords, dateRange, detectedType) => {
    if (!matchedRecords?.length) return
    
    isSyncing.value = true
    syncError.value = null

    try {
      // 1. Wipe out old data entries matching this specific branch, date range, AND log type
      const { error: deleteError } = await supabase
        .from('transaction_logs')
        .delete()
        .eq('origin_area', areaName)
        .eq('log_type', detectedType) // 👈 Clears only the active module's records
        .gte('transaction_date', dateRange.start)
        .lte('transaction_date', dateRange.end)

      if (deleteError) throw deleteError

      // 2. Format local array into database schema columns structure
      const payload = matchedRecords.map((row, i) => {
        const cleanDate = row.date && row.date !== 'N/A' ? row.date.split('T')[0] : new Date().toISOString().split('T')[0]
        
        return {
          origin_area: areaName,
          log_type: detectedType, // 👈 Dynamically saves 'Production' or 'Material Management'
          transaction_date: cleanDate,
          identifier_num: String(row.identifier || row.CleanNum || row.drnum || `REF-${i + 1}`),
          block_name: String(row.extraInfo || row.block || row.CleanBlock || 'General Block'),
          financial_value: parseFloat(row.value || row.UniqueTotal || row.BlockSumTotal || 0)
        }
      })

      // 3. Batch insert fresh payload data points
      const { data, error: insertError } = await supabase
        .from('transaction_logs')
        .insert(payload)
        .select()

      if (insertError) throw insertError
      
      console.log(`🌐 [${areaName} - ${detectedType}] Sync Confirmed: ${data.length} rows updated.`)
      alert(`🎉 Successfully published ${data.length} records to the Executive Portal!`)

    } catch (err) {
      console.error('Cloud Sync Failed:', err)
      syncError.value = err.message
      alert(`❌ Cloud Sync Error: ${err.message}`)
    } finally {
      isSyncing.value = false
    }
  }

  return { uploadHistoricalData, isSyncing, syncError }
}