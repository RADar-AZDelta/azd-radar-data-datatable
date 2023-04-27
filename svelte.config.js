//import preprocess from 'svelte-preprocess'
//import adapter from '@sveltejs/adapter-auto'
import { vitePreprocess } from '@sveltejs/kit/vite'
import adapter from '@sveltejs/adapter-static';

const dev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: [
    vitePreprocess(),
    // preprocess({
    //   scss: {
    //   },
    // }),
  ],
  kit: {
    adapter: adapter({
    }),
    paths: {
      base: dev ? '' : process.env.BASE_PATH,
    }
  },
}

export default config
