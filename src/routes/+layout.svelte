<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import bg from '$lib/assets/bg.png';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import ProfileCard from '$lib/components/ProfileCard.svelte';
	import { applyThemeFromImage } from '$lib/theme';
	import type { SectionId } from '$lib/profile';
	import '../app.css';

	let { children } = $props();

	// 板块由 URL 推导：/ 是主页（居中卡片），/blog、/projects 等是导航栏形态。
	// 直接输入 URL 访问时也是同一份推导，所以天然支持直达。
	const section = $derived<SectionId>(
		page.url.pathname.startsWith('/blog')
			? 'blog'
			: page.url.pathname.startsWith('/projects')
				? 'projects'
				: 'home'
	);

	// 两个锚点常驻 layout（路由切换时 layout 不卸载），卡片因此始终是同一组件实例，
	// 路由变化只会触发它向新锚点的 Tween 过渡，动画与之前完全一致。
	let heroAnchor = $state<HTMLElement>();
	let navAnchor = $state<HTMLElement>();

	let panelEl = $state<HTMLElement>();

	// panel 常驻后滚动位置会保留，路由切换时手动回到顶部
	$effect(() => {
		void page.url.pathname;
		panelEl?.scrollTo({ top: 0 });
	});

	// 运行时从背景图提取主题色写入 --accent；bg 是 Vite 处理的资源 URL，
	// 替换 assets 中的图片后（dev 下 HMR 触发整页刷新）会自动重新提取。
	// 提取失败时保留 :root 中的默认 --accent。
	onMount(() => {
		void applyThemeFromImage(bg).catch(() => {});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="bg-layer" style:background-image="url({bg})"></div>
<div class="scrim"></div>

<main class="shell" class:with-nav={section !== 'home'}>
	<div class="nav-anchor" bind:this={navAnchor} aria-hidden="true"></div>

	<div class="stage">
		<div
			class="hero-anchor"
			class:ghost={section !== 'home'}
			bind:this={heroAnchor}
			aria-hidden="true"
		></div>

		<!-- panel 外壳常驻,不随路由重建;key 只作用于内容层 -->
		<div class="panel" class:bare={section === 'home'} bind:this={panelEl}>
			{#key page.url.pathname}
				<div
					class="panel-body"
					in:fade={{ duration: 250, delay: 120 }}
					out:fade={{ duration: 120 }}
				>
					{@render children()}
				</div>
			{/key}
		</div>
	</div>
</main>

<ProfileCard {section} {heroAnchor} {navAnchor} />

<style>
	.shell {
		display: grid;
		grid-template-columns: 0 minmax(0, 1fr);
		min-height: 100dvh;
	}

	.shell.with-nav {
		grid-template-columns: 132px minmax(0, 1fr);
	}

	/* 卡片收窄后的目标位置。主页形态下塌缩为 0，避免溢出占位 */
	.nav-anchor {
		width: 0;
		height: 0;
		margin: auto;
	}

	/* 桌面端：侧栏里居中的一个竖长区域 */
	.shell.with-nav .nav-anchor {
		width: 88px;
		height: min(460px, calc(100dvh - 64px));
	}

	.stage {
		display: grid;
		min-width: 0;
	}

	.stage > * {
		grid-area: 1 / 1;
	}

	/* 卡片居中形态的目标位置：舞台正中 */
	.hero-anchor {
		width: min(430px, calc(100vw - 48px));
		height: min(620px, calc(100dvh - 64px));
		margin: auto;
	}

	/* 留在 DOM 中保持可测量，但不可见 */
	.hero-anchor.ghost {
		visibility: hidden;
	}

	/* 内容容器：层级中的「桌面」——比遮罩亮、比内容卡暗。
	   四周留白让模糊背景透出来，自身用半透明 + 轻微 backdrop 模糊。
	   display: grid + 子元素同格叠放：路由切换时新旧内容交叉淡入，外壳保持不动 */
	.panel {
		display: grid;
		overflow-y: auto;
		/* 固定尺寸：高度不再随内容增长，超出部分在 panel 内部滚动（无限滚动的前提） */
		width: min(920px, calc(100% - 32px));
		height: min(1200px, calc(100dvh - 56px));
		margin: auto;
		padding: clamp(24px, 5vw, 56px) clamp(20px, 5vw, 48px);
		border-radius: 24px;
		border: 1px solid var(--border);
		background: color-mix(in srgb, var(--panel) 55%, transparent);
		-webkit-backdrop-filter: blur(8px) saturate(1.2);
		backdrop-filter: blur(8px) saturate(1.2);
		box-shadow: 0 24px 60px var(--shadow-panel);
		overscroll-behavior: contain;
		transition:
			background 0.3s ease,
			border-color 0.3s ease,
			box-shadow 0.3s ease;
	}

	.panel > * {
		grid-area: 1 / 1;
		min-width: 0;
	}

	/* 主页没有面板内容，去掉容器外观，只留居中的名片卡 */
	.panel.bare {
		background: none;
		border-color: transparent;
		box-shadow: none;
		-webkit-backdrop-filter: none;
		backdrop-filter: none;
	}

	/* 移动端：卡片改为底部横条（会自动追踪锚点动画过去），panel 铺满舞台。
	   本块放在样式表末尾：同优先级下覆盖上面所有基础规则 */
	@media (max-width: 640px) {
		.shell,
		.shell.with-nav {
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: minmax(0, 1fr) 0;
			/* 确定高度：1fr 行才有定论，panel 才能靠 stretch 撑满舞台而不是被内容撑高 */
			height: 100dvh;
		}

		.shell.with-nav {
			grid-template-rows: minmax(0, 1fr) auto;
		}

		.stage {
			grid-row: 1;
		}

		.nav-anchor {
			grid-row: 2;
		}

		/* 底部横条与屏幕同宽、贴住底边，卡片测量后同样贴边（圆角见 ProfileCard） */
		.shell.with-nav .nav-anchor {
			width: 100%;
			height: 72px;
			margin: 0;
		}

		/* panel 固定占满舞台（留一圈窄边距透出背景），内容超高时在内部滚动 */
		.panel {
			width: auto;
			height: auto;
			margin: 12px;
			padding: 24px 20px;
			border-radius: 20px;
		}
	}
</style>
