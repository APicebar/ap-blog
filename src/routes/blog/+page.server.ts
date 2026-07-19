import { listPosts } from '$lib/server/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	// 首屏只带第一页；后续页由客户端无限滚动从 /api/posts 拉取
	return listPosts(0);
};
