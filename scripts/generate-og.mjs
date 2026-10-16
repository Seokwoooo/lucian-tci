// Run after starting the local site: node scripts/generate-og.mjs [site-url]
// This image contains only public product copy, never an individual result.
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const base = process.argv[2] || 'http://127.0.0.1:4173/tci/';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
  await page.goto(base);
  const flower = await page.locator('.hero-art .flower').evaluate(node=>node.outerHTML);
  await page.setContent(`<!doctype html><html lang="ko"><head><style>
    @font-face{font-family:Noto;src:url('${new URL('fonts/noto-kr-400.woff2',base)}')}@font-face{font-family:Noto;src:url('${new URL('fonts/noto-kr-600.woff2',base)}');font-weight:600}
    *{box-sizing:border-box}body{margin:0;background:#f7f7f0;color:#303d2d;font-family:Noto,sans-serif;width:1200px;height:630px;padding:47px 64px}header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #dfe3d5;padding-bottom:23px;font-size:19px}header span{font-size:15px;color:#64705e}main{display:flex;align-items:center;justify-content:space-between;padding-top:38px}.copy{width:650px}.eyebrow{color:#64705e;font-size:18px;margin:0 0 17px}h1{font-size:69px;letter-spacing:-3px;line-height:1.3;margin:0;font-weight:600}.sub{font-size:19px;line-height:1.8;color:#64705e;margin:21px 0}.badge{display:inline-block;background:#e8eddf;border-radius:100px;padding:10px 19px;font-size:15px}.flower{width:340px;height:340px;color:#536044}.footer{border-top:1px solid #dfe3d5;margin-top:37px;padding-top:19px;color:#64705e;font-size:13px}
  </style></head><body><header><strong>Lucian Labs</strong><span>lucianlabs.dev/tci</span></header><main><div class="copy"><p class="eyebrow">나의 타고난 기질과 성격, 얼마나 알고 계신가요?</p><h1>무료 TCI 기질검사</h1><p class="sub">289개의 질문으로 내 마음의 결을 살펴보세요.<br>100% 무료. 회원가입 없이 결과까지.</p><span class="badge">나를 알아가는 시간</span></div>${flower}</main><p class="footer">IPIP 공개 문항 기반 비공식 자기이해 테스트입니다. 정식 TCI-RS 검사·임상 진단과 다릅니다.</p></body></html>`);
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:fileURLToPath(new URL('../public/og.png',import.meta.url))});
  console.log('Generated public/og.png (1200 × 630).');
} finally {await browser.close();}
