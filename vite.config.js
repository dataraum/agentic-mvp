import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import wasm from 'vite-plugin-wasm';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';

export default defineConfig({
	plugins: [devtoolsJson(), wasm(), tailwindcss(), sveltekit()],
	optimizeDeps: {
		exclude: ['@surrealdb/wasm', 'proto-query-engine'],
		esbuildOptions: {
			target: 'esnext'
		}
	},
	server: {
		fs: {
			allow: ['..']
		}
	},
	esbuild: {
		supported: {
			'top-level-await': true
		}
	},
	build: {
		target: 'esnext'
	}
});
