<script lang="ts">
	interface Props {
		/** 是否还有更多内容；false 时哨兵卸载，不再触发加载 */
		hasMore: boolean;
		/** 是否正在加载中（防止并发触发） */
		loading: boolean;
		/** 哨兵滚入可视区域时回调（一般是加载下一页/下一批） */
		onload: () => void;
	}

	let { hasMore, loading, onload }: Props = $props();

	let sentinel = $state<HTMLElement>();
	let intersecting = $state(false);

	// 列表在 layout 的 panel 内滚动（overflow-y: auto），observer 的 root 取最近的滚动祖先，
	// rootMargin 才能起到「还没滚到底就提前预取」的效果；找不到则退回视口
	function scrollRootOf(el: HTMLElement): Element | null {
		let node = el.parentElement;
		while (node) {
			const { overflowY } = getComputedStyle(node);
			if (overflowY === 'auto' || overflowY === 'scroll') return node;
			node = node.parentElement;
		}
		return null;
	}

	// 同步判断哨兵是否已进入（或接近）滚动容器的可视区。
	// 不依赖 IntersectionObserver 的异步回调——加载结束后立即复核时，
	// observer 上报的还是加载前的位置，会误触发连续补页
	function nearVisible(el: HTMLElement): boolean {
		const root = scrollRootOf(el);
		const rootBottom = root ? root.getBoundingClientRect().bottom : window.innerHeight;
		return el.getBoundingClientRect().top <= rootBottom + 160;
	}

	$effect(() => {
		const el = sentinel;
		if (!el || !hasMore) return;
		const observer = new IntersectionObserver(
			(entries) => {
				intersecting = entries.some((entry) => entry.isIntersecting);
			},
			{ root: scrollRootOf(el), rootMargin: '160px' }
		);
		observer.observe(el);
		return () => observer.disconnect();
	});

	// intersecting 仅作为「滚动导致相交状态变化」的重估信号；
	// 是否真的加载由 nearVisible 的实时测量决定。
	// 加载结束后若哨兵仍在可视区内（新内容没把它推出去），会接着补下一页直到填满
	$effect(() => {
		void intersecting;
		const el = sentinel;
		if (el && hasMore && !loading && nearVisible(el)) onload();
	});
</script>

{#if hasMore}
	<div class="sentinel" bind:this={sentinel} aria-hidden="true">
		{#if loading}
			加载中…
		{/if}
	</div>
{/if}

<style>
	.sentinel {
		min-height: 32px;
		display: grid;
		place-items: center;
		color: var(--muted);
		font-size: 13px;
	}
</style>
