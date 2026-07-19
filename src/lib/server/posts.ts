import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '$env/dynamic/private';
import { Marked } from 'marked';
import { POSTS_PAGE_SIZE, type PostMeta, type PostsPage, type TocHeading } from '$lib/posts';

export interface Post extends PostMeta {
	/** marked 渲染后的正文 HTML */
	html: string;
	/** 文章目录（取自 h1~h3 标题，无标题时为空数组），供文章页右侧目录卡使用 */
	headings: TocHeading[];
}

// 文章目录在构建产物之外，rsync 直接同步、无需重新构建。
// $env/dynamic/private 保证路径是启动时读的环境变量，而非构建时固化。
const contentDir = () => env.CONTENT_DIR || 'content/posts';

// slug 即文件名，白名单防路径穿越；超出此字符集的文件名不会被路由到
const SLUG_PATTERN = /^[A-Za-z0-9_-]+$/;

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

// 每次请求都重新扫描目录，发文/改文无需重新构建。
// offset/limit 做分页：首屏 SSR 取第一页，其余由 /api/posts 按需返回
export async function listPosts(offset = 0, limit = POSTS_PAGE_SIZE): Promise<PostsPage> {
	let files: string[];
	try {
		files = await readdir(contentDir());
	} catch {
		console.warn(`[posts] 文章目录不存在或不可读: ${contentDir()}`);
		return { posts: [], total: 0 };
	}

	const posts: PostMeta[] = [];
	for (const file of files) {
		// 跳过隐藏/临时文件（rsync 传输中的临时文件、编辑器 swp 都以 . 开头）
		if (!file.endsWith('.md') || file.startsWith('.')) continue;
		const slug = file.slice(0, -3);
		if (!SLUG_PATTERN.test(slug)) continue;

		try {
			const raw = await readFile(path.join(contentDir(), file), 'utf-8');
			const { meta, draft } = parsePost(slug, raw);
			if (!draft) posts.push(meta);
		} catch (err) {
			// 单篇解析失败只跳过该文件，列表照常渲染
			console.warn(`[posts] 解析失败，已跳过 ${file}:`, err);
		}
	}

	posts.sort((a, b) => b.date.localeCompare(a.date));
	return { posts: posts.slice(offset, offset + limit), total: posts.length };
}

// 渲染正文并提取目录：每次请求新建 Marked 实例，目录收集在闭包内，无跨请求共享状态。
// heading renderer 给 h1~h3 加锚点 id 并记入目录，更深的标题保持默认渲染
function renderPost(body: string): { html: string; headings: TocHeading[] } {
	const headings: TocHeading[] = [];
	const md = new Marked({
		renderer: {
			heading({ tokens, depth }) {
				const inner = this.parser.parseInline(tokens);
				if (depth > 3) return `<h${depth}>${inner}</h${depth}>`;
				const id = `toc-${headings.length}`;
				// 目录显示纯文本：剥掉行内元素渲染出的标签（如 `code` 的 <code>）
				headings.push({ id, text: inner.replace(/<[^>]+>/g, ''), depth });
				return `<h${depth} id="${id}">${inner}</h${depth}>`;
			}
		}
	});
	return { html: md.parse(body, { async: false }), headings };
}

export async function getPost(slug: string): Promise<Post | null> {
	if (!SLUG_PATTERN.test(slug)) return null;

	try {
		const raw = await readFile(path.join(contentDir(), `${slug}.md`), 'utf-8');
		const { meta, body, draft } = parsePost(slug, raw);
		if (draft) return null;
		return { ...meta, ...renderPost(body) };
	} catch {
		return null;
	}
}
