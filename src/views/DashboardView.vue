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
        <button class="btn-green" @click="handleLoadDashboardData">GO </button>
        <button v-if="invoiceRecords && invoiceRecords.length > 0" 
          class="btn-cloud-publish" @click="handlePublishToCloudPortal(locations)" :disabled="isSyncing">
          {{ isSyncing ? '☁ Publishing...' : '☁ PUBLISH TO PORTAL' }}
        </button>
        
        <div class="right-aligned-metrics">
          <DashboardMetrics 
            :date-range="dateRange"
            :total-amount="totalAmount"
            :main-table-info="mainTableInfo"
            :matched-records-length="invoiceRecords?.length || 0"
          />
        </div>
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
  
  // COMPOSABLE LOGIC CONTROLLERS
  import { useAnalysis } from '../composables/useAnalysis'
  import { useCharts } from '../composables/useCharts' 
  import { useCloudOperations } from '../composables/useCloudOperations'

  // CHARTJS CORE INSTANCE REGISTRATION
  import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js'
  
  // DISPLAY COMPONENTS
  import DashboardLineGraph from '../components/DashboardLineGraph.vue'
  import DashboardBarGraph from '../components/DashboardBarGraph.vue'
  import DashboardMetrics from '../components/DashboardMetrics.vue'
  import DashboardTop10 from '../components/DashboardTop10.vue'
  
  ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement)

  // 1. Explicitly outline incoming property configurations
  const props = defineProps({
    detectedType: String,
    locations: Array,
    mainTableInfo: Object,
    isMigrating: Boolean
  })

  // 2. Keep reactivity completely linked using toRefs
  const { detectedType, isMigrating } = toRefs(props)

  // 3. Initialize data analysis engines with the reactive reference
  const {
    dateRange, totalAmount, invoiceRecords, blockRecords, activeViewType,
    getTableName, getIpc, handleExecuteInvoices, handleExecuteBlocks, clearAnalysisData
  } = useAnalysis(detectedType)

  // 4. Initialize operational synchronization helpers
  const {
    isSyncing, handlePublishToCloud, handlePublishToCloudPortal
  } = useCloudOperations(detectedType, dateRange, getTableName, getIpc)

  // 5. Initialize visual generation matrices
  const { lineChartData, barChartData, chartOptions } = useCharts(invoiceRecords, blockRecords)

  // 6. Data Execution Pipeline Runner
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

  // 7. BULLETPROOF WATCHERS: Force data execution whenever values change or complete migration
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

  // 8. Fallback Safety Catch for hot-reloads or fast mounts
  onMounted(async () => {
    if (props.detectedType && !props.isMigrating) {
      await handleLoadDashboardData()
    }
  })
</script>

<style scoped>
.dashboard-view-wrapper { display: flex; flex-direction: column; gap: 20px; width: 100%; height: 100%; box-sizing: border-box; padding: 1rem 1.5rem; }
.toolbar { padding: 1rem 1.25rem; display: flex; align-items: center; box-sizing: border-box; width: 100%; flex-shrink: 0; }
.date-picker-group { display: flex; gap: 14px; align-items: flex-end; width: 100%; }
.input-field { display: flex; flex-direction: column; gap: 4px; }
.input-field label { font-size: 0.65rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
.input-field input { border: 1px solid #475569; padding: 6px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: #f8fafc; background: #0f172a; height: 32px; box-sizing: border-box; color-scheme: dark; }
.input-field input:focus { border-color: #38bdf8; outline: none; }
.btn-green, .btn-cloud-publish { height: 32px; display: inline-flex; align-items: center; border-radius: 6px; cursor: pointer; transition: 0.2s; }
.btn-green { background: #059669; color: #fff; border: none; padding: 0 30px; font-weight: 600; }
.btn-green:hover { background: #10b981; }
.btn-cloud-publish { background: #2563eb; color: #fff; border: 1px solid #1d4ed8; padding: 0 20px; font-weight: 700; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.btn-cloud-publish:hover { background: #3b82f6; }
.btn-cloud-publish:disabled { background-color: #475569; border-color: #334155; color: #94a3b8; cursor: not-allowed; box-shadow: none; }
.right-aligned-metrics { margin-left: auto; display: flex; align-items: center; color: #f8fafc; }
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