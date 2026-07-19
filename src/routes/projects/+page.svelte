<script lang="ts">
	import InfiniteSentinel from '$lib/components/InfiniteSentinel.svelte';
	import { PROJECTS_CHUNK_SIZE, projects } from '$lib/projects';
	import { SITE_DESCRIPTION, pageTitle } from '$lib/site';

	// 数据是本地常量，懒加载 = 分批渲染：哨兵滚入视野时每次多渲染一批，
	// 避免长列表一次性挂载。本地切片不会失败，loading 恒为 false
	let shown = $state(PROJECTS_CHUNK_SIZE);
	let visible = $derived(projects.slice(0, shown));
	let hasMore = $derived(shown < projects.length);

	function loadMore() {
		shown += PROJECTS_CHUNK_SIZE;
	}
</script>

<svelte:head>
	<title>{pageTitle('Projects')}</title>
	<meta name="description" content={SITE_DESCRIPTION} />
	<meta property="og:title" content={pageTitle('Projects')} />
	<meta property="og:description" content={SITE_DESCRIPTION} />
	<meta property="og:type" content="website" />
</svelte:head>

<header class="page-header">
	<h2>🧪 项目</h2>
	<p>一些做着玩的东西。</p>
</header>

<div class="grid">
	{#each visible as project (project.name)}
		<article class="card-surface">
			<div class="icon">{project.icon}</div>
			<h3>{project.name}</h3>
			<p>{project.desc}</p>
			<div class="tech">
				{#each project.tech as t (t)}
					<span>{t}</span>
				{/each}
			</div>
		</article>
	{/each}
</div>

<InfiniteSentinel {hasMore} loading={false} onload={loadMore} />

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 14px;
	}

	/* 卡片表面（border/背景/hover 等）走全局 .card-surface（app.css），这里只留布局差异 */
	article {
		padding: 20px;
	}

	.icon {
		font-size: 28px;
	}

	h3 {
		margin: 10px 0 6px;
		font-size: 17px;
	}

	article p {
		margin: 0 0 12px;
		color: var(--muted);
		font-size: 14px;
		line-height: 1.6;
	}

	.tech {
		display: flex;
		gap: 6px;
	}

	.tech span {
		padding: 2px 8px;
		border-radius: 999px;
		font-size: 12px;
		background: var(--chip-bg);
		color: var(--muted);
	}
</style>
