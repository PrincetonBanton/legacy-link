<template>
  <div class="card map-panel-card">
    <div class="map-container">
      <a v-if="mapDetails.coords" :href="`https://www.google.com/maps/search/?api=1&query=${mapDetails.coords}`" target="_blank" class="google-overlay-logo" title="Open in Google Maps">
        <img src="/google-maps-icon.png" alt="Google Maps" class="logo-icon" />
      </a>
      
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
.map-panel-card { display: flex; flex-direction: column; height: 220px; padding: 0 !important; overflow: hidden; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; }
.map-container { position: relative; flex: 1; width: 100%; background: #f9fafb; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.map-image { width: 100%; height: 100%; object-fit: contain; background-color: #f0f2f5; }
.empty-state { color: #9ca3af; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }

/* Floating Logo Button Layout */
.google-overlay-logo { position: absolute; top: 12px; left: 12px; z-index: 10; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); border: 1px solid #e5e7eb; transition: all 0.2s ease; }
.google-overlay-logo:hover { transform: scale(1.08); box-shadow: 0 4px 12px rgba(0,0,0,0.2); background: #f8fafc; }
.logo-icon { width: 26px; height: 26px; object-fit: contain; }
</style>