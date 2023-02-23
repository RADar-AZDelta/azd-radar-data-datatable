import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	use: {
		headless: true
	},
	webServer: {
		command: 'pnpm run build && pnpm run preview',
		port: 4173
	},
	testDir: 'tests'
};

export default config;
