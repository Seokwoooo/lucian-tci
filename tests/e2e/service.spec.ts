import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, mkdir } from 'node:fs/promises';
import rawItems from '../../src/data/items.json' with { type: 'json' };
import { domains } from '../../src/data/scales';
import { personaByCode } from '../../src/data/personas';
import { presentationOrder, chapterEnds } from '../../src/lib/order';
import type { Item } from '../../src/types';

const items = rawItems as Item[];
const order = presentationOrder(items);
const ends = chapterEnds(order.length).slice(0, -1);
const labels = ['전혀 나와 맞지 않는다', '별로 나와 맞지 않는다', '보통이다', '대체로 나와 맞는다', '매우 나와 잘 맞는다'];
const key = 'lucian-tci:session:v2';
const option = (page: Page, n: number) => page.getByRole('button', { name: `${n}. ${labels[n - 1]}`, exact: true });
async function a11y(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
}
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
async function pngSize(path: string) { const bytes = await readFile(path); expect(bytes.subarray(1, 4).toString()).toBe('PNG'); return [bytes.readUInt32BE(16), bytes.readUInt32BE(20), bytes.length]; }

test('full 289-item journey with chapters, reload, resume, edit, character result, exports and delete', async ({ page: initial, context }, info) => {
  test.setTimeout(480000);
  let page = initial;
  const errors: string[] = []; const external: string[] = [];
  const origin = new URL(info.project.use.baseURL!).origin;
  const watch = (p: Page) => p.on('pageerror', e => errors.push(e.message));
  watch(page); context.on('page', watch);
  context.on('request', request => { const url = request.url(); if (!url.startsWith(`${origin}/`) && !url.startsWith('data:') && !url.startsWith('blob:')) external.push(url); });
  const out = `output/playwright/${info.project.name}`;
  await mkdir('output/playwright', { recursive: true });

  await page.goto('./'); await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('heading', { level: 1, name: /무료 TCI\s*기질검사/ })).toBeVisible();
  await expect(page.getByText('100% 무료. 회원가입 없이 검사하고 결과까지 확인하세요.')).toBeVisible();
  await noOverflow(page); await a11y(page);
  await page.screenshot({ path: `${out}-home.png`, fullPage: true });
  await page.getByRole('button', { name: '검사 시작하기', exact: true }).first().click();
  await expect(page.getByText('정식 TCI-RS 검사와는 다르며', { exact: false }).first()).toBeVisible();
  await page.getByRole('button', { name: '안내를 확인했어요. 시작하기' }).click();

  const responses: Record<string, number> = {};
  const targets: Record<string, number> = { NS: 4, HA: 2, RD: 4, P: 5, SD: 3, C: 4, ST: 2 };
  for (let i = 0; i < order.length; i++) {
    const item = order[i];
    if (i === 48) { await expect(page.locator('#question-heading')).toHaveText(item.korean); await page.close(); page = await context.newPage(); await page.goto('./#test'); }
    await expect(page.locator('#question-heading')).toHaveText(item.korean);
    const scored = targets[item.domain]; const response = item.reverse ? 6 - scored : scored; responses[item.id] = response;
    if (i === 0) { await a11y(page); await noOverflow(page); await page.screenshot({ path: `${out}-question.png` }); }
    if (i === 24) { await page.reload(); await expect(page.locator('#question-heading')).toHaveText(item.korean); }
    await option(page, response).click();
    if (i === 7) {
      await expect(page.locator('#question-heading')).toHaveText(order[8].korean);
      await page.getByRole('button', { name: '이전', exact: true }).click();
      await expect(page.locator('#question-heading')).toHaveText(item.korean);
      await expect(option(page, response)).toHaveAttribute('aria-pressed', 'true');
      const changed = response === 5 ? 1 : 5;
      await option(page, changed).click();
      responses[item.id] = changed;
    }
    if (ends.includes(i)) {
      await expect(page.getByText(`PART ${ends.indexOf(i) + 1} / 7 완료`)).toBeVisible();
      await expect(page.getByText('최종 결과와 달라질 수 있어요', { exact: false })).toBeVisible();
      if (i === ends[0]) { await a11y(page); await page.screenshot({ path: `${out}-milestone.png` }); }
      await page.getByRole('button', { name: `PART ${ends.indexOf(i) + 2} 시작하기` }).click();
    }
  }
  await expect(page.getByRole('heading', { name: /끝까지 해냈어요/ })).toBeVisible();
  await page.getByRole('button', { name: '답변 확정하고 결과 보기' }).click();

  const means = Object.fromEntries(domains.map(domain => {
    const codes = [...new Set(items.filter(i => i.domain === domain.code).map(i => i.subscale))];
    const subMeans = codes.map(code => { const group = items.filter(i => i.subscale === code); return group.reduce((sum, item) => sum + (item.reverse ? 6 - responses[item.id] : responses[item.id]), 0) / group.length; });
    return [domain.code, subMeans.reduce((a, b) => a + b, 0) / subMeans.length];
  })) as Record<string, number>;
  const persona = personaByCode.get(['NS', 'HA', 'RD', 'P'].map(c => (means[c] > 3 ? 'H' : 'L')).join(''))!;
  await expect(page.getByRole('heading', { level: 1, name: new RegExp(persona.name) })).toBeVisible();
  for (const code of ['NS', 'HA', 'RD', 'P']) await expect(page.locator('.axis-row').filter({ hasText: domains.find(d => d.code === code)!.name }).locator('.axis-score')).toHaveText(`${means[code].toFixed(2)} / 5`);
  for (const code of ['SD', 'C', 'ST']) await expect(page.locator('.char-card').filter({ hasText: domains.find(d => d.code === code)!.name }).locator('.char-score')).toHaveText(`${means[code].toFixed(2)} / 5`);
  await page.reload(); await expect(page.getByRole('heading', { level: 1, name: new RegExp(persona.name) })).toBeVisible();
  await noOverflow(page); await a11y(page);
  await page.screenshot({ path: `${out}-result.png`, fullPage: true });
  await page.getByRole('button', { name: '스탯 보기' }).click();
  await expect(page.getByRole('button', { name: new RegExp(`${persona.name} 캐릭터 카드, 뒷면`) })).toBeVisible();
  await page.locator('.domain-detail').first().locator('summary').click();
  await expect(page.getByText('NS1 · Variety-Seeking', { exact: true })).toBeVisible();

  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: '내 카드 저장·공유' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.card-image')).toBeVisible();
  await a11y(page);
  await page.screenshot({ path: `${out}-share.png`, fullPage: true });
  const feed = page.waitForEvent('download'); await page.getByRole('button', { name: '이미지 저장', exact: true }).click(); await (await feed).saveAs(`${out}-feed.png`);
  const [fw, fh, fbytes] = await pngSize(`${out}-feed.png`); expect([fw, fh]).toEqual([1080, 1350]); expect(fbytes).toBeGreaterThan(40000);
  await page.getByRole('tab', { name: '스토리 9:16' }).click();
  await expect(page.locator('.card-image.story')).toBeVisible();
  const story = page.waitForEvent('download'); await page.getByRole('button', { name: '이미지 저장', exact: true }).click(); await (await story).saveAs(`${out}-story.png`);
  expect((await pngSize(`${out}-story.png`)).slice(0, 2)).toEqual([1080, 1920]);
  await page.getByRole('switch', { name: '카드에 7개 영역 점수 넣기' }).uncheck();
  await expect(page.locator('.card-image')).toHaveAttribute('alt', /점수 없음/);
  const pdf = page.waitForEvent('download'); await page.getByRole('button', { name: '전체 리포트 PDF' }).click(); await (await pdf).saveAs(`${out}-report.pdf`);
  const pdfBytes = await readFile(`${out}-report.pdf`); expect(pdfBytes.subarray(0, 5).toString()).toBe('%PDF-'); expect(pdfBytes.length).toBeGreaterThan(150000);
  await page.getByRole('button', { name: '비교 링크 복사' }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toMatch(new RegExp(`^https://lucianlabs\\.dev/tci/t/${persona.slug}/#vs=1(-\\d{3}){7}$`));
  await page.getByRole('button', { name: '결과 요약 복사' }).click();
  const summary = await page.evaluate(() => navigator.clipboard.readText());
  expect(summary).toContain(persona.name); expect(summary).not.toMatch(/\d\.\d\d/);
  for (const item of order.slice(0, 30)) expect(`${summary}${link}`).not.toContain(item.korean);
  await page.getByRole('button', { name: '공유 창 닫기' }).click();

  await page.getByRole('button', { name: '저장된 답변 삭제' }).click();
  await page.getByRole('button', { name: '모든 답변 삭제', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: /무료 TCI\s*기질검사/ })).toBeVisible();
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBeNull();
  expect(external).toEqual([]); expect(errors).toEqual([]);
});

