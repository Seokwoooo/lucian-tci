import { domains, subscales } from '../data/scales';
import type { Domain, DomainCode, DomainScore, Insight, ScoreResult, SubscaleScore } from '../types';

export interface ExportSelection {
  includeSummary: boolean;
  domains: DomainCode[];
  /** Detailed subscale scores are included only in PDF exports. */
  includeSubscales: boolean;
}

const DEFAULT_SITE_URL = 'https://lucianlabs.dev/tci/';
const FONT = '"Noto Sans KR"';
const PAPER = '#F5F2E9';
const INK = '#303D2C';
const MUTED = '#64705C';
const RULE = '#DADDCF';
const SCALE_NOTE = '평균 1–5 · 응답을 기술한 값이며 규준·백분위가 아닙니다.';
const DISCLOSURE = '비공식 IPIP 기반 자기이해 도구입니다. 공식 TCI 검사나 임상 진단을 대신하지 않습니다.';
const PDF_NOTE = '이 PDF는 한글 모양을 보존한 이미지 문서로, 텍스트 검색·선택이 지원되지 않습니다.';
const READING_NOTE = '영역 평균은 하위척도 평균을 같은 비중으로 합산합니다. 3은 응답척도의 중간점이며 다른 사람의 평균이나 정상 범위가 아닙니다. 문항별로 서로 다른 응답이 섞여 있을 수 있습니다.';
const PRIVACY_NOTE = '선택한 요약과 영역만 이 파일에 포함했습니다. 점수와 답변은 이 내보내기 과정에서 서버로 전송되지 않습니다.';

interface SelectedDomain { metadata: Domain; score: DomainScore }
interface ExportContent { domains: SelectedDomain[]; insights: Insight[]; siteUrl: string }

function siteLink(value: string): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('사이트 주소를 확인해 주세요.'); }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('사이트 주소는 http 또는 https 주소여야 합니다.');
  }
  // A general site link never carries answers, scores, or a result fragment.
  url.search = '';
  url.hash = '';
  return url.href;
}

function contentFor(result: ScoreResult, insights: Insight[], selection: ExportSelection, siteUrl: string): ExportContent {
  if (!selection.domains.length) throw new Error('내보낼 영역을 하나 이상 선택해 주세요.');
  const codes = new Set(selection.domains);
  if ([...codes].some(code => !domains.some(domain => domain.code === code))) throw new Error('알 수 없는 영역입니다.');
  const selectedDomains = domains.filter(domain => codes.has(domain.code)).map(metadata => {
    const matches = result.domains.filter(score => score.code === metadata.code);
    const score = matches[0];
    if (matches.length !== 1 || !Number.isFinite(score.mean) || score.mean < 1 || score.mean > 5) {
      throw new Error(`${metadata.code} 영역 점수를 확인해 주세요.`);
    }
    return { metadata, score };
  });
  const selectedInsights = selection.includeSummary
    ? insights.filter(insight => subscales.some(scale => scale.code === insight.code && codes.has(scale.domain)))
      .filter(insight => Number.isFinite(insight.mean) && insight.mean >= 1 && insight.mean <= 5)
      .filter((insight, index, all) => all.findIndex(other => other.code === insight.code) === index)
      .sort((a, b) => Math.abs(b.mean - 3) - Math.abs(a.mean - 3)).slice(0, 3)
    : [];
  return { domains: selectedDomains, insights: selectedInsights, siteUrl: siteLink(siteUrl) };
}

export function buildSummaryText(
  result: ScoreResult, insights: Insight[], selection: ExportSelection, siteUrl = DEFAULT_SITE_URL,
): string {
  const content = contentFor(result, insights, selection, siteUrl);
  return [
    'LucianLabs · 기질과 성격 돌아보기',
    ...content.domains.map(({ metadata, score }) => `${metadata.name} (${metadata.code}) · 평균 ${score.mean.toFixed(2)} / 5`),
    ...(content.insights.length ? ['선택한 영역의 응답 요약', ...content.insights.map(insight => `${insight.title}\n${insight.text}`)] : []),
    SCALE_NOTE, DISCLOSURE, content.siteUrl,
  ].join('\n\n');
}

