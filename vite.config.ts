import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  plugins: [sveltekit()],
  css: {
    preprocessorOptions: {
      scss: {},
    },
  },
  resolve: {
    alias: {
      '@datatable': path.resolve(__dirname, 'src/lib')
    }
  }
})
