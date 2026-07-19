<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import { profile, type SectionId } from '$lib/profile';

	interface Props {
		/** 当前板块；'home' 时卡片是居中的个人主页，其余时是导航栏 */
		section: SectionId;
		/** 主页锚点：卡片居中形态要对齐到的占位元素 */
		heroAnchor: HTMLElement | undefined;
		/** 导航锚点：卡片收窄形态要对齐到的占位元素 */
		navAnchor: HTMLElement | undefined;
	}

	let { section, heroAnchor, navAnchor }: Props = $props();

	interface Rect {
		x: number;
		y: number;
		w: number;
		h: number;
	}

	// 卡片的位置尺寸全部由 Tween 驱动：目标锚点变化时自动平滑过渡（移动 + 缩放）
	const rect = new Tween<Rect>({ x: 0, y: 0, w: 0, h: 0 }, { duration: 350, easing: cubicOut });
	let ready = $state(false);

	// 导航栏方向由锚点形状推导：宽大于高时是横向底栏（移动端），否则是竖向侧栏。
	// 不需要额外断点判断——锚点长什么样，导航内容就排成什么方向。
	const horizontal = $derived(rect.current.w > rect.current.h);

	function measure(): Rect | null {
		const anchor = section === 'home' ? heroAnchor : navAnchor;
		if (!anchor) return null;
		const r = anchor.getBoundingClientRect();
		return { x: r.left, y: r.top, w: r.width, h: r.height };
	}

	function retarget() {
		const target = measure();
		if (target) rect.target = target;
	}

	$effect(() => {
		void section; // 显式依赖：板块切换时重新测量目标锚点
		const target = measure();
		if (!target) return;
		if (ready) {
			rect.target = target;
		} else {
			// 首次渲染直接落位，不播放动画
			rect.set(target, { duration: 0 });
			ready = true;
		}
	});

	// 锚点自身尺寸变化（媒体查询生效、字体加载、面板撑开布局等）时重新对齐。
	// 位置变化但尺寸不变的场景（如居中锚点随窗口平移）由下面的 window resize 兜底。
	$effect(() => {
		const anchors = [heroAnchor, navAnchor].filter((a): a is HTMLElement => !!a);
		const observer = new ResizeObserver(retarget);
		for (const a of anchors) observer.observe(a);
		return () => observer.disconnect();
	});
</script>

<svelte:window onresize={retarget} />

