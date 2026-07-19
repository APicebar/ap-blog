<script lang="ts">
	import { resolve } from '$app/paths';
	import InfiniteSentinel from '$lib/components/InfiniteSentinel.svelte';
	import { POSTS_PAGE_SIZE, type PostMeta, type PostsPage } from '$lib/posts';
	import { SITE_DESCRIPTION, pageTitle } from '$lib/site';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// 首屏数据来自服务端第一页；之后哨兵滚入视野时经 /api/posts 逐页追加到 extra
	let extra = $state<PostMeta[]>([]);
	let posts = $derived([...data.posts, ...extra]);
	let loading = $state(false);
	let failed = $state(false);
	let hasMore = $derived(posts.length < data.total);

	async function loadMore() {
		if (loading || !hasMore) return;
		loading = true;
		try {
			const res = await fetch(`/api/posts?offset=${posts.length}&limit=${POSTS_PAGE_SIZE}`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const page: PostsPage = await res.json();
			extra = [...extra, ...page.posts];
		} catch (err) {
			// 失败后停止自动重试（哨兵卸载），由用户手动重试，避免接口故障时空转打满
			console.error('[blog] 加载更多文章失败:', err);
			failed = true;
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{pageTitle('Blog')}</title>
	<meta name="description" content={SITE_DESCRIPTION} />
	<meta property="og:title" content={pageTitle('Blog')} />
	<meta property="og:description" content={SITE_DESCRIPTION} />
	<meta property="og:type" content="website" />
</svelte:head>

<header>
	<h2>📝 博客</h2>
	<p>随便写写的笔记，不定期更新。</p>
</header>

<ul>
	{#each posts as post (post.slug)}
		<li>
			<a href={resolve('/blog/[slug]', { slug: post.slug })}>
				<div class="meta">
					<time>{post.date}</time>
					{#each post.tags as tag (tag)}
						<span class="tag">{tag}</span>
					{/each}
				</div>
				<h3>{post.title}</h3>
				<p>{post.excerpt}</p>
			</a>
		</li>
	{/each}
</ul>

{#if failed}
	<p class="load-error">
		加载更多失败
		<button onclick={() => (failed = false)}>重试</button>
	</p>
{:else}
	<InfiniteSentinel {hasMore} {loading} onload={loadMore} />
{/if}

<style>
	header {
		margin-bottom: 28px;
	}

	header h2 {
		margin: 0 0 6px;
		font-size: 28px;
	}

	header p {
		margin: 0;
		color: var(--muted);
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	li a {
		display: block;
		padding: 18px 20px;
		border-radius: 18px;
		border: 1px solid var(--border);
		/* 层级最高的一级内容卡：比 panel 更亮的实色表面（背景已被 panel 模糊过，无需再 blur） */
		background: color-mix(in srgb, var(--panel-2) 78%, transparent);
		text-decoration: none;
		transition:
			border-color 0.15s ease,
			transform 0.15s ease;
	}

	li a:hover {
		border-color: color-mix(in srgb, var(--accent) 45%, transparent);
		transform: translateY(-2px);
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: var(--muted);
	}

	.tag {
		padding: 1px 8px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		color: var(--accent);
	}

	h3 {
		margin: 8px 0 6px;
		font-size: 18px;
	}

	li p {
		margin: 0;
		color: var(--muted);
		font-size: 14px;
		line-height: 1.6;
	}

	.load-error {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		margin: 14px 0 0;
		color: var(--muted);
		font-size: 13px;
	}

	.load-error button {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
</style>
