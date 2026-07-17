/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../src/cli_agent_orchestrator/web_ui',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react'
          if (id.includes('node_modules/@xterm')) return 'xterm'
          if (id.includes('node_modules/lucide-react')) return 'icons'
          if (id.includes('node_modules/zustand')) return 'state'
          return undefined
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/test/**/*.{test,spec}.{ts,tsx}'],
  },
  server: {
    host: 'localhost',
    port: 5173,
    proxy: {
      '/sessions': { target: 'http://localhost:9889', changeOrigin: true },
      '/terminals': { target: 'http://localhost:9889', changeOrigin: true, ws: true },
      '/health': { target: 'http://localhost:9889', changeOrigin: true },
      '/agents': { target: 'http://localhost:9889', changeOrigin: true },
      '/settings': { target: 'http://localhost:9889', changeOrigin: true },
      '/flows': { target: 'http://localhost:9889', changeOrigin: true },
      '/memory': { target: 'http://localhost:9889', changeOrigin: true },
    },
  },
})
