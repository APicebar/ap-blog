<script lang="ts">
	import { resolve } from '$app/paths';
	import { pageTitle } from '$lib/site';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{pageTitle(data.post.title)}</title>
	<meta name="description" content={data.post.excerpt} />
	<meta property="og:title" content={pageTitle(data.post.title)} />
	<meta property="og:description" content={data.post.excerpt} />
	<meta property="og:type" content="article" />
</svelte:head>

<a class="back" href={resolve('/blog')}>← 返回博客</a>

<article>
	<div class="meta">
		<time>{data.post.date}</time>
		{#each data.post.tags as tag (tag)}
			<span class="tag">{tag}</span>
		{/each}
	</div>
	<h2>{data.post.title}</h2>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- 站长自己的 Markdown，服务端渲染 -->
	<div class="content">{@html data.post.html}</div>
</article>

<style>
	.back {
		display: inline-block;
		margin-bottom: 24px;
		color: var(--muted);
		text-decoration: none;
		font-size: 14px;
	}

	.back:hover {
		color: var(--accent);
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: var(--muted);
	}

	.tag {
		padding: 1px 8px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		color: var(--accent);
	}

	h2 {
		margin: 12px 0 20px;
		font-size: 26px;
		line-height: 1.4;
	}

	/* 正文由 {@html} 注入，scoped 样式作用不到，全部走 :global */
	.content :global(p) {
		color: var(--text-body);
		line-height: 1.9;
		margin: 0 0 16px;
	}

	.content :global(h3) {
		margin: 24px 0 12px;
		font-size: 20px;
	}

	.content :global(a) {
		color: var(--accent);
	}

	.content :global(ul),
	.content :global(ol) {
		margin: 0 0 16px;
		padding-left: 24px;
	}

	.content :global(li) {
		color: var(--text-body);
		line-height: 1.9;
	}

	.content :global(code) {
		padding: 1px 6px;
		border-radius: 6px;
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		font-size: 0.9em;
	}

	.content :global(pre) {
		margin: 0 0 16px;
		padding: 14px 16px;
		border-radius: 12px;
		border: 1px solid var(--border);
		background: color-mix(in srgb, var(--panel-2) 78%, transparent);
		overflow-x: auto;
	}

	.content :global(pre code) {
		padding: 0;
		background: none;
		font-size: 13px;
	}

	.content :global(blockquote) {
		margin: 0 0 16px;
		padding: 4px 16px;
		border-left: 3px solid var(--accent);
		color: var(--muted);
	}

	.content :global(img) {
		max-width: 100%;
		border-radius: 12px;
	}
</style>
