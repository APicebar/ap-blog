import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		// 允许从局域网/WSL2 宿主机访问开发服务器
		host: '0.0.0.0'
	}
});
