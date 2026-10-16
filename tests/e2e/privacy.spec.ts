import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import rawItems from '../../src/data/items.json' with { type: 'json' };
import { presentationOrder } from '../../src/lib/order';
import type { Item } from '../../src/types';

const items = rawItems as Item[];
const order = presentationOrder(items);
const key = 'lucian-tci:session:v2';
const friendKey = 'lucian-tci:friend:v1';
const token = '1-380-360-240-250-300-320-410';
const complete = { version: '2026-10-16.1', order: 'spread-1', answers: Object.fromEntries(items.map(item => [item.id, item.reverse ? 2 : 4])), position: 288, complete: true, updatedAt: 1, timings: {} };
async function a11y(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
}

test('a friend link shows that character, keeps the friend only after a click, then compares', async ({ page }) => {
  await page.goto(`./t/curious-cat/#vs=${token}`);
  await expect(page.getByRole('heading', { level: 1, name: /친구의 캐릭터는.*호기심 고양이/ })).toBeVisible();
  await a11y(page);
  expect(await page.evaluate(k => localStorage.getItem(k), friendKey)).toBeNull();
  await page.getByRole('button', { name: '나도 검사하고 비교하기' }).first().click();
  await expect(page.getByText('친구 결과를 보관해 뒀어요', { exact: false })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/tci/');
  expect(await page.evaluate(k => localStorage.getItem(k), friendKey)).toBe(token);
  await page.evaluate(([k, s]) => localStorage.setItem(k as string, JSON.stringify(s)), [key, complete] as const);
  await page.goto('./#result'); await page.reload();
  const section = page.locator('#friend-compare');
  await expect(section.getByText('같은 방향', { exact: true })).toBeVisible();
  await expect(section.getByText('관계가 잘 맞는지, 잘 될지를 판단하지 않습니다', { exact: false })).toBeVisible();
  await a11y(page);
  await section.getByRole('button', { name: '저장된 친구 결과 지우기' }).click();
  expect(await page.evaluate(k => localStorage.getItem(k), friendKey)).toBeNull();
  await expect(section.getByRole('button', { name: '비교 링크 만들기' })).toBeVisible();
});

test('X posts the score-free character link, and a denied clipboard falls back to visible text', async ({ page }) => {
  await page.addInitScript(([k, s]) => {
    localStorage.setItem(k as string, JSON.stringify(s));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) }, configurable: true });
    window.open = ((url?: string | URL) => { (window as unknown as { captured: string }).captured = String(url); return null; }) as typeof window.open;
  }, [key, complete] as const);
  await page.goto('./#result');
  await page.getByRole('button', { name: '내 카드 저장·공유' }).first().click();
  await page.getByRole('button', { name: '𝕏 에 올리기' }).click();
  const url = new URL(await page.evaluate(() => (window as unknown as { captured: string }).captured));
  expect(url.origin + url.pathname).toBe('https://x.com/intent/post');
  expect(url.searchParams.get('url')).toMatch(/^https:\/\/lucianlabs\.dev\/tci\/t\/[a-z-]+\/$/);
  expect(url.searchParams.get('text')).not.toMatch(/\d\.\d\d/);
  expect(url.searchParams.get('text')).not.toContain(order[0].korean);
  await page.getByRole('button', { name: '비교 링크 복사' }).click();
  await expect(page.getByRole('textbox', { name: '직접 복사할 내용' })).toHaveValue(/#vs=1(-\d{3}){7}$/);
});

test('the character gallery opens shareable character pages and page links still work there', async ({ page }) => {
  await page.goto('./');
  await page.locator('#characters').getByRole('button', { name: /호기심 고양이/ }).click();
  await expect(page).toHaveURL(/\/tci\/t\/curious-cat\/$/);
  await expect(page.getByRole('heading', { level: 1, name: /호기심 고양이/ })).toBeVisible();
  await a11y(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('contentinfo').getByRole('link', { name: '채점 방법' }).click();
  await expect(page.getByRole('heading', { level: 1, name: '점수는 이렇게 계산해요' })).toBeVisible();
  await expect(page.getByText('3보다 크면 H', { exact: false })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: /호기심 고양이/ })).toBeVisible();
});

test('answers and deletion synchronize across open tabs', async ({ page, context }) => {
  await page.goto('./#test');
  const other = await context.newPage();
  await other.goto('./#test');
  await page.getByRole('button', { name: '3. 보통이다', exact: true }).click();
  await expect(other.locator('#question-heading')).toHaveText(order[1].korean);
  await page.getByRole('button', { name: '저장된 답변 삭제' }).click();
  await page.getByRole('button', { name: '모든 답변 삭제', exact: true }).click();
  await expect(other.getByRole('heading', { level: 1, name: /무료 TCI\s*기질검사/ })).toBeVisible();
  expect(await other.evaluate(k => localStorage.getItem(k), key)).toBeNull();
});
