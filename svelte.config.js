import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import adapter from '@sveltejs/adapter-static'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [vitePreprocess()],
  vitePlugin: {
    inspector: {
      toggleKeyCombo: 'control-shift',
    },
  },
  kit: {
    adapter: adapter(),
    alias: {
      '@datatable': "src/lib"
    }
  },
}

export default config
