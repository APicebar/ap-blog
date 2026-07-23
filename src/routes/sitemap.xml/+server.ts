import { listPosts } from '$lib/server/posts';
import type { RequestHandler } from './$types';

const SITE = 'https://apice.bar';

export const GET: RequestHandler = async () => {
	const { posts } = await listPosts(0, 9999);

	const urls = [
		{ loc: '/', priority: '1.0' },
		{ loc: '/blog', priority: '0.8' },
		{ loc: '/projects', priority: '0.7' },
		...posts.map((p) => ({ loc: `/blog/${p.slug}`, priority: '0.6' }))
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u.loc}</loc><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, s-maxage=3600'
		}
	});
};
