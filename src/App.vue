<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="logo-area">
        <img src="/sodaco.png" style="width: 45px;" />
      </div>
      <nav class="nav-stack">
        <div class="nav-item active">O-- Dashboard</div>
        <div class="nav-item">O-- Inventory</div>
        <div class="nav-item">O-- Analytics</div>
      </nav>

      <footer class="sidebar-map-footer">
        <DashboardMap :locations="locations" />
      </footer>
    </aside>

    <main class="main-canvas">

      <header class="top-header-banner">
        <div class="title-context">
          <h2 v-if="detectedType || locations.length" class="main-title">
            <span>{{ locations.join(', ') }}</span>
            <small class="title-type-label" v-if="detectedType"> - {{ detectedType }}</small>
          </h2>
          <h2 v-else class="main-title empty-title">Area Location - Detected Type</h2>
        </div>

        <div class="header-control-stack">
          <div class="db-connection-manager" :class="{ 'connected': selectedPath }">
            <button v-if="!selectedPath" @click="handleMdbBrowse" class="btn-header-browse">📂 BROWSE DATABASE</button>
            <template v-else>
              <div class="db-status-pill">
                <span class="status-dot"></span>
                <span class="filename-text" :title="fileInfo.name">{{ fileInfo.name }}</span>
              </div>
              <button v-if="!detectedType" @click="handleMdbSync" :disabled="isMigrating" class="btn-header-sync">
                {{ isMigrating ? '⚡ Syncing...' : 'SYNC DATABASE' }}
              </button>
              <button @click.stop="resetSelection" class="btn-header-disconnect">DISCONNECT</button>
            </template>
          </div>
        </div>

      </header>

      <section :class="['workspace', { 'workspace-empty-state': !detectedType }]">
        
        <template v-if="detectedType">

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
              
              <button 
                class="btn-green" 
                style="background-color: #145214; border-color: #0e3a0e;" 
                @click="handleLoadDashboardData"
              >
                GO
              </button>

              <button 
                v-if="matchedRecords && matchedRecords.length > 0"
                class="btn-cloud-publish" 
                @click="handlePublishToCloud"
                :disabled="isSyncing"
              >
                {{ isSyncing ? '☁ Publishing...' : '☁ PUBLISH TO PORTAL' }}
              </button>
              
              <div class="right-aligned-metrics">
                <DashboardMetrics 
                  :date-range="dateRange"
                  :total-amount="totalAmount"
                  :main-table-info="mainTableInfo"
                  :matched-records-length="matchedRecords?.length || 0"
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
        </template>

        <template v-else>
          <DashboardSplash :is-migrating="isMigrating" :selected-path="selectedPath" />
        </template>

      </section>
    </main>
  </div>
</template>

