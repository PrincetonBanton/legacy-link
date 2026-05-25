<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="logo-area">
        <img src="/sodaco.png" style="width: 45px;" />
        <span class="logo-text">COMPANY LOGO</span>
      </div>
      <nav class="nav-stack">
        <div class="nav-item active">⚙️ Dashboard</div>
        <div class="nav-item">📦 Inventory</div>
        <div class="nav-item">📈 Analytics</div>
      </nav>
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

          <div class="header-insight-subtext">
            <div v-if="mainTableInfo.name" class="status-active-logic">
              {{ mainTableInfo.name === 'DRDetails' ? 'Production - Ready to process Block/Phase weights.' : 'Issuance - Ready to track material costs.' }}
            </div>
            <div v-else class="status-empty-logic">Connect a database to view system logic.</div>
          </div>
        </div>
      </header>

      <section class="workspace">
        <div class="toolbar">
          <div class="date-picker-group">
            <div class="input-field"><label>Start Date</label><input type="date" v-model="dateRange.start" /></div>
            <div class="input-field"><label>End Date</label><input type="date" v-model="dateRange.end" /></div>
            <button class="btn-green" style="background-color: #145214; border-color: #0e3a0e;" @click="handleExecuteGo">GO</button>
            <button class="btn-green" @click="handleExecuteFiltered">Filter by Date</button>
            <button class="btn-green" @click="handleExecuteBlocks">Check Block Data</button> 
          </div>
        </div>

        <div v-if="isMigrating" class="spinner-overlay">
          <div class="sync-spinner"></div>
          <h3>Syncing database schema, please wait...</h3>
        </div>

        <div v-else class="dashboard-grid">
          <div class="card main-graph-card">
            <div class="card-header"><h3>Graph Visualization - 1</h3></div>
            <div class="chart-container-frame">
              <div v-if="matchedRecords?.length" style="height: 100%; width: 100%; position: relative;">
                <Line v-if="activeViewType === 'dates'" :data="lineChartData" :options="chartOptions" />
                <Bar v-slot="bar" v-if="activeViewType === 'blocks'" :data="barChartData" :options="chartOptions" />
              </div>
              <div v-else class="empty-state-card-message">No active data loaded. Apply a filter runtime context module above.</div>
            </div>
          </div>

          <div class="card graph-stack-card">
            <div class="stack-section">
              <div class="stack-header">
                <h4>Daily Trends (Invoices)</h4>
                <span v-if="activeViewType === 'dates'" class="active-dot"></span>
              </div>
              <div class="mini-chart-frame">
                <Line v-if="matchedRecords?.length" :data="lineChartData" :options="miniChartOptions" />
                <div v-else class="mini-empty">No active dataset</div>
              </div>
            </div>
            
            <div class="stack-section">
              <div class="stack-header">
                <h4>Structural Block Aggregations</h4>
                <span v-if="activeViewType === 'blocks'" class="active-dot"></span>
              </div>
              <div class="mini-chart-frame">
                <Bar v-if="matchedRecords?.length" :data="barChartData" :options="miniChartOptions" />
                <div v-else class="mini-empty">No active dataset</div>
              </div>
            </div>
          </div>

          <DashboardMetrics 
            :date-range="dateRange"
            :total-amount="totalAmount"
            :main-table-info="mainTableInfo"
            :matched-records-length="matchedRecords?.length || 0"
          />
          <DashboardTop10 
            :matched-records="matchedRecords"
            :active-view-type="activeViewType"
          />
          <DashboardMap :locations="locations" />

        </div>

      </section>
    </main>
  </div>
</template>

