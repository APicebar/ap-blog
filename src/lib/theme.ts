// 从图片提取主题色并写入 CSS 变量（--accent）。
// 流程：canvas 缩采样 → median-cut 颜色量化 → 按「人口 × 饱和度² × 亮度权重」打分选主色
// → 归一化成暗色 UI 上可用的强调色。提取失败时静默保留 :root 里的默认 --accent。

interface RGB {
	r: number;
	g: number;
	b: number;
}

type Channel = keyof RGB;

const SAMPLE_SIZE = 80; // 缩采样边长，80px 足够代表色彩分布
const MAX_BOXES = 12; // 量化盒子上限

function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`图片加载失败: ${url}`));
		img.src = url;
	});
}

function rgbToHsl({ r, g, b }: RGB): [h: number, s: number, l: number] {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return [0, 0, l];
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h: number;
	if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
	else if (max === g) h = (b - r) / d + 2;
	else h = (r - g) / d + 4;
	return [h * 60, s, l];
}

function channelRange(box: RGB[], ch: Channel): number {
	let min = 255;
	let max = 0;
	for (const p of box) {
		if (p[ch] < min) min = p[ch];
		if (p[ch] > max) max = p[ch];
	}
	return max - min;
}

function widestChannel(box: RGB[]): Channel {
	let best: Channel = 'r';
	let bestRange = -1;
	for (const ch of ['r', 'g', 'b'] as const) {
		const range = channelRange(box, ch);
		if (range > bestRange) {
			bestRange = range;
			best = ch;
		}
	}
	return best;
}

/** 经典的 median-cut：反复把「通道范围最大」的盒子沿中位数切成两半 */
function medianCut(pixels: RGB[], maxBoxes: number): RGB[][] {
	const boxes: RGB[][] = [pixels];
	while (boxes.length < maxBoxes) {
		let idx = -1;
		let range = -1;
		let ch: Channel = 'r';
		boxes.forEach((box, i) => {
			if (box.length < 2) return;
			const c = widestChannel(box);
			const r = channelRange(box, c);
			if (r > range) {
				range = r;
				idx = i;
				ch = c;
			}
		});
		if (idx < 0) break; // 所有盒子都只剩单色，提前结束
		const [box] = boxes.splice(idx, 1);
		box.sort((a, b) => a[ch] - b[ch]);
		const mid = box.length >> 1;
		boxes.push(box.slice(0, mid), box.slice(mid));
	}
	return boxes;
}

function average(box: RGB[]): RGB {
	let r = 0;
	let g = 0;
	let b = 0;
	for (const p of box) {
		r += p.r;
		g += p.g;
		b += p.b;
	}
	const n = box.length;
	return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

export async function applyThemeFromImage(url: string): Promise<void> {
	const img = await loadImage(url);

	const canvas = document.createElement('canvas');
	canvas.width = SAMPLE_SIZE;
	canvas.height = SAMPLE_SIZE;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) return;
	ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
	const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

	const pixels: RGB[] = [];
	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] < 128) continue; // 跳过基本透明的像素
		pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
	}
	if (pixels.length === 0) return;

	// 饱和度取平方：让灰色、棕色很难胜出，挑到的是图片里「最像主题色」的颜色
	let best: { h: number; s: number; l: number } | null = null;
	let bestScore = 0;
	for (const box of medianCut(pixels, MAX_BOXES)) {
		const [h, s, l] = rgbToHsl(average(box));
		const score = box.length * s * s * (1 - Math.min(1, Math.abs(l - 0.55) * 1.5));
		if (score > bestScore) {
			bestScore = score;
			best = { h, s, l };
		}
	}
	if (!best) return;

	// 归一化：暗色 UI 上的强调色需要足够的饱和度和亮度才「跳」得出来
	const s = Math.min(0.85, Math.max(0.45, best.s));
	const l = Math.min(0.7, Math.max(0.6, best.l));
	const h = Math.round(best.h);
	document.documentElement.style.setProperty(
		'--accent',
		`hsl(${h} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`
	);
}
