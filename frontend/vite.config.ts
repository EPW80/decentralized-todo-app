import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Enable build optimizations
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'web3-vendor': ['ethers'],
        }
      }
    },
    // Optimize chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Image optimization - Vite handles static assets efficiently by default
    // Images in public/ are served as-is, images imported in code are optimized
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb as base64
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    testTimeout: 10000, // Increase timeout to 10 seconds for async tests
    hookTimeout: 10000, // Increase hook timeout as well
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/'
      ]
    }
  }
})
