import { error } from '@sveltejs/kit';
import { getPost } from '$lib/server/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const post = await getPost(params.slug);
	if (!post) error(404, '文章不存在');
	setHeaders({ 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' });
	return { post };
};
