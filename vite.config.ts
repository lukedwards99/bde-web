import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { blogContentPlugin } from './build/blogContentPlugin'

export default defineConfig(() => ({
  plugins: [react(), blogContentPlugin()],
  base: '/',
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    globals: true,
  },
}))
