import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// SSR 构建默认把 dependencies 外置，而部署只 rsync build/、服务器上没有 node_modules
	// （之前靠 bun 的全局缓存兜底解析外置依赖，shiki 自引用 'shiki/wasm' 子路径时解析失败）。
	// noExternal: true 把全部依赖打进产物，build/ 自包含，node build 即可运行
	ssr: {
		noExternal: true
	},
	server: {
		// 允许从局域网/WSL2 宿主机访问开发服务器
		host: '0.0.0.0'
	}
});
