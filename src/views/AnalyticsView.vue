<template>
  <div class="placeholder-workbench">
    <h1 class="works-notice">📊 Analytics Framework</h1>
    <p class="works-caption">Advanced data mining projections system module is pending activation.</p>
  </div>
</template>

<script setup>
  defineProps({ detectedType: String, mainTableInfo: Object })
</script>

<style scoped>
.placeholder-workbench { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #0f172a; border: 1px dashed #334155; border-radius: 12px; min-height: 400px; margin: 1rem 1.5rem; }
.works-notice { font-size: 1.75rem; font-weight: 800; color: #f1f5f9; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
.works-caption { font-size: 0.95rem; color: #64748b; margin: 0; }
</style>