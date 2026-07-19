import { error } from '@sveltejs/kit';
import { getPost } from '$lib/server/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	// 根 layout load 已读过这篇文章（见 +layout.server.ts），直接复用
	const post = locals.post !== undefined ? locals.post : await getPost(params.slug);
	if (!post) error(404, '文章不存在');
	return { post };
};