<script setup>
  import { computed, watch } from 'vue'
  import { useMigration } from './composables/useMigration'
  import { useAnalysis } from './composables/useAnalysis'
  import { useCloudSync } from './composables/useCloudSync'
  import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js'
  
  import DashboardLineGraph from './components/DashboardLineGraph.vue'
  import DashboardBarGraph from './components/DashboardBarGraph.vue'
  import DashboardMetrics from './components/DashboardMetrics.vue'
  import DashboardTop10 from './components/DashboardTop10.vue'
  import DashboardMap from './components/DashboardMap.vue'
  import DashboardSplash from './components/DashboardSplash.vue'
  
  ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement)

  const { 
    selectedPath, isMigrating, fileInfo, detectedType, mainTableInfo, 
    locations, handleMdbBrowse, handleMdbSync, resetSelection 
  } = useMigration()

  const {
    dateRange, totalAmount, matchedRecords, blockRecords, activeViewType,
    handleExecuteFiltered, handleExecuteBlocks, clearAnalysisData
  } = useAnalysis(detectedType)

  const { uploadHistoricalData, isSyncing } = useCloudSync()

  const setDefaultCurrentMonth = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    dateRange.start = `${year}-${month}-01`
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()
    dateRange.end = `${year}-${month}-${lastDay}`
  }
  setDefaultCurrentMonth()

  // 🔄 Local Isolation Search Logic
  const handleLoadDashboardData = async () => {
    if (!detectedType.value) return
    console.log("⚙ Running private query check...")
    await handleExecuteFiltered()
    await handleExecuteBlocks()
    console.log(`📊 Analysis updated. ${matchedRecords.value?.length || 0} items structured inside sandbox UI.`)
  }

  // ☁ Explicit Cloud Deployment Triggers
  const handlePublishToCloud = async () => {
    const areaName = locations.value?.join(', ') || 'Unknown Branch'
    const recordsToUpload = matchedRecords.value || []

    if (recordsToUpload.length === 0) {
      alert("Cannot publish an empty dataset. Please load data first.")
      return
    }

    // 📝 Added detectedType.value to the parameters list here
    await uploadHistoricalData(areaName, recordsToUpload, dateRange, detectedType.value)
  }

  watch(isMigrating, (newIsMigrating, oldIsMigrating) => {
    if (oldIsMigrating && !newIsMigrating && selectedPath.value) {
      handleLoadDashboardData()
    }
  })

  watch(detectedType, (newProfile) => {
    if (!newProfile) {
      clearAnalysisData()
    } else {
      handleLoadDashboardData()
    }
  })

  const lineChartData = computed(() => {
    const rawList = matchedRecords.value || []
    const sortedList = [...rawList].sort((a, b) => new Date(a.date) - new Date(b.date))
    return {
      labels: sortedList.map(item => {
        if (!item.date || item.date === 'N/A') return 'N/A'
        return new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: '2-digit' })
      }),
      datasets: [{
        label: 'Invoices Released (Trend)',
        backgroundColor: 'rgba(16, 185, 129, 0.04)',
        borderColor: '#10b981',
        pointBackgroundColor: '#064e3b',
        borderWidth: 2,
        tension: 0.2, 
        data: sortedList.map(item => item.value)
      }]
    }
  })

  const barChartData = computed(() => {
    const dataSource = blockRecords?.value || []
    return {
      labels: dataSource.map(item => item.identifier),
      datasets: [{
        label: 'Volume per Block',
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        data: dataSource.map(item => item.value)
      }]
    }
  })

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: '#f3f4f6' }, ticks: { color: '#9ca3af', font: { size: 10, weight: '500' } } },
      x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 10, weight: '500' } } }
    }
  }
</script>

