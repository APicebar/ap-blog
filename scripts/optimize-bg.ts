import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('src/lib/assets/bg.png');
const OUT_WEBP = path.resolve('src/lib/assets/bg.webp');
const OUT_OG = path.resolve('static/og-image.png');
const OUT_ACCENT = path.resolve('src/lib/generated/accent.ts');

const SAMPLE_SIZE = 80;
const MAX_BOXES = 12;

interface RGB {
	r: number;
	g: number;
	b: number;
}
type Channel = keyof RGB;

function rgbToHsl({ r, g, b }: RGB): [number, number, number] {
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
		if (idx < 0) break;
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

function extractAccent(data: Buffer, width: number, height: number): string {
	const pixels: RGB[] = [];
	for (let i = 0; i < width * height; i++) {
		const offset = i * 3;
		pixels.push({ r: data[offset], g: data[offset + 1], b: data[offset + 2] });
	}

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

	if (!best) return 'hsl(222 65% 65%)';

	const s = Math.min(0.85, Math.max(0.45, best.s));
	const l = Math.min(0.7, Math.max(0.6, best.l));
	const h = Math.round(best.h);
	return `hsl(${h} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
}

async function main() {
	const img = sharp(SRC);

	// 1. Generate optimized WebP for the blurred background
	await img
		.clone()
		.resize(960, null, { withoutEnlargement: true })
		.webp({ quality: 75 })
		.toFile(OUT_WEBP);

	const webpStat = await import('node:fs').then((fs) => fs.statSync(OUT_WEBP));
	console.log(`bg.webp: ${(webpStat.size / 1024).toFixed(0)} KB (from ${SRC})`);

	// 2. Extract accent color from a small sample
	const { data, info } = await img
		.clone()
		.resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: 'cover' })
		.removeAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });

	const accent = extractAccent(data, info.width, info.height);
	console.log(`accent: ${accent}`);

	mkdirSync(path.dirname(OUT_ACCENT), { recursive: true });
	writeFileSync(OUT_ACCENT, `export const ACCENT = '${accent}';\n`);

	// 3. Generate OG image (1200x630) from background with dark overlay
	const ogOverlay = Buffer.from(
		`<svg width="1200" height="630">
			<rect width="1200" height="630" fill="rgba(11,14,20,0.55)"/>
		</svg>`
	);
	await sharp(SRC)
		.resize(1200, 630, { fit: 'cover' })
		.composite([{ input: ogOverlay, blend: 'over' }])
		.png({ quality: 80 })
		.toFile(OUT_OG);

	const ogStat = await import('node:fs').then((fs) => fs.statSync(OUT_OG));
	console.log(`og-image.png: ${(ogStat.size / 1024).toFixed(0)} KB`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
