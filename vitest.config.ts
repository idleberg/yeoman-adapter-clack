import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['src/**/*.spec.ts'],
		coverage: {
			include: ['src/**/*.ts', 'generators/**/*.ts'],
			exclude: ['src/**/*.d.ts', 'src/**/index.ts'],
		},
	},
});
