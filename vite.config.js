import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,         // Locked to 5174 - 5173 before for portal
    strictPort: true,   // Prevents Vite from slipping back to 5173
    open: false
  }
})