import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		// adapter-node：博客在运行时读取 CONTENT_DIR 下的 Markdown，需要有持久文件系统的 Node 环境
		adapter: adapter()
	}
};

export default config;
