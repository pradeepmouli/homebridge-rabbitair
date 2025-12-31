import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['test/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov', 'html'],
			include: ['src/**/*.ts'],
			exclude: ['**/*.d.ts'],
			reportsDirectory: './coverage'
		},
		testTimeout: 10000,
		hookTimeout: 10000
	},
	resolve: {
		extensions: ['.ts', '.js', '.json'],
		// This allows .js imports to resolve to .ts files
		alias: {
			'~': '/src'
		}
	}
});
