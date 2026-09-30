/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Unit tests only: the Playwright suite in e2e/ runs on its own
  // (`test:e2e`), and vitest's default pattern would pick its specs up too.
  test: {
    include: ['src/**/*.test.ts'],
  },
})
