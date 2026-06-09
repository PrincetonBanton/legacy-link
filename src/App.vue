<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="logo-area">
       <img src="/sodaco.png" style="width: 65px; height: 65px; border-radius: 100%; object-fit: cover;" />
      </div>
      <nav class="nav-stack">
        <div class="nav-item active">DASHBOARD</div>
        <div class="nav-item">INVENTORY</div>
        <div class="nav-item">ANALYTICS</div>
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
            <small class="main-title" v-if="detectedType"> - {{ detectedType }}</small>
          </h2>
          <h2 v-else class="main-title">ADMIN DASHBOARD</h2>
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
        </template>

        <template v-else>
          <DashboardSplash :is-migrating="isMigrating" :selected-path="selectedPath" />
        </template>

      </section>
    </main>
  </div>
</template>

<script setup>
  import { watch } from 'vue'
  import { useMigration } from './composables/useMigration'
  import { useAnalysis } from './composables/useAnalysis'
  import { useCharts } from './composables/useCharts' 
  import { useCloudOperations } from './composables/useCloudOperations'
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
    dateRange, totalAmount, invoiceRecords, blockRecords, activeViewType,
    getTableName, getIpc, handleExecuteInvoices, handleExecuteBlocks, clearAnalysisData
  } = useAnalysis(detectedType)

  const {
    isSyncing, handlePublishToCloud, handlePublishToCloudPortal, clearCloudRecords
  } = useCloudOperations(detectedType, dateRange, getTableName, getIpc)

  const { lineChartData, barChartData, chartOptions } = useCharts(invoiceRecords, blockRecords)

  const handleLoadDashboardData = async () => {
    if (!detectedType.value) return
    try { await handleExecuteInvoices() } catch (e) { console.error(e) }
    try { await handleExecuteBlocks() } catch (e) { console.error(e) }
    try { await handlePublishToCloud() } catch (e) { console.error(e) }
  }

  watch(isMigrating, async (newIsMigrating, oldIsMigrating) => {
    if (oldIsMigrating && !newIsMigrating && selectedPath.value) {
      await handleLoadDashboardData()
    }
  })

  watch(detectedType, async (newProfile) => {
    if (!newProfile) {
      clearAnalysisData()
    } else {
      await handleLoadDashboardData()
    }
  })
</script>

<style scoped>
/* 🛠️ FIXED: Standardized safety layout configuration to clear any residual outer viewport borders */
:global(html), :global(body) { margin: 0; padding: 0; background-color: black; }
.app-layout { display: flex; height: 100vh; width: 100vw; color: #f8fafc; font-family: -apple-system, sans-serif; overflow: hidden; }
.main-canvas { flex: 1; display: flex; flex-direction: column; overflow: hidden;}
.sidebar { width: 240px; display: flex; flex-direction: column; padding: 1.5rem 1rem 2.5rem 1rem; box-sizing: border-box; position: relative; margin-left: -1px; padding-left: calc(1rem + 1px); }
.logo-area { display: flex; align-items: center; gap: 12px; margin-bottom: 2rem; font-weight: 800; font-size: 1.1rem; letter-spacing: -0.5px; }
.nav-stack { flex: 1; display: flex; flex-direction: column; gap: 4px; margin-bottom: 190px; }
.nav-item { padding: 12px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; color: #94a3b8; font-size: 0.9rem; transition: 0.2s; }
.nav-item:hover { background: #334155; color: #f8fafc; }
.nav-item.active { background: #334155; color: #38bdf8; font-weight: 700; }
.sidebar-map-footer { position: absolute; bottom: 2rem; left: 1rem; right: 1rem; height: auto; border-radius: 12px; overflow: hidden; border: 1px solid #334155; background: #1e293b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); }

/* --- HEADER MODULES --- */
.top-header-banner { display: flex; justify-content: space-between; align-items: center; padding: 12px 2.5rem; min-height: 80px; box-sizing: border-box; }
.title-context .main-title { margin: 0; font-size: 1.35rem; font-weight: 900; letter-spacing: -0.02em; color: #fff; }
.header-control-stack { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.db-connection-manager { display: flex; align-items: center; gap: 10px; padding: 4px; border-radius: 30px; border: 1px solid #334155; }
.db-status-pill { display: flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 20px; border: 1px solid #334155; font-size: 0.8rem; font-weight: 700; color: #34d399; max-width: 180px; }
.status-dot { width: 7px; height: 7px; background: #10b981; border-radius: 50%; box-shadow: 0 0 0 3px rgba(16,185,129,0.3); }
.filename-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* --- SYSTEM INTERACTIVE ACTIONS --- */
.btn-header-browse, .btn-header-sync, .btn-header-disconnect { border: none; padding: 8 px 14px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; cursor: pointer; color: #fff; transition: opacity 0.2s; }
.btn-header-browse { background: #059669; padding: 8px 16px; }
.btn-header-browse:hover { background: #10b981; }
.btn-header-sync { background: #2563eb; }
.btn-header-sync:hover { background: #3b82f6; }
.btn-header-disconnect { background: #dc2626; }
.btn-header-disconnect:hover { background: #ef4444; }

/* --- ACTION PANEL CONTROLS --- */
.workspace { padding: 1rem 1.5rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 20px; box-sizing: border-box; }
.workspace-empty-state { justify-content: center; }
.toolbar { padding: 1rem 1.25rem; display: flex; align-items: center; box-sizing: border-box; width: 100%; }
.date-picker-group { display: flex; gap: 14px; align-items: flex-end; width: 100%; }
.input-field { display: flex; flex-direction: column; gap: 4px; }
.input-field label { font-size: 0.65rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
.input-field input { border: 1px solid #475569; padding: 6px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: #f8fafc; background: #0f172a; height: 32px; box-sizing: border-box; color-scheme: dark; }
.input-field input:focus { border-color: #38bdf8; outline: none; }
.btn-green { background: #059669; color: #fff; border: none; padding: 0 30px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem; height: 32px; display: inline-flex; align-items: center; transition: background 0.2s; }
.btn-green:hover { background: #10b981; }
.btn-cloud-publish { background: #2563eb; color: #fff; border: 1px solid #1d4ed8; padding: 0 20px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 0.8rem; height: 32px; display: inline-flex; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: 0.2s; }
.btn-cloud-publish:hover { background: #3b82f6; }
.btn-cloud-publish:disabled { background-color: #475569; border-color: #334155; color: #94a3b8; cursor: not-allowed; box-shadow: none; }
.right-aligned-metrics { margin-left: auto; display: flex; align-items: center; color: #f8fafc; }

/* --- GRID VIEWPORT SPECIFICATIONS --- */
.workspace-body-layout { display: flex; flex-direction: column; gap: 20px; width: 100%; }
.dashboard-columns-container { display: flex; gap: 20px; width: 100%; align-items: stretch; }
.left-charts-column { flex: 0 0 70%; display: flex; flex-direction: column; gap: 20px; min-width: 0; height: 660px; }
.right-metrics-column { flex: 0 0 30%; min-width: 0; display: flex; flex-direction: column; max-height: 660px; overflow: hidden; }
.spinner-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 350px; background: #1e293b; border-radius: 12px; border: 1px solid #334155; gap: 1rem; }
.sync-spinner { width: 45px; height: 45px; border: 4px solid #334155; border-top-color: #34d399; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>