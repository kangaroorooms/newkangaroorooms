import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Mapbox is a large optional dependency used by lazy-loaded map views.
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          mapbox: ['mapbox-gl'],
        },
      },
    },
  },
})
