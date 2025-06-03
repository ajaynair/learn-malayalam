
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Determine base path based on GitHub repository name for Pages deployment
  // You might need to manually set this if the auto-detection is not suitable.
  const repoName = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : null;
  
  return {
    plugins: [react()],
    base: command === 'build' && repoName ? `/${repoName}/` : './',
    build: {
      outDir: 'dist',
    }
  }
})
