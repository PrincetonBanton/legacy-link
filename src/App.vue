<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="logo-area">
        <img src="/sodaco.png" style="width: 65px; height: 65px; border-radius: 100%; object-fit: cover;" />
      </div>
      <nav class="nav-stack">
        <div class="nav-item" :class="{ active: activeTab === 'DASHBOARD' }" @click="activeTab = 'DASHBOARD'">DASHBOARD</div>
        <div class="nav-item" :class="{ active: activeTab === 'INVENTORY', 'is-disabled': detectedType === 'Production System' }" @click="handleInventoryTabClick">INVENTORY</div>
        <div class="nav-item" :class="{ active: activeTab === 'ANALYTICS' }" @click="activeTab = 'ANALYTICS'">ANALYTICS</div>
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
            <button v-if="!selectedPath" @click="handleMdbBrowse" class="btn-header-browse">BROWSE DATABASE</button>
            <template v-else>
              <div class="db-status-pill">
                <span class="status-dot"></span>  
                <span class="filename-text" :title="fileInfo.name">{{ fileInfo.name }}</span>
              </div>
              
              <button v-if="!detectedType && !isMigrating" @click="handleMdbSync" class="btn-header-sync">
                SYNC DATABASE
              </button>
              
              <button @click.stop="resetSelection" class="btn-header-disconnect">DISCONNECT</button>
            </template>
          </div>
        </div>
      </header>

      <section :class="['workspace', { 'workspace-empty-state': !detectedType }]">
        <template v-if="detectedType">
          <component 
            :is="currentView" 
            :detected-type="detectedType"
            :locations="locations"
            :main-table-info="mainTableInfo"
            :is-migrating="isMigrating"
          />
        </template>
        <template v-else>
          <DashboardSplash :is-migrating="isMigrating" :selected-path="selectedPath" />
        </template>
      </section>
    </main>
  </div>
</template>

<script setup>
  import { watch, ref, computed } from 'vue'
  import { useMigration } from './composables/useMigration'
  import DashboardMap from './components/DashboardMap.vue'
  import DashboardSplash from './components/DashboardSplash.vue'

  import DashboardView from './views/DashboardView.vue'
  import InventoryView from './views/InventoryView.vue'
  import AnalyticsView from './views/AnalyticsView.vue'

  const activeTab = ref('DASHBOARD')

  const { 
    selectedPath, isMigrating, fileInfo, detectedType, mainTableInfo, 
    locations, handleMdbBrowse, handleMdbSync, resetSelection 
  } = useMigration()

  const currentView = computed(() => {
    if (activeTab.value === 'INVENTORY') return InventoryView
    if (activeTab.value === 'ANALYTICS') return AnalyticsView
    return DashboardView
  })

  const handleInventoryTabClick = () => {
    if (detectedType.value === 'Production System') {
      alert('Inventory Operations are unavailable under a Production context.')
      return
    }
    activeTab.value = 'INVENTORY'
  }

  watch(detectedType, (newProfile) => {
    if (!newProfile) {
      activeTab.value = 'DASHBOARD'
    }
  })
</script>

<style scoped>
:global(html), :global(body) { margin: 0; padding: 0; background-color: black; }
.app-layout { display: flex; height: 100vh; width: 100vw; color: #f8fafc; font-family: -apple-system, sans-serif; overflow: hidden; }
.main-canvas { flex: 1; display: flex; flex-direction: column; overflow: hidden;}
.sidebar { width: 240px; display: flex; flex-direction: column; padding: 1.5rem 1rem 2.5rem 1rem; box-sizing: border-box; position: relative; margin-left: -1px; padding-left: calc(1rem + 1px); }
.logo-area { display: flex; align-items: center; gap: 12px; margin-bottom: 2rem; font-weight: 800; font-size: 1.1rem; letter-spacing: -0.5px; }
.nav-stack { flex: 1; display: flex; flex-direction: column; gap: 4px; margin-bottom: 190px; }
.nav-item { padding: 12px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; color: #94a3b8; font-size: 0.9rem; transition: 0.2s; user-select: none; }
.nav-item:hover { background: #334155; color: #f8fafc; }
.nav-item.active { background: #334155; color: #38bdf8; font-weight: 700; }
.nav-item.is-disabled { opacity: 0.25; cursor: not-allowed; }
.nav-item.is-disabled:hover { background: transparent; color: #94a3b8; }
.sidebar-map-footer { position: absolute; bottom: 2rem; left: 1rem; right: 1rem; height: auto; border-radius: 12px; overflow: hidden; border: 1px solid #334155; background: #1e293b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); }
.top-header-banner { display: flex; justify-content: space-between; align-items: center; padding: 12px 2.5rem; min-height: 80px; box-sizing: border-box; }
.title-context .main-title { margin: 0; font-size: 1.35rem; font-weight: 900; letter-spacing: -0.02em; color: #fff; }
.header-control-stack { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.db-connection-manager { display: flex; align-items: center; gap: 10px; padding: 4px; border-radius: 30px; border: 1px solid #334155; }
.db-status-pill { display: flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 20px; border: 1px solid #334155; font-size: 0.8rem; font-weight: 700; color: #34d399; max-width: 180px; }
.status-dot { width: 7px; height: 7px; background: #10b981; border-radius: 50%; box-shadow: 0 0 0 3px rgba(16,185,129,0.3); }
.filename-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.btn-header-browse, .btn-header-sync, .btn-header-disconnect { border: none; padding: 8px 14px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; cursor: pointer; color: #fff; transition: opacity 0.2s; }
.btn-header-browse { background: #059669; padding: 8px 16px; }
.btn-header-browse:hover { background: #10b981; }
.btn-header-sync { background: #2563eb; }
.btn-header-sync:hover { background: #3b82f6; }
.btn-header-disconnect { background: #dc2626; }
.btn-header-disconnect:hover { background: #ef4444; }
.workspace { padding: 0; overflow-y: auto; flex: 1; display: flex; flex-direction: column; box-sizing: border-box; }
.workspace-empty-state { justify-content: center; padding: 1rem 1.5rem; }
</style>