async function loadFonts(text: string): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) throw new Error('내보내기는 글꼴을 지원하는 브라우저에서 실행해 주세요.');
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const loaded = await Promise.race([
      Promise.all([400, 600].map(weight => document.fonts.load(`${weight} 28px ${FONT}`, text))),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('font timeout')), 15000); }),
    ]);
    if (loaded.some(faces => faces.length === 0)) throw new Error('font unavailable');
  } catch {
    throw new Error('한글 글꼴을 불러오지 못해 내보내기를 중단했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.');
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function canvasContext(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('이 브라우저에서 이미지 내보내기를 사용할 수 없습니다.');
  ctx.textBaseline = 'top';
  return { canvas, ctx };
}

function font(ctx: CanvasRenderingContext2D, size: number, weight = 400, color = INK): void {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
}

/** Measure real Unicode characters; do not cut Korean by byte or stretch text. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  return text.split('\n').flatMap(paragraph => {
    const lines: string[] = [];
    let line = '';
    for (const character of Array.from(paragraph)) {
      // Hang closing punctuation into the padding instead of orphaning it on a new line.
      if (line && ctx.measureText(line + character).width > width && !/[.,!?;:…。，、）)\]”’]/u.test(character)) {
        lines.push(line.trimEnd());
        line = character.trimStart();
      } else line += character;
    }
    lines.push(line);
    return lines;
  });
}

function paragraph(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, size: number, weight = 400, color = INK, spacing = 1.65): number {
  font(ctx, size, weight, color);
  const lines = wrap(ctx, text, width);
  for (const line of lines) { ctx.fillText(line, x, y); y += size * spacing; }
  return y;
}

function fontText(content: ExportContent): string {
  return [
    'LUCIANLABS IPIP 기질과 성격 돌아보기 선택한 영역 응답 요약 평균 자세한 점수 합계 문항 수 나의 응답 단서 선택한 응답 기록 낮은 응답 방향 높은 응답 방향 해석할 때 기록을 읽을 때 비공식 IPIP 응답 기록 0123456789. /',
    SCALE_NOTE, DISCLOSURE, PDF_NOTE, READING_NOTE, PRIVACY_NOTE, content.siteUrl,
    ...content.domains.flatMap(({ metadata }) => [metadata.name, metadata.everyday, metadata.description, metadata.low, metadata.high, metadata.caution]),
    ...content.insights.flatMap(insight => [insight.title, insight.text]),
  ].join(' ');
}

export async function renderShareImage(
  result: ScoreResult, insights: Insight[], selection: ExportSelection, siteUrl = DEFAULT_SITE_URL,
): Promise<HTMLCanvasElement> {
  const content = contentFor(result, insights, selection, siteUrl);
  await loadFonts(fontText(content));
  const width = 1080;
  const margin = 72;
  const inner = width - margin * 2;
  const { canvas, ctx } = canvasContext(width, 1440);
  font(ctx, 29);
  const cards = content.insights.map(insight => {
    font(ctx, 29, 600);
    const titleLines = wrap(ctx, insight.title, inner - 56);
    font(ctx, 27);
    const textLines = wrap(ctx, insight.text, inner - 56);
    return { insight, height: 54 + titleLines.length * 44 + textLines.length * 45 };
  });
  font(ctx, 24);
  const noteHeight = wrap(ctx, SCALE_NOTE, inner).length * 39;
  font(ctx, 22);
  const footerHeight = wrap(ctx, DISCLOSURE, inner).length * 36 + wrap(ctx, content.siteUrl, inner).length * 36 + 110;
  canvas.height = Math.ceil(Math.max(1440, 360 + content.domains.length * 110 + noteHeight + 46 + (cards.length ? 86 : 0) + cards.reduce((sum, card) => sum + card.height + 22, 0) + footerHeight));
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, canvas.height);
  // The leaf motif stays outside all text and chart bounds.
  ctx.fillStyle = '#C4CFAC';
  ctx.beginPath(); ctx.ellipse(886, 152, 53, 100, 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#DBBBA1';
  ctx.beginPath(); ctx.ellipse(964, 144, 34, 67, -0.6, 0, Math.PI * 2); ctx.fill();
  paragraph(ctx, 'LUCIANLABS  /  IPIP', margin, 66, 710, 23, 600, MUTED);
  paragraph(ctx, '나의 응답 단서', margin, 122, 740, 60, 600);
  paragraph(ctx, '기질과 성격 돌아보기', margin, 218, 740, 28, 400, MUTED);
  let y = 322;
  for (const { metadata, score } of content.domains) {
    font(ctx, 29, 600);
    ctx.fillText(`${metadata.name} · ${metadata.code}`, margin, y);
    ctx.textAlign = 'right';
    ctx.fillText(score.mean.toFixed(2), width - margin, y);
    ctx.textAlign = 'left';
    y += 50;
    ctx.fillStyle = RULE;
    ctx.fillRect(margin, y, inner, 13);
    ctx.fillStyle = metadata.color;
    ctx.fillRect(margin, y, inner * (score.mean - 1) / 4, 13);
    ctx.beginPath(); ctx.arc(margin + inner * (score.mean - 1) / 4, y + 6.5, 11, 0, Math.PI * 2); ctx.fill();
    font(ctx, 18, 400, MUTED);
    ctx.fillText('1', margin, y + 23);
    ctx.textAlign = 'right'; ctx.fillText('5', width - margin, y + 23); ctx.textAlign = 'left';
    y += 60;
  }
  y += 12;
  y = paragraph(ctx, SCALE_NOTE, margin, y, inner, 24, 400, MUTED) + 36;
  if (cards.length) {
    y = paragraph(ctx, '선택한 영역의 응답 요약', margin, y, inner, 30, 600) + 28;
    for (const { insight, height } of cards) {
      ctx.fillStyle = '#FFFDF7';
      ctx.beginPath(); ctx.roundRect(margin, y, inner, height, 22); ctx.fill();
      let cardY = paragraph(ctx, insight.title, margin + 28, y + 24, inner - 56, 29, 600, INK, 44 / 29) + 10;
      cardY = paragraph(ctx, insight.text, margin + 28, cardY, inner - 56, 27, 400, INK, 45 / 27);
      y = Math.max(y + height, cardY + 20) + 22;
    }
  }
  y += 24;
  ctx.fillStyle = RULE; ctx.fillRect(margin, y, inner, 1);
  y = paragraph(ctx, DISCLOSURE, margin, y + 27, inner, 22, 400, MUTED, 36 / 22) + 20;
  paragraph(ctx, content.siteUrl, margin, y, inner, 22, 600, INK, 36 / 22);
  return canvas;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  try { anchor.click(); } finally {
    anchor.remove();
    // Give the browser time to start reading the local blob before revocation.
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
}

export async function downloadPng(
  result: ScoreResult, insights: Insight[], selection: ExportSelection, siteUrl = DEFAULT_SITE_URL,
): Promise<void> {
  const canvas = await renderShareImage(result, insights, selection, siteUrl);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => {
    if (value) resolve(value); else reject(new Error('PNG 파일을 만들지 못했습니다. 다시 시도해 주세요.'));
  }, 'image/png'));
  downloadBlob(blob, 'lucian-tci-selected.png');
}

function selectedSubscales(result: ScoreResult, content: ExportContent): SubscaleScore[] {
  return subscales.filter(scale => content.domains.some(domain => domain.metadata.code === scale.domain)).map(metadata => {
    const matches = result.subscales.filter(score => score.code === metadata.code && score.domain === metadata.domain);
    const score = matches[0];
    if (matches.length !== 1 || !Number.isInteger(score.count) || score.count < 1 || !Number.isInteger(score.sum)
      || !Number.isFinite(score.mean) || score.mean < 1 || score.mean > 5 || Math.abs(score.sum / score.count - score.mean) > 1e-9) {
      throw new Error(`${metadata.code} 하위척도 점수를 확인해 주세요.`);
    }
    return score;
  });
}

export async function downloadPdf(
  result: ScoreResult, insights: Insight[], selection: ExportSelection, siteUrl = DEFAULT_SITE_URL,
): Promise<void> {
  const content = contentFor(result, insights, selection, siteUrl);
  const details = selection.includeSubscales ? selectedSubscales(result, content) : [];
  const detailsText = details.map(score => {
    const metadata = subscales.find(scale => scale.code === score.code)!;
    return `${metadata.name} ${metadata.description} ${metadata.caution ?? ''}`;
  }).join(' ');
  await loadFonts(`${fontText(content)} ${detailsText}`);
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({ title: 'LucianLabs - Selected IPIP responses', creator: 'LucianLabs', subject: 'Locally selected response summary' });
  const pageWidth = 1240;
  const pageHeight = 1754;
  const margin = 90;
  const inner = pageWidth - margin * 2;
  const top = 140;
  const bottom = pageHeight - 155;
  let { canvas, ctx } = canvasContext(pageWidth, pageHeight);
  let pageNumber = 0;
  let y = top;

  function startPage(): void {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, pageWidth, pageHeight);
    paragraph(ctx, 'LUCIANLABS  /  기질과 성격 돌아보기', margin, 60, inner, 22, 600, MUTED);
    ctx.fillStyle = RULE; ctx.fillRect(margin, 106, inner, 1);
    y = top;
  }
  function finishPage(): void {
    ctx.fillStyle = RULE; ctx.fillRect(margin, bottom + 32, inner, 1);
    paragraph(ctx, 'LucianLabs · 비공식 IPIP 응답 기록', margin, bottom + 52, inner - 90, 19, 400, MUTED);
    font(ctx, 19, 600, MUTED);
    ctx.textAlign = 'right'; ctx.fillText(String(pageNumber + 1), pageWidth - margin, bottom + 52); ctx.textAlign = 'left';
    if (pageNumber) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297, undefined, 'FAST');
    pageNumber++;
  }
  function nextPage(): void {
    finishPage();
    ({ canvas, ctx } = canvasContext(pageWidth, pageHeight));
    startPage();
  }
  function ensure(height: number): void { if (y + height > bottom) nextPage(); }
  function text(textValue: string, size = 27, weight = 400, color = INK, gap = 16): void {
    font(ctx, size, weight, color);
    const lines = wrap(ctx, textValue, inner);
    const lineHeight = Math.ceil(size * 1.7);
    // Keep ordinary paragraphs together at page boundaries. A very long paragraph
    // can still split line by line, so content is never clipped or discarded.
    if (lines.length * lineHeight <= bottom - top) ensure(lines.length * lineHeight);
    for (const line of lines) {
      ensure(lineHeight);
      font(ctx, size, weight, color);
      ctx.fillText(line, margin, y);
      y += lineHeight;
    }
    y += gap;
  }
  function heading(value: string): void {
    ensure(150);
    y += 18;
    text(value, 34, 600, INK, 18);
  }

  startPage();
  text('선택한 응답 기록', 48, 600, INK, 28);
  text(SCALE_NOTE, 25, 400, MUTED);
  text(DISCLOSURE, 24, 400, MUTED);
  text(PDF_NOTE, 23, 400, MUTED, 28);
  if (content.insights.length) {
    heading('선택한 영역의 응답 요약');
    for (const insight of content.insights) {
      ensure(135);
      text(insight.title, 29, 600);
      text(insight.text, 26);
    }
  }
  for (const { metadata, score } of content.domains) {
    heading(`${metadata.name} (${metadata.code}) · 평균 ${score.mean.toFixed(2)} / 5`);
    text(metadata.everyday, 27, 600);
    text(metadata.description, 26);
    text(`낮은 응답 방향: ${metadata.low}`, 25);
    text(`높은 응답 방향: ${metadata.high}`, 25);
    text(`해석할 때: ${metadata.caution}`, 24, 400, MUTED);
    for (const detail of details.filter(value => value.domain === metadata.code)) {
      const scale = subscales.find(value => value.code === detail.code)!;
      ensure(145);
      text(`${scale.code} · ${scale.name}`, 27, 600);
      text(`합계 ${detail.sum} · 문항 수 ${detail.count} · 평균 ${detail.mean.toFixed(2)} / 5`, 25);
      if (scale.caution) text(scale.caution, 23, 400, MUTED);
    }
  }
  heading('기록을 읽을 때');
  text(READING_NOTE, 24, 400, MUTED);
  text(PRIVACY_NOTE, 24, 400, MUTED);
  text(content.siteUrl, 24, 600);
  finishPage();
  downloadBlob(pdf.output('blob'), 'lucian-tci-selected.pdf');
}
