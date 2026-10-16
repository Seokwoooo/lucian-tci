import { domains, subscales } from '../data/scales';
import { band, domainStories, subscaleLines, subscaleSentence } from '../data/narratives';
import { findTwist, mascotSignals, meansOf, readPersona, strongestPoints, type PersonaReading } from './persona';
import { mascotDataUrl } from './mascot';
import type { ScoreResult } from '../types';

export type CardFormat = 'feed' | 'story';
export interface CardOptions { format: CardFormat; includeScores: boolean }

const FONT = '"Noto Sans KR"';
const INK = '#1D1B2F';
const INK2 = '#4A4760';
const HOST = 'lucianlabs.dev/tci';
const DISCLOSURE = '비공식 IPIP 기반 · 정식 TCI-RS 아님 · 규준·백분위 아님';
const REPORT_NOTE = '본 리포트는 IPIP 공개 문항으로 만든 비공식 자기이해 테스트 결과입니다. 정식 TCI-RS 검사와 다르며 임상 진단을 대신하지 않습니다. 점수는 역채점 후 응답 평균(1~5)이고 한국인 평균·백분위가 아닙니다. 캐릭터 이름은 네 기질 평균이 3보다 높은지를 조합한 별명입니다.';

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  return `rgb(${mix(n >> 16)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
}

/** Plain text a visitor can copy; scores only when they keep the score option on. */
export function summaryText(result: ScoreResult, includeScores: boolean, link: string): string {
  const { persona, axes, gear } = readPersona(meansOf(result));
  return [
    `나의 기질 캐릭터: ${persona.emoji} ${persona.name}`,
    `“${persona.tagline}”`,
    axes.map(a => a.word).join(' · '),
    `성격 무기: ${gear.item} (${gear.name})`,
    ...(includeScores ? [result.domains.map(s => `${domains.find(d => d.code === s.code)!.name} ${s.mean.toFixed(2)}`).join(' / ') + ' (1–5 응답 평균)'] : []),
    `무료 TCI 기질검사 · ${DISCLOSURE}`,
    link,
  ].join('\n');
}

export function shareText(result: ScoreResult): string {
  const { persona } = readPersona(meansOf(result));
  return `나의 기질 캐릭터는 ‘${persona.name}’ ${persona.emoji}\n“${persona.tagline}”\n\n289문항 무료 TCI 기질검사 해 봤는데 꽤 디테일함. 너는 무슨 캐릭터 나와?`;
}

async function loadFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) throw new Error('내보내기는 글꼴을 지원하는 브라우저에서 실행해 주세요.');
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const loaded = await Promise.race([
      Promise.all([400, 600, 800].map(weight => document.fonts.load(`${weight} 28px ${FONT}`, '나의 기질 캐릭터 가나다라마바사 0123'))),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('font timeout')), 15000); }),
    ]);
    if (loaded.some(faces => faces.length === 0)) throw new Error('font unavailable');
  } catch {
    throw new Error('한글 글꼴을 불러오지 못해 이미지를 만들지 못했어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.');
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('캐릭터 그림을 불러오지 못했어요.')); image.src = src; });
}

function canvasContext(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('이 브라우저에서 이미지 내보내기를 사용할 수 없습니다.');
  ctx.textBaseline = 'top';
  return { canvas, ctx };
}
function font(ctx: CanvasRenderingContext2D, size: number, weight = 400, color = INK, align: CanvasTextAlign = 'left') {
  ctx.font = `${weight} ${size}px ${FONT}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'top';
}
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
/** Measure real Unicode characters; do not cut Korean by byte or stretch text. */
export function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  return text.split('\n').flatMap(paragraph => {
    const lines: string[] = [];
    let line = '';
    for (const character of Array.from(paragraph)) {
      if (line && ctx.measureText(line + character).width > width && !/[.,!?;:…。，、）)\]”’]/u.test(character)) { lines.push(line.trimEnd()); line = character.trimStart(); }
      else line += character;
    }
    lines.push(line);
    return lines;
  });
}
function lines(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, size: number, weight = 400, color = INK, height = 1.5, align: CanvasTextAlign = 'left', max = 99): number {
  font(ctx, size, weight, color, align);
  let rows = wrap(ctx, text, width);
  if (rows.length > max) { rows = rows.slice(0, max); rows[max - 1] = rows[max - 1].replace(/.$/u, '…'); }
  for (const row of rows) { ctx.fillText(row, x, y); y += size * height; }
  return y;
}
function fitFont(ctx: CanvasRenderingContext2D, text: string, width: number, size: number, weight: number): number {
  for (; size > 40; size -= 4) { ctx.font = `${weight} ${size}px ${FONT}`; if (ctx.measureText(text).width <= width) break; }
  return size;
}
function stickerCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.fillStyle = INK; rr(ctx, x + 14, y + 16, w, h, r); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; rr(ctx, x, y, w, h, r); ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = INK; rr(ctx, x, y, w, h, r); ctx.stroke();
}
function chips(ctx: CanvasRenderingContext2D, words: string[], center: number, y: number, maxWidth: number, size: number, fill: string, color: string): number {
  font(ctx, size, 600, color, 'left');
  const pad = size * 0.75, height = size * 1.9, gap = size * 0.4;
  const widths = words.map(word => ctx.measureText(word).width + pad * 2);
  const rows: number[][] = [[]];
  let rowWidth = 0;
  widths.forEach((w, i) => { if (rows[rows.length - 1].length && rowWidth + gap + w > maxWidth) { rows.push([]); rowWidth = 0; } rowWidth += (rows[rows.length - 1].length ? gap : 0) + w; rows[rows.length - 1].push(i); });
  for (const row of rows) {
    const total = row.reduce((sum, i) => sum + widths[i], 0) + gap * (row.length - 1);
    let x = center - total / 2;
    for (const i of row) { ctx.fillStyle = fill; rr(ctx, x, y, widths[i], height, height / 2); ctx.fill(); font(ctx, size, 600, color, 'left'); ctx.fillText(words[i], x + pad, y + (height - size * 1.18) / 2); x += widths[i] + gap; }
    y += height + gap;
  }
  return y;
}
function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, mean: number, color: string) {
  ctx.fillStyle = '#EEEAF2'; rr(ctx, x, y, w, h, h / 2); ctx.fill();
  const fill = Math.max(h, (mean - 1) / 4 * w);
  ctx.fillStyle = color; rr(ctx, x, y, fill, h, h / 2); ctx.fill();
  ctx.fillStyle = 'rgba(29,27,47,.35)'; ctx.fillRect(x + w / 2 - 1, y - 4, 2, h + 8);
}
function scoreRows(ctx: CanvasRenderingContext2D, result: ScoreResult, x: number, y: number, w: number, rowHeight: number, size: number, codes = domains.map(d => d.code)) {
  for (const code of codes) {
    const d = domains.find(v => v.code === code)!; const mean = result.domains.find(s => s.code === code)!.mean;
    font(ctx, size, 600, INK); ctx.fillText(d.name, x, y);
    font(ctx, size, 800, INK, 'right'); ctx.fillText(mean.toFixed(2), x + w, y);
    bar(ctx, x, y + size * 1.45, w, Math.round(size * 0.48), mean, d.color);
    y += rowHeight;
  }
  return y;
}

