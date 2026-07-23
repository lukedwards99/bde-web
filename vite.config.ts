import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { blogContentPlugin } from './build/blogContentPlugin'

export default defineConfig(({ mode }) => ({
  plugins: [react(), blogContentPlugin()],
  base: mode === 'production' ? '/bde-web/' : '/',
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    globals: true,
  },
}))
