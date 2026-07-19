// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Post } from '$lib/server/posts';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** 文章路由下由根 layout load 读取并缓存的文章，page load 直接复用，避免二次解析 */
			post?: Post | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
