<template>
  <div v-if="isOpen" class="modal-backdrop" @click="closeModal">
    <div class="modal-card" @click.stop>
      <div class="modal-header">
        <h4>🔍 Smart Research Pipeline</h4>
        <button class="close-btn" @click="closeModal">×</button>
      </div>
      
      <div class="modal-body">
        <p class="target-title">Target Item: <strong>{{ itemName }}</strong></p>
        <span class="category-tag">{{ itemGroup }}</span>
        
        <hr class="divider" />

        <div class="ai-insight-box">
          <h5>✨ Automated AI Summary</h5>
          <div v-if="loading" class="placeholder-text loading">
            <span class="spinner"></span> Analyzing item context via neural models...
          </div>
          <div v-else-if="aiResult" class="ai-text-output">
            {{ aiResult }}
          </div>
          <div v-else class="placeholder-text">
            Click the button below to generate a deep-dive technical context sheet for this item profile.
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="action-btn secondary" @click="openExternalSearch">
          🌐 Open Google Search
        </button>
        <button class="action-btn primary" :disabled="loading" @click="fetchAiInsight">
          {{ aiResult ? '🔄 Regenerate Sheet' : '🚀 Ask AI Assistant' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  itemName: String,
  itemGroup: String
})

const emit = defineEmits(['close'])

const loading = ref(false)
const aiResult = ref('')

// Reset text whenever user changes items
watch(() => props.itemName, () => {
  aiResult.value = ''
})

const closeModal = () => {
  if (loading.value) return
  emit('close')
}

// 🌐 Fallback Method: Simple Online Redirection Search
const openExternalSearch = () => {
  const query = encodeURIComponent(`${props.itemName} ${props.itemGroup} specifications use-case`)
  const url = `https://www.google.com/search?q=${query}`
  
  // Electron safe cross-runtime safe external opener window check
  if (window.require) {
    window.require('electron').shell.openExternal(url)
  } else {
    window.open(url, '_blank')
  }
}

// 🤖 AI Method: Frontend to IPC Request
const fetchAiInsight = async () => {
  if (!navigator.onLine) {
    alert("🛑 Connection Failure: Your workstation is currently offline. Please restore internet connectivity to poll the AI Endpoint.")
    return
  }

  loading.value = true
  try {
    const ipc = window.require ? window.require('electron').ipcRenderer : null
    if (ipc) {
      // Sending payload request directly to backend node worker
      const res = await ipc.invoke('ask-ai-about-item', { 
        name: props.itemName, 
        group: props.itemGroup 
      })
      aiResult.value = res.data || res.error || 'No overview returned.'
    } else {
      // Mock simulation fallback if testing purely in browser environment
      setTimeout(() => {
        aiResult.value = `[Browser Mock Engine] This item "${props.itemName}" belongs to the ${props.props.itemGroup} registry. Typical enterprise deployments include logistical validation and inventory rotation audits.`
        loading.value = false
      }, 1200)
      return
    }
  } catch (err) {
    aiResult.value = `Failed to process information: ${err.message}`
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.modal-card { background: #1e293b; border: 1px solid #334155; width: 500px; max-width: 90%; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); display: flex; flex-direction: column; overflow: hidden; animation: zoomIn 0.15s ease-out; }
@keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #0f172a; border-bottom: 1px solid #334155; }
.modal-header h4 { margin: 0; font-size: 0.85rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.close-btn { background: transparent; border: none; color: #64748b; font-size: 1.5rem; cursor: pointer; transition: color 0.2s; }
.close-btn:hover { color: #ef4444; }
.modal-body { padding: 16px; flex: 1; }
.target-title { margin: 0 0 6px 0; font-size: 1rem; color: #fff; }
.category-tag { font-size: 0.65rem; font-weight: 700; background: #38bdf8; color: #0f172a; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
.divider { border: 0; height: 1px; background: #334155; margin: 16px 0; }
.ai-insight-box { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 14px; min-height: 140px; display: flex; flex-direction: column; }
.ai-insight-box h5 { margin: 0 0 10px 0; font-size: 0.75rem; font-weight: 800; color: #a855f7; text-transform: uppercase; }
.placeholder-text { font-size: 0.8rem; color: #475569; line-height: 1.5; margin: auto; text-align: center; }
.placeholder-text.loading { color: #38bdf8; display: flex; align-items: center; gap: 8px; }
.ai-text-output { font-size: 0.85rem; color: #cbd5e1; line-height: 1.6; white-space: pre-wrap; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px; background: #0f172a; border-top: 1px solid #334155; }
.action-btn { font-size: 0.7rem; font-weight: 700; padding: 8px 14px; border-radius: 6px; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
.action-btn.primary { background: #a855f7; color: #fff; }
.action-btn.primary:hover:not(:disabled) { background: #b55fe6; }
.action-btn.secondary { background: #1e293b; border-color: #334155; color: #94a3b8; }
.action-btn.secondary:hover { background: #24334d; color: #fff; }
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Simple loading animation indicator */
.spinner { width: 14px; height: 14px; border: 2px solid #334155; border-top-color: #38bdf8; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>