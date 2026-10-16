import { afterEach, describe, expect, it, vi } from 'vitest';
import rawItems from '../src/data/items.json';
import { renderCard, shareText, summaryText, wrap } from '../src/lib/export';
import { scoreAnswers } from '../src/lib/scoring';
import type { Item, ScoreResult } from '../src/types';

const items = rawItems as Item[];
const target: Record<string, number> = { NS: 4, HA: 2, RD: 4, P: 4, SD: 4, C: 4, ST: 3 };
const result: ScoreResult = scoreAnswers(Object.fromEntries(items.map(item => [item.id, item.reverse ? 6 - target[item.domain] : target[item.domain]])));
const LINK = 'https://lucianlabs.dev/tci/t/sunny-captain/';

function canvasRecorder() {
  const painted: Array<{ text: string; x: number; y: number; size: number }> = [];
  const images: Array<{ w: number; h: number }> = [];
  const ctx = {
    font: '', fillStyle: '', strokeStyle: '', lineWidth: 1, globalAlpha: 1, textBaseline: 'top', textAlign: 'left',
    measureText(text: string) { return { width: Array.from(text).length * (parseFloat(this.font.split(' ')[1]) || 28) * 0.9 }; },
    fillText(text: string, x: number, y: number) { painted.push({ text, x, y, size: parseFloat(this.font.split(' ')[1]) || 28 }); },
    drawImage(_: unknown, _x: number, _y: number, w: number, h: number) { images.push({ w, h }); },
    fillRect() {}, beginPath() {}, moveTo() {}, arcTo() {}, arc() {}, closePath() {}, fill() {}, stroke() {},
  };
  const canvas = { width: 0, height: 0, getContext: () => ctx };
  const fontRequests: string[] = [];
  vi.stubGlobal('document', { fonts: { load: (font: string) => { fontRequests.push(font); return Promise.resolve([{}]); } }, createElement: () => canvas });
  vi.stubGlobal('Image', class { onload: (() => void) | null = null; set src(_: string) { queueMicrotask(() => this.onload?.()); } });
  return { painted, images, canvas, fontRequests };
}
afterEach(() => vi.unstubAllGlobals());

describe('copied and posted text', () => {
  it('names the character and includes domain averages only when the score option is on', () => {
    const withScores = summaryText(result, true, LINK);
    expect(withScores).toContain('햇살 캡틴');
    expect(withScores).toContain('자극추구 4.00');
    expect(withScores).toContain('1–5 응답 평균');
    expect(withScores).toContain('비공식 IPIP');
    expect(withScores).toContain(LINK);
    const without = summaryText(result, false, LINK);
    expect(without).toContain('햇살 캡틴');
    expect(without).not.toMatch(/\d\.\d\d/);
  });

  it('posts a character teaser without any score or item text', () => {
    const text = shareText(result);
    expect(text).toContain('햇살 캡틴');
    expect(text).not.toMatch(/\d\.\d\d/);
    for (const item of items.slice(0, 40)) expect(text).not.toContain(item.korean);
  });
});

describe('share card canvas', () => {
  it.each([['feed', 1080, 1350], ['story', 1080, 1920]] as const)('%s card fits its canvas and loads all three weights first', async (format, w, h) => {
    const { painted, images, fontRequests } = canvasRecorder();
    const canvas = await renderCard(result, { format, includeScores: true });
    expect([canvas.width, canvas.height]).toEqual([w, h]);
    expect(fontRequests).toEqual(['400 28px "Noto Sans KR"', '600 28px "Noto Sans KR"', '800 28px "Noto Sans KR"']);
    const text = painted.map(line => line.text).join(' ');
    expect(text).toContain('햇살 캡틴');
    for (const name of ['자극추구', '위험회피', '사회적 민감성', '인내력', '자율성', '연대감', '자기초월']) expect(text).toContain(name);
    expect(painted.filter(line => line.text === '4.00')).toHaveLength(5);
    expect(text).toContain('정식 TCI-RS 아님');
    expect(images).toHaveLength(1);
    expect(painted.every(line => line.y >= 0 && line.y + line.size <= h)).toBe(true);
  });

  it.each(['feed', 'story'] as const)('%s card leaves out every number when scores are off', async format => {
    const { painted } = canvasRecorder();
    await renderCard(result, { format, includeScores: false });
    const text = painted.map(line => line.text).join(' ');
    expect(text).toContain('햇살 캡틴');
    expect(text).not.toMatch(/\d\.\d\d/);
    expect(text).not.toContain('위험회피');
  });

  it('stops before drawing when the Korean fonts are not available', async () => {
    vi.stubGlobal('document', { fonts: { load: () => Promise.resolve([]) } });
    await expect(renderCard(result, { format: 'feed', includeScores: true })).rejects.toThrow(/글꼴/);
  });

  it('wraps Korean by characters without splitting closing punctuation onto a new line', () => {
    const ctx = { font: '400 10px x', measureText: (t: string) => ({ width: Array.from(t).length * 10 }) } as unknown as CanvasRenderingContext2D;
    const rows = wrap(ctx, '가나다라마.', 50);
    expect(rows).toEqual(['가나다라마.']);
    expect(wrap(ctx, '가나다라마바사', 50)).toEqual(['가나다라마', '바사']);
  });
});
