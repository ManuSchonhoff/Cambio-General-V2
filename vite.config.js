import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Configuración personalizada para manejar errores y comportamiento del cliente
const addTransformIndexHtml = {
	name: 'add-transform-index-html',
	transformIndexHtml(html) {
		return {
			html,
			tags: [
				{
					tag: 'script',
					attrs: { type: 'module' },
					children: `
window.onerror = (message, source, lineno, colno, errorObj) => {
	const errorDetails = errorObj ? JSON.stringify({
		name: errorObj.name,
		message: errorObj.message,
		stack: errorObj.stack,
		source,
		lineno,
		colno,
	}) : null;
	
	window.parent.postMessage({
		type: 'runtime-error',
		message,
		error: errorDetails
	}, '*');
};
					`,
					injectTo: 'head',
				},
			],
		};
	},
};

export default defineConfig({
	plugins: [react(), addTransformIndexHtml],
	server: {
		cors: true,
		headers: {
			'Cross-Origin-Embedder-Policy': 'credentialless',
		},
		allowedHosts: true,
	},
	resolve: {
		extensions: ['.jsx', '.js', '.tsx', '.ts', '.json', ],
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
});