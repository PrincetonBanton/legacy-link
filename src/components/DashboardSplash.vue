<template>
  <div class="empty-splash-card">
    <div class="splash-branding">
      <div v-if="isMigrating" class="splash-spinner-box">
        <div class="sync-spinner"></div>
      </div>
      <img v-else src="/sodaco.png" class="splash-logo animate-pulse" alt="Company Logo" />

      <h1 class="splash-title">
        {{ isMigrating ? 'SYNCING DATA' : 'COMPANY NAME' }}
      </h1>
      <p class="splash-lead">
        {{ isMigrating ? 'Parsing schemas and migrating tables...' : 'System dashboard is offline.' }}
      </p>
      
      <div class="splash-action-badge">
        {{ isMigrating 
          ? '⚡ Please keep this application open until compilation finishes' 
          : (selectedPath ? '⚠️ Click "SYNC DATABASE" above to initialize schemas' : '📂 Please connect a local database structure to begin data mapping') 
        }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isMigrating: { type: Boolean, default: false },
  selectedPath: { type: [String, Object, null], default: null }
})
</script>

<style scoped>
.empty-splash-card { width: 100%; display: flex; align-items: center; justify-content: center; text-align: center; box-sizing: border-box; }
.splash-branding { display: flex; flex-direction: column; align-items: center; max-width: 440px; }
.splash-logo { width: 95px; height: auto; opacity: 0.65; margin-bottom: 1.5rem; filter: grayscale(100%); }
.splash-spinner-box { width: 95px; height: 95px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; }
.splash-title { font-size: 1.35rem; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 0.25rem 0; }
.splash-lead { font-size: 0.9rem; font-weight: 500; color: #6b7280; margin: 0 0 1.75rem 0; }
.splash-action-badge { font-size: 0.8rem; font-weight: 600; color: #4b5563; line-height: 1.5; background: #fff; padding: 12px 20px; border-radius: 10px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.sync-spinner { width: 45px; height: 45px; border: 4px solid #f3f4f6; border-top-color: #059669; border-radius: 50%; animation: spin 1s linear infinite; }

.animate-pulse { animation: pulse-keyframe 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
@keyframes pulse-keyframe { 0%, 100% { opacity: .65; transform: scale(1); } 50% { opacity: .35; transform: scale(0.97); } }
@keyframes spin { to { transform: rotate(360deg); } }
</style>