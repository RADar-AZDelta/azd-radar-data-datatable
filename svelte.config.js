import { vitePreprocess } from '@sveltejs/kit/vite'
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
  },
}

export default config
