import { expect, test } from '@playwright/test';
import { mkdir, rm, writeFile } from 'node:fs/promises';

test('博客列表展示全部文章', async ({ page }) => {
	await page.goto('/blog');
	await expect(page.getByRole('heading', { name: '麻将战斗少女 逆向趣事小记' })).toBeVisible();
});

test('文章页渲染 Markdown 正文', async ({ page }) => {
	await page.goto('/blog');
	await page.getByRole('heading', { name: '麻将战斗少女 逆向趣事小记' }).click();
	await expect(page).toHaveURL('/blog/vfg-reverse-misc');
	await expect(page.locator('.content pre code').first()).toBeVisible();
	// Shiki 高亮生效的标志：服务端输出的 pre 带 shiki class
	await expect(page.locator('.content pre.shiki').first()).toBeVisible();
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

// 图片引用用例的自建夹具：内容是运行时从文件系统扫描的，测试期间临时建一篇文章
const FIXTURE_DIR = 'content/posts/e2e-assets-fixture';
// 1x1 透明 PNG
const PIXEL_PNG = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
	'base64'
);

test.beforeAll(async () => {
	await mkdir(FIXTURE_DIR, { recursive: true });
	await writeFile(
		`${FIXTURE_DIR}/index.md`,
		'---\ntitle: 图片引用夹具\ndate: 2026-01-01\n---\n\n![一张图片](pixel.png)\n'
	);
	await writeFile(`${FIXTURE_DIR}/pixel.png`, PIXEL_PNG);
});

test.afterAll(async () => {
	await rm(FIXTURE_DIR, { recursive: true, force: true });
});

test('正文中的相对图片路径改写到 assets 端点并可访问', async ({ page }) => {
	await page.goto('/blog/e2e-assets-fixture');
	const img = page.locator('.content img');
	await expect(img).toHaveAttribute('src', '/blog/e2e-assets-fixture/assets/pixel.png');
	// 图片真正加载成功
	await expect(img).toBeVisible();

	const response = await page.request.get('/blog/e2e-assets-fixture/assets/pixel.png');
	expect(response.status()).toBe(200);
	expect(response.headers()['content-type']).toBe('image/png');
});

test('assets 端点拒绝路径穿越与文章源文件', async ({ page }) => {
	const traversal = await page.request.get('/blog/e2e-assets-fixture/assets/..%2Findex.md');
	expect(traversal.status()).toBe(404);

	const source = await page.request.get('/blog/e2e-assets-fixture/assets/index.md');
	expect(source.status()).toBe(404);
});
