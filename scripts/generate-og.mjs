// Run with the dev server up: npm run dev, then node scripts/generate-og.mjs [dev-url]
// Captures public link-preview images: public/og.png and public/og/<slug>.png for the 16 characters.
// They contain only product copy and fixed example characters, never an individual result.
import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base = process.argv[2] || 'http://127.0.0.1:4173/tci/';
const source = await readFile(new URL('../src/data/personas.ts', import.meta.url), 'utf8');
const slugs = [...source.matchAll(/slug: '([a-z-]+)'/g)].map(match => match[1]);
if (slugs.length !== 16) throw new Error(`Expected 16 character slugs, found ${slugs.length}`);
await mkdir(new URL('../public/og/', import.meta.url), { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const slug of ['home', ...slugs]) {
    await page.goto(`${base}?og=${slug}`);
    await page.locator('.og').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const target = slug === 'home' ? '../public/og.png' : `../public/og/${slug}.png`;
    await page.screenshot({ path: fileURLToPath(new URL(target, import.meta.url)) });
    console.log(`Generated ${target.replace('../', '')}`);
  }
} finally { await browser.close(); }
