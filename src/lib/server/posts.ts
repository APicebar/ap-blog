import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '$env/dynamic/private';
import { base } from '$app/paths';
import { Marked } from 'marked';
import markedShiki from 'marked-shiki';
import { createHighlighter } from 'shiki';
import { POSTS_PAGE_SIZE, type PostMeta, type PostsPage } from '$lib/posts';

export interface Post extends PostMeta {
	/** marked 渲染后的正文 HTML */
	html: string;
}

// 文章目录在构建产物之外，rsync 直接同步、无需重新构建。
// $env/dynamic/private 保证路径是启动时读的环境变量，而非构建时固化。
const contentDir = () => env.CONTENT_DIR || 'content/posts';

// slug 即文章文件夹名，白名单防路径穿越；超出此字符集的名字不会被路由到
const SLUG_PATTERN = /^[A-Za-z0-9_-]+$/;

// 每篇文章一个文件夹：index.md 是正文，同目录的图片等资源经
// /blog/<slug>/assets/... 端点访问，Markdown 里直接写相对路径（如 ![图](a.jpg)）即可
const POST_ENTRY = 'index.md';

// 绝对 URL（http:、data:、//cdn）、站内绝对路径与页内锚点不动，只改写相对路径
const NON_RELATIVE_REF = /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i;

// Shiki 初始化是异步的：模块级单例，首次渲染文章时完成，后续请求复用同一实例。
// tokyo-night 与站点暗色主题、--accent 蓝色一致；langs 按需白名单，控制内存与启动开销
const shikiPromise = createHighlighter({
	themes: ['tokyo-night'],
	langs: [
		'ts',
		'js',
		'svelte',
		'css',
		'html',
		'json',
		'bash',
		'yaml',
		'md',
		'python',
		'rust',
		'go',
		'diff',
		'csharp',
		'cpp',
		'asm',
		'c'
	]
}).then((highlighter) =>
	markedShiki({
		highlight(code, lang) {
			// 未加载的语言回退为 text（无高亮但仍带主题底色），避免 codeToHtml 抛错
			const loaded = highlighter.getLoadedLanguages() as string[];
			return highlighter.codeToHtml(code, {
				lang: loaded.includes(lang) ? lang : 'text',
				theme: 'tokyo-night'
			});
		}
	})
);

// 极简 frontmatter：仅支持 `key: value` 与 `tags: [a, b]`，需要嵌套结构时再换 yaml 解析器
function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
	if (!match) return { data: {}, body: raw };

	const data: Record<string, string> = {};
	for (const line of match[1].split(/\r?\n/)) {
		const colon = line.indexOf(':');
		if (colon === -1) continue;
		const value = line.slice(colon + 1).trim();
		data[line.slice(0, colon).trim()] = value.replace(/^['"]|['"]$/g, '');
	}
	return { data, body: raw.slice(match[0].length) };
}

function parseTags(value: string | undefined): string[] {
	if (!value) return [];
	return value
		.replace(/^\[|\]$/g, '')
		.split(',')
		.map((tag) => tag.trim())
		.filter(Boolean);
}

function parsePost(slug: string, raw: string): { meta: PostMeta; body: string; draft: boolean } {
	const { data, body } = parseFrontmatter(raw);
	return {
		meta: {
			slug,
			title: data.title || slug,
			date: data.date ?? '',
			excerpt: data.excerpt ?? '',
			tags: parseTags(data.tags)
		},
		body,
		draft: data.draft === 'true'
	};
}

// 读取一篇文章文件夹：返回解析结果与文件夹绝对路径；slug 非法或 index.md 不存在时为 null
async function readPostEntry(slug: string) {
	if (!SLUG_PATTERN.test(slug)) return null;
	// 绝对路径，供 assets 端点做 startsWith 边界校验
	const dir = path.resolve(contentDir(), slug);
	try {
		const raw = await readFile(path.join(dir, POST_ENTRY), 'utf-8');
		return { ...parsePost(slug, raw), dir };
	} catch {
		return null;
	}
}

// 每次请求都重新扫描目录，发文/改文无需重新构建。
// offset/limit 做分页：首屏 SSR 取第一页，其余由 /api/posts 按需返回
export async function listPosts(offset = 0, limit = POSTS_PAGE_SIZE): Promise<PostsPage> {
	let dirents;
	try {
		dirents = await readdir(contentDir(), { withFileTypes: true });
	} catch {
		console.warn(`[posts] 文章目录不存在或不可读: ${contentDir()}`);
		return { posts: [], total: 0 };
	}

	const posts: PostMeta[] = [];
	for (const dirent of dirents) {
		// 跳过隐藏/临时文件夹（rsync 传输中的临时文件、编辑器 swp 都以 . 开头）
		if (!dirent.isDirectory() || dirent.name.startsWith('.') || !SLUG_PATTERN.test(dirent.name))
			continue;

		const post = await readPostEntry(dirent.name);
		// 无 index.md 或单篇解析失败只跳过该文件夹，列表照常渲染
		if (!post) {
			console.warn(`[posts] 缺少 ${POST_ENTRY} 或解析失败，已跳过 ${dirent.name}`);
			continue;
		}
		if (!post.draft) posts.push(post.meta);
	}

	posts.sort((a, b) => b.date.localeCompare(a.date));
	return { posts: posts.slice(offset, offset + limit), total: posts.length };
}

export async function getPost(slug: string): Promise<Post | null> {
	const post = await readPostEntry(slug);
	if (!post || post.draft) return null;

	const shiki = await shikiPromise;
	// walkTokens 依赖具体 slug，无法挂在共享实例上，故每篇文章建一个 Marked 实例；
	// 昂贵的 Shiki 高亮器仍是模块级单例
	const marked = new Marked().use(shiki).use({
		// 把正文里的相对图片路径改写到 /blog/<slug>/assets/ 端点
		walkTokens(token) {
			if (token.type === 'image' && !NON_RELATIVE_REF.test(token.href)) {
				token.href = `${base}/blog/${slug}/assets/${token.href}`;
			}
		}
	});
	// marked-shiki 会把扩展标记为 async，必须走异步 parse（highlight 本身是同步的）
	return { ...post.meta, html: await marked.parse(post.body, { async: true }) };
}

// 供 /blog/[slug]/assets 端点使用：返回文章文件夹绝对路径。
// 文章不存在或是草稿时为 null——草稿的图片资源同样不对外暴露
export async function postAssetsDir(slug: string): Promise<string | null> {
	const post = await readPostEntry(slug);
	if (!post || post.draft) return null;
	return post.dir;
}
