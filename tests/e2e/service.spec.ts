import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, mkdir } from 'node:fs/promises';
import items from '../../src/data/items.json' with { type: 'json' };
import { domains } from '../../src/data/scales';

const labels=['전혀 나와 맞지 않는다','별로 나와 맞지 않는다','보통이다','대체로 나와 맞는다','매우 나와 잘 맞는다'];
const key='lucian-tci:session:v1';
async function a11y(page:Page) {
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(results.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
}
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}

test('full 289-item journey, reload, reopen, edit, results, PNG/PDF, share and delete',async({page:initial,context},info)=>{
  let page=initial;
  const errors:string[]=[];const external:string[]=[];
  const allowedOrigin = new URL(info.project.use.baseURL!).origin;
  context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  page.on('pageerror',e=>errors.push(e.message));
  context.on('request',request=>{if(!request.url().startsWith(`${allowedOrigin}/`)&&!request.url().startsWith('data:')&&!request.url().startsWith('blob:'))external.push(request.url());});
  await mkdir('output/playwright',{recursive:true});
  await page.goto('./');await page.evaluate(()=>document.fonts.ready);
  await expect(page.getByRole('heading',{name:'무료 TCI 기질검사.',exact:true})).toBeVisible();
  await noOverflow(page);await a11y(page);
  await page.screenshot({path:`output/playwright/${info.project.name}-home.png`,fullPage:true});
  await page.getByRole('button',{name:'검사 시작하기',exact:true}).first().click();
  await expect(page.locator('#main-content')).toBeFocused();
  await expect(page.getByText('정식 TCI-RS 검사와는 다르며', {exact:false}).first()).toBeVisible();
  await page.getByRole('button',{name:'안내를 확인했어요. 시작하기'}).click();
  await expect(page.getByRole('button',{name:'다음 문항'})).toBeDisabled();
  const responses:Record<string,number>={};
  const targets:Record<string,number>={NS:4,HA:2,RD:4,P:5,SD:3,C:4,ST:2};
  for(let i=0;i<items.length;i++){
    if(i===48){await page.close();page=await context.newPage();await page.goto('./#test');}
    await expect(page.getByRole('heading',{name:items[i].korean,exact:true})).toBeVisible();
    const scored=targets[items[i].domain];const response=items[i].reverse?6-scored:scored;responses[items[i].id]=response;
    await page.getByRole('radio',{name:labels[response-1],exact:false}).check();
    if(i===0){await page.screenshot({path:`output/playwright/${info.project.name}-question.png`,fullPage:true});await a11y(page);}
    if(i===7){await page.getByRole('button',{name:'이전',exact:true}).click();await page.getByRole('radio',{name:labels[4]}).check();responses[items[6].id]=5;await page.getByRole('button',{name:'다음 문항'}).click();await expect(page.getByRole('radio',{name:labels[response-1]})).toBeChecked();}
    if(i===24){await page.reload();await expect(page.getByRole('radio',{name:labels[response-1]})).toBeChecked();}
    await page.getByRole('button',{name:i===items.length-1?'최종 답변 확인':'다음 문항',exact:true}).click();
  }
  await expect(page.getByText('289 / 289문항 완료',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'답변 확정하고 결과 보기'}).click();
  await expect(page.getByRole('heading',{name:'지금, 내 마음의 결'})).toBeVisible();
  for(const domain of domains){
    const codes=[...new Set(items.filter(i=>i.domain===domain.code).map(i=>i.subscale))];
    const means=codes.map(code=>{const group=items.filter(i=>i.subscale===code);return group.reduce((sum,item)=>sum+(item.reverse?6-responses[item.id]:responses[item.id]),0)/group.length;});
    const mean=means.reduce((a,b)=>a+b,0)/means.length;
    await expect(page.locator('.profile-row').filter({hasText:domain.name}).locator('strong')).toHaveText(`${mean.toFixed(2)} / 5`);
  }
  await page.reload();await expect(page.getByRole('heading',{name:'지금, 내 마음의 결'})).toBeVisible();
  await noOverflow(page);await a11y(page);
  await page.screenshot({path:`output/playwright/${info.project.name}-result.png`,fullPage:true});
  await page.locator('.domain-detail').first().locator('summary').first().click();
  await page.locator('.sub-detail').first().locator('summary').click();
  await expect(page.getByText('IPIP 원명: Variety-Seeking',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'저장·공유하기',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('button',{name:'PNG 저장',exact:true})).toBeDisabled();
  await page.getByRole('checkbox',{name:'자극추구',exact:true}).check();
  await page.getByRole('checkbox',{name:'위험회피',exact:true}).check();
  await page.getByRole('checkbox',{name:'선택한 영역의 요약 설명도 포함',exact:true}).check();
  await a11y(page);await noOverflow(page);
  await page.screenshot({path:`output/playwright/${info.project.name}-share.png`,fullPage:true});
  const preview=await page.locator('.share-preview pre').innerText();
  expect(preview).toContain('자극추구');expect(preview).not.toContain('자기초월');expect(preview).not.toContain('사회적 민감성');expect(preview).not.toContain(items[0].korean);
  const pngPromise=page.waitForEvent('download');await page.getByRole('button',{name:'PNG 저장',exact:true}).click();const png=await pngPromise;await png.saveAs(`output/playwright/${info.project.name}-export.png`);
  const bytes=await readFile(`output/playwright/${info.project.name}-export.png`);expect(bytes.subarray(1,4).toString()).toBe('PNG');expect(bytes.readUInt32BE(16)).toBe(1080);expect(bytes.readUInt32BE(20)).toBe(1350);expect(bytes.length).toBeGreaterThan(20000);
  for(const domain of domains)await page.getByRole('checkbox',{name:domain.name,exact:true}).check();
  await page.getByRole('checkbox',{name:'PDF에 선택한 영역의 하위척도 상세도 포함'}).check();
  const pdfPromise=page.waitForEvent('download');await page.getByRole('button',{name:'PDF 다운로드',exact:true}).click();const pdf=await pdfPromise;await pdf.saveAs(`output/playwright/${info.project.name}-export.pdf`);
  const pdfBytes=await readFile(`output/playwright/${info.project.name}-export.pdf`);expect(pdfBytes.subarray(0,5).toString()).toBe('%PDF-');expect(pdfBytes.length).toBeGreaterThan(100000);
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.getByRole('button',{name:'일반 링크 복사'}).click();await expect(page.getByRole('status').filter({hasText:'개인 결과가 없는'})).toBeVisible();
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('https://lucianlabs.dev/tci/');
  await page.getByRole('button',{name:'결과 요약 복사',exact:true}).click();expect(await page.evaluate(()=>navigator.clipboard.readText())).toContain('자극추구');
  await page.getByRole('button',{name:'공유 창 닫기'}).click();
  await page.getByRole('button',{name:'저장된 답변 삭제'}).click();await page.getByRole('button',{name:'모든 답변 삭제',exact:true}).click();
  await expect(page.getByRole('heading',{name:'무료 TCI 기질검사.',exact:true})).toBeVisible();
  expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBeNull();
  expect(external).toEqual([]);expect(errors).toEqual([]);
});

test('keyboard answers, incomplete gating, and damaged storage',async({page})=>{
  await page.goto('./#test');await page.keyboard.press('3');await expect(page.getByRole('radio',{name:'보통이다'})).toBeChecked();await page.keyboard.press('Enter');await expect(page.getByRole('heading',{name:items[1].korean,exact:true})).toBeVisible();
  await page.getByRole('button',{name:'답변 목록·문항 이동'}).click();await expect(page.getByRole('button',{name:'답변 확정하고 결과 보기'})).toBeDisabled();
  await page.goto('./#result');await expect(page.getByRole('heading',{name:'무료 TCI 기질검사.',exact:true})).toBeVisible();
  await page.evaluate(k=>localStorage.setItem(k,'{damaged'),key);await page.reload();await expect(page.getByRole('alert')).toContainText('불러오지 못했습니다');
  await page.getByRole('button',{name:'저장된 답변 삭제'}).click();await page.getByRole('button',{name:'모든 답변 삭제',exact:true}).click();expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBeNull();
});

test('blocked localStorage reports failure and still clears the current session',async({page})=>{
  await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('blocked');};Storage.prototype.setItem=()=>{throw new Error('blocked');};Storage.prototype.removeItem=()=>{throw new Error('blocked');};});
  await page.goto('./#test');await page.getByRole('radio',{name:'보통이다'}).check();await expect(page.getByRole('alert')).toContainText('저장하지 못했습니다');
  await expect(page.getByText('이 기기에 저장되지 않음')).toBeVisible();
  await page.getByRole('button',{name:'저장된 답변 삭제'}).click();await page.getByRole('button',{name:'모든 답변 삭제',exact:true}).click();
  await page.goto('./#test');await expect(page.getByRole('radio',{name:'보통이다'})).not.toBeChecked();
});
