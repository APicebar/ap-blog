<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { SITE_DESCRIPTION, pageTitle } from '$lib/site';

	// 优先展示后端给的错误消息（如文章 404 时的「文章不存在」），没有时按状态码给通用文案
	const message = $derived(
		page.error?.message ?? (page.status === 404 ? '页面不存在' : '服务器出了点问题，请稍后再试')
	);
</script>

<svelte:head>
	<title>{pageTitle(String(page.status))}</title>
	<meta name="description" content={SITE_DESCRIPTION} />
</svelte:head>

<div class="wrap">
	<div class="card">
		<p class="status">{page.status}</p>
		<h2>{message}</h2>
		<a class="home-link" href={resolve('/')}>回到首页</a>
	</div>
</div>

<style>
	/* panel 是固定高度，内容居中靠 wrap 的上下留白实现，避免依赖父级高度 */
	.wrap {
		display: flex;
		justify-content: center;
		padding: clamp(40px, 10vh, 96px) 0;
	}

	/* 与 blog 列表页同级的实色内容卡 */
	.card {
		width: min(420px, 100%);
		padding: 40px 32px;
		border-radius: 18px;
		border: 1px solid var(--border);
		background: color-mix(in srgb, var(--panel-2) 78%, transparent);
		text-align: center;
	}

	.status {
		margin: 0;
		font-size: 56px;
		font-weight: 700;
		line-height: 1;
		color: var(--accent);
	}

	h2 {
		margin: 14px 0 0;
		font-size: 18px;
		font-weight: 600;
	}

	/* 链接做成胶囊按钮：配色复用 tag 的 accent 底色与卡片 hover 的 accent 描边 */
	.home-link {
		display: inline-block;
		margin-top: 24px;
		padding: 8px 18px;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		color: var(--accent);
		text-decoration: none;
		transition: border-color 0.15s ease;
	}

	.home-link:hover {
		border-color: color-mix(in srgb, var(--accent) 45%, transparent);
	}
</style>
