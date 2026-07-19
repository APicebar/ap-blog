import { expect, test } from '@playwright/test';

test('博客列表展示全部文章', async ({ page }) => {
	await page.goto('/blog');
	await expect(page.getByRole('heading', { name: '为什么我喜欢 Svelte 的 Tween' })).toBeVisible();
	await expect(page.getByRole('heading', { name: '用 FLIP 思路做共享元素过渡' })).toBeVisible();
	await expect(page.getByRole('heading', { name: '我的博客其实是一堆 Markdown' })).toBeVisible();
});

test('文章页渲染 Markdown 正文', async ({ page }) => {
	await page.goto('/blog');
	await page.getByRole('heading', { name: '我的博客其实是一堆 Markdown' }).click();
	await expect(page).toHaveURL('/blog/blog-is-just-markdown');
	await expect(page.locator('.content pre code')).toBeVisible();
});

test('不存在或非法的 slug 返回 404', async ({ page }) => {
	const missing = await page.goto('/blog/does-not-exist');
	expect(missing?.status()).toBe(404);

	const traversal = await page.goto('/blog/..%2F..%2Fpackage');
	expect(traversal?.status()).toBe(404);
});

test('不存在的路径下名片卡为导航栏形态，不与错误页重叠', async ({ page }) => {
	const response = await page.goto('/nonexist');
	expect(response?.status()).toBe(404);
	// 导航栏形态：compact 卡片可见，居中 hero 形态不出现
	await expect(page.locator('.card.compact')).toBeVisible();
	await expect(page.locator('.card .hero')).toHaveCount(0);
});
