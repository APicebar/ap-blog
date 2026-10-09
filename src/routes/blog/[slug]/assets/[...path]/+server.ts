import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { error } from '@sveltejs/kit';
import { postAssetsDir } from '$lib/server/posts';
import type { RequestHandler } from './$types';

// 文章文件夹内的静态资源端点：Markdown 里的相对图片路径会被改写到这里。
// 扩展名白名单既确定 Content-Type，也顺带挡住了 index.md 等文章源文件
const MIME_TYPES: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.avif': 'image/avif',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.mp4': 'video/mp4',
	'.webm': 'video/webm',
	'.mp3': 'audio/mpeg',
	'.wav': 'audio/wav',
	'.ogg': 'audio/ogg',
	'.pdf': 'application/pdf'
};

export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const dir = await postAssetsDir(params.slug);
	const mime = MIME_TYPES[path.extname(params.path).toLowerCase()];
	if (!dir || !mime) error(404, '资源不存在');

	// rest 参数可能含多级路径：逐段拦截隐藏文件（. 开头，含 ..），
	// 再用 resolve + startsWith 兜底，两层防护与 posts.ts 的 slug 白名单同级
	const segments = params.path.split('/');
	if (segments.some((s) => !s || s.startsWith('.'))) error(404, '资源不存在');
	const file = path.resolve(dir, ...segments);
	if (!file.startsWith(dir + path.sep)) error(404, '资源不存在');

	try {
		const data = await readFile(file);
		setHeaders({
			'Content-Type': mime,
			'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
		});
		return new Response(new Uint8Array(data));
	} catch {
		error(404, '资源不存在');
	}
};