export async function renderCard(result: ScoreResult, options: CardOptions): Promise<HTMLCanvasElement> {
  await loadFonts();
  const means = meansOf(result);
  const reading = readPersona(means);
  const { persona, axes, gear } = reading;
  const story = options.format === 'story';
  const W = 1080, H = story ? 1920 : 1350;
  const { canvas, ctx } = canvasContext(W, H);
  const pale = shade(persona.color, 0.82), light = shade(persona.color, 0.55), dark = shade(persona.color, -0.4);
  ctx.fillStyle = pale; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = light; ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.arc(W - 120, 150, 240, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(110, H - 140, 200, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  const mascot = await loadImage(mascotDataUrl(mascotSignals(means), persona.color, false));
  if (!story) {
    font(ctx, 30, 600, INK2); ctx.fillText('LUCIAN LABS  ·  무료 TCI 기질검사', 72, 62);
    stickerCard(ctx, 60, 124, 960, 1086, 56);
    font(ctx, 34, 600, dark, 'center'); ctx.fillText('나의 기질 캐릭터', W / 2, 168);
    ctx.drawImage(mascot, W / 2 - 195, 210, 390, 390);
    const size = fitFont(ctx, persona.name, 860, 108, 800);
    font(ctx, size, 800, INK, 'center'); ctx.fillText(persona.name, W / 2, 610 + (108 - size) / 2);
    lines(ctx, persona.tagline, W / 2, 748, 820, 34, 400, INK2, 1.45, 'center', 2);
    let y = chips(ctx, axes.map(a => a.word), W / 2, 852, 880, 28, pale, dark);
    if (options.includeScores) {
      y = Math.max(y + 4, 948);
      scoreRows(ctx, result, 110, y, 400, 60, 25, ['NS', 'HA', 'RD', 'P']);
      scoreRows(ctx, result, 570, y, 400, 60, 25, ['SD', 'C', 'ST']);
      font(ctx, 24, 600, dark); ctx.fillText(`성격 무기 · ${gear.item}`, 570, y + 60 * 3 + 4);
    } else {
      font(ctx, 32, 600, dark, 'center'); ctx.fillText(`성격 무기 · ${gear.item}`, W / 2, Math.max(y + 24, 990));
      font(ctx, 28, 400, INK2, 'center'); ctx.fillText(gear.power, W / 2, Math.max(y + 24, 990) + 54);
    }
    font(ctx, 28, 600, INK); ctx.fillText(persona.tags.map(t => `#${t}`).join('  '), 72, 1246);
    font(ctx, 32, 800, INK, 'right'); ctx.fillText(HOST, W - 72, 1242);
    font(ctx, 21, 400, INK2); ctx.fillText(DISCLOSURE, 72, 1296);
  } else {
    font(ctx, 44, 600, dark, 'center'); ctx.fillText('나의 기질 캐릭터는', W / 2, 104);
    font(ctx, 40, 400, INK2, 'center');
    const taglineRows = Math.min(2, wrap(ctx, persona.tagline, 800).length);
    const tagY = 846, chipY = tagY + taglineRows * 58 + 26, gearY = chipY + 74 + 16, cardBottom = gearY + 128;
    stickerCard(ctx, 80, 180, 920, cardBottom - 180, 60);
    ctx.drawImage(mascot, W / 2 - 225, 206, 450, 450);
    const size = fitFont(ctx, persona.name, 840, 124, 800);
    font(ctx, size, 800, INK, 'center'); ctx.fillText(persona.name, W / 2, 680 + (124 - size) / 2);
    lines(ctx, persona.tagline, W / 2, tagY, 800, 40, 400, INK2, 1.45, 'center', 2);
    chips(ctx, axes.map(a => a.word), W / 2, chipY, 840, 32, pale, dark);
    font(ctx, 34, 600, dark, 'center'); ctx.fillText(`성격 무기 · ${gear.item}`, W / 2, gearY);
    font(ctx, 28, 400, INK2, 'center'); ctx.fillText(gear.power, W / 2, gearY + 52);
    if (options.includeScores) {
      font(ctx, 28, 600, INK2); ctx.fillText('7가지 영역 · 응답 평균 1–5', 110, cardBottom + 48);
      scoreRows(ctx, result, 110, cardBottom + 100, 860, 58, 27);
    } else {
      lines(ctx, persona.tags.map(t => `#${t}`).join('  '), W / 2, cardBottom + 90, 860, 38, 600, INK, 1.4, 'center');
    }
    font(ctx, 52, 800, INK, 'center'); ctx.fillText('너는 무슨 캐릭터일까?', W / 2, 1712);
    font(ctx, 36, 800, dark, 'center'); ctx.fillText(`${HOST}  ·  무료 · 회원가입 없음`, W / 2, 1786);
    font(ctx, 24, 400, INK2, 'center'); ctx.fillText(DISCLOSURE, W / 2, 1850);
  }
  return canvas;
}

export function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('이미지를 만들지 못했어요.')), 'image/png'));
}
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.rel = 'noopener';
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function cardFilename(result: ScoreResult, options: CardOptions): string {
  return `lucian-tci-${readPersona(meansOf(result)).persona.slug}-${options.format}.png`;
}

