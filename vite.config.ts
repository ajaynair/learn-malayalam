import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  // If assets are served from https://www.learn-malayalam.org/assets/...
  // the base path must be '/'.
  const buildBasePath = '/'; // Corrected from '/learn-malayalam/'
  
  return {
    plugins: [react()],
    // Use './' for development (npm run dev) to keep paths relative.
    // Use the explicit buildBasePath for production builds.
    base: command === 'build' ? buildBasePath : './',
    build: {
      outDir: 'dist',
    }
  }
})