test('keyboard answers, back navigation, incomplete gating, and damaged storage', async ({ page }) => {
  await page.goto('./#test');
  await expect(page.locator('#question-heading')).toHaveText(order[0].korean);
  await page.keyboard.press('3');
  await expect(page.locator('#question-heading')).toHaveText(order[1].korean);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#question-heading')).toHaveText(order[0].korean);
  await expect(option(page, 3)).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#question-heading')).toHaveText(order[1].korean);
  await page.goto('./#review');
  await expect(page.getByRole('button', { name: '답변 확정하고 결과 보기' })).toBeDisabled();
  await page.goto('./#result');
  await expect(page.getByRole('heading', { level: 1, name: /무료 TCI\s*기질검사/ })).toBeVisible();
  await page.evaluate(k => localStorage.setItem(k, '{damaged'), key); await page.reload();
  await expect(page.getByRole('alert')).toContainText('불러오지 못했습니다');
  await page.getByRole('button', { name: '저장된 답변 삭제' }).click(); await page.getByRole('button', { name: '모든 답변 삭제', exact: true }).click();
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBeNull();
});

test('blocked localStorage reports failure and still clears the current session', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('blocked'); }; Storage.prototype.setItem = () => { throw new Error('blocked'); }; Storage.prototype.removeItem = () => { throw new Error('blocked'); }; });
  await page.goto('./#test');
  await option(page, 3).click();
  await expect(page.getByRole('alert')).toContainText('저장하지 못했습니다');
  await expect(page.getByText('이 기기에 저장되지 않음')).toBeVisible();
  await page.getByRole('button', { name: '저장된 답변 삭제' }).click(); await page.getByRole('button', { name: '모든 답변 삭제', exact: true }).click();
  await page.goto('./#test');
  await expect(page.locator('#question-heading')).toHaveText(order[0].korean);
  await expect(option(page, 3)).toHaveAttribute('aria-pressed', 'false');
});
