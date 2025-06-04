import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  // For deployment to https://www.learn-malayalam.org/
  // the base path must be '/'.
  const buildBasePath = '/';
  
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
