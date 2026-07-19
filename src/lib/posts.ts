// 客户端与服务端共享的文章类型和分页常量。
// 放在 $lib 根下而非 $lib/server：客户端（博客列表页、/api/posts 的响应类型）也需要引用
export interface PostMeta {
	slug: string;
	title: string;
	date: string;
	excerpt: string;
	tags: string[];
}

/** 一页文章列表：listPosts 与 /api/posts 共用的返回结构 */
export interface PostsPage {
	posts: PostMeta[];
	total: number;
}

/** 博客列表每页文章数：首屏 SSR 与客户端无限滚动分页共用 */
export const POSTS_PAGE_SIZE = 10;