/** A multi-page image PDF: Korean glyph shapes are preserved; text is not searchable. */
export async function downloadReport(result: ScoreResult): Promise<void> {
  await loadFonts();
  const means = meansOf(result);
  const reading: PersonaReading = readPersona(means);
  const { persona, axes, gear } = reading;
  const mascot = await loadImage(mascotDataUrl(mascotSignals(means), persona.color, true));
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const W = 1240, H = 1754, M = 96, bottom = H - 170;
  let page = 0, y = 0;
  let { canvas, ctx } = canvasContext(W, H);
  function start() {
    ({ canvas, ctx } = canvasContext(W, H));
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = persona.color; ctx.fillRect(0, 0, W, 14);
    font(ctx, 22, 600, INK2); ctx.fillText('LUCIAN LABS · 무료 TCI 기질검사 리포트', M, 50);
    font(ctx, 22, 400, INK2, 'right'); ctx.fillText(new Date().toLocaleDateString('ko-KR'), W - M, 50);
    y = 120;
  }
  function finish() {
    page++;
    lines(ctx, REPORT_NOTE, M, H - 140, W - M * 2, 18, 400, INK2, 1.55);
    font(ctx, 18, 600, INK2, 'right'); ctx.fillText(`${page}`, W - M, H - 50);
    if (page > 1) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297, undefined, 'FAST');
  }
  function ensure(height: number) { if (y + height > bottom) { finish(); start(); } }
  function heading(text: string, kicker?: string) {
    ensure(110);
    if (kicker) { font(ctx, 20, 600, shade(persona.color, -0.4)); ctx.fillText(kicker, M, y); y += 34; }
    font(ctx, 38, 800, INK); ctx.fillText(text, M, y); y += 66;
  }
  function para(text: string, size = 24, weight = 400, color = INK2, indent = 0) {
    font(ctx, size, weight, color);
    const rows = wrap(ctx, text, W - M * 2 - indent);
    ensure(rows.length * size * 1.6);
    y = lines(ctx, text, M + indent, y, W - M * 2 - indent, size, weight, color, 1.6) + 10;
  }
  start();
  ctx.drawImage(mascot, M, y, 320, 320);
  font(ctx, 24, 600, shade(persona.color, -0.4)); ctx.fillText('나의 기질 캐릭터', M + 360, y + 20);
  font(ctx, 72, 800, INK); ctx.fillText(`${persona.name}`, M + 360, y + 60);
  lines(ctx, persona.tagline, M + 360, y + 160, W - M * 2 - 360, 28, 400, INK2, 1.5);
  chips(ctx, axes.map(a => `${a.word} · ${a.degree}`), M + 360 + (W - M * 2 - 360) / 2, y + 250, W - M * 2 - 360, 22, shade(persona.color, 0.82), shade(persona.color, -0.4));
  y += 360;
  para(persona.summary, 26, 400, INK);
  para(`성격 무기 · ${gear.item}: ${gear.power} (${gear.name} ${gear.mean.toFixed(2)} / 5)`, 24, 600, INK);
  heading('이런 모습, 익숙하지 않나요?');
  persona.traits.forEach(t => para(`•  ${t}`, 24, 400, INK));
  heading('이럴 때 빛나요 · 이럴 땐 지칠 수 있어요');
  persona.strengths.forEach(t => para(`+  ${t}`, 24, 400, INK));
  persona.watchouts.forEach(t => para(`−  ${t}`, 24, 400, INK));
  heading('4가지 기질 조합', '캐릭터를 만든 재료');
  for (const axis of axes) {
    const d = domains.find(v => v.code === axis.code)!; const s = domainStories[axis.code][band(axis.mean)];
    ensure(150);
    font(ctx, 26, 600, INK); ctx.fillText(`${d.name} · ${axis.word}`, M, y);
    font(ctx, 26, 800, INK, 'right'); ctx.fillText(`${axis.mean.toFixed(2)} / 5`, W - M, y);
    bar(ctx, M, y + 42, W - M * 2, 14, axis.mean, d.color); y += 76;
    para(`${s.title}. ${s.text}`, 22);
  }
  heading('3가지 성격 영역', '지금의 나를 받쳐 주는 힘');
  for (const code of ['SD', 'C', 'ST'] as const) {
    const d = domains.find(v => v.code === code)!; const m = means[code]; const s = domainStories[code][band(m)];
    ensure(150);
    font(ctx, 26, 600, INK); ctx.fillText(d.name, M, y);
    font(ctx, 26, 800, INK, 'right'); ctx.fillText(`${m.toFixed(2)} / 5`, W - M, y);
    bar(ctx, M, y + 42, W - M * 2, 14, m, d.color); y += 76;
    para(`${s.title}. ${s.text}${domainStories[code].note ? ` ${domainStories[code].note}` : ''}`, 22);
  }
  const twist = findTwist(result);
  heading('반전 포인트와 가장 뚜렷한 세부 성향');
  para(twist ? `반전: ${domains.find(d => d.code === twist.domain)!.name}은(는) ${twist.domainMean > 3 ? '높은' : '낮은'} 편인데 ‘${twist.nick}’은(는) 반대예요. “${twist.text}” (${twist.sub.code} ${twist.sub.mean.toFixed(2)})` : '반전: 영역 안의 세부 성향이 대부분 같은 방향이에요.', 22, 400, INK);
  strongestPoints(result).forEach((s, i) => para(`${i + 1}. ${s.nick} — ${s.text} (${s.code} ${s.mean.toFixed(2)})`, 22, 400, INK));
  heading('30가지 세부 결과', '응답 평균 1–5 · 가운데 선이 3');
  for (const domain of domains) {
    ensure(90);
    font(ctx, 28, 800, INK); ctx.fillText(`${domain.name} ${result.domains.find(s => s.code === domain.code)!.mean.toFixed(2)}`, M, y); y += 52;
    for (const sub of result.subscales.filter(s => s.domain === domain.code)) {
      const meta = subscales.find(s => s.code === sub.code)!;
      ensure(120);
      font(ctx, 22, 600, INK); ctx.fillText(`${subscaleLines[sub.code].nick}  ·  ${sub.code} ${meta.english}`, M, y);
      font(ctx, 22, 800, INK, 'right'); ctx.fillText(sub.mean.toFixed(2), W - M, y);
      bar(ctx, M, y + 36, W - M * 2, 10, sub.mean, domain.color); y += 60;
      para(subscaleSentence(sub.code, sub.mean), 20, 400, INK2);
    }
    y += 12;
  }
  heading('함께 알아 두세요');
  para('이 리포트는 이미지형 PDF라 텍스트 검색·선택과 스크린리더가 지원되지 않아요. 읽기용 텍스트는 웹 결과 화면이나 ‘결과 요약 복사’를 이용해 주세요.', 22);
  para('자기초월 영역의 ST4·ST5에는 정치·종교·문화 취향 문항이 섞여 있어요. 성별, 영성의 수준, 도덕적 우열로 해석하지 마세요.', 22);
  finish();
  downloadBlob(pdf.output('blob'), `lucian-tci-${persona.slug}-report.pdf`);
}

