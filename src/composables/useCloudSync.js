import { createClient } from '@supabase/supabase-js'
import { ref } from 'vue'

const SUPABASE_URL = 'https://iggdqakajrauoehfvegx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnZ2RxYWthanJhdW9laGZ2ZWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTU2MTAsImV4cCI6MjA5NTU3MTYxMH0.urHZtvPmADAuUpTkaBqqgQUkUG4uw2D1G0GFZ10pEac'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export function useCloudSync() {
  const isSyncing = ref(false)
  const syncError = ref(null)

  const uploadHistoricalData = async (areaName, multiPayload, detectedType) => {
    if (!multiPayload) return
    
    isSyncing.value = true
    syncError.value = null

    const targetDetails = multiPayload.transactionalDetails || []
    const targetInventory = multiPayload.currentInventory || []
    
    if (targetDetails.length === 0 && targetInventory.length === 0) {
      isSyncing.value = false
      return
    }

    const isProd = detectedType === "Production System"
    const areaClean = areaName.trim().toUpperCase()
    const invoicePattern = isProd ? 'DR' : 'MIS'

    try {
      // =========================================================================
      // TRANSACTIONS OVERWRITE SCAN & USER CONFIRMATION
      // =========================================================================
      if (targetDetails.length > 0) {
        console.log(`Scanning cloud table for pre-existing ${detectedType} logs in ${areaClean}...`)
        const { data: cloudScan, error: scanError } = await supabase
          .from('delivery_details')
          .select('transaction_date')
          .eq('area_name', areaClean)
          .ilike('invoice_num', `%${invoicePattern}%`)

        if (scanError) throw scanError

        if (cloudScan && cloudScan.length > 0) {
          const dates = cloudScan
            .map(row => row.transaction_date ? row.transaction_date.split('T')[0] : null)
            .filter(Boolean)
            .sort()

          const totalRows = cloudScan.length
          const minDate = dates[0] || 'N/A'
          const maxDate = dates[dates.length - 1] || 'N/A'

          const confirmOverwrite = window.confirm(
            `Conflict Detected on Cloud Portal!\n\n` +
            `Existing "${detectedType}" transaction history already exists for area "${areaClean}".\n` +
            `• Total Entries: ${totalRows} rows\n` +
            `• Date Range: ${minDate} to ${maxDate}\n\n` +
            `Do you want to DELETE this existing cloud dataset and replace it with your fresh local files?`
          )

          if (!confirmOverwrite) {
            console.log('Publish workflow aborted by user choice.')
            isSyncing.value = false
            return
          }

          console.log(`Purging old data bracket from delivery_details...`)
          const { error: deleteError } = await supabase
            .from('delivery_details')
            .delete()
            .eq('area_name', areaClean)
            .ilike('invoice_num', `%${invoicePattern}%`)

          if (deleteError) throw deleteError
        }
      }

      // =========================================================================
      // PAYLOAD PREPARATION & PARALLEL INJECTION
      // =========================================================================
      const syncPromises = []

      // Track A: Map and Push Sales & Deliveries Receipts
      if (targetDetails.length > 0) {
        const detailsPayload = targetDetails.map((row, i) => {
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

        console.log(`Queueing delivery_details insertion engine for ${detailsPayload.length} records...`)
        syncPromises.push(
          supabase
            .from('delivery_details')
            .insert(detailsPayload)
            .then(({ error }) => { if (error) throw error })
        )
      }

      // Track B: Map and Upsert Current Warehouse Balance Counts (Case-Insensitive Unique Lines)
      if (targetInventory.length > 0 && !isProd) {
        
        const inventoryPayload = targetInventory.map((row) => {
          const itemCodeClean = String(row.ItemCode || 'UNKNOWN').trim()
          
          // Strips currency symbols/formatting out of Short Text fields before parsing
          const rawCostString = String(row.Cost || '0').replace(/[^\d.-]/g, '')
          const rawStockString = String(row.AvailStock || '0').replace(/[^\d.-]/g, '')

          const cleanCost = parseFloat(rawCostString) || 0
          const cleanStock = parseFloat(rawStockString) || 0
          const cleanRemarks = row.Remarks ? String(row.Remarks).trim() : '';

          // 🛠️ FIX: Safely grab the ID no matter how the Access driver cases the property key
          const rawId = row.InvID || row.Invid || row.invid;
          
          // If no raw ID is found, fallback to an item-code hash to prevent NULL crashes
          const validId = rawId !== undefined && rawId !== null 
            ? String(rawId).trim() 
            : `HASH-${itemCodeClean}-${cleanCost}-${cleanStock}`;

          // Create the guaranteed unique primary key string
          const uniqueLineId = `${areaClean}-${validId}`;

          return {
            master_id: uniqueLineId, // 🔑 Bulletproof unique primary key string
            area_name: areaClean,
            item_code: itemCodeClean,
            item_name: String(row.ItemName || 'Unnamed Item').trim(),
            item_group: String(row.ItemGroup || 'Unassigned').trim(),
            unit_of_measure: String(row.Unit || 'pcs').trim(), 
            unit_cost: cleanCost,      
            available_stock: cleanStock, 
            remarks: cleanRemarks,
            updated_at: new Date().toISOString()
          }
        }).filter(item => item.item_code !== 'UNKNOWN')

        console.log(`Queueing material_inventory upsert engine for ${inventoryPayload.length} unique lines...`)
        syncPromises.push(
          supabase
            .from('material_inventory')
            // Upsert targets our singular, guaranteed string master_id column
            .upsert(inventoryPayload, { onConflict: 'master_id' })
            .then(({ error }) => { if (error) throw error })
        )
      }

      await Promise.all(syncPromises)
      console.log(`🌐 [${areaClean}] Cloud synchronization completed successfully.`)
      
      let successMessage = `🎉 Successfully synchronized data for ${areaClean}!\n`
      if (targetDetails.length > 0) successMessage += `• ${targetDetails.length} transactions processed.\n`
      if (targetInventory.length > 0 && !isProd) successMessage += `• ${targetInventory.length} current inventory items upserted.`
      
      alert(successMessage)

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