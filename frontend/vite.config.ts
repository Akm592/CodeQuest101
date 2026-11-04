// vite.config.ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  // The algorithm step generators are pure functions, so there is nothing to
  // render and no need for jsdom. Tests import { describe, it, expect } from
  // "vitest" explicitly rather than enabling globals, because tsconfig.app.json
  // has include: ["src"] and would otherwise need its types array changed.
  test: {
    include: ['src/**/*.test.ts'],
  },
  optimizeDeps: {
    include: ['react-syntax-highlighter', 'react-syntax-highlighter/dist/cjs/styles/hljs']
  }
})