<style scoped>
/* --- CORE CANVAS & SIDEBAR TRACKING --- */
.app-layout { display: flex; height: 100vh; width: 100vw; background: #f4f6f9; color: #111827; font-family: -apple-system, sans-serif; overflow: hidden; }
.main-canvas { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.sidebar { width: 240px; background: #fff; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; padding: 1.5rem 1rem 2.5rem 1rem; box-sizing: border-box; position: relative; }
.logo-area { display: flex; align-items: center; gap: 12px; margin-bottom: 2.5rem; font-weight: 800; font-size: 1.1rem; letter-spacing: -0.5px; }
.nav-stack { flex: 1; display: flex; flex-direction: column; gap: 4px; margin-bottom: 190px; }
.nav-item { padding: 12px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; color: #4b5563; font-size: 0.9rem; transition: 0.2s; }
.nav-item:hover { background: #f3f4f6; color: #1f2937; }
.nav-item.active { background: #f3f4f6; color: #111827; font-weight: 700; }

/* --- COMPACT MAP FOOTER WITH BOUNDARY ESCAPE SAFEGUARDS --- */
.sidebar-map-footer { position: absolute; bottom: 2rem; left: 1rem; right: 1rem; height: auto; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; background: #fafafa; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }

/* --- HEADER BANNER & SYSTEM STATS --- */
.top-header-banner { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 12px 2.5rem; border-bottom: 1px solid #e5e7eb; min-height: 80px; box-sizing: border-box; }
.title-context .main-title { font-size: 1.3rem; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
.title-context .empty-title { color: #6b7280; font-weight: 600; }
.title-type-label { font-size: 0.95rem; color: #6b7280; font-weight: 500; }
.header-control-stack { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.db-connection-manager { display: flex; align-items: center; gap: 10px; background: #f3f4f6; padding: 4px; border-radius: 30px; }
.db-status-pill { display: flex; align-items: center; gap: 8px; background: #fff; padding: 6px 14px; border-radius: 20px; border: 1px solid #e5e7eb; font-size: 0.8rem; font-weight: 700; color: #065f46; max-width: 180px; }
.status-dot { width: 7px; height: 7px; background: #10b981; border-radius: 50%; box-shadow: 0 0 0 3px rgba(16,185,129,0.15); }
.filename-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* --- BUTTON ACCENTS --- */
.btn-header-browse, .btn-header-sync, .btn-header-disconnect { border: none; padding: 8px 14px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; cursor: pointer; color: #fff; }
.btn-header-browse { background: #064e3b; padding: 8px 16px; }
.btn-header-browse:hover { background: #065f46; }
.btn-header-sync { background: #2563eb; }
.btn-header-sync:hover { background: #1d4ed8; }
.btn-header-disconnect { background: #ef4444; }
.btn-header-disconnect:hover { background: #dc2626; }

/* --- WORKSPACE CORE CONTROLS --- */
.workspace { padding: 1rem 1.5rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 20px; box-sizing: border-box; }
.workspace-empty-state { background-color: #f4f6f9; justify-content: center; }
.toolbar { background: #fff; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid #e5e7eb; display: flex; align-items: center; box-sizing: border-box; width: 100%; }
.date-picker-group { display: flex; gap: 14px; align-items: flex-end; width: 100%; }
.input-field { display: flex; flex-direction: column; gap: 4px; }
.input-field label { font-size: 0.65rem; font-weight: 700; color: #6b7280; text-transform: uppercase; }
.input-field input { border: 1px solid #d1d5db; padding: 6px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: #374151; height: 32px; box-sizing: border-box; }
.btn-green { background: #064e3b; color: #fff; border: none; padding: 0 30px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem; height: 32px; display: inline-flex; align-items: center; }
.btn-green:hover { opacity: 0.9; }

/* --- BRAND NEW CLOUD PUBLISH BUTTON COMPONENT STYLING --- */
.btn-cloud-publish { background: #2563eb; color: #fff; border: 1px solid #1d4ed8; padding: 0 20px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 0.8rem; height: 32px; display: inline-flex; align-items: center; box-shadow: 0 2px 4px rgba(37,99,235,0.2); transition: 0.2s; }
.btn-cloud-publish:hover { background: #1d4ed8; }
.btn-cloud-publish:disabled { background-color: #94a3b8; border-color: #cbd5e1; cursor: not-allowed; box-shadow: none; }

.right-aligned-metrics { margin-left: auto; display: flex; align-items: center; }

/* --- WORKSPACE GRID MATRIX --- */
.workspace-body-layout { display: flex; flex-direction: column; gap: 20px; width: 100%; }
.dashboard-columns-container { display: flex; gap: 20px; width: 100%; align-items: stretch; }
.left-charts-column { flex: 0 0 70%; display: flex; flex-direction: column; gap: 20px; min-width: 0; height: 660px; }
.right-metrics-column { flex: 0 0 30%; min-width: 0; display: flex; flex-direction: column; max-height: 660px; overflow: hidden; }

/* --- SPLASH SCREEN & LOADING OVERLAYS --- */
.spinner-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 350px; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; gap: 1rem; }
.sync-spinner { width: 45px; height: 45px; border: 4px solid #f3f4f6; border-top-color: #059669; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>