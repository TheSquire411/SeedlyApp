import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Critical for Capacitor: Forces relative paths (./file.js)
  base: './',

  // Explicitly tell Vite where to put the build (so Capacitor finds it)
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Clears the folder before building
  }
})