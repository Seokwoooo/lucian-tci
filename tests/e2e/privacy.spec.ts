import { test, expect } from '@playwright/test';
import items from '../../src/data/items.json' with { type: 'json' };

const key = 'lucian-tci:session:v1';

test('changing sharing selection clears denied-clipboard fallback and X includes only selected data', async ({ page }) => {
  await page.addInitScript(({ key, items }) => {
    localStorage.setItem(key, JSON.stringify({version:'2026-10-16.1',answers:Object.fromEntries(items.map(item=>[item.id,3])),position:288,complete:true,updatedAt:Date.now(),timings:{}}));
    Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('denied'))},configurable:true});
    window.open = ((url?: string | URL) => { (window as unknown as { capturedShare: string }).capturedShare=String(url); return null; }) as typeof window.open;
  }, { key, items });
  await page.goto('./#result');
  await page.getByRole('button',{name:'저장·공유하기',exact:true}).click();
  await page.getByRole('checkbox',{name:'자기초월',exact:true}).check();
  await page.getByRole('button',{name:'결과 요약 복사',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'직접 복사할 내용'})).toHaveValue(/자기초월/);
  await page.getByRole('checkbox',{name:'자기초월',exact:true}).uncheck();
  await expect(page.getByRole('textbox',{name:'직접 복사할 내용'})).toHaveCount(0);
  await page.getByRole('checkbox',{name:'자극추구',exact:true}).check();
  await page.getByRole('button',{name:'𝕏 선택한 결과 공유'}).click();
  const url = new URL(await page.evaluate(()=>(window as unknown as {capturedShare:string}).capturedShare));
  expect(url.origin).toBe('https://x.com');
  expect(url.pathname).toBe('/intent/post');
  expect(url.searchParams.get('text')).toContain('자극추구');
  expect(url.searchParams.get('text')).not.toContain('자기초월');
  expect(url.searchParams.get('text')).not.toContain(items[0].korean);
  await page.getByRole('button',{name:'일반 링크 복사'}).click();
  await expect(page.getByRole('textbox',{name:'직접 복사할 내용'})).toHaveValue('https://lucianlabs.dev/tci/');
});

test('answers and deletion synchronize across open tabs', async ({ page, context }) => {
  await page.goto('./#test');
  const other = await context.newPage();
  await other.goto('./#test');
  await page.getByRole('radio',{name:'보통이다'}).check();
  await expect(other.getByRole('radio',{name:'보통이다'})).toBeChecked();
  await page.getByRole('button',{name:'저장된 답변 삭제'}).click();
  await page.getByRole('button',{name:'모든 답변 삭제',exact:true}).click();
  await expect(other.getByRole('heading',{name:'무료 TCI 기질검사.',exact:true})).toBeVisible();
  await other.goto('./#test');
  await expect(other.getByRole('radio',{name:'보통이다'})).not.toBeChecked();
  expect(await other.evaluate(k=>localStorage.getItem(k),key)).toBeNull();
});