<script setup>
  import { computed, watch } from 'vue'
  import { useMigration } from './composables/useMigration'
  import { useAnalysis } from './composables/useAnalysis'
  import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js'
  import { Line, Bar } from 'vue-chartjs'
  
  import DashboardMetrics from './components/DashboardMetrics.vue'
  import DashboardTop10 from './components/DashboardTop10.vue'
  import DashboardMap from './components/DashboardMap.vue'
  
  ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement)

  const { 
    selectedPath, isMigrating, fileInfo, detectedType, mainTableInfo, 
    locations, handleMdbBrowse, handleMdbSync, resetSelection 
  } = useMigration()

  const {
    dateRange, totalAmount, matchedRecords, activeViewType,
    handleExecuteGo, handleExecuteFiltered, handleExecuteBlocks, clearAnalysisData
  } = useAnalysis(detectedType)

  const lineChartData = computed(() => {
    const limitedList = matchedRecords.value?.slice(0, 50) || []
    return {
      labels: limitedList.map(item => item.date),
      datasets: [{
        label: 'Invoices',
        backgroundColor: 'rgba(16, 185, 129, 0.04)',
        borderColor: '#10b981',
        pointBackgroundColor: '#064e3b',
        borderWidth: 2,
        tension: 0.2, 
        data: limitedList.map(item => item.value)
      }]
    }
  })

  const barChartData = computed(() => {
    const limitedList = matchedRecords.value?.slice(0, 30) || []
    return {
      labels: limitedList.map(item => item.identifier),
      datasets: [{
        label: 'Blocks',
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        data: limitedList.map(item => item.value)
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

  const miniChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      y: { display: false, grid: { display: false } },
      x: { display: false, grid: { display: false } }
    }
  }

  watch(detectedType, (newProfile) => {
    if (!newProfile) clearAnalysisData()
  })
</script>

<style scoped>
/* --- 1. CORE LAYOUT --- */
.app-layout { display: flex; height: 100vh; width: 100vw; background: #f4f6f9; color: #111827; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
.main-canvas { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* --- 2. SIDEBAR --- */
.sidebar { width: 240px; background: #ffffff; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; padding: 1.5rem 1rem; box-sizing: border-box; }
.logo-area { display: flex; align-items: center; gap: 12px; margin-bottom: 2.5rem; font-weight: 800; font-size: 1.1rem; color: #1f2937; letter-spacing: -0.5px; }
.nav-stack { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.nav-item { padding: 12px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; color: #4b5563; transition: 0.2s ease; font-size: 0.9rem; }
.nav-item:hover { background: #f3f4f6; color: #1f2937; }
.nav-item.active { background: #f3f4f6; color: #111827; font-weight: 700; }

/* --- 3. TOP HEADER BANNER --- */
.top-header-banner { display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 12px 2.5rem; border-bottom: 1px solid #e5e7eb; min-height: 80px; box-sizing: border-box; }
.title-context .main-title { font-size: 1.3rem; font-weight: 700; color: #111827; margin: 0; letter-spacing: -0.5px; }
.title-context .empty-title { color: #6b7280; font-weight: 600; }
.title-type-label { font-size: 0.95rem; color: #6b7280; font-weight: 500; }

/* --- 4. HEADER SYSTEM CONTROLS --- */
.header-control-stack { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.db-connection-manager { display: flex; align-items: center; gap: 10px; background: #f3f4f6; padding: 4px; border-radius: 30px; }
.db-status-pill { display: flex; align-items: center; gap: 8px; background: #ffffff; padding: 6px 14px; border-radius: 20px; border: 1px solid #e5e7eb; font-size: 0.8rem; font-weight: 700; color: #065f46; max-width: 180px; }
.status-dot { width: 7px; height: 7px; background: #10b981; border-radius: 50%; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15); }
.filename-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.header-insight-subtext { font-size: 0.75rem; font-weight: 600; padding-right: 6px; }
.status-active-logic { color: #b45309; }
.status-empty-logic { color: #9ca3af; font-style: italic; }

.btn-header-browse { background: #064e3b; color: #ffffff; border: none; padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; cursor: pointer; }
.btn-header-browse:hover { background: #065f46; }
.btn-header-sync { background: #2563eb; color: #ffffff; border: none; padding: 8px 14px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; cursor: pointer; }
.btn-header-sync:hover { background: #1d4ed8; }
.btn-header-disconnect { background: #ef4444; color: #ffffff; border: none; padding: 8px 14px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; cursor: pointer; }
.btn-header-disconnect:hover { background: #dc2626; }

/* --- 5. WORKSPACE HUB LAYOUT --- */
.workspace { padding: 2rem 2.5rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 20px; box-sizing: border-box; }
.toolbar { background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #e5e7eb; }
.date-picker-group { display: flex; gap: 12px; align-items: flex-end; }
.input-field { display: flex; flex-direction: column; gap: 4px; }
.input-field label { font-size: 0.65rem; font-weight: 700; color: #6b7280; text-transform: uppercase; }
.input-field input { border: 1px solid #d1d5db; padding: 8px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: #374151; }

.btn-green { background: #064e3b; color: #ffffff; border: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem; }
.btn-green:hover { opacity: 0.9; }

/* --- 6. OVERLAY --- */
.spinner-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 350px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; gap: 1rem; }
.sync-spinner { width: 45px; height: 45px; border: 4px solid #f3f4f6; border-top-color: #059669; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* --- 7. GRID CARDS FRAMEWORK --- */
.dashboard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; width: 100%; box-sizing: border-box; }
.card { background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 1.5rem; box-sizing: border-box; }

.main-graph-card { grid-column: span 2; display: flex; flex-direction: column; gap: 1rem; height: 333px; }
.card-header h3 { font-size: 1.05rem; font-weight: 700; color: #111827; margin: 0; }
.chart-container-frame { flex: 1; position: relative; height: 100%; min-width: 0; }
.empty-state-card-message { display: flex; align-items: center; justify-content: center; height: 100%; text-align: center; color: #9ca3af; font-size: 0.8rem; font-weight: 500; border: 1px dashed #e5e7eb; border-radius: 8px; padding: 1rem; box-sizing: border-box; }

.graph-stack-card { display: flex; flex-direction: column; justify-content: space-between; gap: 16px; height: 333px; padding: 1.25rem; }
.stack-section { flex: 1; display: flex; flex-direction: column; gap: 6px; min-height: 0; }
.stack-header { display: flex; justify-content: space-between; align-items: center; }
.stack-section h4 { margin: 0; font-size: 0.8rem; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.3px; }
.active-dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2); }
.mini-chart-frame { flex: 1; background: #f9fafb; border-radius: 6px; border: 1px solid #f3f4f6; padding: 6px; position: relative; min-height: 0; }
.mini-empty { display: flex; align-items: center; justify-content: center; height: 100%; font-size: 0.75rem; color: #9ca3af; font-style: italic; }

</style>