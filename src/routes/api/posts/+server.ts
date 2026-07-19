import { json } from '@sveltejs/kit';
import { POSTS_PAGE_SIZE } from '$lib/posts';
import { listPosts } from '$lib/server/posts';
import type { RequestHandler } from './$types';

// 博客列表的分页接口：客户端无限滚动按 offset 逐页拉取
export const GET: RequestHandler = async ({ url }) => {
	const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
	const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || POSTS_PAGE_SIZE));
	return json(await listPosts(offset, limit));
};
