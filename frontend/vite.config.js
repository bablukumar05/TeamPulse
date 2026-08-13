import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts')) return 'vendor-charts';
          if (id.includes('node_modules/@hello-pangea')) return 'vendor-dnd';
          if (id.includes('node_modules/xlsx') || id.includes('node_modules/jspdf')) return 'vendor-export';
          if (id.includes('node_modules/axios') || id.includes('node_modules/socket.io-client')) return 'vendor-network';
        },
      },
    },
  },
})