{#if ready}
	<div
		class="card"
		class:compact={section !== 'home'}
		class:horizontal
		style:left="{rect.current.x}px"
		style:top="{rect.current.y}px"
		style:width="{rect.current.w}px"
		style:height="{rect.current.h}px"
	>
		{#if section === 'home'}
			<!-- 居中形态：完整个人介绍 -->
			<div class="layer hero" in:fade={{ duration: 200, delay: 280 }} out:fade={{ duration: 140 }}>
				<div class="avatar">{profile.avatar}</div>
				<h1>{profile.name}</h1>
				<p class="tagline">{profile.tagline}</p>
				<nav class="links">
					{#each profile.links as link (link.label)}
						{#if link.kind === 'section'}
							<a class="link" href={resolve(link.href)}>
								<span class="icon">{link.icon}</span>
								<span class="label">{link.label}</span>
								<span class="blurb">{link.blurb}</span>
							</a>
						{:else}
							<!-- 外部链接无需 resolve() -->
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a class="link" href={link.href} target="_blank" rel="noreferrer">
								<span class="icon">{link.icon}</span>
								<span class="label">{link.label}</span>
								<span class="blurb">外部链接 ↗</span>
							</a>
						{/if}
					{/each}
				</nav>
			</div>
		{:else}
			<!-- 收窄形态：竖排导航栏 -->
			<div
				class="layer rail"
				class:horizontal
				in:fade={{ duration: 200, delay: 280 }}
				out:fade={{ duration: 140 }}
			>
				<a class="rail-item avatar-mini" href={resolve('/')} title="回到主页" aria-label="回到主页">
					{profile.avatar}
				</a>
				<span class="divider"></span>
				{#each profile.links as link (link.label)}
					{#if link.kind === 'section'}
						<a
							class="rail-item"
							class:active={section === link.section}
							href={resolve(link.href)}
							title={link.label}
							aria-label={link.label}
						>
							{link.icon}
						</a>
					{:else}
						<!-- 外部链接无需 resolve() -->
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						<a
							class="rail-item"
							href={link.href}
							target="_blank"
							rel="noreferrer"
							title={link.label}
							aria-label={link.label}
						>
							{link.icon}
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					{/if}
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.card {
		position: fixed;
		z-index: 10;
		overflow: hidden;
		border-radius: 32px;
		/* 毛玻璃：半透明渐变 + 背景模糊，透出底下的背景图 */
		background: linear-gradient(
			165deg,
			color-mix(in srgb, var(--panel-2) 76%, transparent),
			color-mix(in srgb, var(--panel) 76%, transparent)
		);
		-webkit-backdrop-filter: blur(22px) saturate(1.4);
		backdrop-filter: blur(22px) saturate(1.4);
		border: 1px solid var(--border);
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
		transition: border-radius 0.2s ease;
	}

	.card.compact {
		border-radius: 28px;
	}

	/* 横向底栏（移动端）贴住屏幕底边，下方不再留圆角 */
	.card.compact.horizontal {
		border-radius: 20px 20px 0 0;
	}

	.layer {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	/* ---- 居中形态 ---- */

	.hero {
		justify-content: center;
		gap: 10px;
		padding: 28px;
		text-align: center;
	}

	.avatar {
		width: 76px;
		height: 76px;
		display: grid;
		place-items: center;
		font-size: 40px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		border: 1px solid var(--border);
	}

	h1 {
		margin: 6px 0 0;
		font-size: 24px;
		letter-spacing: 0.02em;
	}

	.tagline {
		margin: 0 0 14px;
		color: var(--muted);
		font-size: 14px;
	}

	.links {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
	}

	.link {
		display: grid;
		grid-template-columns: 28px auto 1fr;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		border-radius: 14px;
		border: 1px solid var(--border);
		background: rgba(255, 255, 255, 0.02);
		text-decoration: none;
		text-align: left;
		transition:
			background 0.15s ease,
			border-color 0.15s ease,
			transform 0.15s ease;
	}

	.link:hover {
		background: color-mix(in srgb, var(--accent) 10%, transparent);
		border-color: color-mix(in srgb, var(--accent) 40%, transparent);
		transform: translateY(-1px);
	}

	.link .icon {
		font-size: 18px;
	}

	.link .label {
		font-weight: 600;
		white-space: nowrap;
	}

	.link .blurb {
		color: var(--muted);
		font-size: 12px;
		text-align: right;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* ---- 导航栏形态 ---- */

	.rail {
		gap: 8px;
		padding: 14px 0;
	}

	.rail-item {
		width: 52px;
		height: 52px;
		display: grid;
		place-items: center;
		font-size: 22px;
		border-radius: 16px;
		text-decoration: none;
		border: 1px solid transparent;
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
	}

	.rail-item:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.rail-item.active {
		background: color-mix(in srgb, var(--accent) 16%, transparent);
		border-color: color-mix(in srgb, var(--accent) 45%, transparent);
	}

	.avatar-mini {
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		border: 1px solid var(--border);
		border-radius: 50%;
	}

	.divider {
		width: 32px;
		height: 1px;
		background: var(--border);
		margin: 4px 0;
	}

	/* 横向形态（移动端底栏）：由锚点形状推导，见 .rail.horizontal */
	.rail.horizontal {
		flex-direction: row;
		justify-content: center;
		padding: 0 14px;
	}

	.rail.horizontal .divider {
		width: 1px;
		height: 32px;
		margin: 0 4px;
	}
</style>
