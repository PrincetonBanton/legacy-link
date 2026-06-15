<template>
  <div class="dashboard-view-wrapper">
    <div class="toolbar">
      <div class="date-picker-group">
        <div class="input-field">
          <label>Start Date</label>
          <input type="date" v-model="dateRange.start" />
        </div>
        <div class="input-field">
          <label>End Date</label>
          <input type="date" v-model="dateRange.end" />
        </div>
        
        <button class="btn-green" @click="handleLoadDashboardData">GO</button>
        <button v-if="invoiceRecords && invoiceRecords.length > 0" 
          class="btn-cloud-publish" @click="handlePublishToCloudPortal(locations)" :disabled="isSyncing">
          {{ isSyncing ? 'Publishing...' : 'PUSH TO CLOUD' }}
        </button>
      </div>
      
      <div class="right-aligned-metrics">
        <DashboardMetrics 
          :date-range="dateRange"
          :total-amount="totalAmount"
          :main-table-info="mainTableInfo"
          :matched-records-length="invoiceRecords?.length || 0"
        />
      </div>
    </div>

    <div v-if="isMigrating" class="spinner-overlay">
      <div class="sync-spinner"></div>
      <h3>Syncing database schema, please wait...</h3>
    </div>

    <div v-else class="workspace-body-layout">
      <div class="dashboard-columns-container">
        <div class="left-charts-column">
            <DashboardLineGraph :chart-data="lineChartData" :options="chartOptions" />
            <DashboardBarGraph :chart-data="barChartData" :options="chartOptions" />
        </div>
        
        <div class="right-metrics-column">
          <DashboardTop10 
            :matched-records="blockRecords" 
            :active-view-type="activeViewType" 
            :main-table-info="mainTableInfo" 
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { toRefs, watch, onMounted } from 'vue'
  
  import { useAnalysis } from '../composables/useAnalysis'
  import { useCharts } from '../composables/useCharts' 
  import { useCloudOperations } from '../composables/useCloudOperations'

  import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js'
  
  import DashboardLineGraph from '../components/DashboardLineGraph.vue'
  import DashboardBarGraph from '../components/DashboardBarGraph.vue'
  import DashboardMetrics from '../components/DashboardMetrics.vue'
  import DashboardTop10 from '../components/DashboardTop10.vue'
  
  ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement)

  const props = defineProps({
    detectedType: String,
    locations: Array,
    mainTableInfo: Object,
    isMigrating: Boolean
  })

  const { detectedType, isMigrating } = toRefs(props)

  const {
    dateRange, totalAmount, invoiceRecords, blockRecords, activeViewType,
    getTableName, getIpc, handleExecuteInvoices, handleExecuteBlocks, clearAnalysisData
  } = useAnalysis(detectedType)

  const {
    isSyncing, handlePublishToCloud, handlePublishToCloudPortal
  } = useCloudOperations(detectedType, dateRange, getTableName, getIpc)

  const { lineChartData, barChartData, chartOptions } = useCharts(invoiceRecords, blockRecords)

  const handleLoadDashboardData = async () => {
    if (!props.detectedType) return
    try { 
      await handleExecuteInvoices() 
      await handleExecuteBlocks() 
      await handlePublishToCloud() 
    } catch (e) { 
      console.error('Dashboard view data collection routine error:', e) 
    }
  }

  watch(() => props.detectedType, async (newProfile) => {
    if (!newProfile) {
      clearAnalysisData()
    } else {
      await handleLoadDashboardData()
    }
  }, { immediate: true })

  watch(() => props.isMigrating, async (newIsMigrating, oldIsMigrating) => {
    if (oldIsMigrating && !newIsMigrating && props.detectedType) {
      await handleLoadDashboardData()
    }
  })

  onMounted(async () => {
    if (props.detectedType && !props.isMigrating) {
      await handleLoadDashboardData()
    }
  })
</script>

<style scoped>
.dashboard-view-wrapper { display: flex; flex-direction: column; gap: 20px; width: 100%; height: 100%; box-sizing: border-box; padding: 1rem 1.5rem; }

.toolbar { display: flex; align-items: stretch; gap: 20px; box-sizing: border-box; width: 100%; flex-shrink: 0; background: transparent; padding: 0; }
.date-picker-group { flex: 1; display: flex; gap: 14px; align-items: flex-end; background: #0f151f; border-radius: 12px; padding: 1rem 1.25rem; box-sizing: border-box; }
.right-aligned-metrics { flex: 1; display: flex; align-items: center; color: #f8fafc; }
.right-aligned-metrics :deep(.consolidated-metrics-horizontal) { width: 100%; }

.input-field { display: flex; flex-direction: column; gap: 4px; }
.input-field label { font-size: 0.65rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
.input-field input { border: 1px solid #475569; padding: 6px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: #f8fafc; background: #0f172a; height: 32px; box-sizing: border-box; color-scheme: dark; }
.input-field input:focus { border-color: #38bdf8; outline: none; }

/* 🛠️ MODIFIED: Standardized action button widths with flex centering */
.btn-green, .btn-cloud-publish { height: 32px; width: 150px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; cursor: pointer; transition: 0.2s; font-size: 0.75rem; text-transform: uppercase; box-sizing: border-box; }
.btn-green { background: #059669; color: #fff; border: none; font-weight: 700; letter-spacing: 0.02em; }
.btn-green:hover { background: #10b981; }
.btn-cloud-publish { background: #2563eb; color: #fff; border: 1px solid #1d4ed8; font-weight: 700; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.btn-cloud-publish:hover { background: #3b82f6; }
.btn-cloud-publish:disabled { background-color: #475569; border-color: #334155; color: #94a3b8; cursor: not-allowed; box-shadow: none; }

.workspace-body-layout, .dashboard-columns-container { display: flex; gap: 20px; width: 100%; flex: 1; min-height: 0; }
.workspace-body-layout { flex-direction: column; }
.dashboard-columns-container { align-items: stretch; }
.left-charts-column, .right-metrics-column { min-width: 0; display: flex; flex-direction: column; height: 100%; }
.left-charts-column { flex: 0 0 70%; gap: 20px; }
.right-metrics-column { flex: 0 0 30%; overflow: hidden; }
.spinner-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; background: #1e293b; border-radius: 12px; border: 1px solid #334155; gap: 1rem; }
.sync-spinner { width: 45px; height: 45px; border: 4px solid #334155; border-top-color: #34d399; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>