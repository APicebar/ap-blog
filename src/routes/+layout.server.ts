import { getPost } from '$lib/server/posts';
import type { LayoutServerLoad } from './$types';

// 文章路由下把目录提到 layout 层：目录卡渲染在 panel 之外（layout 的 .toc-slot），
// 数据没法从 page 自下而上传，只能在这里随 layout data 下发。
// 文章本体经 locals 递给 page load 复用，同一次请求不重复读盘解析。
export const load: LayoutServerLoad = async ({ params, route, locals }) => {
	// 根 layout 的 params 类型不含子路由参数，守卫到 slug 再查
	if (route.id !== '/blog/[slug]' || !params.slug) return { postToc: null };
	const post = await getPost(params.slug);
	locals.post = post;
	return { postToc: post?.headings ?? null };
};
