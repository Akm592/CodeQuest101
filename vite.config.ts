// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-syntax-highlighter', 'react-syntax-highlighter/dist/cjs/styles/hljs']
  }
})
