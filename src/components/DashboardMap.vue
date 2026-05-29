<template>
  <div class="card map-panel-card">
  <a v-if="mapDetails.coords" :href="`https://www.google.com/maps?q=${mapDetails.coords}`" target="_blank" class="google-header-logo" title="Open in Google Maps">
    <img src="/google-maps-icon.png" alt="Google Maps" class="logo-icon" />
    <span>SATELLITE MAP</span>
  </a>
    
    <div class="map-container">
      <img v-if="mapDetails.image" :src="mapDetails.image" :alt="mapDetails.name" class="map-image" />
      <div v-else class="empty-state"><p>No Location Context</p></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  locations: { type: Array, required: true, default: () => [] }
})

const MAP_REGISTRY = [
  { keywords: ['baractan', 'b1'], name: 'B1 Baractan', image: '/b1.png', coords: '6.964267,125.442515' },
  { keywords: ['batobato', 'b2'], name: 'B2 Batobato', image: '/b2.png', coords: '6.829407,126.090667' },
  { keywords: ['malungon', 'b3'], name: 'B3 Malungon', image: '/b3.png', coords: '6.401633,125.325326' }
]

const mapDetails = computed(() => {
  if (!props.locations?.length) return { name: '', image: null, coords: null }
  const localizedString = props.locations.join(' ').toLowerCase()
  const match = MAP_REGISTRY.find(zone => zone.keywords.some(keyword => localizedString.includes(keyword)))
  return match || { name: '', image: null, coords: null }
})
</script>

<style scoped>
.map-panel-card { display: flex; flex-direction: column; height: 100%; padding: 0 !important; overflow: hidden; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; }
.google-header-logo { display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: #fafafa; border-bottom: 1px solid #e5e7eb; text-decoration: none; color: #4b5563; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; transition: background 0.2s; }
.google-header-logo:hover { background: #f3f4f6; color: #111827; }
.logo-icon { width: 30px; height: 30px; object-fit: contain; }
.map-container { position: relative; flex: 1; background: #f9fafb; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.map-image { width: 100%; height: 100%; object-fit: fill; background-color: #f0f2f5; }
.empty-state { color: #9ca3af; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
</style>