import { error } from '@sveltejs/kit';
import { getPost } from '$lib/server/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const post = await getPost(params.slug);
	if (!post) error(404, '文章不存在');
	return { post };
};
