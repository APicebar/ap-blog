<script lang="ts">
	import type { TocHeading } from '$lib/posts';

	let { headings }: { headings: TocHeading[] } = $props();

	// 目录链接不走路由，直接在 panel 滚动容器内平滑滚动到锚点
	function scrollTo(event: MouseEvent, id: string) {
		event.preventDefault();
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
	}
</script>

<aside class="toc card-surface">
	<p class="toc-title">目录</p>
	<nav>
		{#each headings as heading (heading.id)}
			<a
				class="toc-item"
				class:toc-sub={heading.depth >= 3}
				href="#{heading.id}"
				onclick={(event) => scrollTo(event, heading.id)}
			>
				{heading.text}
			</a>
		{/each}
	</nav>
</aside>

<style>
	/* 卡片宽度由挂载处（layout 的 .toc-float）决定，这里只管内容与表面 */
	.toc {
		max-height: calc(100dvh - 120px);
		overflow-y: auto;
		padding: 16px 18px;
	}

	.toc-title {
		margin: 0 0 8px;
		font-size: 13px;
		color: var(--muted);
	}

	.toc-item {
		display: block;
		padding: 3px 0;
		color: var(--muted);
		text-decoration: none;
		font-size: 13px;
		line-height: 1.6;
	}

	.toc-item:hover {
		color: var(--accent);
	}

	/* h3 条目缩进一级、字号略小 */
	.toc-sub {
		padding-left: 14px;
		font-size: 12px;
	}
</style>
